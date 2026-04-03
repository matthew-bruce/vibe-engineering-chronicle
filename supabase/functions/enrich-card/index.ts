/**
 * enrich-card — real-time enrichment via Database Webhook on INSERT.
 *
 * Triggered by the pg_net webhook set up in setup_enrich_webhook_trigger.sql.
 * Accepts either:
 *   - Supabase webhook payload: { type: 'INSERT', record: { card_id, ... } }
 *   - Direct card object:       { card_id, card_title, ... }
 *
 * Snapshots the card before writing any enrichment so every enrichment
 * can be rolled back via the version history UI.
 *
 * Skip condition: card_relevance === 'evergreen' (regardless of source).
 * Versioning is the safety net — not field-level locks.
 *
 * Returns HTTP 200 even on error to prevent Supabase webhook retry storms.
 * All errors are logged to console.
 */

import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const VALID_RELEVANCE = ['current', 'review', 'dated', 'evergreen'];
const VALID_AUDIENCE  = ['beginner', 'practitioner', 'leadership', 'universal'];
const VALID_THEMES    = ['Industry', 'Economics', 'Org Design', 'Evidence', 'Leadership', 'Signal', 'Unlock'];

// ─── Snapshot helper (inlined — Deno can't import from app lib/) ──────────────

async function snapshotCard(
  supabase: ReturnType<typeof createClient>,
  cardId: string,
  enrichedAt: string,
): Promise<void> {
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

    if (cardRes.error || !cardRes.data) {
      console.warn('[enrich-card] snapshot: card not found', cardId, cardRes.error);
      return;
    }

    const snapshot = {
      ...cardRes.data,
      categories: (catsRes.data    ?? []).map((c: Record<string, string>) => c.category_id),
      themes:     (themesRes.data  ?? []).map((t: Record<string, string>) => t.theme_id),
      sections:   (sectionsRes.data ?? []).map((s: Record<string, unknown>) => ({
        label: s.section_label,
        body:  s.section_body,
        order: s.section_order,
      })),
    };

    const { data: maxRow } = await supabase
      .from('card_versions')
      .select('version_number')
      .eq('card_id', cardId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = ((maxRow as Record<string, number> | null)?.version_number ?? 0) + 1;

    const { error: insertErr } = await supabase.from('card_versions').insert({
      card_id:        cardId,
      version_number: nextVersionNumber,
      card_snapshot:  snapshot,
      versioned_by:   'enrichment_engine',
      version_note:   `Pre-enrichment snapshot · enrichment_engine · ${enrichedAt}`,
    });
    if (insertErr) { console.warn('[enrich-card] snapshot insert failed:', insertErr); return; }

    const { data: allVersions } = await supabase
      .from('card_versions')
      .select('version_id, version_number')
      .eq('card_id', cardId)
      .order('version_number', { ascending: true });

    if (allVersions && allVersions.length > 50) {
      const excess = allVersions.length - 50;
      const toPrune = (allVersions as Record<string, string>[]).slice(0, excess).map(v => v.version_id);
      await supabase.from('card_versions').delete().in('version_id', toPrune);
    }
  } catch (err) {
    console.warn('[enrich-card] snapshot failed (non-fatal):', err);
  }
}

// ─── Enrichment prompt ────────────────────────────────────────────────────────

function buildPrompt(card: Record<string, unknown>, sectionText: string): string {
  const title   = card.card_title   ?? '';
  const body    = card.card_body    ?? '';
  const benefit = card.card_benefit ?? '';
  return `You are enriching a Vibe Engineering Chronicle card. Respond with ONLY valid JSON — no prose.

Card title: ${title}
Card body: ${body}
Card benefit: ${benefit}
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

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
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

  try {
    const body = await req.json();
    const card: Record<string, unknown> = body.type === 'INSERT' ? body.record : body;
    const cardId = card.card_id as string;

    if (!cardId) {
      return new Response(JSON.stringify({ error: 'Missing card_id' }), { status: 200 });
    }

    // Skip cards with no meaningful content
    if (!card.card_title) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no title' }), { status: 200 });
    }

    // Skip only evergreen cards — versioning is the safety net, not field locks
    if (card.card_relevance === 'evergreen') {
      return new Response(JSON.stringify({ skipped: true, reason: 'evergreen' }), { status: 200 });
    }

    // Fetch sections for richer context
    const { data: sections } = await supabase
      .from('card_sections')
      .select('section_label, section_body')
      .eq('card_id', cardId)
      .is('section_deleted_at', null)
      .order('section_order', { ascending: true });

    const sectionText = (sections ?? [])
      .map((s: Record<string, string>) => `${s.section_label}: ${s.section_body ?? ''}`)
      .join('\n');

    const enrichedAt = new Date().toISOString();

    // Snapshot before any enrichment write
    await snapshotCard(supabase, cardId, enrichedAt);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: buildPrompt(card, sectionText) }],
    });

    const text   = (response.content[0] as { type: string; text: string }).text;
    const parsed = parseResponse(text);
    if (!parsed) throw new Error(`Failed to parse Claude response: ${text}`);

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
    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ ok: true, cardId }), { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[enrich-card] error:', msg);
    // Always 200 — webhook must not retry on failures
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 200 });
  }
});
