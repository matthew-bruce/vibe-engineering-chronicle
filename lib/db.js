import supabase from './supabase.js';

// ─── ID Maps ──────────────────────────────────────────────────────────────────
// These are stable seed UUIDs from the chronicle Supabase project.

const CAT_SLUG_TO_UUID = {
  aspiration: '300577e4-f0b8-4c16-9233-485db604fe98',
  ideas:      '2643b834-d609-4dfa-ab50-962ac122372d',
  learning:   '4a0358e0-eaf9-4983-9be6-da9c8f6bb7fb',
  built:      'fcbb36aa-c245-4413-bd98-3355008b306b',
  tooling:    'e34a1dd6-ae92-4f4f-a079-4c754ac2bbb4',
  wow:        '22714a99-565c-4759-9af9-f4ec0caaa9a6',
  // 'session' has no DB category — card_categories row is skipped for these
};

const CAT_UUID_TO_SLUG = Object.fromEntries(
  Object.entries(CAT_SLUG_TO_UUID).map(([k, v]) => [v, k])
);

const THEME_SLUG_TO_UUID = {
  economics:  '561ebfe3-c921-41b6-9eee-8037c6568910',
  evidence:   '8bd7d73d-6198-4a3f-833e-a5c42785a9b5',
  industry:   'c37ca848-e045-40a4-8539-8c18ac7e6930',
  leadership: '17d42d1a-a0a3-47ac-a66c-5118cdc2b84a',
  orgdesign:  '91a35ffa-9a6b-4e06-a18e-70722191b0dc',
  signal:     '04296844-fa23-4861-b2c0-b3a3748ccea2',
  unlock:     'f8c2d9c0-3031-4811-827c-fab7537491ec',
};

const THEME_UUID_TO_SLUG = Object.fromEntries(
  Object.entries(THEME_SLUG_TO_UUID).map(([k, v]) => [v, k])
);

// DB project name may differ from the app's display name (e.g. "Dispatch" vs
// "Dispatch (PI Planning Tool)"). UUID is the canonical key.
const PROJECT_NAME_TO_UUID = {
  'Dispatch (PI Planning Tool)': 'c382be7a-23b3-4c0f-8594-d66c9d3a0754',
  'Platform Org Structure':      'd472cdbf-6b85-4013-b35d-379f800e2651',
  'Platform Roadmapping Tool':   '5ce9546f-de82-4514-89f7-107d52fe7856',
  'Vibe Engineering Chronicle':  '1fd3cc02-49c8-4b07-956b-b1bc5ecd7f3f',
  'Vibe Engineering Strategy':   '41d62189-57f2-446a-9815-9fffe1f52d60',
};

const PROJECT_UUID_TO_NAME = Object.fromEntries(
  Object.entries(PROJECT_NAME_TO_UUID).map(([k, v]) => [v, k])
);

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapTimelineCard(row) {
  const catId = row.card_categories?.[0]?.category_id;
  return {
    id:       row.card_id,
    date:     row.card_event_date,
    category: CAT_UUID_TO_SLUG[catId] ?? 'session',
    title:    row.card_title,
    body:     row.card_body    ?? '',
    benefit:  row.card_benefit ?? '',
    themes:   (row.card_themes ?? []).map(t => THEME_UUID_TO_SLUG[t.theme_id]).filter(Boolean),
    createdAt: new Date(row.card_created_at).getTime(),
  };
}

function mapCapture(row) {
  return {
    id:     row.card_id,
    text:   row.card_title,
    source: row.card_source ?? '',
    themes: (row.card_themes ?? []).map(t => THEME_UUID_TO_SLUG[t.theme_id]).filter(Boolean),
    createdAt: new Date(row.card_created_at).getTime(),
  };
}

function mapSession(row) {
  return {
    id:          row.session_id,
    project:     PROJECT_UUID_TO_NAME[row.project_id] ?? row.project_id,
    date:        row.session_date,
    durationMins: row.session_duration_minutes,
    notes:       row.session_notes ?? '',
    createdAt:   new Date(row.session_created_at).getTime(),
  };
}

