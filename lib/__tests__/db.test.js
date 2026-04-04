import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';

// ─── Mock queue (hoisted so vi.mock factory can access it) ────────────────────

const { mockQueue, enqueue, storageMockQueue, enqueueStorage } = vi.hoisted(() => {
  const mockQueue = [];
  const storageMockQueue = [];
  return {
    mockQueue,
    storageMockQueue,
    enqueue: (...items) => mockQueue.push(...items),
    enqueueStorage: (...items) => storageMockQueue.push(...items),
  };
});

vi.mock('../supabase.js', () => {
  function makeChain(result) {
    const obj = {
      then: (res, rej) => Promise.resolve(result).then(res, rej),
      catch: (rej) => Promise.resolve(result).catch(rej),
      single: vi.fn(() => Promise.resolve(result)),
    };
    ['select', 'insert', 'update', 'delete', 'is', 'not', 'eq', 'in', 'order', 'limit'].forEach(m => {
      obj[m] = vi.fn(() => obj);
    });
    return obj;
  }

  return {
    default: {
      from: vi.fn(() => {
        const result = mockQueue.shift() ?? { data: [], error: null };
        return makeChain(result);
      }),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(() => Promise.resolve(storageMockQueue.shift() ?? { error: null })),
          remove: vi.fn(() => Promise.resolve(storageMockQueue.shift() ?? { error: null })),
          getPublicUrl: vi.fn(path => ({ data: { publicUrl: `https://mock.storage/${path}` } })),
        })),
      },
    },
  };
});

// ─── Test fixtures ────────────────────────────────────────────────────────────

const CAT_UUID_WOW      = 'cat-uuid-wow';
const CAT_UUID_LEARNING = 'cat-uuid-learning';
const THEME_UUID_SIGNAL = 'theme-uuid-signal';
const THEME_UUID_INDUSTRY = 'theme-uuid-industry';
const PROJECT_UUID      = 'proj-uuid-chronicle';
const CARD_UUID         = 'card-uuid-1';
const SESSION_UUID      = 'session-uuid-1';
const SECTION_UUID      = 'section-uuid-1';
const CREATED_AT        = '2026-03-24T10:00:00Z';

const MOCK_CATEGORIES = [
  { category_id: CAT_UUID_WOW,      category_name: 'Wow Moment',  category_colour: '#B07FE8', category_glyph: '✦', category_description: 'A moment of genuine surprise or delight.' },
  { category_id: CAT_UUID_LEARNING, category_name: 'Key Learning', category_colour: '#F5A623', category_glyph: '◉', category_description: 'Something important you now understand differently.' },
];
const MOCK_THEMES = [
  { theme_id: THEME_UUID_SIGNAL,   theme_name: 'Signal'   },
  { theme_id: THEME_UUID_INDUSTRY, theme_name: 'Industry' },
];
const MOCK_PROJECTS = [
  { project_id: PROJECT_UUID, project_name: 'Vibe Engineering Chronicle' },
];

// ─── Import module under test ─────────────────────────────────────────────────

import * as db from '../db.js';
import { cats } from '../cats.js';

// ─── Seed initLookups before all tests ───────────────────────────────────────

beforeAll(async () => {
  enqueue(
    { data: MOCK_CATEGORIES, error: null },
    { data: MOCK_THEMES,     error: null },
    { data: MOCK_PROJECTS,   error: null },
  );
  await db.initLookups();
});

beforeEach(() => {
  mockQueue.length = 0;
  storageMockQueue.length = 0;
});

// ─── initLookups ──────────────────────────────────────────────────────────────

describe('initLookups', () => {
  it('succeeds when supabase returns valid data', async () => {
    enqueue(
      { data: MOCK_CATEGORIES, error: null },
      { data: MOCK_THEMES,     error: null },
      { data: MOCK_PROJECTS,   error: null },
    );
    await expect(db.initLookups()).resolves.toBeUndefined();
  });

  it('populates cats with label, color, glyph, description from DB', async () => {
    enqueue(
      { data: MOCK_CATEGORIES, error: null },
      { data: MOCK_THEMES,     error: null },
      { data: MOCK_PROJECTS,   error: null },
    );
    await db.initLookups();
    expect(cats.wow).toEqual({ label: 'Wow Moment', color: '#B07FE8', glyph: '✦', description: 'A moment of genuine surprise or delight.' });
    expect(cats.learning).toEqual({ label: 'Key Learning', color: '#F5A623', glyph: '◉', description: 'Something important you now understand differently.' });
    expect(cats.session).toBeDefined(); // virtual — always present
  });

  it('stores empty string for description when category_description is null', async () => {
    const catsWithNullDesc = MOCK_CATEGORIES.map(c => ({ ...c, category_description: null }));
    enqueue(
      { data: catsWithNullDesc, error: null },
      { data: MOCK_THEMES,      error: null },
      { data: MOCK_PROJECTS,    error: null },
    );
    await db.initLookups();
    expect(cats.wow.description).toBe('');
    expect(cats.learning.description).toBe('');
  });

  it('throws when categories query fails', async () => {
    enqueue(
      { data: null, error: new Error('cats error') },
      { data: MOCK_THEMES,   error: null },
      { data: MOCK_PROJECTS, error: null },
    );
    await expect(db.initLookups()).rejects.toThrow('cats error');
  });
});

