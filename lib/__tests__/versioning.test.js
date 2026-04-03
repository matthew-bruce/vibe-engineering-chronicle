import { describe, it, expect, vi } from 'vitest';
import {
  MAX_VERSIONS,
  buildCardSnapshot,
  buildRestorePayload,
  getVersionsToPrune,
} from '../versioning.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FULL_CARD_ROW = {
  card_title:            'Vibe engineering changes everything',
  card_body:             'This is the body',
  card_benefit:          'Massive productivity gains',
  card_impact:           4,
  card_impact_source:    'human',
  card_audience:         'leadership',
  card_format:           'fact_or_fiction',
  card_event_date:       '2026-03-01',
  card_source:           'https://example.com',
  card_relevance:        'current',
  card_relevance_source: 'ai',
  card_ai_themes:        ['Signal', 'Industry'],
  card_ai_audience:      'practitioner',
  card_ai_summary:       'A short summary here',
  card_enriched_at:      '2026-03-01T12:00:00Z',
};

const CATEGORIES = [{ category_id: 'cat-uuid-wow' }];
const THEMES     = [{ theme_id: 'theme-uuid-signal' }, { theme_id: 'theme-uuid-industry' }];
const SECTIONS   = [
  { section_label: 'Context', section_body: 'Some context', section_order: 0 },
  { section_label: 'Outcome', section_body: null,           section_order: 1 },
];

// ─── buildCardSnapshot ────────────────────────────────────────────────────────

describe('buildCardSnapshot', () => {
  it('includes all main card fields', () => {
    const snap = buildCardSnapshot(FULL_CARD_ROW, CATEGORIES, THEMES, SECTIONS);
    expect(snap.card_title).toBe('Vibe engineering changes everything');
    expect(snap.card_body).toBe('This is the body');
    expect(snap.card_benefit).toBe('Massive productivity gains');
    expect(snap.card_impact).toBe(4);
    expect(snap.card_impact_source).toBe('human');
    expect(snap.card_audience).toBe('leadership');
    expect(snap.card_format).toBe('fact_or_fiction');
    expect(snap.card_event_date).toBe('2026-03-01');
    expect(snap.card_source).toBe('https://example.com');
    expect(snap.card_relevance).toBe('current');
    expect(snap.card_relevance_source).toBe('ai');
    expect(snap.card_ai_themes).toEqual(['Signal', 'Industry']);
    expect(snap.card_ai_audience).toBe('practitioner');
    expect(snap.card_ai_summary).toBe('A short summary here');
    expect(snap.card_enriched_at).toBe('2026-03-01T12:00:00Z');
  });

  it('includes category IDs from card_categories rows', () => {
    const snap = buildCardSnapshot(FULL_CARD_ROW, CATEGORIES, THEMES, SECTIONS);
    expect(snap.categories).toEqual(['cat-uuid-wow']);
  });

  it('includes theme IDs from card_themes rows', () => {
    const snap = buildCardSnapshot(FULL_CARD_ROW, CATEGORIES, THEMES, SECTIONS);
    expect(snap.themes).toEqual(['theme-uuid-signal', 'theme-uuid-industry']);
  });

  it('maps sections to { label, body, order } using snake_case fields', () => {
    const snap = buildCardSnapshot(FULL_CARD_ROW, CATEGORIES, THEMES, SECTIONS);
    expect(snap.sections).toHaveLength(2);
    expect(snap.sections[0]).toEqual({ label: 'Context', body: 'Some context', order: 0 });
    expect(snap.sections[1]).toEqual({ label: 'Outcome', body: null, order: 1 });
  });

  it('falls back to camelCase section fields when snake_case absent', () => {
    const camelSections = [{ label: 'Notes', body: 'Some notes', order: 0 }];
    const snap = buildCardSnapshot(FULL_CARD_ROW, [], [], camelSections);
    expect(snap.sections[0]).toEqual({ label: 'Notes', body: 'Some notes', order: 0 });
  });

  it('normalises missing card fields to null', () => {
    const sparse = { card_title: 'Sparse card' };
    const snap = buildCardSnapshot(sparse, [], [], []);
    expect(snap.card_body).toBeNull();
    expect(snap.card_impact).toBeNull();
    expect(snap.card_format).toBeNull();
    expect(snap.card_relevance).toBeNull();
    expect(snap.card_ai_summary).toBeNull();
    expect(snap.card_enriched_at).toBeNull();
  });

  it('defaults card_ai_themes to [] when field is absent', () => {
    const sparse = { card_title: 'No themes' };
    const snap = buildCardSnapshot(sparse, [], [], []);
    expect(snap.card_ai_themes).toEqual([]);
  });

  it('handles empty categories, themes, sections gracefully', () => {
    const snap = buildCardSnapshot(FULL_CARD_ROW, [], [], []);
    expect(snap.categories).toEqual([]);
    expect(snap.themes).toEqual([]);
    expect(snap.sections).toEqual([]);
  });

  it('handles null/undefined categories, themes, sections without throwing', () => {
    const snap = buildCardSnapshot(FULL_CARD_ROW, null, undefined, null);
    expect(snap.categories).toEqual([]);
    expect(snap.themes).toEqual([]);
    expect(snap.sections).toEqual([]);
  });

  it('filters out falsy category_id / theme_id values', () => {
    const badCats   = [{ category_id: 'cat-1' }, { category_id: null }, { category_id: undefined }];
    const badThemes = [{ theme_id: 'theme-1' }, { theme_id: '' }];
    const snap = buildCardSnapshot(FULL_CARD_ROW, badCats, badThemes, []);
    expect(snap.categories).toEqual(['cat-1']);
    expect(snap.themes).toEqual(['theme-1']);
  });
});

