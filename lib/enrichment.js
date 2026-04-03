/**
 * Pure business logic for the Chronicle Enrichment Engine.
 * No network/Deno dependencies — importable by both Vitest tests and edge functions.
 */

export const VALID_THEMES    = ['Industry', 'Economics', 'Org Design', 'Evidence', 'Leadership', 'Signal', 'Unlock'];
export const VALID_RELEVANCE = ['current', 'review', 'dated', 'evergreen'];
export const VALID_AUDIENCE  = ['beginner', 'practitioner', 'leadership', 'universal'];

/**
 * Parse and validate Claude's JSON enrichment response.
 * Throws on invalid required fields. Invalid themes are silently filtered.
 */
export function parseEnrichmentResponse(json) {
  if (typeof json !== 'object' || json === null) {
    throw new Error('Enrichment response must be an object');
  }

  const impact = Number(json.card_impact);
  if (!Number.isInteger(impact) || impact < 1 || impact > 5) {
    throw new Error(`Invalid card_impact: ${json.card_impact}`);
  }

  if (!VALID_RELEVANCE.includes(json.card_relevance)) {
    throw new Error(`Invalid card_relevance: ${json.card_relevance}`);
  }

  const themes = Array.isArray(json.card_ai_themes)
    ? json.card_ai_themes.filter(t => VALID_THEMES.includes(t))
    : [];

  if (!VALID_AUDIENCE.includes(json.card_ai_audience)) {
    throw new Error(`Invalid card_ai_audience: ${json.card_ai_audience}`);
  }

  const summary = typeof json.card_ai_summary === 'string'
    ? json.card_ai_summary.trim().slice(0, 300)
    : '';

  return {
    card_impact:      impact,
    card_relevance:   json.card_relevance,
    card_ai_themes:   themes,
    card_ai_audience: json.card_ai_audience,
    card_ai_summary:  summary,
  };
}

/**
 * Returns true when a card should be skipped by any sweep.
 * Only evergreen cards are excluded — versioning is the safety net,
 * not field-level locks. Source is irrelevant for the skip decision.
 */
export function shouldSkipCard(card) {
  return card.card_relevance === 'evergreen';
}

/**
 * Build the database update object from an enrichment response.
 * All non-evergreen cards are fully re-enriched on every run.
 * No human-source locks — versioning handles rollback.
 *
 * @param {object} card     - existing card record
 * @param {object} response - validated enrichment result
 * @returns {object}        - update object safe to pass to supabase .update()
 */
export function buildEnrichmentUpdate(card, response) {
  return {
    card_impact:           response.card_impact,
    card_impact_source:    'enrichment_engine',
    card_relevance:        response.card_relevance,
    card_relevance_source: 'enrichment_engine',
    card_ai_themes:        response.card_ai_themes,
    card_ai_audience:      response.card_ai_audience,
    card_ai_summary:       response.card_ai_summary,
    card_enriched_at:      new Date().toISOString(),
  };
}

/**
 * Aggregate an array of per-card results into a sweep summary.
 * Each result must have exactly one of: enriched, skipped, or failed.
 */
export function aggregateSweepResults(results) {
  return results.reduce(
    (acc, r) => ({
      enriched: acc.enriched + (r.enriched ? 1 : 0),
      skipped:  acc.skipped  + (r.skipped  ? 1 : 0),
      failed:   acc.failed   + (r.failed   ? 1 : 0),
    }),
    { enriched: 0, skipped: 0, failed: 0 },
  );
}

/**
 * Build the Claude prompt for a card.
 * sectionText is a pre-formatted string of section label: body pairs.
 */
export function buildEnrichPrompt(card, sectionText) {
  return `You are classifying a "Vibe Engineering Chronicle" entry — a personal knowledge card from someone tracking AI-assisted development inside an organisation.

Card title: ${card.card_title}
Card body: ${card.card_body ?? '(none)'}${sectionText ? `\nAdditional sections:\n${sectionText}` : ''}

Return ONLY a JSON object (no markdown, no explanation):
{
  "card_impact": <integer 1-5: 5=transformative, 4=significant, 3=moderate, 2=minor, 1=trivial>,
  "card_relevance": <"current"|"review"|"dated"|"evergreen">,
  "card_ai_themes": <array of 0-3 items from exactly: ["Industry","Economics","Org Design","Evidence","Leadership","Signal","Unlock"]>,
  "card_ai_audience": <"beginner"|"practitioner"|"leadership"|"universal">,
  "card_ai_summary": <one sentence, maximum 25 words>
}

Relevance definitions:
- current: actively relevant today
- review: worth revisiting soon, may need updating
- dated: based on information that may now be outdated
- evergreen: timelessly relevant, will not age`;
}