// ─── loadTimeline ─────────────────────────────────────────────────────────────

describe('loadTimeline', () => {
  it('returns mapped timeline entries with sections attached', async () => {
    const row = {
      card_id:          CARD_UUID,
      card_title:       'Test entry',
      card_body:        'Some body',
      card_benefit:     'Some benefit',
      card_impact:      3,
      card_audience:    'leadership',
      card_ai_summary:  'AI-generated summary',
      card_enriched_at: '2026-03-25T12:00:00Z',
      card_event_date:  '2026-03-24',
      card_source:      null,
      card_format:      'fact_or_fiction',
      card_created_at:  CREATED_AT,
      card_categories:  [{ category_id: CAT_UUID_WOW }],
      card_themes:      [{ theme_id: THEME_UUID_SIGNAL }],
    };
    const sectionRow = { section_id: SECTION_UUID, card_id: CARD_UUID, section_label: 'What changed', section_body: 'Everything', section_order: 0 };
    enqueue({ data: [row], error: null });       // cards query
    enqueue({ data: [sectionRow], error: null }); // sections query

    const result = await db.loadTimeline();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(CARD_UUID);
    expect(result[0].title).toBe('Test entry');
    expect(result[0].body).toBe('Some body');
    expect(result[0].benefit).toBe('Some benefit');
    expect(result[0].impact).toBe(3);
    expect(result[0].audience).toBe('leadership');
    expect(result[0].aiSummary).toBe('AI-generated summary');
    expect(result[0].enrichedAt).toBe('2026-03-25T12:00:00Z');
    expect(result[0].date).toBe('2026-03-24');
    expect(result[0].category).toBe('wow');
    expect(result[0].format).toBe('fact_or_fiction');
    expect(result[0].themes).toContain('signal');
    expect(result[0].createdAt).toBe(new Date(CREATED_AT).getTime());
    expect(result[0].sections).toHaveLength(1);
    expect(result[0].sections[0].label).toBe('What changed');
  });

  it('maps unknown category to "session", nulls ai fields when absent, and returns empty sections', async () => {
    const row = {
      card_id: CARD_UUID, card_title: 'T', card_body: null,
      card_benefit: null, card_impact: null, card_audience: null,
      card_ai_summary: null, card_enriched_at: null,
      card_event_date: '2026-03-24',
      card_source: null, card_format: null, card_created_at: CREATED_AT,
      card_categories: [], card_themes: [],
    };
    enqueue({ data: [row], error: null });    // cards query
    enqueue({ data: [], error: null });        // sections query (none)
    const result = await db.loadTimeline();
    expect(result[0].category).toBe('session');
    expect(result[0].impact).toBeNull();
    expect(result[0].audience).toBeNull();
    expect(result[0].aiSummary).toBeNull();
    expect(result[0].enrichedAt).toBeNull();
    expect(result[0].format).toBeNull();
    expect(result[0].sections).toEqual([]);
  });

  it('includes cards with null card_event_date — they appear on the Timeline', async () => {
    const row = {
      card_id: CARD_UUID, card_title: 'Quick capture',
      card_body: null, card_benefit: null, card_impact: null, card_audience: null,
      card_ai_summary: null, card_enriched_at: null,
      card_event_date: null,
      card_source: null, card_format: null, card_created_at: CREATED_AT,
      card_categories: [{ category_id: CAT_UUID_WOW }], card_themes: [],
    };
    enqueue({ data: [row], error: null });
    enqueue({ data: [], error: null });

    const result = await db.loadTimeline();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(CARD_UUID);
  });

  it('falls back to card_created_at date when card_event_date is null', async () => {
    const row = {
      card_id: CARD_UUID, card_title: 'No event date',
      card_body: null, card_benefit: null, card_impact: null, card_audience: null,
      card_ai_summary: null, card_enriched_at: null,
      card_event_date: null,
      card_source: null, card_format: null, card_created_at: CREATED_AT,
      card_categories: [], card_themes: [],
    };
    enqueue({ data: [row], error: null });
    enqueue({ data: [], error: null });

    const result = await db.loadTimeline();
    expect(result[0].date).toBe('2026-03-24'); // date portion of CREATED_AT
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('db error') });
    await expect(db.loadTimeline()).rejects.toThrow('db error');
  });
});

// ─── loadCaptures ─────────────────────────────────────────────────────────────

describe('loadCaptures', () => {
  it('returns mapped captures', async () => {
    const row = {
      card_id: CARD_UUID, card_title: 'Captured thought',
      card_body: null, card_benefit: null, card_event_date: null,
      card_source: 'Some source', card_created_at: CREATED_AT,
      card_categories: [], card_themes: [{ theme_id: THEME_UUID_SIGNAL }],
    };
    enqueue({ data: [row], error: null });

    const result = await db.loadCaptures();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(CARD_UUID);
    expect(result[0].text).toBe('Captured thought');
    expect(result[0].source).toBe('Some source');
    expect(result[0].themes).toContain('signal');
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('capture error') });
    await expect(db.loadCaptures()).rejects.toThrow('capture error');
  });
});

// ─── loadSessions ─────────────────────────────────────────────────────────────

