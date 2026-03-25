export const CATS = {
  tooling:    { label: 'Tooling Decision',  color: '#4A9EDB', glyph: '⚙' },
  built:      { label: 'Thing I Built',     color: '#52C788', glyph: '◈' },
  learning:   { label: 'Key Learning',      color: '#F5A623', glyph: '◉' },
  wow:        { label: 'Wow Moment',        color: '#B07FE8', glyph: '✦' },
  aspiration: { label: 'Aspiration / Goal', color: '#E86161', glyph: '◎' },
  ideas:      { label: 'Idea / Wishlist',   color: '#A78BFA', glyph: '◐' },
  session:    { label: 'Session',           color: '#34D4D4', glyph: '◷' },
};

export const THEMES = [
  { id: 'industry',   label: 'Industry',   color: '#4A9EDB' },
  { id: 'economics',  label: 'Economics',  color: '#F5A623' },
  { id: 'orgdesign',  label: 'Org Design', color: '#B07FE8' },
  { id: 'evidence',   label: 'Evidence',   color: '#52C788' },
  { id: 'leadership', label: 'Leadership', color: '#E86161' },
  { id: 'signal',     label: 'Signal',     color: '#c9a96e' },
  { id: 'unlock',     label: 'Unlock',     color: '#34D4D4' },
];

export const PROJECTS = [
  'Dispatch (PI Planning Tool)',
  'Platform Org Structure',
  'Platform Roadmapping Tool',
  'Vibe Engineering Chronicle',
  'Vibe Engineering Strategy',
];

export const toggleTheme = (themes, id) =>
  themes.includes(id) ? themes.filter(t => t !== id) : [...themes, id];

export const minsToHours = m => {
  const n = Number(m) || 0;
  const d = Math.floor(n / 1440);
  const rem = n % 1440;
  const h = Math.floor(rem / 60);
  const r = rem % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (r || parts.length === 0) parts.push(`${r}m`);
  return parts.join(' ');
};

export const durToMins = (d, h, m) =>
  (Number(d) || 0) * 1440 + (Number(h) || 0) * 60 + (Number(m) || 0);

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

export const fmtDate = d =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

export const today = () => new Date().toISOString().slice(0, 10);
