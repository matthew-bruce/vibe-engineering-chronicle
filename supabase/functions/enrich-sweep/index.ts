/**
 * enrich-sweep — on-demand and scheduled enrichment sweep.
 *
 * Called with { mode: 'demand' | 'scheduled' }.
 *
 * On-demand: enriches cards where card_enriched_at is null (never enriched).
 * Scheduled: evaluates all non-deleted cards.
 *
 * Skip condition (both modes): card_relevance === 'evergreen'.
 * Versioning is the safety net — not field-level locks. All non-evergreen
 * cards are enriched on every run regardless of prior source.
 *
 * Snapshots each card before writing — every change is undoable.
 * Returns { enriched, skipped, failed }.
 */

import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const VALID_RELEVANCE = ['current', 'review', 'dated', 'evergreen'];
const VALID_AUDIENCE  = ['beginner', 'practitioner', 'leadership', 'universal'];
const VALID_THEMES    = ['Industry', 'Economics', 'Org Design', 'Evidence', 'Leadership', 'Signal', 'Unlock'];

type Card = Record<string, unknown>;

// ─── Snapshot helper (inlined — Deno can't import from app lib/) ──────────────

async function snapshotCard(supabase: SupabaseClient, cardId: string, enrichedAt: string): Promise<void> {
  try {
    const [cardRes, catsRes, themesRes, sectionsRes] = await Promise.all([
      supabase
        .from('cards')
        .select(`card_title, card_body, card_benefit, card_impact, card_impact_source,
                 card_audience, card_format, card_event_date, card_source,
                 card_relevance, card_relevance_source, card_ai_themes,
                 card_ai_audience, card_ai_summary, card_enriched_at`)
        .eq('card_id', cardId)
        .single(),
      supabase.from('card_categories').select('category_id').eq('card_id', cardId),
      supabase.from('card_themes').select('theme_id').eq('card_id', cardId),
      supabase
        .from('card_sections')
        .select('section_label, section_body, section_order')
        .eq('card_id', cardId)
        .is('section_deleted_at', null)
        .order('section_order', { ascending: true }),
    ]);

    if (cardRes.error || !cardRes.data) return;

    const snapshot = {
      ...cardRes.data,
      categories: (catsRes.data    ?? []).map((c: Record<string, string>) => c.category_id),
      themes:     (themesRes.data  ?? []).map((t: Record<string, string>) => t.theme_id),
      sections:   (sectionsRes.data ?? []).map((s: Record<string, unknown>) => ({
        label: s.section_label, body: s.section_body, order: s.section_order,
      })),
    };

    const { data: maxRow } = await supabase
      .from('card_versions')
      .select('version_number')
      .eq('card_id', cardId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextNum = ((maxRow as Record<string, number> | null)?.version_number ?? 0) + 1;

    await supabase.from('card_versions').insert({
      card_id:        cardId,
      version_number: nextNum,
      card_snapshot:  snapshot,
      versioned_by:   'enrichment_engine',
      version_note:   `Pre-enrichment snapshot · enrichment_engine · ${enrichedAt}`,
    });

    const { data: all } = await supabase
      .from('card_versions')
      .select('version_id, version_number')
      .eq('card_id', cardId)
      .order('version_number', { ascending: true });

    if (all && all.length > 50) {
      const excess = all.length - 50;
      const toPrune = (all as Record<string, string>[]).slice(0, excess).map(v => v.version_id);
      await supabase.from('card_versions').delete().in('version_id', toPrune);
    }
  } catch (err) {
    console.warn('[enrich-sweep] snapshot failed (non-fatal):', err);
  }
}

// ─── Enrichment helpers ───────────────────────────────────────────────────────

function buildPrompt(card: Card, sectionText: string): string {
  return `You are enriching a Vibe Engineering Chronicle card. Respond with ONLY valid JSON — no prose.

Card title: ${card.card_title ?? ''}
Card body: ${card.card_body ?? ''}
Card benefit: ${card.card_benefit ?? ''}
${sectionText ? `Additional sections:\n${sectionText}` : ''}

Return JSON with these fields:
- impact: integer 1-5 (signal strength of this insight)
- relevance: one of "current" | "review" | "dated" | "evergreen"
- themes: array of zero or more from ["Industry","Economics","Org Design","Evidence","Leadership","Signal","Unlock"]
- audience: one of "beginner" | "practitioner" | "leadership" | "universal"
- summary: string, ≤25 words, present-tense active voice

Example: {"impact":4,"relevance":"current","themes":["Signal"],"audience":"leadership","summary":"Vibe coding unlocks junior engineers to ship production code without deep technical knowledge."}`;
}

function parseResponse(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const json = JSON.parse(match[0]);
    if (typeof json.impact !== 'number' || json.impact < 1 || json.impact > 5) return null;
    if (!VALID_RELEVANCE.includes(json.relevance as string)) return null;
    if (!VALID_AUDIENCE.includes(json.audience as string)) return null;
    json.themes = Array.isArray(json.themes)
      ? json.themes.filter((t: unknown) => VALID_THEMES.includes(t as string))
      : [];
    return json;
  } catch { return null; }
}