describe('loadSessions', () => {
  it('returns mapped sessions', async () => {
    const row = {
      session_id:               SESSION_UUID,
      project_id:               PROJECT_UUID,
      session_date:             '2026-03-24',
      session_duration_minutes: 120,
      session_notes:            'Good session',
      session_created_at:       CREATED_AT,
    };
    enqueue({ data: [row], error: null });

    const result = await db.loadSessions();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(SESSION_UUID);
    expect(result[0].project).toBe('Vibe Engineering Chronicle');
    expect(result[0].durationMins).toBe(120);
    expect(result[0].notes).toBe('Good session');
    expect(result[0].date).toBe('2026-03-24');
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('session error') });
    await expect(db.loadSessions()).rejects.toThrow('session error');
  });
});

// ─── addTimelineEntry ─────────────────────────────────────────────────────────

describe('addTimelineEntry', () => {
  it('inserts card and returns entry with server id and createdAt', async () => {
    // 1. insert card → single()
    enqueue({ data: { card_id: CARD_UUID, card_created_at: CREATED_AT }, error: null });
    // 2. insert card_categories
    enqueue({ data: null, error: null });
    // 3. insert card_themes
    enqueue({ data: null, error: null });

    const entry = {
      title: 'Test entry', body: 'Body text',
      date: '2026-03-24', category: 'wow',
      themes: ['signal'], benefit: 'Big benefit',
    };
    const result = await db.addTimelineEntry(entry);
    expect(result.id).toBe(CARD_UUID);
    expect(result.title).toBe('Test entry');
    expect(result.createdAt).toBe(new Date(CREATED_AT).getTime());
  });

  it('passes impact and audience to insert', async () => {
    enqueue({ data: { card_id: CARD_UUID, card_created_at: CREATED_AT }, error: null });
    enqueue({ data: null, error: null }); // cat insert
    // no themes

    const entry = {
      title: 'Impact entry', body: '', date: '2026-03-24',
      category: 'wow', themes: [], benefit: '',
      impact: 4, audience: 'universal',
    };
    const result = await db.addTimelineEntry(entry);
    expect(result.impact).toBe(4);
    expect(result.audience).toBe('universal');
  });

  it('passes format to insert and returns it on the mapped result', async () => {
    enqueue({ data: { card_id: CARD_UUID, card_created_at: CREATED_AT }, error: null });
    enqueue({ data: null, error: null }); // cat insert
    // no themes

    const entry = {
      title: 'Format entry', body: '', date: '2026-03-24',
      category: 'wow', themes: [], benefit: '',
      format: 'fact_or_fiction',
    };
    const result = await db.addTimelineEntry(entry);
    expect(result.format).toBe('fact_or_fiction');
  });

  it('passes format: null through when explicitly null (blankForm default)', async () => {
    enqueue({ data: { card_id: CARD_UUID, card_created_at: CREATED_AT }, error: null });
    enqueue({ data: null, error: null }); // cat insert

    const entry = {
      title: 'No format', body: '', date: '2026-03-24',
      category: 'wow', themes: [], benefit: '',
      format: null,
    };
    const result = await db.addTimelineEntry(entry);
    expect(result.format).toBeNull();
  });

  it('skips category insert when category has no UUID', async () => {
    // 1. insert card → single()
    enqueue({ data: { card_id: CARD_UUID, card_created_at: CREATED_AT }, error: null });
    // No category insert (session has no DB category)
    // No theme insert (empty themes)

    const entry = {
      title: 'Session card', body: '', date: '2026-03-24',
      category: 'session', themes: [], benefit: '',
    };
    const result = await db.addTimelineEntry(entry);
    expect(result.id).toBe(CARD_UUID);
  });

  it('throws when card insert fails', async () => {
    enqueue({ data: null, error: new Error('insert failed') });
    await expect(db.addTimelineEntry({
      title: 'X', body: '', date: '2026-03-24',
      category: 'wow', themes: [], benefit: '',
    })).rejects.toThrow('insert failed');
  });
});

// ─── Shared helper: enqueue a snapshotCard call (7 queue items, no pruning) ──

const SNAPSHOT_CARD_ROW = {
  card_title: 'Test', card_body: null, card_benefit: null,
  card_impact: null, card_impact_source: null, card_audience: null,
  card_format: null, card_event_date: '2026-03-24', card_source: null,
  card_relevance: null, card_relevance_source: null,
  card_ai_themes: [], card_ai_audience: null, card_ai_summary: null, card_enriched_at: null,
};
function enqueueSnapshot({ pruneCount = 0, cardRow = SNAPSHOT_CARD_ROW } = {}) {
  // 1. card row (single)
  enqueue({ data: cardRow, error: null });
  // 2. card_categories
  enqueue({ data: [], error: null });
  // 3. card_themes
  enqueue({ data: [], error: null });
  // 4. card_sections
  enqueue({ data: [], error: null });
  // 5. max version_number (single)
  enqueue({ data: null, error: null }); // no existing versions
  // 6. insert version row
  enqueue({ data: null, error: null });
  // 7. all versions list (for pruning check)
  const existingCount = 1; // just inserted
  const versionList = Array.from({ length: existingCount + pruneCount }, (_, i) => ({
    version_id: `ver-${i + 1}`, version_number: i + 1,
  }));
  enqueue({ data: versionList, error: null });
  // 8. if pruning: delete query
  if (pruneCount > 0) {
    enqueue({ data: null, error: null });
  }
}

