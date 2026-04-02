// ─── Dynamic category map ─────────────────────────────────────────────────────
// Pre-seeded with hardcoded fallbacks so components render correctly before
// initLookups() runs. initLookups() (lib/db.js) fetches live data from the
// categories table and replaces these entries in-place — so any category added
// to the DB automatically appears in the UI without code changes.
//
// 'session' is a virtual slug (no DB row) — it is never replaced.

export const cats = {
  session:    { label: 'Session',           color: '#34D4D4', glyph: '◷' },
  wow:        { label: 'Wow Moment',        color: '#B07FE8', glyph: '✦' },
  learning:   { label: 'Key Learning',      color: '#F5A623', glyph: '◉' },
  tooling:    { label: 'Tooling Decision',  color: '#4A9EDB', glyph: '⚙' },
  built:      { label: 'Thing I Built',     color: '#52C788', glyph: '◈' },
  aspiration: { label: 'Aspiration / Goal', color: '#E86161', glyph: '◎' },
  ideas:      { label: 'Idea / Wishlist',   color: '#A78BFA', glyph: '◐' },
  capture:    { label: 'Capture',           color: '#9ca3af', glyph: '◌' },
};