// Skip only evergreen cards — versioning is the safety net, not field locks
function shouldSkip(card: Card): boolean {
  return card.card_relevance === 'evergreen';
}

async function enrichOne(
  supabase: SupabaseClient,
  anthropic: Anthropic,
  card: Card,
): Promise<'enriched' | 'skipped' | 'failed'> {
  if (shouldSkip(card)) return 'skipped';

  const cardId    = card.card_id as string;
  const enrichedAt = new Date().toISOString();

  const { data: sections } = await supabase
    .from('card_sections')
    .select('section_label, section_body')
    .eq('card_id', cardId)
    .is('section_deleted_at', null)
    .order('section_order', { ascending: true });

  const sectionText = (sections ?? [])
    .map((s: Record<string, string>) => `${s.section_label}: ${s.section_body ?? ''}`)
    .join('\n');

  try {
    // Snapshot before write — records timestamp and source in version note
    await snapshotCard(supabase, cardId, enrichedAt);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: buildPrompt(card, sectionText) }],
    });

    const text   = (response.content[0] as { type: string; text: string }).text;
    const parsed = parseResponse(text);
    if (!parsed) { console.warn('[enrich-sweep] parse failed for', cardId, text); return 'failed'; }

    // Write all enrichment fields — no human-source locks
    const update: Record<string, unknown> = {
      card_impact:           parsed.impact,
      card_impact_source:    'enrichment_engine',
      card_relevance:        parsed.relevance,
      card_relevance_source: 'enrichment_engine',
      card_ai_themes:        parsed.themes,
      card_ai_audience:      parsed.audience,
      card_ai_summary:       parsed.summary,
      card_enriched_at:      enrichedAt,
    };

    const { error: updateErr } = await supabase.from('cards').update(update).eq('card_id', cardId);
    if (updateErr) { console.error('[enrich-sweep] update failed for', cardId, updateErr); return 'failed'; }

    return 'enriched';
  } catch (err) {
    console.error('[enrich-sweep] enrichOne failed for', cardId, err);
    return 'failed';
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  console.log('[enrich-sweep] handler reached — method:', req.method);

  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin':  '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    const supabase  = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const body = await req.json().catch(() => ({}));
    const mode = (body.mode === 'scheduled') ? 'scheduled' : 'demand';
    console.log('[enrich-sweep] mode:', mode);

    // On-demand: only cards never enriched (fill-in-blanks pass).
    // Scheduled: all non-deleted cards — full refresh, shouldSkip handles evergreen.
    let query = supabase
      .from('cards')
      .select('card_id, card_title, card_body, card_benefit, card_relevance, card_enriched_at')
      .is('card_deleted_at', null);

    if (mode === 'demand') {
      query = query.is('card_enriched_at', null);
    }

    const { data: cards, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    const results = await Promise.all(
      (cards ?? []).map((card: Card) => enrichOne(supabase, anthropic, card))
    );

    const enriched = results.filter(r => r === 'enriched').length;
    const skipped  = results.filter(r => r === 'skipped').length;
    const failed   = results.filter(r => r === 'failed').length;

    return new Response(JSON.stringify({ enriched, skipped, failed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[enrich-sweep] fatal error — full error object:', err);
    throw err;
  }
});