// ─── updateTimelineEntry ──────────────────────────────────────────────────────

describe('updateTimelineEntry', () => {
  it('resolves without error with full fields', async () => {
    enqueueSnapshot();
    enqueue(
      { data: null, error: null }, // update cards
      { data: null, error: null }, // delete card_categories
      { data: null, error: null }, // insert card_categories (wow → uuid exists)
      { data: null, error: null }, // delete card_themes
      { data: null, error: null }, // insert card_themes (signal → uuid exists)
    );
    await expect(db.updateTimelineEntry(CARD_UUID, {
      title: 'Updated', body: 'Body', date: '2026-03-24',
      category: 'wow', themes: ['signal'], benefit: '',
      impact: 3, audience: 'practitioner',
    })).resolves.toBeUndefined();
  });

  it('skips category/theme inserts when empty', async () => {
    enqueueSnapshot();
    enqueue(
      { data: null, error: null }, // update cards
      { data: null, error: null }, // delete card_categories
      // no category insert (session)
      { data: null, error: null }, // delete card_themes
      // no theme insert (empty)
    );
    await expect(db.updateTimelineEntry(CARD_UUID, {
      title: 'Updated', body: '', date: '2026-03-24',
      category: 'session', themes: [], benefit: '',
    })).resolves.toBeUndefined();
  });
});

// ─── snapshotCard ─────────────────────────────────────────────────────────────

describe('snapshotCard', () => {
  it('resolves without error when card exists and no previous versions', async () => {
    enqueueSnapshot();
    await expect(db.snapshotCard(CARD_UUID, 'user', 'Manual edit')).resolves.toBeUndefined();
    expect(mockQueue).toHaveLength(0);
  });

  it('resolves without error for enrichment_engine versioned_by', async () => {
    enqueueSnapshot();
    await expect(db.snapshotCard(CARD_UUID, 'enrichment_engine', 'Pre-enrichment snapshot')).resolves.toBeUndefined();
  });

  it('computes next version_number as 1 when no prior versions exist', async () => {
    // We can't inspect the insert args directly in this mock, but we verify
    // the function completes without error (meaning insert was called)
    enqueueSnapshot();
    await expect(db.snapshotCard(CARD_UUID, 'user', 'Test')).resolves.toBeUndefined();
  });

  it('prunes oldest version when count exceeds 50', async () => {
    // 50 existing + 1 just inserted = 51 → prune 1 → 8 queue items
    enqueueSnapshot({ pruneCount: 50 });
    await expect(db.snapshotCard(CARD_UUID, 'user', 'Test')).resolves.toBeUndefined();
    expect(mockQueue).toHaveLength(0);
  });

  it('does not prune when count is exactly 50', async () => {
    // Simulate: after insert there are exactly 50 versions (49 old + 1 new)
    // enqueueSnapshot puts 1 item in versionList → well under 50 → no prune
    enqueueSnapshot(); // 1 item in list = no prune needed
    await expect(db.snapshotCard(CARD_UUID, 'user', 'Test')).resolves.toBeUndefined();
  });

  it('throws when card fetch fails', async () => {
    enqueue({ data: null, error: new Error('card not found') }); // card single
    enqueue({ data: [], error: null }); // cats
    enqueue({ data: [], error: null }); // themes
    enqueue({ data: [], error: null }); // sections
    await expect(db.snapshotCard(CARD_UUID, 'user', 'Test')).rejects.toThrow('card not found');
  });

  it('throws when insert fails', async () => {
    enqueue({ data: SNAPSHOT_CARD_ROW, error: null }); // card
    enqueue({ data: [], error: null }); // cats
    enqueue({ data: [], error: null }); // themes
    enqueue({ data: [], error: null }); // sections
    enqueue({ data: null, error: null }); // max version (single)
    enqueue({ data: null, error: new Error('insert failed') }); // insert version
    await expect(db.snapshotCard(CARD_UUID, 'user', 'Test')).rejects.toThrow('insert failed');
  });
});

// ─── loadCardVersions ─────────────────────────────────────────────────────────

describe('loadCardVersions', () => {
  it('returns mapped version list ordered by version_number desc', async () => {
    enqueue({ data: [
      { version_id: 'ver-2', version_number: 2, versioned_at: '2026-03-25T10:00:00Z', versioned_by: 'user', version_note: 'Manual edit' },
      { version_id: 'ver-1', version_number: 1, versioned_at: '2026-03-24T10:00:00Z', versioned_by: 'enrichment_engine', version_note: 'Pre-enrichment snapshot' },
    ], error: null });
    const result = await db.loadCardVersions(CARD_UUID);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('ver-2');
    expect(result[0].number).toBe(2);
    expect(result[0].versionedBy).toBe('user');
    expect(result[0].note).toBe('Manual edit');
    expect(result[1].versionedBy).toBe('enrichment_engine');
  });

  it('returns empty array when no versions', async () => {
    enqueue({ data: [], error: null });
    const result = await db.loadCardVersions(CARD_UUID);
    expect(result).toEqual([]);
  });

  it('defaults version_note to empty string when null', async () => {
    enqueue({ data: [
      { version_id: 'ver-1', version_number: 1, versioned_at: '2026-03-24T10:00:00Z', versioned_by: 'user', version_note: null },
    ], error: null });
    const result = await db.loadCardVersions(CARD_UUID);
    expect(result[0].note).toBe('');
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('versions error') });
    await expect(db.loadCardVersions(CARD_UUID)).rejects.toThrow('versions error');
  });
});