// ─── buildRestorePayload ──────────────────────────────────────────────────────

describe('buildRestorePayload', () => {
  const SNAPSHOT = buildCardSnapshot(FULL_CARD_ROW, CATEGORIES, THEMES, SECTIONS);

  it('returns cardFields containing all card columns', () => {
    const { cardFields } = buildRestorePayload(SNAPSHOT);
    expect(cardFields.card_title).toBe('Vibe engineering changes everything');
    expect(cardFields.card_body).toBe('This is the body');
    expect(cardFields.card_impact).toBe(4);
    expect(cardFields.card_impact_source).toBe('human');
    expect(cardFields.card_relevance).toBe('current');
    expect(cardFields.card_relevance_source).toBe('ai');
    expect(cardFields.card_ai_themes).toEqual(['Signal', 'Industry']);
    expect(cardFields.card_ai_summary).toBe('A short summary here');
    expect(cardFields.card_enriched_at).toBe('2026-03-01T12:00:00Z');
  });

  it('cardFields includes card_updated_at as ISO timestamp', () => {
    const before = new Date().toISOString();
    const { cardFields } = buildRestorePayload(SNAPSHOT);
    const after = new Date().toISOString();
    expect(cardFields.card_updated_at >= before).toBe(true);
    expect(cardFields.card_updated_at <= after).toBe(true);
  });

  it('returns categories array of UUIDs', () => {
    const { categories } = buildRestorePayload(SNAPSHOT);
    expect(categories).toEqual(['cat-uuid-wow']);
  });

  it('returns themes array of UUIDs', () => {
    const { themes } = buildRestorePayload(SNAPSHOT);
    expect(themes).toEqual(['theme-uuid-signal', 'theme-uuid-industry']);
  });

  it('returns sections array with label/body/order', () => {
    const { sections } = buildRestorePayload(SNAPSHOT);
    expect(sections).toHaveLength(2);
    expect(sections[0].label).toBe('Context');
    expect(sections[0].order).toBe(0);
  });

  it('handles snapshot with empty/absent categories, themes, sections', () => {
    const emptySnap = { ...SNAPSHOT, categories: undefined, themes: undefined, sections: undefined };
    const { categories, themes, sections } = buildRestorePayload(emptySnap);
    expect(categories).toEqual([]);
    expect(themes).toEqual([]);
    expect(sections).toEqual([]);
  });

  it('cardFields nulls optional fields absent from snapshot', () => {
    const minSnap = { card_title: 'Minimal' };
    const { cardFields } = buildRestorePayload(minSnap);
    expect(cardFields.card_body).toBeNull();
    expect(cardFields.card_impact).toBeNull();
    expect(cardFields.card_relevance).toBeNull();
    expect(cardFields.card_ai_summary).toBeNull();
  });
});

// ─── getVersionsToPrune ───────────────────────────────────────────────────────

