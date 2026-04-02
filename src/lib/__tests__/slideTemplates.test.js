import { describe, it, expect } from 'vitest';
import { scoreCard, thumbScrollDelta } from '../slideTemplates.jsx';

// ── scoreCard() ───────────────────────────────────────────────────────────────

describe('scoreCard() — standard mode', () => {
  it('returns standard when detailMode is false, no sections', () => {
    expect(scoreCard({ sections: [] }, false)).toBe('standard');
  });

  it('returns standard when detailMode is false, many sections', () => {
    expect(scoreCard({ sections: [1, 2, 3, 4, 5].map(id => ({ id })) }, false)).toBe('standard');
  });

  it('returns standard even when card_template_preference is set and detailMode is false', () => {
    expect(scoreCard({ card_template_preference: 'detailed-two-col', sections: [] }, false)).toBe('standard');
  });

  it('handles missing sections gracefully in standard mode', () => {
    expect(scoreCard({}, false)).toBe('standard');
  });
});

describe('scoreCard() — template preference override', () => {
  it('returns the preference value when set and detailMode is true', () => {
    expect(scoreCard({ card_template_preference: 'detailed-two-col', sections: [] }, true)).toBe('detailed-two-col');
  });

  it('returns preference over section-count scoring', () => {
    const card = { card_template_preference: 'detailed-overflow', sections: [{ id: 1 }] };
    expect(scoreCard(card, true)).toBe('detailed-overflow');
  });

  it('ignores falsy preference (null)', () => {
    expect(scoreCard({ card_template_preference: null, sections: [] }, true)).toBe('detailed-single');
  });

  it('ignores falsy preference (empty string)', () => {
    expect(scoreCard({ card_template_preference: '', sections: [] }, true)).toBe('detailed-single');
  });
});

describe('scoreCard() — section count scoring in detail mode', () => {
  it('returns detailed-single for 0 sections', () => {
    expect(scoreCard({ sections: [] }, true)).toBe('detailed-single');
  });

  it('returns detailed-single for 1 section', () => {
    expect(scoreCard({ sections: [{ id: 1 }] }, true)).toBe('detailed-single');
  });

  it('returns detailed-two-col for exactly 2 sections', () => {
    expect(scoreCard({ sections: [{ id: 1 }, { id: 2 }] }, true)).toBe('detailed-two-col');
  });

  it('returns detailed-three-col for exactly 3 sections', () => {
    expect(scoreCard({ sections: [{ id: 1 }, { id: 2 }, { id: 3 }] }, true)).toBe('detailed-three-col');
  });

  it('returns detailed-overflow for 4 sections', () => {
    expect(scoreCard({ sections: [1, 2, 3, 4].map(id => ({ id })) }, true)).toBe('detailed-overflow');
  });

  it('returns detailed-overflow for 10 sections', () => {
    expect(scoreCard({ sections: Array.from({ length: 10 }, (_, i) => ({ id: i })) }, true)).toBe('detailed-overflow');
  });

  it('handles missing sections property in detail mode', () => {
    expect(scoreCard({}, true)).toBe('detailed-single');
  });
});

// ── thumbScrollDelta() ────────────────────────────────────────────────────────

describe('thumbScrollDelta()', () => {
  const strip = { left: 100, right: 600 };

  it('returns 0 when thumb is fully visible', () => {
    expect(thumbScrollDelta(strip, { left: 200, right: 300 })).toBe(0);
  });

  it('returns 0 when thumb left edge exactly meets strip left edge', () => {
    expect(thumbScrollDelta(strip, { left: 100, right: 200 })).toBe(0);
  });

  it('returns 0 when thumb right edge exactly meets strip right edge', () => {
    expect(thumbScrollDelta(strip, { left: 500, right: 600 })).toBe(0);
  });

  it('returns negative delta when thumb is off the left edge', () => {
    // strip.left=100, thumb.left=60 → should scroll left by (100-60+12) = 52
    expect(thumbScrollDelta(strip, { left: 60, right: 160 })).toBe(-52);
  });

  it('returns correct negative delta for heavily off-screen left thumb', () => {
    // strip.left=100, thumb.left=0 → -(100-0+12) = -112
    expect(thumbScrollDelta(strip, { left: 0, right: 100 })).toBe(-112);
  });

  it('returns positive delta when thumb is off the right edge', () => {
    // thumb.right=650, strip.right=600 → 650-600+12 = 62
    expect(thumbScrollDelta(strip, { left: 550, right: 650 })).toBe(62);
  });

  it('returns correct positive delta for heavily off-screen right thumb', () => {
    // thumb.right=800, strip.right=600 → 800-600+12 = 212
    expect(thumbScrollDelta(strip, { left: 700, right: 800 })).toBe(212);
  });

  it('left edge check takes priority over right when thumb spans beyond both', () => {
    // thumb wider than strip, left is off left edge — left condition fires first
    expect(thumbScrollDelta(strip, { left: 50, right: 700 })).toBeLessThan(0);
  });
});
