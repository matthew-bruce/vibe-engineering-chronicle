/**
 * enrich-sweep — on-demand and scheduled enrichment sweep.
 *
 * Called with { mode: 'demand' | 'scheduled' }.
 *
 * On-demand: enriches cards where card_enriched_at is null OR relevance was
 *            set by AI (so it can be re-evaluated). Skips evergreen (human).
 *
 * Scheduled: evaluates all non-deleted cards. Skips only human-locked evergreen
 *            cards. When relevance changes, prefixes summary with an audit note.
 *
 * Snapshots each card before writing enrichment — every change is undoable.
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

async function snapshotCard(supabase: SupabaseClient, cardId: string): Promise<void> {
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
      version_note:   'Pre-enrichment snapshot',
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

function shouldSkip(card: Card): boolean {
  return card.card_relevance === 'evergreen' && card.card_relevance_source === 'human';
}

async function enrichOne(
  supabase: SupabaseClient,
  anthropic: Anthropic,
  card: Card,
  mode: string,
): Promise<'enriched' | 'skipped' | 'failed'> {
  if (shouldSkip(card)) return 'skipped';

  const cardId = card.card_id as string;

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
    // Snapshot before write
    await snapshotCard(supabase, cardId);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: buildPrompt(card, sectionText) }],
    });

    const text   = (response.content[0] as { type: string; text: string }).text;
    const parsed = parseResponse(text);
    if (!parsed) { console.warn('[enrich-sweep] parse failed for', cardId, text); return 'failed'; }

    const update: Record<string, unknown> = {
      card_ai_themes:   parsed.themes,
      card_ai_audience: parsed.audience,
      card_enriched_at: new Date().toISOString(),
    };

    if (card.card_impact_source !== 'human') {
      update.card_impact        = parsed.impact;
      update.card_impact_source = 'ai';
    }

    if (card.card_relevance_source !== 'human') {
      const prevRelevance = card.card_relevance as string | null;
      update.card_relevance        = parsed.relevance;
      update.card_relevance_source = 'ai';

      let summary = parsed.summary as string;
      // Scheduled: flag relevance drift in summary
      if (mode === 'scheduled' && prevRelevance && prevRelevance !== parsed.relevance) {
        summary = `[Relevance changed from ${prevRelevance} to ${parsed.relevance}] ${summary}`;
      }
      update.card_ai_summary = summary;
    } else {
      update.card_ai_summary = parsed.summary;
    }

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
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
    });
  }

  const supabase  = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  try {
    const body = await req.json().catch(() => ({}));
    const mode = (body.mode === 'scheduled') ? 'scheduled' : 'demand';

    let query = supabase
      .from('cards')
      .select(`card_id, card_title, card_body, card_benefit,
               card_impact, card_impact_source,
               card_relevance, card_relevance_source,
               card_ai_summary, card_enriched_at`)
      .is('card_deleted_at', null);

    if (mode === 'demand') {
      query = query.or('card_enriched_at.is.null,card_relevance_source.eq.ai');
    }

    const { data: cards, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    const results = await Promise.all(
      (cards ?? []).map((card: Card) => enrichOne(supabase, anthropic, card, mode))
    );

    const enriched = results.filter(r => r === 'enriched').length;
    const skipped  = results.filter(r => r === 'skipped').length;
    const failed   = results.filter(r => r === 'failed').length;

    return new Response(JSON.stringify({ enriched, skipped, failed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[enrich-sweep] fatal error:', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
