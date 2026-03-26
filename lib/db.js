import supabase from './supabase.js';
import { cats } from './cats.js';

// ─── Name-to-slug maps ────────────────────────────────────────────────────────
// Human-readable names match what is stored in the DB. Slugs are the app's
// internal short keys. Names are stable business logic; UUIDs are never
// hardcoded here — they are resolved at runtime by initLookups().

const CAT_NAME_TO_SLUG = {
  'Aspiration / Goal': 'aspiration',
  'Capture':           'capture',
  'Idea / Wishlist':   'ideas',
  'Key Learning':      'learning',
  'Principle':         'principle',
  'Thing I Built':     'built',
  'Tooling Decision':  'tooling',
  'Wow Moment':        'wow',
  // 'Session' has no DB category — card_categories row is skipped for those entries
};

const THEME_NAME_TO_SLUG = {
  'Economics':  'economics',
  'Evidence':   'evidence',
  'Industry':   'industry',
  'Leadership': 'leadership',
  'Org Design': 'orgdesign',
  'Signal':     'signal',
  'Unlock':     'unlock',
};

// ─── Runtime lookup maps ──────────────────────────────────────────────────────
// Populated once by initLookups() before any data operation runs.

let catSlugToUUID   = {};  // 'wow'                       → uuid
let catUUIDToSlug   = {};  // uuid                        → 'wow'
let themeSlugToUUID = {};  // 'signal'                    → uuid
let themeUUIDToSlug = {};  // uuid                        → 'signal'
let projectNameToUUID = {}; // 'Vibe Engineering Chronicle' → uuid
let projectUUIDToName = {}; // uuid → 'Vibe Engineering Chronicle'

export async function initLookups() {
  const [catsRes, themesRes, projectsRes] = await Promise.all([
    supabase.from('categories').select('category_id, category_name, category_colour, category_glyph'),
    supabase.from('themes').select('theme_id, theme_name'),
    supabase.from('projects')
      .select('project_id, project_name')
      .is('project_deleted_at', null),
  ]);
  if (catsRes.error)     throw catsRes.error;
  if (themesRes.error)   throw themesRes.error;
  if (projectsRes.error) throw projectsRes.error;

  catSlugToUUID = {};
  catUUIDToSlug = {};
  // Remove non-virtual entries so DB is the sole source of truth after this point
  for (const key of Object.keys(cats)) {
    if (key !== 'session') delete cats[key];
  }
  for (const c of catsRes.data) {
    const slug = CAT_NAME_TO_SLUG[c.category_name];
    if (slug) {
      catSlugToUUID[slug]          = c.category_id;
      catUUIDToSlug[c.category_id] = slug;
      cats[slug] = { label: c.category_name, color: c.category_colour, glyph: c.category_glyph };
    }
  }

  themeSlugToUUID = {};
  themeUUIDToSlug = {};
  for (const t of themesRes.data) {
    const slug = THEME_NAME_TO_SLUG[t.theme_name];
    if (slug) {
      themeSlugToUUID[slug]          = t.theme_id;
      themeUUIDToSlug[t.theme_id]    = slug;
    }
  }

  projectNameToUUID = {};
  projectUUIDToName = {};
  for (const p of projectsRes.data) {
    projectNameToUUID[p.project_name] = p.project_id;
    projectUUIDToName[p.project_id]   = p.project_name;
  }
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapTimelineCard(row) {
  const catId = row.card_categories?.[0]?.category_id;
  return {
    id:        row.card_id,
    date:      row.card_event_date,
    category:  catUUIDToSlug[catId] ?? 'session',
    title:     row.card_title,
    body:      row.card_body    ?? '',
    benefit:     row.card_benefit    ?? '',
    impact:      row.card_impact     ?? null,
    audience:    row.card_audience   ?? null,
    aiSummary:   row.card_ai_summary ?? null,
    enrichedAt:  row.card_enriched_at ?? null,
    themes:    (row.card_themes ?? []).map(t => themeUUIDToSlug[t.theme_id]).filter(Boolean),
    createdAt: new Date(row.card_created_at).getTime(),
  };
}

function mapCapture(row) {
  return {
    id:        row.card_id,
    text:      row.card_title,
    source:    row.card_source ?? '',
    themes:    (row.card_themes ?? []).map(t => themeUUIDToSlug[t.theme_id]).filter(Boolean),
    createdAt: new Date(row.card_created_at).getTime(),
  };
}

function mapSession(row) {
  return {
    id:          row.session_id,
    project:     projectUUIDToName[row.project_id] ?? row.project_id,
    date:        row.session_date,
    durationMins: row.session_duration_minutes,
    notes:       row.session_notes ?? '',
    createdAt:   new Date(row.session_created_at).getTime(),
  };
}

const CARD_SELECT = `
  card_id, card_title, card_body, card_benefit,
  card_impact, card_audience,
  card_ai_summary, card_enriched_at,
  card_event_date, card_source, card_created_at,
  card_categories(category_id),
  card_themes(theme_id)
`;

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function loadTimeline() {
  const [cardsRes, sectionsRes] = await Promise.all([
    supabase
      .from('cards')
      .select(CARD_SELECT)
      .is('card_deleted_at', null)
      .not('card_event_date', 'is', null)
      .order('card_event_date', { ascending: false })
      .order('card_created_at', { ascending: false }),
    supabase
      .from('card_sections')
      .select('section_id, card_id, section_label, section_body, section_order')
      .is('section_deleted_at', null)
      .order('section_order', { ascending: true }),
  ]);
  if (cardsRes.error) throw cardsRes.error;
  if (sectionsRes.error) throw sectionsRes.error;

  const sectionsByCardId = {};
  for (const s of sectionsRes.data) {
    if (!sectionsByCardId[s.card_id]) sectionsByCardId[s.card_id] = [];
    sectionsByCardId[s.card_id].push({
      id: s.section_id,
      label: s.section_label,
      body: s.section_body ?? '',
      order: s.section_order,
    });
  }

  return cardsRes.data.map(row => ({
    ...mapTimelineCard(row),
    sections: sectionsByCardId[row.card_id] ?? [],
  }));
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
      card_body:       entry.body    || null,
      card_benefit:    entry.benefit || null,
      card_impact:     entry.impact  || null,
      card_audience:   entry.audience || null,
      card_event_date: entry.date,
    })
    .select('card_id, card_created_at')
    .single();
  if (cardErr) throw cardErr;

  const catId = catSlugToUUID[entry.category];
  if (catId) {
    const { error: catErr } = await supabase
      .from('card_categories')
      .insert({ card_id: card.card_id, category_id: catId });
    if (catErr) throw catErr;
  }

  const themeRows = (entry.themes ?? [])
    .map(slug => ({ card_id: card.card_id, theme_id: themeSlugToUUID[slug] }))
    .filter(r => r.theme_id);
  if (themeRows.length > 0) {
    const { error: themeErr } = await supabase.from('card_themes').insert(themeRows);
    if (themeErr) throw themeErr;
  }

  const sections = entry.sections ?? [];
  if (sections.length > 0) {
    const sectionRows = sections.map((s, i) => ({
      card_id: card.card_id,
      section_label: s.label,
      section_body: s.body || null,
      section_order: s.order ?? i,
    }));
    const { error: secErr } = await supabase.from('card_sections').insert(sectionRows);
    if (secErr) throw secErr;
  }

  return { ...entry, id: card.card_id, createdAt: new Date(card.card_created_at).getTime(), sections };
}