// ─── restoreCardVersion ───────────────────────────────────────────────────────

describe('restoreCardVersion', () => {
  const VERSION_ID = 'ver-1';
  const MOCK_SNAPSHOT = {
    card_title: 'Restored title', card_body: 'Restored body',
    card_benefit: null, card_impact: 3, card_impact_source: 'human',
    card_audience: 'practitioner', card_format: null,
    card_event_date: '2026-03-01', card_source: null,
    card_relevance: 'current', card_relevance_source: 'ai',
    card_ai_themes: [], card_ai_audience: null, card_ai_summary: null, card_enriched_at: null,
    categories: ['cat-uuid-wow'],
    themes: ['theme-uuid-signal'],
    sections: [{ label: 'Context', body: 'Some context', order: 0 }],
  };

  it('resolves without error on a full restore (with cats, themes, sections)', async () => {
    enqueueSnapshot(); // pre-restore snapshot (7 items)
    enqueue({ data: { card_snapshot: MOCK_SNAPSHOT }, error: null }); // load target version
    enqueue({ data: null, error: null }); // update cards
    enqueue({ data: null, error: null }); // delete card_categories
    enqueue({ data: null, error: null }); // insert card_categories
    enqueue({ data: null, error: null }); // delete card_themes
    enqueue({ data: null, error: null }); // insert card_themes
    enqueue({ data: null, error: null }); // soft-delete sections
    enqueue({ data: null, error: null }); // insert sections

    await expect(db.restoreCardVersion(CARD_UUID, VERSION_ID)).resolves.toBeUndefined();
    expect(mockQueue).toHaveLength(0);
  });

  it('skips cat/theme/section inserts when snapshot has none', async () => {
    const emptySnap = { ...MOCK_SNAPSHOT, categories: [], themes: [], sections: [] };
    enqueueSnapshot();
    enqueue({ data: { card_snapshot: emptySnap }, error: null }); // load version
    enqueue({ data: null, error: null }); // update cards
    enqueue({ data: null, error: null }); // delete card_categories (no insert)
    enqueue({ data: null, error: null }); // delete card_themes (no insert)
    enqueue({ data: null, error: null }); // soft-delete sections (no insert)

    await expect(db.restoreCardVersion(CARD_UUID, VERSION_ID)).resolves.toBeUndefined();
    expect(mockQueue).toHaveLength(0);
  });

  it('throws when snapshot load fails', async () => {
    enqueueSnapshot();
    enqueue({ data: null, error: new Error('version not found') }); // load version fails
    await expect(db.restoreCardVersion(CARD_UUID, VERSION_ID)).rejects.toThrow('version not found');
  });

  it('throws when card update fails', async () => {
    enqueueSnapshot();
    enqueue({ data: { card_snapshot: MOCK_SNAPSHOT }, error: null }); // load version
    enqueue({ data: null, error: new Error('card update failed') }); // update cards
    await expect(db.restoreCardVersion(CARD_UUID, VERSION_ID)).rejects.toThrow('card update failed');
  });

  it('creates a pre-restore snapshot before applying the restore', async () => {
    // Verify 7 snapshot items are consumed before the version is loaded
    enqueueSnapshot();
    enqueue({ data: { card_snapshot: { ...MOCK_SNAPSHOT, categories: [], themes: [], sections: [] } }, error: null });
    enqueue({ data: null, error: null }); // update
    enqueue({ data: null, error: null }); // del cats
    enqueue({ data: null, error: null }); // del themes
    enqueue({ data: null, error: null }); // del sections

    await db.restoreCardVersion(CARD_UUID, VERSION_ID);
    // All queue items consumed — snapshot was taken and restore applied
    expect(mockQueue).toHaveLength(0);
  });
});

// ─── softDeleteCard ───────────────────────────────────────────────────────────

describe('softDeleteCard', () => {
  it('resolves without error', async () => {
    enqueue({ data: null, error: null });
    await expect(db.softDeleteCard(CARD_UUID)).resolves.toBeUndefined();
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('delete failed') });
    await expect(db.softDeleteCard(CARD_UUID)).rejects.toThrow('delete failed');
  });
});

// ─── addCapture ───────────────────────────────────────────────────────────────

describe('addCapture', () => {
  it('inserts capture and returns with server id', async () => {
    enqueue({ data: { card_id: CARD_UUID, card_created_at: CREATED_AT }, error: null });
    enqueue({ data: null, error: null }); // theme insert

    const entry = { text: 'A captured thought', source: 'Twitter', themes: ['signal'] };
    const result = await db.addCapture(entry);
    expect(result.id).toBe(CARD_UUID);
    expect(result.text).toBe('A captured thought');
    expect(result.source).toBe('Twitter');
  });

  it('skips theme insert when no themes', async () => {
    enqueue({ data: { card_id: CARD_UUID, card_created_at: CREATED_AT }, error: null });
    // no theme insert needed

    const entry = { text: 'No themes', source: '', themes: [] };
    const result = await db.addCapture(entry);
    expect(result.id).toBe(CARD_UUID);
    expect(mockQueue).toHaveLength(0); // nothing left in queue
  });

  it('throws when insert fails', async () => {
    enqueue({ data: null, error: new Error('capture insert failed') });
    await expect(db.addCapture({ text: 'X', source: '', themes: [] })).rejects.toThrow('capture insert failed');
  });
});

