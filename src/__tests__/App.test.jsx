import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { cats } from '../../lib/cats.js';

// ─── Mock heavy dependencies ──────────────────────────────────────────────────

vi.mock('../../lib/supabase.js', () => ({
  default: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      is:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      then:   vi.fn(),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

const MOCK_ENTRY = {
  id: 'card-1',
  date: '2026-03-01',
  category: 'wow',
  title: 'First real AI session',
  body: '',
  benefit: '',
  impact: 3,
  audience: 'practitioner',
  source: '',
  themes: [],
  sections: [],
  relevance: 'current',
  relevanceSource: 'ai',
  aiSummary: '',
  enrichedAt: null,
  templatePreference: null,
  format: null,
  createdAt: Date.now(),
};

vi.mock('../../lib/db.js', () => ({
  initLookups:          vi.fn(() => Promise.resolve()),
  loadTimeline:         vi.fn(() => Promise.resolve([MOCK_ENTRY])),
  loadSessions:         vi.fn(() => Promise.resolve([])),
  addTimelineEntry:     vi.fn(),
  updateTimelineEntry:  vi.fn(),
  softDeleteCard:       vi.fn(),
  confirmCardField:     vi.fn(),
  restoreCardVersion:   vi.fn(),
  addSession:           vi.fn(),
  updateSession:        vi.fn(),
  softDeleteSession:    vi.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/timeline']}>
      <App />
    </MemoryRouter>,
  );
}

async function openPfPanel() {
  await waitFor(() => expect(screen.getByText('⊞ Filter')).toBeInTheDocument());
  fireEvent.click(screen.getByText('⊞ Filter'));
}

// ─── pf-panel category description tests ─────────────────────────────────────

describe('pf-panel category descriptions', () => {
  beforeEach(() => {
    cats.wow.description      = 'A moment of genuine surprise or delight.';
    cats.learning.description = 'Something important you now understand differently.';
  });

  afterEach(() => {
    Object.values(cats).forEach(c => { c.description = ''; });
    cleanup();
  });

  it('renders category descriptions in the pf-panel', async () => {
    renderApp();
    await openPfPanel();
    expect(screen.getByText('A moment of genuine surprise or delight.')).toBeInTheDocument();
    expect(screen.getByText('Something important you now understand differently.')).toBeInTheDocument();
  });

  it('does not render .pf-chip-desc spans when descriptions are empty', async () => {
    cats.wow.description      = '';
    cats.learning.description = '';
    renderApp();
    await openPfPanel();
    expect(document.querySelectorAll('.pf-chip-desc')).toHaveLength(0);
  });

  it('descriptions appear inside pf-chip buttons', async () => {
    renderApp();
    await openPfPanel();
    const descEl = screen.getByText('A moment of genuine surprise or delight.');
    expect(descEl.closest('button')).not.toBeNull();
  });
});
