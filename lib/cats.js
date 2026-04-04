// ─── Dynamic category map ─────────────────────────────────────────────────────
// Pre-seeded with hardcoded fallbacks so components render correctly before
// initLookups() runs. initLookups() (lib/db.js) fetches live data from the
// categories table and replaces these entries in-place — so any category added
// to the DB automatically appears in the UI without code changes.
//
// 'session' is a virtual slug (no DB row) — it is never replaced.

export const cats = {
  session:    { label: 'Session',           color: '#34D4D4', glyph: '◷', description: '' },
  wow:        { label: 'Wow Moment',        color: '#B07FE8', glyph: '✦', description: '' },
  learning:   { label: 'Key Learning',      color: '#F5A623', glyph: '◉', description: '' },
  tooling:    { label: 'Tooling Decision',  color: '#4A9EDB', glyph: '⚙', description: '' },
  built:      { label: 'Thing I Built',     color: '#52C788', glyph: '◈', description: '' },
  aspiration: { label: 'Aspiration / Goal', color: '#E86161', glyph: '◎', description: '' },
  ideas:      { label: 'Idea / Wishlist',   color: '#A78BFA', glyph: '◐', description: '' },
  capture:    { label: 'Capture',           color: '#9ca3af', glyph: '◌', description: '' },
};
