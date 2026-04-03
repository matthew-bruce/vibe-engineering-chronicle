import { describe, it, expect } from 'vitest';
import {
  parseEnrichmentResponse,
  shouldSkipCard,
  buildEnrichmentUpdate,
  aggregateSweepResults,
} from '../enrichment.js';

// ─── parseEnrichmentResponse ──────────────────────────────────────────────────

describe('parseEnrichmentResponse', () => {
  const valid = {
    card_impact:      4,
    card_relevance:   'current',
    card_ai_themes:   ['Signal', 'Industry'],
    card_ai_audience: 'leadership',
    card_ai_summary:  'A clear and useful insight.',
  };

  it('returns parsed fields for a valid response', () => {
    const result = parseEnrichmentResponse(valid);
    expect(result.card_impact).toBe(4);
    expect(result.card_relevance).toBe('current');
    expect(result.card_ai_themes).toEqual(['Signal', 'Industry']);
    expect(result.card_ai_audience).toBe('leadership');
    expect(result.card_ai_summary).toBe('A clear and useful insight.');
  });

  it('accepts all valid relevance values', () => {
    for (const rel of ['current', 'review', 'dated', 'evergreen']) {
      expect(() => parseEnrichmentResponse({ ...valid, card_relevance: rel })).not.toThrow();
    }
  });

  it('accepts all valid audience values', () => {
    for (const aud of ['beginner', 'practitioner', 'leadership', 'universal']) {
      expect(() => parseEnrichmentResponse({ ...valid, card_ai_audience: aud })).not.toThrow();
    }
  });

  it('throws on invalid card_impact (out of range high)', () => {
    expect(() => parseEnrichmentResponse({ ...valid, card_impact: 6 })).toThrow('Invalid card_impact');
  });

  it('throws on invalid card_impact (out of range low)', () => {
    expect(() => parseEnrichmentResponse({ ...valid, card_impact: 0 })).toThrow('Invalid card_impact');
  });

  it('throws on non-integer card_impact', () => {
    expect(() => parseEnrichmentResponse({ ...valid, card_impact: 3.5 })).toThrow('Invalid card_impact');
  });

  it('throws on invalid card_relevance', () => {
    expect(() => parseEnrichmentResponse({ ...valid, card_relevance: 'unknown' })).toThrow('Invalid card_relevance');
  });

  it('throws on invalid card_ai_audience', () => {
    expect(() => parseEnrichmentResponse({ ...valid, card_ai_audience: 'executive' })).toThrow('Invalid card_ai_audience');
  });

  it('filters out invalid themes silently, keeps valid ones', () => {
    const result = parseEnrichmentResponse({
      ...valid,
      card_ai_themes: ['Signal', 'NotATheme', 'Industry'],
    });
    expect(result.card_ai_themes).toEqual(['Signal', 'Industry']);
  });

  it('returns empty themes array when all are invalid', () => {
    const result = parseEnrichmentResponse({ ...valid, card_ai_themes: ['Foo', 'Bar'] });
    expect(result.card_ai_themes).toEqual([]);
  });

  it('returns empty themes array when themes is empty', () => {
    const result = parseEnrichmentResponse({ ...valid, card_ai_themes: [] });
    expect(result.card_ai_themes).toEqual([]);
  });

  it('treats non-array themes as empty', () => {
    const result = parseEnrichmentResponse({ ...valid, card_ai_themes: null });
    expect(result.card_ai_themes).toEqual([]);
  });

  it('throws on null input', () => {
    expect(() => parseEnrichmentResponse(null)).toThrow();
  });

  it('throws on non-object input', () => {
    expect(() => parseEnrichmentResponse('string')).toThrow();
  });
});

// ─── shouldSkipCard ───────────────────────────────────────────────────────────
// Versioning is the safety net — not field-level locks.
// Skip condition: card_relevance === 'evergreen', regardless of source.

describe('shouldSkipCard', () => {
  it('returns true for evergreen set by enrichment_engine', () => {
    expect(shouldSkipCard({ card_relevance: 'evergreen', card_relevance_source: 'enrichment_engine' })).toBe(true);
  });

  it('returns true for evergreen set by human', () => {
    expect(shouldSkipCard({ card_relevance: 'evergreen', card_relevance_source: 'human' })).toBe(true);
  });

  it('returns true for evergreen with null source', () => {
    expect(shouldSkipCard({ card_relevance: 'evergreen', card_relevance_source: null })).toBe(true);
  });

  it('returns false for non-evergreen set by human', () => {
    expect(shouldSkipCard({ card_relevance: 'current', card_relevance_source: 'human' })).toBe(false);
  });

  it('returns false when relevance is null', () => {
    expect(shouldSkipCard({ card_relevance: null, card_relevance_source: null })).toBe(false);
  });
});

