// Pure utility functions — exported for unit testing

export const fmtDate = d =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const fmtDateTs = ts =>
  new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const today = () => new Date().toISOString().slice(0, 10);

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

export function minsToHours(mins) {
  const m = Number(mins) || 0;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

export function sessionsTotalMins(sessions) {
  return sessions.reduce((sum, s) => sum + (Number(s.durationMins) || 0), 0);
}

export function sessionsForProject(sessions, project) {
  return sessions.filter(s => s.project === project);
}

/**
 * Filter timeline entries for Present mode.
 * - pfCats: array of included category keys
 * - pfThemes: array of included theme ids
 * - pfSignalOnly: if true, only entries with 'signal' theme are included
 * - allThemeCount: total number of theme ids (used to detect "all selected")
 *
 * Theme rule: if some themes are deselected, an entry passes only if it has
 * no themes assigned OR has at least one theme in pfThemes.
 */
export function filterPresentEntries(entries, pfCats, pfThemes, pfSignalOnly, allThemeCount) {
  return entries.filter(e => {
    if (!pfCats.includes(e.category)) return false;
    if (pfSignalOnly && !(e.themes || []).includes('signal')) return false;
    const entryThemes = e.themes || [];
    if (pfThemes.length < allThemeCount && entryThemes.length > 0) {
      if (!entryThemes.some(t => pfThemes.includes(t))) return false;
    }
    return true;
  });
}

/**
 * Load data from a raw localStorage string, falling back to seed if
 * the value is missing, invalid JSON, or an empty array.
 */
export function loadOrSeed(raw, seed) {
  if (!raw) return seed;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return seed;
  } catch {
    return seed;
  }
}
