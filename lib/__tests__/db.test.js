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
    ['select', 'insert', 'update', 'delete', 'is', 'not', 'eq', 'order'].forEach(m => {
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
const CREATED_AT        = '2026-03-24T10:00:00Z';

const MOCK_CATEGORIES = [
  { category_id: CAT_UUID_WOW,      category_name: 'Wow Moment'  },
  { category_id: CAT_UUID_LEARNING, category_name: 'Key Learning' },
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
  it('returns mapped timeline entries', async () => {
    const row = {
      card_id:         CARD_UUID,
      card_title:      'Test entry',
      card_body:       'Some body',
      card_benefit:    'Some benefit',
      card_event_date: '2026-03-24',
      card_source:     null,
      card_created_at: CREATED_AT,
      card_categories: [{ category_id: CAT_UUID_WOW }],
      card_themes:     [{ theme_id: THEME_UUID_SIGNAL }],
    };
    enqueue({ data: [row], error: null });

    const result = await db.loadTimeline();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(CARD_UUID);
    expect(result[0].title).toBe('Test entry');
    expect(result[0].body).toBe('Some body');
    expect(result[0].benefit).toBe('Some benefit');
    expect(result[0].date).toBe('2026-03-24');
    expect(result[0].category).toBe('wow');
    expect(result[0].themes).toContain('signal');
    expect(result[0].createdAt).toBe(new Date(CREATED_AT).getTime());
  });

  it('maps unknown category to "session"', async () => {
    const row = {
      card_id: CARD_UUID, card_title: 'T', card_body: null,
      card_benefit: null, card_event_date: '2026-03-24',
      card_source: null, card_created_at: CREATED_AT,
      card_categories: [], card_themes: [],
    };
    enqueue({ data: [row], error: null });
    const result = await db.loadTimeline();
    expect(result[0].category).toBe('session');
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

// ─── updateTimelineEntry ──────────────────────────────────────────────────────

describe('updateTimelineEntry', () => {
  it('resolves without error with full fields', async () => {
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
    })).resolves.toBeUndefined();
  });

  it('skips category/theme inserts when empty', async () => {
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
  it('uploads file and returns mapped attachment', async () => {
    const file = { name: 'shot.png', type: 'image/png', size: 1024 };
    // storage upload succeeds (no error in queue → default { error: null })
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
    expect(result.publicUrl).toContain('mock.storage');
    expect(result.mimeType).toBe('image/png');
  });

  it('throws when storage upload fails', async () => {
    const file = { name: 'shot.png', type: 'image/png', size: 1024 };
    enqueueStorage({ error: new Error('storage full') });
    await expect(db.uploadProjectScreenshot(PROJECT_UUID, file)).rejects.toThrow('storage full');
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