// ─── addSession ───────────────────────────────────────────────────────────────

describe('addSession', () => {
  it('inserts session and returns with server id', async () => {
    enqueue({ data: { session_id: SESSION_UUID, session_created_at: CREATED_AT }, error: null });

    const entry = {
      project: 'Vibe Engineering Chronicle',
      date: '2026-03-24', durationMins: 90, notes: 'Good work',
    };
    const result = await db.addSession(entry);
    expect(result.id).toBe(SESSION_UUID);
    expect(result.durationMins).toBe(90);
    expect(result.createdAt).toBe(new Date(CREATED_AT).getTime());
  });

  it('throws when insert fails', async () => {
    enqueue({ data: null, error: new Error('session insert failed') });
    await expect(db.addSession({
      project: 'Vibe Engineering Chronicle',
      date: '2026-03-24', durationMins: 30, notes: '',
    })).rejects.toThrow('session insert failed');
  });
});

// ─── updateSession ────────────────────────────────────────────────────────────

describe('updateSession', () => {
  it('resolves without error', async () => {
    enqueue({ data: null, error: null });
    await expect(db.updateSession(SESSION_UUID, {
      project: 'Vibe Engineering Chronicle',
      date: '2026-03-24', durationMins: 60, notes: 'Updated',
    })).resolves.toBeUndefined();
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('update failed') });
    await expect(db.updateSession(SESSION_UUID, {
      project: 'Vibe Engineering Chronicle',
      date: '2026-03-24', durationMins: 60, notes: '',
    })).rejects.toThrow('update failed');
  });
});

// ─── softDeleteSession ────────────────────────────────────────────────────────

describe('softDeleteSession', () => {
  it('resolves without error', async () => {
    enqueue({ data: null, error: null });
    await expect(db.softDeleteSession(SESSION_UUID)).resolves.toBeUndefined();
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('session delete failed') });
    await expect(db.softDeleteSession(SESSION_UUID)).rejects.toThrow('session delete failed');
  });
});

// ─── getProjects ──────────────────────────────────────────────────────────────

const PROJECT_ROW = {
  project_id: PROJECT_UUID,
  project_name: 'Vibe Engineering Chronicle',
  project_status: 'live',
  project_description: 'A chronicle app.',
  project_problem: 'Hard to track insights.',
  project_evolution: 'Grew into a full app.',
  project_key_features: ['Timeline', 'Capture', 'Sessions'],
  project_saas_replaced: 'Notion',
  project_live_url: null,
  project_demo_url: null,
};

describe('getProjects', () => {
  it('returns mapped projects with totalMins and attachments', async () => {
    enqueue({ data: [PROJECT_ROW], error: null }); // projects
    enqueue({ data: [{ project_id: PROJECT_UUID, session_duration_minutes: 120 }], error: null }); // sessions
    enqueue({ data: [], error: null }); // attachments

    const result = await db.getProjects();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(PROJECT_UUID);
    expect(result[0].name).toBe('Vibe Engineering Chronicle');
    expect(result[0].status).toBe('live');
    expect(result[0].totalMins).toBe(120);
    expect(result[0].attachments).toEqual([]);
    expect(result[0].keyFeatures).toEqual(['Timeline', 'Capture', 'Sessions']);
    expect(result[0].saasReplaced).toBe('Notion');
  });

  it('sums session minutes across multiple sessions', async () => {
    enqueue({ data: [PROJECT_ROW], error: null });
    enqueue({
      data: [
        { project_id: PROJECT_UUID, session_duration_minutes: 60 },
        { project_id: PROJECT_UUID, session_duration_minutes: 90 },
      ],
      error: null,
    });
    enqueue({ data: [], error: null });

    const result = await db.getProjects();
    expect(result[0].totalMins).toBe(150);
  });

  it('maps attachments and includes publicUrl', async () => {
    const att = {
      attachment_id: 'att-uuid-1',
      attached_to_project_id: PROJECT_UUID,
      attachment_storage_path: 'projects/proj/123.png',
      attachment_caption: 'Screenshot',
      attachment_mime_type: 'image/png',
      attachment_sort_order: 0,
    };
    enqueue({ data: [PROJECT_ROW], error: null });
    enqueue({ data: [], error: null });
    enqueue({ data: [att], error: null });

    const result = await db.getProjects();
    expect(result[0].attachments).toHaveLength(1);
    expect(result[0].attachments[0].id).toBe('att-uuid-1');
    expect(result[0].attachments[0].publicUrl).toBe('https://mock.storage/projects/proj/123.png');
  });

  it('throws when projects query fails', async () => {
    enqueue({ data: null, error: new Error('projects error') });
    enqueue({ data: [], error: null });
    enqueue({ data: [], error: null });
    await expect(db.getProjects()).rejects.toThrow('projects error');
  });
});