export async function updateTimelineEntry(id, fields) {
  const { error: cardErr } = await supabase
    .from('cards')
    .update({
      card_title:      fields.title,
      card_body:       fields.body    || null,
      card_benefit:    fields.benefit || null,
      card_impact:     fields.impact  || null,
      card_audience:   fields.audience || null,
      card_event_date: fields.date,
      card_updated_at: new Date().toISOString(),
    })
    .eq('card_id', id);
  if (cardErr) throw cardErr;

  // Replace category — delete then re-insert
  await supabase.from('card_categories').delete().eq('card_id', id);
  const catId = catSlugToUUID[fields.category];
  if (catId) {
    const { error: catErr } = await supabase
      .from('card_categories')
      .insert({ card_id: id, category_id: catId });
    if (catErr) throw catErr;
  }

  // Replace themes — delete then re-insert
  await supabase.from('card_themes').delete().eq('card_id', id);
  const themeRows = (fields.themes ?? [])
    .map(slug => ({ card_id: id, theme_id: themeSlugToUUID[slug] }))
    .filter(r => r.theme_id);
  if (themeRows.length > 0) {
    const { error: themeErr } = await supabase.from('card_themes').insert(themeRows);
    if (themeErr) throw themeErr;
  }

  // Replace sections — soft-delete existing, then insert new ones
  if (fields.sections !== undefined) {
    await supabase
      .from('card_sections')
      .update({ section_deleted_at: new Date().toISOString() })
      .eq('card_id', id)
      .is('section_deleted_at', null);
    const newSections = fields.sections.filter(s => s.label?.trim());
    if (newSections.length > 0) {
      const { error: secErr } = await supabase.from('card_sections').insert(
        newSections.map((s, i) => ({
          card_id: id,
          section_label: s.label,
          section_body: s.body || null,
          section_order: s.order ?? i,
        }))
      );
      if (secErr) throw secErr;
    }
  }
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
    .map(slug => ({ card_id: card.card_id, theme_id: themeSlugToUUID[slug] }))
    .filter(r => r.theme_id);
  if (themeRows.length > 0) {
    const { error: themeErr } = await supabase.from('card_themes').insert(themeRows);
    if (themeErr) throw themeErr;
  }

  return { ...entry, id: card.card_id, createdAt: new Date(card.card_created_at).getTime() };
}