// ─── buildEnrichmentUpdate ────────────────────────────────────────────────────
// No human-source locks — all non-evergreen cards are fully re-enriched.
// Source value is 'enrichment_engine' for both impact and relevance fields.

describe('buildEnrichmentUpdate', () => {
  const card = { card_id: 'abc-123' };

  const response = {
    card_impact:      4,
    card_relevance:   'current',
    card_ai_themes:   ['Signal'],
    card_ai_audience: 'leadership',
    card_ai_summary:  'A great insight.',
  };

  it('includes all enrichment fields in the update', () => {
    const update = buildEnrichmentUpdate(card, response);
    expect(update.card_impact).toBe(4);
    expect(update.card_relevance).toBe('current');
    expect(update.card_ai_themes).toEqual(['Signal']);
    expect(update.card_ai_audience).toBe('leadership');
    expect(update.card_ai_summary).toBe('A great insight.');
    expect(update.card_enriched_at).toBeDefined();
  });

  it('sets card_enriched_at as an ISO timestamp', () => {
    const update = buildEnrichmentUpdate(card, response);
    expect(() => new Date(update.card_enriched_at)).not.toThrow();
    expect(new Date(update.card_enriched_at).getFullYear()).toBeGreaterThan(2020);
  });

  it('sets card_impact_source to enrichment_engine', () => {
    const update = buildEnrichmentUpdate(card, response);
    expect(update.card_impact_source).toBe('enrichment_engine');
  });

  it('sets card_relevance_source to enrichment_engine', () => {
    const update = buildEnrichmentUpdate(card, response);
    expect(update.card_relevance_source).toBe('enrichment_engine');
  });

  it('overwrites impact even when previously set by human (versioning is the safety net)', () => {
    const prevCard = { ...card, card_impact: 2, card_impact_source: 'human' };
    const update = buildEnrichmentUpdate(prevCard, response);
    expect(update.card_impact).toBe(4);
    expect(update.card_impact_source).toBe('enrichment_engine');
  });

  it('overwrites relevance even when previously set by human', () => {
    const prevCard = { ...card, card_relevance: 'review', card_relevance_source: 'human' };
    const update = buildEnrichmentUpdate(prevCard, response);
    expect(update.card_relevance).toBe('current');
    expect(update.card_relevance_source).toBe('enrichment_engine');
  });

  it('overwrites a prior enrichment_engine value without needing any check', () => {
    const prevCard = { ...card, card_impact_source: 'enrichment_engine', card_relevance_source: 'enrichment_engine' };
    const update = buildEnrichmentUpdate(prevCard, response);
    expect(update.card_impact).toBe(4);
    expect(update.card_relevance).toBe('current');
  });

  it('always writes card_ai_summary directly from response', () => {
    const update = buildEnrichmentUpdate(card, response);
    expect(update.card_ai_summary).toBe('A great insight.');
  });
});

// ─── aggregateSweepResults ────────────────────────────────────────────────────

describe('aggregateSweepResults', () => {
  it('counts enriched, skipped, and failed correctly', () => {
    const results = [
      { enriched: true },
      { enriched: true },
      { skipped: true },
      { failed: true },
      { enriched: true },
    ];
    const summary = aggregateSweepResults(results);
    expect(summary.enriched).toBe(3);
    expect(summary.skipped).toBe(1);
    expect(summary.failed).toBe(1);
  });

  it('returns zeros for an empty array', () => {
    expect(aggregateSweepResults([])).toEqual({ enriched: 0, skipped: 0, failed: 0 });
  });

  it('handles all-enriched', () => {
    const results = [{ enriched: true }, { enriched: true }];
    const s = aggregateSweepResults(results);
    expect(s.enriched).toBe(2);
    expect(s.skipped).toBe(0);
    expect(s.failed).toBe(0);
  });

  it('handles all-skipped', () => {
    const results = [{ skipped: true }, { skipped: true }];
    const s = aggregateSweepResults(results);
    expect(s.skipped).toBe(2);
    expect(s.enriched).toBe(0);
    expect(s.failed).toBe(0);
  });

  it('handles all-failed', () => {
    const results = [{ failed: true }, { failed: true }, { failed: true }];
    const s = aggregateSweepResults(results);
    expect(s.failed).toBe(3);
    expect(s.enriched).toBe(0);
    expect(s.skipped).toBe(0);
  });

  it('sums correctly with mixed results of many cards', () => {
    const results = Array.from({ length: 10 }, (_, i) => {
      if (i < 6) return { enriched: true };
      if (i < 8) return { skipped: true };
      return { failed: true };
    });
    const s = aggregateSweepResults(results);
    expect(s.enriched).toBe(6);
    expect(s.skipped).toBe(2);
    expect(s.failed).toBe(2);
  });
});