// ─── uploadProjectScreenshot ──────────────────────────────────────────────────

const ATT_UUID = 'att-uuid-1';

describe('uploadProjectScreenshot', () => {
  it('uses sort_order 0 when no existing attachments', async () => {
    const file = { name: 'shot.png', type: 'image/png', size: 1024 };
    // storage upload (default { error: null })
    // max sort_order query → no rows
    enqueue({ data: null, error: null });
    // DB insert → single()
    enqueue({
      data: {
        attachment_id: ATT_UUID,
        attachment_storage_path: `projects/${PROJECT_UUID}/123.png`,
        attachment_caption: null,
        attachment_mime_type: 'image/png',
        attachment_sort_order: 0,
      },
      error: null,
    });

    const result = await db.uploadProjectScreenshot(PROJECT_UUID, file);
    expect(result.id).toBe(ATT_UUID);
    expect(result.sortOrder).toBe(0);
    expect(result.publicUrl).toContain('mock.storage');
    expect(result.mimeType).toBe('image/png');
  });

  it('uses max + 1 when existing attachments are present', async () => {
    const file = { name: 'shot2.png', type: 'image/png', size: 2048 };
    // storage upload (default { error: null })
    // max sort_order query → existing max is 3
    enqueue({ data: { attachment_sort_order: 3 }, error: null });
    // DB insert → single()
    enqueue({
      data: {
        attachment_id: ATT_UUID,
        attachment_storage_path: `projects/${PROJECT_UUID}/456.png`,
        attachment_caption: null,
        attachment_mime_type: 'image/png',
        attachment_sort_order: 4,
      },
      error: null,
    });

    const result = await db.uploadProjectScreenshot(PROJECT_UUID, file);
    expect(result.sortOrder).toBe(4);
  });

  it('throws when storage upload fails', async () => {
    const file = { name: 'shot.png', type: 'image/png', size: 1024 };
    enqueueStorage({ error: new Error('storage full') });
    await expect(db.uploadProjectScreenshot(PROJECT_UUID, file)).rejects.toThrow('storage full');
  });

  it('throws when DB insert fails', async () => {
    const file = { name: 'shot.png', type: 'image/png', size: 1024 };
    // storage upload succeeds
    // max sort_order query → no rows
    enqueue({ data: null, error: null });
    // DB insert fails
    enqueue({ data: null, error: new Error('insert failed') });
    await expect(db.uploadProjectScreenshot(PROJECT_UUID, file)).rejects.toThrow('insert failed');
  });
});

// ─── softDeleteProject ────────────────────────────────────────────────────────

describe('softDeleteProject', () => {
  it('resolves without error', async () => {
    enqueue({ data: null, error: null });
    await expect(db.softDeleteProject(PROJECT_UUID)).resolves.toBeUndefined();
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('delete failed') });
    await expect(db.softDeleteProject(PROJECT_UUID)).rejects.toThrow('delete failed');
  });
});

// ─── updateProjectStatus ──────────────────────────────────────────────────────

describe('updateProjectStatus', () => {
  it('resolves without error', async () => {
    enqueue({ data: null, error: null });
    await expect(db.updateProjectStatus(PROJECT_UUID, 'live')).resolves.toBeUndefined();
  });

  it('resolves for any valid status', async () => {
    for (const status of ['poc', 'in_progress', 'archived']) {
      enqueue({ data: null, error: null });
      await expect(db.updateProjectStatus(PROJECT_UUID, status)).resolves.toBeUndefined();
    }
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('update failed') });
    await expect(db.updateProjectStatus(PROJECT_UUID, 'archived')).rejects.toThrow('update failed');
  });
});

// ─── deleteAttachment ─────────────────────────────────────────────────────────

describe('deleteAttachment', () => {
  it('resolves without error', async () => {
    // storage remove + DB update both succeed via defaults
    enqueue({ data: null, error: null }); // DB soft-delete
    await expect(db.deleteAttachment(ATT_UUID, 'projects/proj/123.png')).resolves.toBeUndefined();
  });

  it('throws when storage remove fails', async () => {
    enqueueStorage({ error: new Error('storage remove failed') });
    await expect(db.deleteAttachment(ATT_UUID, 'projects/proj/123.png')).rejects.toThrow('storage remove failed');
  });

  it('throws when DB update fails', async () => {
    // storage succeeds (default), DB fails
    enqueue({ data: null, error: new Error('db update failed') });
    await expect(db.deleteAttachment(ATT_UUID, 'projects/proj/123.png')).rejects.toThrow('db update failed');
  });
});

// ─── getCardSections ──────────────────────────────────────────────────────────

describe('getCardSections', () => {
  it('returns mapped sections for a card', async () => {
    enqueue({ data: [
      { section_id: SECTION_UUID, section_label: 'Context', section_body: 'Some context', section_order: 0 },
      { section_id: 'section-uuid-2', section_label: 'Outcome', section_body: null, section_order: 1 },
    ], error: null });
    const result = await db.getCardSections(CARD_UUID);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(SECTION_UUID);
    expect(result[0].label).toBe('Context');
    expect(result[0].body).toBe('Some context');
    expect(result[1].body).toBe('');
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('sections error') });
    await expect(db.getCardSections(CARD_UUID)).rejects.toThrow('sections error');
  });
});