// ─── Session writes ───────────────────────────────────────────────────────────

export async function addSession(entry) {
  const { data: ses, error } = await supabase
    .from('sessions')
    .insert({
      project_id:               projectNameToUUID[entry.project],
      session_date:             entry.date,
      session_duration_minutes: entry.durationMins,
      session_notes:            entry.notes || null,
    })
    .select('session_id, session_created_at')
    .single();
  if (error) throw error;
  return { ...entry, id: ses.session_id, createdAt: new Date(ses.session_created_at).getTime() };
}

export async function updateSession(id, fields) {
  const { error } = await supabase
    .from('sessions')
    .update({
      project_id:               projectNameToUUID[fields.project],
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

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects() {
  const [projectsRes, sessionsRes, attachmentsRes] = await Promise.all([
    supabase
      .from('projects')
      .select('project_id,project_name,project_status,project_description,project_problem,project_evolution,project_key_features,project_saas_replaced,project_live_url,project_demo_url')
      .is('project_deleted_at', null)
      .order('project_created_at', { ascending: true }),
    supabase
      .from('sessions')
      .select('project_id,session_duration_minutes')
      .is('session_deleted_at', null),
    supabase
      .from('attachments')
      .select('attachment_id,attached_to_project_id,attachment_storage_path,attachment_caption,attachment_mime_type,attachment_sort_order')
      .not('attached_to_project_id', 'is', null)
      .is('attachment_deleted_at', null)
      .order('attachment_sort_order', { ascending: true }),
  ]);
  if (projectsRes.error)    throw projectsRes.error;
  if (sessionsRes.error)    throw sessionsRes.error;
  if (attachmentsRes.error) throw attachmentsRes.error;

  // Sum session minutes per project
  const totalMinsById = {};
  for (const s of sessionsRes.data) {
    totalMinsById[s.project_id] = (totalMinsById[s.project_id] || 0) + (s.session_duration_minutes || 0);
  }

  // Group attachments by project, computing public URL for each
  const attachsByProject = {};
  for (const a of attachmentsRes.data) {
    if (!attachsByProject[a.attached_to_project_id]) attachsByProject[a.attached_to_project_id] = [];
    const { data: { publicUrl } } = supabase.storage
      .from('chronicle-attachments')
      .getPublicUrl(a.attachment_storage_path);
    attachsByProject[a.attached_to_project_id].push({
      id:          a.attachment_id,
      storagePath: a.attachment_storage_path,
      publicUrl,
      caption:     a.attachment_caption ?? '',
      mimeType:    a.attachment_mime_type,
      sortOrder:   a.attachment_sort_order,
    });
  }

  return projectsRes.data.map(p => ({
    id:          p.project_id,
    name:        p.project_name,
    status:      p.project_status,
    description: p.project_description ?? '',
    problem:     p.project_problem     ?? '',
    evolution:   p.project_evolution   ?? '',
    keyFeatures: p.project_key_features ?? [],
    saasReplaced: p.project_saas_replaced ?? '',
    liveUrl:     p.project_live_url    ?? '',
    demoUrl:     p.project_demo_url    ?? '',
    totalMins:   totalMinsById[p.project_id] || 0,
    attachments: attachsByProject[p.project_id] || [],
  }));
}

export async function uploadProjectScreenshot(projectId, file) {
  const ext  = file.name.split('.').pop().toLowerCase();
  const path = `projects/${projectId}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('chronicle-attachments')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadErr) throw uploadErr;

  // Determine next sort order — max existing + 1, or 0 if no attachments yet
  const { data: maxRow } = await supabase
    .from('attachments')
    .select('attachment_sort_order')
    .eq('attached_to_project_id', projectId)
    .is('attachment_deleted_at', null)
    .order('attachment_sort_order', { ascending: false })
    .limit(1)
    .single();
  const sortOrder = maxRow ? (maxRow.attachment_sort_order ?? 0) + 1 : 0;

  const { data: row, error: dbErr } = await supabase
    .from('attachments')
    .insert({
      attached_to_project_id:  projectId,
      attachment_storage_path: path,
      attachment_mime_type:    file.type,
      attachment_sort_order:   sortOrder,
    })
    .select('attachment_id,attachment_storage_path,attachment_caption,attachment_mime_type,attachment_sort_order')
    .single();
  if (dbErr) throw dbErr;

  const { data: { publicUrl } } = supabase.storage
    .from('chronicle-attachments')
    .getPublicUrl(row.attachment_storage_path);

  return {
    id:          row.attachment_id,
    storagePath: row.attachment_storage_path,
    publicUrl,
    caption:     row.attachment_caption ?? '',
    mimeType:    row.attachment_mime_type,
    sortOrder:   row.attachment_sort_order,
  };
}

export async function deleteAttachment(id, storagePath) {
  const { error: storageErr } = await supabase.storage
    .from('chronicle-attachments')
    .remove([storagePath]);
  if (storageErr) throw storageErr;

  const { error } = await supabase
    .from('attachments')
    .update({ attachment_deleted_at: new Date().toISOString() })
    .eq('attachment_id', id);
  if (error) throw error;
}

export async function softDeleteProject(id) {
  const { error } = await supabase
    .from('projects')
    .update({ project_deleted_at: new Date().toISOString() })
    .eq('project_id', id);
  if (error) throw error;
}

export async function updateProjectStatus(id, status) {
  const { error } = await supabase
    .from('projects')
    .update({ project_status: status })
    .eq('project_id', id);
  if (error) throw error;
}

// ─── Card Sections ────────────────────────────────────────────────────────────

export async function getCardSections(cardId) {
  const { data, error } = await supabase
    .from('card_sections')
    .select('section_id, section_label, section_body, section_order')
    .eq('card_id', cardId)
    .is('section_deleted_at', null)
    .order('section_order', { ascending: true });
  if (error) throw error;
  return data.map(s => ({
    id: s.section_id,
    label: s.section_label,
    body: s.section_body ?? '',
    order: s.section_order,
  }));
}

export async function addCardSection(cardId, section) {
  const { data, error } = await supabase
    .from('card_sections')
    .insert({
      card_id: cardId,
      section_label: section.label,
      section_body: section.body || null,
      section_order: section.order ?? 0,
    })
    .select('section_id, section_label, section_body, section_order')
    .single();
  if (error) throw error;
  return {
    id: data.section_id,
    label: data.section_label,
    body: data.section_body ?? '',
    order: data.section_order,
  };
}

export async function updateCardSection(id, fields) {
  const { error } = await supabase
    .from('card_sections')
    .update({
      section_label: fields.label,
      section_body: fields.body || null,
      section_order: fields.order,
    })
    .eq('section_id', id);
  if (error) throw error;
}

export async function deleteCardSection(id) {
  const { error } = await supabase
    .from('card_sections')
    .update({ section_deleted_at: new Date().toISOString() })
    .eq('section_id', id);
  if (error) throw error;
}

// ─── Project Milestones ───────────────────────────────────────────────────────

export async function getProjectMilestones(projectId) {
  const { data, error } = await supabase
    .from('project_milestones')
    .select('milestone_id, milestone_date, milestone_type, milestone_title, milestone_description, milestone_order')
    .eq('project_id', projectId)
    .is('milestone_deleted_at', null)
    .order('milestone_date', { ascending: true });
  if (error) throw error;
  return data.map(m => ({
    id: m.milestone_id,
    date: m.milestone_date,
    type: m.milestone_type ?? '',
    title: m.milestone_title,
    description: m.milestone_description ?? '',
    order: m.milestone_order,
  }));
}

export async function addProjectMilestone(projectId, milestone) {
  const { data, error } = await supabase
    .from('project_milestones')
    .insert({
      project_id: projectId,
      milestone_date: milestone.date,
      milestone_type: milestone.type || null,
      milestone_title: milestone.title,
      milestone_description: milestone.description || null,
      milestone_order: milestone.order ?? 0,
    })
    .select('milestone_id, milestone_date, milestone_type, milestone_title, milestone_description, milestone_order')
    .single();
  if (error) throw error;
  return {
    id: data.milestone_id,
    date: data.milestone_date,
    type: data.milestone_type ?? '',
    title: data.milestone_title,
    description: data.milestone_description ?? '',
    order: data.milestone_order,
  };
}

export async function updateProjectMilestone(id, fields) {
  const { error } = await supabase
    .from('project_milestones')
    .update({
      milestone_date: fields.date,
      milestone_type: fields.type || null,
      milestone_title: fields.title,
      milestone_description: fields.description || null,
      milestone_order: fields.order,
    })
    .eq('milestone_id', id);
  if (error) throw error;
}

export async function softDeleteProjectMilestone(id) {
  const { error } = await supabase
    .from('project_milestones')
    .update({ milestone_deleted_at: new Date().toISOString() })
    .eq('milestone_id', id);
  if (error) throw error;
}