const CARD_SELECT = `
  card_id, card_title, card_body, card_benefit,
  card_event_date, card_source, card_created_at,
  card_categories(category_id),
  card_themes(theme_id)
`;

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function loadTimeline() {
  const { data, error } = await supabase
    .from('cards')
    .select(CARD_SELECT)
    .is('card_deleted_at', null)
    .not('card_event_date', 'is', null)
    .order('card_event_date', { ascending: true });
  if (error) throw error;
  return data.map(mapTimelineCard);
}

export async function loadCaptures() {
  const { data, error } = await supabase
    .from('cards')
    .select(CARD_SELECT)
    .is('card_deleted_at', null)
    .is('card_event_date', null)
    .order('card_created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapCapture);
}

export async function loadSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('session_id, project_id, session_date, session_duration_minutes, session_notes, session_created_at')
    .is('session_deleted_at', null)
    .order('session_date', { ascending: true });
  if (error) throw error;
  return data.map(mapSession);
}

// ─── Timeline writes ──────────────────────────────────────────────────────────

export async function addTimelineEntry(entry) {
  const { data: card, error: cardErr } = await supabase
    .from('cards')
    .insert({
      card_title:      entry.title,
      card_body:       entry.body      || null,
      card_benefit:    entry.benefit   || null,
      card_event_date: entry.date,
    })
    .select('card_id, card_created_at')
    .single();
  if (cardErr) throw cardErr;

  const catId = CAT_SLUG_TO_UUID[entry.category];
  if (catId) {
    const { error: catErr } = await supabase
      .from('card_categories')
      .insert({ card_id: card.card_id, category_id: catId });
    if (catErr) throw catErr;
  }

  const themeRows = (entry.themes ?? [])
    .map(slug => ({ card_id: card.card_id, theme_id: THEME_SLUG_TO_UUID[slug] }))
    .filter(r => r.theme_id);
  if (themeRows.length > 0) {
    const { error: themeErr } = await supabase.from('card_themes').insert(themeRows);
    if (themeErr) throw themeErr;
  }

  return {
    ...entry,
    id:       card.card_id,
    createdAt: new Date(card.card_created_at).getTime(),
  };
}

export async function softDeleteCard(id) {
  const { error } = await supabase
    .from('cards')
    .update({ card_deleted_at: new Date().toISOString() })
    .eq('card_id', id);
  if (error) throw error;
}

// ─── Capture writes ───────────────────────────────────────────────────────────

export async function addCapture(entry) {
  const { data: card, error: cardErr } = await supabase
    .from('cards')
    .insert({
      card_title:      entry.text,
      card_source:     entry.source || null,
      card_event_date: null,
    })
    .select('card_id, card_created_at')
    .single();
  if (cardErr) throw cardErr;

  const themeRows = (entry.themes ?? [])
    .map(slug => ({ card_id: card.card_id, theme_id: THEME_SLUG_TO_UUID[slug] }))
    .filter(r => r.theme_id);
  if (themeRows.length > 0) {
    const { error: themeErr } = await supabase.from('card_themes').insert(themeRows);
    if (themeErr) throw themeErr;
  }

  return {
    ...entry,
    id:       card.card_id,
    createdAt: new Date(card.card_created_at).getTime(),
  };
}

// ─── Session writes ───────────────────────────────────────────────────────────

export async function addSession(entry) {
  const projectId = PROJECT_NAME_TO_UUID[entry.project];
  const { data: ses, error } = await supabase
    .from('sessions')
    .insert({
      project_id:               projectId,
      session_date:             entry.date,
      session_duration_minutes: entry.durationMins,
      session_notes:            entry.notes || null,
    })
    .select('session_id, session_created_at')
    .single();
  if (error) throw error;

  return {
    ...entry,
    id:       ses.session_id,
    createdAt: new Date(ses.session_created_at).getTime(),
  };
}

export async function updateSession(id, fields) {
  const projectId = PROJECT_NAME_TO_UUID[fields.project];
  const { error } = await supabase
    .from('sessions')
    .update({
      project_id:               projectId,
      session_date:             fields.date,
      session_duration_minutes: fields.durationMins,
      session_notes:            fields.notes || null,
      session_updated_at:       new Date().toISOString(),
    })
    .eq('session_id', id);
  if (error) throw error;
}

export async function softDeleteSession(id) {
  const { error } = await supabase
    .from('sessions')
    .update({ session_deleted_at: new Date().toISOString() })
    .eq('session_id', id);
  if (error) throw error;
}