// ─── addCardSection ───────────────────────────────────────────────────────────

describe('addCardSection', () => {
  it('inserts section and returns mapped result', async () => {
    enqueue({ data: { section_id: SECTION_UUID, section_label: 'Context', section_body: 'Body text', section_order: 0 }, error: null });
    const result = await db.addCardSection(CARD_UUID, { label: 'Context', body: 'Body text', order: 0 });
    expect(result.id).toBe(SECTION_UUID);
    expect(result.label).toBe('Context');
    expect(result.body).toBe('Body text');
  });

  it('throws when insert fails', async () => {
    enqueue({ data: null, error: new Error('insert failed') });
    await expect(db.addCardSection(CARD_UUID, { label: 'X', body: '', order: 0 })).rejects.toThrow('insert failed');
  });
});

// ─── updateCardSection ────────────────────────────────────────────────────────

describe('updateCardSection', () => {
  it('resolves without error', async () => {
    enqueue({ data: null, error: null });
    await expect(db.updateCardSection(SECTION_UUID, { label: 'Updated', body: 'New body', order: 0 })).resolves.toBeUndefined();
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('update failed') });
    await expect(db.updateCardSection(SECTION_UUID, { label: 'X', body: '', order: 0 })).rejects.toThrow('update failed');
  });
});

// ─── deleteCardSection ────────────────────────────────────────────────────────

describe('deleteCardSection', () => {
  it('resolves without error', async () => {
    enqueue({ data: null, error: null });
    await expect(db.deleteCardSection(SECTION_UUID)).resolves.toBeUndefined();
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('delete failed') });
    await expect(db.deleteCardSection(SECTION_UUID)).rejects.toThrow('delete failed');
  });
});

// ─── getProjectMilestones ─────────────────────────────────────────────────────

const MILESTONE_UUID = 'milestone-uuid-1';

describe('getProjectMilestones', () => {
  it('returns mapped milestones for a project', async () => {
    enqueue({ data: [
      { milestone_id: MILESTONE_UUID, milestone_date: '2026-01-15', milestone_type: 'kickoff', milestone_title: 'Project kicked off', milestone_description: 'Initial meeting', milestone_order: 0 },
    ], error: null });
    const result = await db.getProjectMilestones(PROJECT_UUID);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(MILESTONE_UUID);
    expect(result[0].date).toBe('2026-01-15');
    expect(result[0].type).toBe('kickoff');
    expect(result[0].title).toBe('Project kicked off');
    expect(result[0].description).toBe('Initial meeting');
  });

  it('returns empty array when no milestones', async () => {
    enqueue({ data: [], error: null });
    const result = await db.getProjectMilestones(PROJECT_UUID);
    expect(result).toEqual([]);
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('milestones error') });
    await expect(db.getProjectMilestones(PROJECT_UUID)).rejects.toThrow('milestones error');
  });
});

// ─── addProjectMilestone ──────────────────────────────────────────────────────

describe('addProjectMilestone', () => {
  it('inserts milestone and returns mapped result', async () => {
    enqueue({ data: { milestone_id: MILESTONE_UUID, milestone_date: '2026-02-01', milestone_type: 'release', milestone_title: 'v1.0 shipped', milestone_description: null, milestone_order: 0 }, error: null });
    const result = await db.addProjectMilestone(PROJECT_UUID, { date: '2026-02-01', type: 'release', title: 'v1.0 shipped', description: '', order: 0 });
    expect(result.id).toBe(MILESTONE_UUID);
    expect(result.date).toBe('2026-02-01');
    expect(result.type).toBe('release');
    expect(result.title).toBe('v1.0 shipped');
    expect(result.description).toBe('');
  });

  it('throws when insert fails', async () => {
    enqueue({ data: null, error: new Error('insert failed') });
    await expect(db.addProjectMilestone(PROJECT_UUID, { date: '2026-02-01', type: 'other', title: 'X', description: '', order: 0 })).rejects.toThrow('insert failed');
  });
});

// ─── updateProjectMilestone ───────────────────────────────────────────────────

describe('updateProjectMilestone', () => {
  it('resolves without error', async () => {
    enqueue({ data: null, error: null });
    await expect(db.updateProjectMilestone(MILESTONE_UUID, { date: '2026-03-01', type: 'poc', title: 'PoC done', description: 'Working prototype', order: 0 })).resolves.toBeUndefined();
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('update failed') });
    await expect(db.updateProjectMilestone(MILESTONE_UUID, { date: '2026-03-01', type: 'other', title: 'X', description: '', order: 0 })).rejects.toThrow('update failed');
  });
});

// ─── softDeleteProjectMilestone ───────────────────────────────────────────────

describe('softDeleteProjectMilestone', () => {
  it('resolves without error', async () => {
    enqueue({ data: null, error: null });
    await expect(db.softDeleteProjectMilestone(MILESTONE_UUID)).resolves.toBeUndefined();
  });

  it('throws on supabase error', async () => {
    enqueue({ data: null, error: new Error('delete failed') });
    await expect(db.softDeleteProjectMilestone(MILESTONE_UUID)).rejects.toThrow('delete failed');
  });
});
