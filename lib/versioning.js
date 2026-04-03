/**
 * Card Versioning — pure business logic
 *
 * No Supabase calls here. All functions are deterministic and testable without
 * a database. DB operations (snapshotCard, loadCardVersions, restoreCardVersion)
 * live in lib/db.js and call these helpers.
 */

export const MAX_VERSIONS = 50;

/**
 * Build a card snapshot object from raw DB row + associated rows.
 *
 * @param {object} cardRow   - Raw row from the cards table (snake_case fields)
 * @param {Array}  categories - Rows from card_categories: [{ category_id }]
 * @param {Array}  themes     - Rows from card_themes:      [{ theme_id }]
 * @param {Array}  sections   - Rows from card_sections:    [{ section_label, section_body, section_order }]
 * @returns {object} Plain snapshot object suitable for storing in card_snapshot (jsonb)
 */
export function buildCardSnapshot(cardRow, categories, themes, sections) {
  return {
    card_title:            cardRow.card_title            ?? null,
    card_body:             cardRow.card_body             ?? null,
    card_benefit:          cardRow.card_benefit          ?? null,
    card_impact:           cardRow.card_impact           ?? null,
    card_impact_source:    cardRow.card_impact_source    ?? null,
    card_audience:         cardRow.card_audience         ?? null,
    card_format:           cardRow.card_format           ?? null,
    card_event_date:       cardRow.card_event_date       ?? null,
    card_source:           cardRow.card_source           ?? null,
    card_relevance:        cardRow.card_relevance        ?? null,
    card_relevance_source: cardRow.card_relevance_source ?? null,
    card_ai_themes:        Array.isArray(cardRow.card_ai_themes) ? cardRow.card_ai_themes : [],
    card_ai_audience:      cardRow.card_ai_audience      ?? null,
    card_ai_summary:       cardRow.card_ai_summary       ?? null,
    card_enriched_at:      cardRow.card_enriched_at      ?? null,
    categories: (categories ?? []).map(c => c.category_id).filter(Boolean),
    themes:     (themes     ?? []).map(t => t.theme_id  ).filter(Boolean),
    sections:   (sections   ?? []).map(s => ({
      label: s.section_label ?? s.label  ?? null,
      body:  s.section_body  ?? s.body   ?? null,
      order: s.section_order ?? s.order  ?? 0,
    })),
  };
}

/**
 * Build the update payload for restoring a card from a snapshot.
 * Returns { cardFields, categories, themes, sections } — the three DB targets.
 *
 * @param {object} snapshot - Value previously stored in card_snapshot
 * @returns {{ cardFields: object, categories: string[], themes: string[], sections: Array }}
 */
export function buildRestorePayload(snapshot) {
  return {
    cardFields: {
      card_title:            snapshot.card_title,
      card_body:             snapshot.card_body            ?? null,
      card_benefit:          snapshot.card_benefit         ?? null,
      card_impact:           snapshot.card_impact          ?? null,
      card_impact_source:    snapshot.card_impact_source   ?? null,
      card_audience:         snapshot.card_audience        ?? null,
      card_format:           snapshot.card_format          ?? null,
      card_event_date:       snapshot.card_event_date      ?? null,
      card_source:           snapshot.card_source          ?? null,
      card_relevance:        snapshot.card_relevance       ?? null,
      card_relevance_source: snapshot.card_relevance_source ?? null,
      card_ai_themes:        snapshot.card_ai_themes       ?? [],
      card_ai_audience:      snapshot.card_ai_audience     ?? null,
      card_ai_summary:       snapshot.card_ai_summary      ?? null,
      card_enriched_at:      snapshot.card_enriched_at     ?? null,
      card_updated_at:       new Date().toISOString(),
    },
    categories: snapshot.categories ?? [],
    themes:     snapshot.themes     ?? [],
    sections:   snapshot.sections   ?? [],
  };
}

/**
 * Given all existing versions for a card (sorted by version_number ascending),
 * return the version_ids that must be deleted to bring the count within MAX_VERSIONS.
 * Always prunes the oldest versions first.
 *
 * @param {Array} versions - [{ version_id, version_number }, ...] sorted asc
 * @returns {string[]} Array of version_id strings to delete (empty if no pruning needed)
 */
export function getVersionsToPrune(versions) {
  if (!Array.isArray(versions) || versions.length <= MAX_VERSIONS) return [];
  const excess = versions.length - MAX_VERSIONS;
  return versions.slice(0, excess).map(v => v.version_id);
}