describe('getVersionsToPrune', () => {
  const makeVersions = (count) =>
    Array.from({ length: count }, (_, i) => ({
      version_id:     `ver-${i + 1}`,
      version_number: i + 1,
    }));

  it('returns [] when count is below MAX_VERSIONS', () => {
    expect(getVersionsToPrune(makeVersions(10))).toEqual([]);
  });

  it('returns [] when count is exactly MAX_VERSIONS (50)', () => {
    expect(getVersionsToPrune(makeVersions(MAX_VERSIONS))).toEqual([]);
  });

  it('returns 1 version_id when count is MAX_VERSIONS + 1', () => {
    const ids = getVersionsToPrune(makeVersions(MAX_VERSIONS + 1));
    expect(ids).toHaveLength(1);
    expect(ids[0]).toBe('ver-1'); // oldest
  });

  it('returns 5 version_ids when count is MAX_VERSIONS + 5', () => {
    const ids = getVersionsToPrune(makeVersions(MAX_VERSIONS + 5));
    expect(ids).toHaveLength(5);
    expect(ids).toEqual(['ver-1', 'ver-2', 'ver-3', 'ver-4', 'ver-5']);
  });

  it('prunes oldest (lowest version_number) not newest', () => {
    const versions = makeVersions(MAX_VERSIONS + 2);
    const ids = getVersionsToPrune(versions);
    // Should prune ver-1 and ver-2, keep ver-3 through ver-52
    expect(ids).toContain('ver-1');
    expect(ids).toContain('ver-2');
    expect(ids).not.toContain(`ver-${MAX_VERSIONS + 2}`); // newest kept
  });

  it('returns [] for empty array', () => {
    expect(getVersionsToPrune([])).toEqual([]);
  });

  it('returns [] when passed null or undefined', () => {
    expect(getVersionsToPrune(null)).toEqual([]);
    expect(getVersionsToPrune(undefined)).toEqual([]);
  });
});

// ─── Integration: snapshot-before-enrichment pattern ─────────────────────────
// These tests verify the pure logic works correctly in both enrichment and
// manual-edit contexts. Actual DB calls are tested in db.test.js.

describe('snapshot before enrichment (pure logic)', () => {
  it('buildCardSnapshot captures enrichment fields that an AI might overwrite', () => {
    const cardBeforeEnrich = {
      ...FULL_CARD_ROW,
      card_impact:           3,
      card_impact_source:    'ai',
      card_relevance:        'review',
      card_relevance_source: 'ai',
      card_ai_summary:       'Old summary',
    };
    const snap = buildCardSnapshot(cardBeforeEnrich, [], [], []);
    expect(snap.card_impact).toBe(3);
    expect(snap.card_impact_source).toBe('ai');
    expect(snap.card_relevance).toBe('review');
    expect(snap.card_ai_summary).toBe('Old summary');
  });

  it('buildCardSnapshot captures human-locked fields so restore can re-apply the lock', () => {
    const lockedCard = {
      ...FULL_CARD_ROW,
      card_impact_source:    'human',
      card_relevance:        'evergreen',
      card_relevance_source: 'human',
    };
    const snap = buildCardSnapshot(lockedCard, [], [], []);
    expect(snap.card_impact_source).toBe('human');
    expect(snap.card_relevance).toBe('evergreen');
    expect(snap.card_relevance_source).toBe('human');
  });

  it('restoring snapshot re-applies human locks via buildRestorePayload', () => {
    const lockedCard = { ...FULL_CARD_ROW, card_impact_source: 'human', card_relevance_source: 'human' };
    const snap = buildCardSnapshot(lockedCard, [], [], []);
    const { cardFields } = buildRestorePayload(snap);
    expect(cardFields.card_impact_source).toBe('human');
    expect(cardFields.card_relevance_source).toBe('human');
  });
});

describe('50-version cap (pure logic)', () => {
  it('MAX_VERSIONS is 50', () => {
    expect(MAX_VERSIONS).toBe(50);
  });

  it('adding version 51 triggers pruning of version 1', () => {
    // Simulate: we have 50 versions, we just inserted v51 → list is now 51
    const versions = Array.from({ length: 51 }, (_, i) => ({
      version_id: `ver-${i + 1}`,
      version_number: i + 1,
    }));
    const toPrune = getVersionsToPrune(versions);
    expect(toPrune).toEqual(['ver-1']);
  });

  it('restore creates pre-restore snapshot which could itself trigger pruning', () => {
    // Scenario: card at exactly 50 versions. Restore adds one (pre-restore snapshot)
    // → list is 51 → prune oldest.
    const versionsBefore = Array.from({ length: 50 }, (_, i) => ({
      version_id: `ver-${i + 1}`,
      version_number: i + 1,
    }));
    // Simulate the new pre-restore version being added (v51)
    const versionsAfter = [...versionsBefore, { version_id: 'ver-51', version_number: 51 }];
    const toPrune = getVersionsToPrune(versionsAfter);
    expect(toPrune).toHaveLength(1);
    expect(toPrune[0]).toBe('ver-1');
  });
});
