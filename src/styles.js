const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=JetBrains+Mono:wght@400;500&family=Figtree:wght@300;400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root {
  --bg: #ffffff;
  --s1: #f9fafb;
  --s2: #f3f4f6;
  --s3: #e5e7eb;
  --border: #e5e7eb;
  --border2: #d1d5db;
  --text: #111827;
  --muted: #9ca3af;
  --muted2: #6b7280;
  --accent: #cc0000;
  --accent-dim: rgba(204,0,0,0.08);
  --accent-glow: rgba(204,0,0,0.20);
  --radius: 8px;
  --ff-display: 'Playfair Display', Georgia, serif;
  --ff-mono: 'JetBrains Mono', monospace;
  --ff-body: 'Figtree', system-ui, sans-serif;
}

html,body,#root { height:100%; background:var(--bg); color:var(--text); font-family:var(--ff-body); }

.app { display:flex; flex-direction:column; height:100vh; overflow:hidden; }

/* HEADER */
.hdr {
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 28px; border-bottom:1px solid var(--border);
  background:var(--bg); flex-shrink:0; gap:12px;
}
.hdr-left { display:flex; align-items:center; gap:14px; }
.hdr-glyph {
  width:38px; height:38px; border-radius:50%;
  border:1px solid var(--accent); color:var(--accent);
  display:flex; align-items:center; justify-content:center;
  font-size:18px; flex-shrink:0;
  box-shadow: 0 0 12px var(--accent-dim);
}
.hdr-title { font-family:var(--ff-display); font-size:20px; font-weight:700; color:var(--text); letter-spacing:-0.3px; }
.hdr-sub { font-size:11px; font-family:var(--ff-mono); color:var(--muted2); letter-spacing:0.08em; margin-top:1px; }
.hdr-right { display:flex; align-items:center; gap:10px; }

/* TABS */
.tabs { display:flex; background:var(--s2); border:1px solid var(--border); border-radius:6px; padding:3px; gap:2px; }
.tab {
  padding:6px 16px; border:none; background:none; color:var(--muted2);
  font-family:var(--ff-body); font-size:13px; font-weight:500;
  border-radius:4px; cursor:pointer; transition:all 0.15s; white-space:nowrap;
  display:flex; align-items:center; gap:6px;
}
.tab.on { background:var(--s3); color:var(--text); }
.tab:hover:not(.on) { color:var(--text); }
.badge {
  background:var(--accent); color:#fff;
  font-size:10px; font-weight:700;
  width:16px; height:16px; border-radius:50%;
  display:inline-flex; align-items:center; justify-content:center;
}

/* BUTTONS */
.btn {
  display:inline-flex; align-items:center; gap:6px;
  padding:7px 14px; border-radius:6px; border:1px solid transparent;
  font-family:var(--ff-body); font-size:13px; font-weight:500;
  cursor:pointer; transition:all 0.15s; white-space:nowrap;
}
.btn-primary {
  background:var(--accent); color:#fff; border-color:var(--accent);
}
.btn-primary:hover { background:#aa0000; }
.btn-ghost { background:none; color:var(--muted2); border-color:var(--border); }
.btn-ghost:hover { border-color:var(--muted2); color:var(--text); }
.btn-present {
  background:none; color:var(--accent); border-color:var(--accent);
}
.btn-present:hover { background:var(--accent-dim); }
.btn-sm { padding:4px 10px; font-size:12px; }
.btn-icon { padding:5px 8px; font-size:14px; line-height:1; }

/* MAIN */
.main { flex:1; overflow-y:auto; padding:28px; }

/* TIMELINE */
.tl-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.tl-count { font-family:var(--ff-mono); font-size:11px; color:var(--muted); }

/* FILTER */
.filter-row { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:24px; }
.fchip {
  padding:4px 12px; border-radius:20px; border:1px solid var(--border2);
  font-size:12px; color:var(--muted2); background:none;
  font-family:var(--ff-body); cursor:pointer; transition:all 0.15s;
  display:flex; align-items:center; gap:5px;
}
.fchip:hover { border-color:var(--muted2); color:var(--text); }
.fchip.on { background:var(--s3); color:var(--text); border-color:var(--muted2); }

/* ADD FORM */
.form-card {
  background:var(--s1); border:1px solid var(--border2);
  border-radius:10px; padding:20px; margin-bottom:24px;
  animation: slideIn 0.2s ease;
}
@keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
.form-grid-full { grid-column:1/-1; }
.form-label { font-size:11px; font-family:var(--ff-mono); color:var(--muted2); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:5px; }
.form-input, .form-textarea, .form-select {
  width:100%; background:var(--s2); border:1px solid var(--border2);
  color:var(--text); border-radius:6px; padding:9px 12px;
  font-family:var(--ff-body); font-size:14px;
  outline:none; transition:border 0.15s;
}
.form-input:focus, .form-textarea:focus, .form-select:focus { border-color:var(--accent); }
.form-select option { background:var(--s2); }
.form-textarea { resize:vertical; min-height:80px; line-height:1.6; }
.form-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:12px; }
.cat-select-row { display:flex; gap:6px; flex-wrap:wrap; }
.cat-chip {
  padding:5px 12px; border-radius:20px; border:2px solid transparent;
  font-size:12px; font-weight:500; cursor:pointer; background:none;
  font-family:var(--ff-body); transition:all 0.15s; color:var(--muted2);
}
.cat-chip:hover { color:var(--text); }
.cat-chip.selected { color:#fff; font-weight:600; }

/* THEMES */
.theme-select-row { display:flex; gap:5px; flex-wrap:wrap; }
.theme-chip {
  padding:4px 10px; border-radius:20px; border:1px solid;
  font-size:11px; font-weight:500; cursor:pointer; background:none;
  font-family:var(--ff-body); transition:all 0.15s;
}
.theme-chip.selected { color:#fff !important; font-weight:600; }
/* BENEFIT */
.tl-benefit {
  margin-top:10px; padding:8px 12px; border-radius:6px;
  background:rgba(201,169,110,0.07); border-left:3px solid #c9a96e;
}
.tl-benefit-label {
  font-family:var(--ff-mono); font-size:10px; color:#c9a96e;
  text-transform:uppercase; letter-spacing:0.08em; margin-bottom:3px;
}
.tl-benefit-text { font-size:13px; color:var(--muted2); line-height:1.4; }

/* IMPACT DOTS — form selector */
.impact-selector { display:flex; align-items:center; gap:8px; padding-top:4px; }
.impact-dot {
  width:16px; height:16px; border-radius:50%; border:2px solid var(--border2);
  background:none; cursor:pointer; padding:0; transition:all 0.15s; flex-shrink:0;
}
.impact-dot.filled { background:var(--accent); border-color:var(--accent); }
.impact-dot:hover { border-color:var(--accent); }
.impact-value { font-family:var(--ff-mono); font-size:11px; color:var(--muted2); margin-left:4px; }

/* IMPACT DOTS — card display */
.tl-impact-dots { display:inline-flex; align-items:center; gap:3px; }
.tl-impact-dot {
  width:7px; height:7px; border-radius:50%; border:1px solid var(--border2);
  background:none; flex-shrink:0;
}
.tl-impact-dot.filled { background:var(--accent); border-color:var(--accent); }

/* AUDIENCE PILL */
.tl-audience-pill {
  font-size:10px; font-weight:600; padding:2px 7px; border-radius:3px;
  font-family:var(--ff-mono); letter-spacing:0.05em; white-space:nowrap;
  background:var(--s3); color:var(--muted2); text-transform:capitalize;
}

/* LINKED BENEFITS PLACEHOLDER */
.linked-benefits-placeholder {
  display:flex; flex-direction:column; gap:4px;
  padding:10px 14px; border-radius:6px; border:1px dashed var(--border2);
  font-size:12px; color:var(--muted); line-height:1.5;
}
.linked-benefits-label {
  font-family:var(--ff-mono); font-size:10px; color:var(--muted);
  text-transform:uppercase; letter-spacing:0.08em;
}

.theme-pills { display:flex; gap:4px; flex-wrap:wrap; margin-top:6px; }
.theme-pill {
  font-size:10px; font-weight:600; padding:2px 7px; border-radius:3px;
  font-family:var(--ff-mono); letter-spacing:0.03em; white-space:nowrap;
}

/* SEARCH */
.tl-search-wrap { position:relative; margin-bottom:14px; }
.tl-search-input {
  width:100%; background:var(--s1); border:1px solid var(--border2);
  color:var(--text); border-radius:6px; padding:9px 36px 9px 12px;
  font-family:var(--ff-body); font-size:14px; outline:none; transition:border 0.15s;
}
.tl-search-input:focus { border-color:var(--accent); }
.tl-search-input::placeholder { color:var(--muted); }
.tl-search-clear {
  position:absolute; right:10px; top:50%; transform:translateY(-50%);
  background:none; border:none; color:var(--muted2); cursor:pointer;
  font-size:14px; padding:2px 4px; line-height:1;
}
.tl-search-clear:hover { color:var(--text); }
.tl-search-summary {
  font-family:var(--ff-mono); font-size:11px; color:var(--muted2);
  margin-bottom:14px; letter-spacing:0.03em;
}
mark.search-hl { background:#fef08a; color:inherit; border-radius:2px; padding:0 1px; }

/* TIMELINE ENTRIES */
.tl-list { display:flex; flex-direction:column; gap:0; }
.tl-entry {
  display:flex; gap:0; position:relative;
}
.tl-entry::before {
  content:''; position:absolute; left:19px; top:40px; bottom:-1px;
  width:1px; background:var(--border); z-index:0;
}
.tl-entry:last-child::before { display:none; }
.tl-dot-wrap { width:40px; flex-shrink:0; display:flex; flex-direction:column; align-items:center; padding-top:14px; position:relative; z-index:1; }
.tl-dot {
  width:13px; height:13px; border-radius:50%; border:2px solid var(--bg);
  flex-shrink:0;
}
.tl-body {
  flex:1; background:var(--s1); border:1px solid var(--border);
  border-radius:10px; padding:16px 18px; margin:6px 0 14px 0;
  transition:border-color 0.15s;
  border-left-width:3px;
}
.tl-body:hover { border-color:var(--border2); }
.tl-meta { display:flex; align-items:center; gap:10px; margin-bottom:8px; flex-wrap:wrap; }
.tl-date { font-family:var(--ff-mono); font-size:11px; color:var(--muted2); }
.tl-cat-badge {
  font-size:11px; font-weight:600; padding:2px 8px; border-radius:3px;
  font-family:var(--ff-mono); letter-spacing:0.03em;
}
.tl-title { font-family:var(--ff-display); font-size:17px; font-weight:500; margin-bottom:6px; line-height:1.35; }
.tl-text { font-size:14px; color:var(--muted2); line-height:1.65; white-space:pre-wrap; }
.tl-actions { display:flex; gap:4px; margin-left:auto; opacity:0; transition:opacity 0.15s; }
.tl-body:hover .tl-actions { opacity:1; }
.tl-head-row { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }

/* EMPTY STATE */
.empty {
  text-align:center; padding:60px 20px;
  color:var(--muted); font-size:15px;
}
.empty-title { font-family:var(--ff-display); font-size:26px; color:var(--muted2); margin-bottom:10px; font-style:italic; }
.empty-sub { font-size:13px; color:var(--muted); line-height:1.6; max-width:340px; margin:0 auto 20px; }

/* QUICK CAPTURE */
.qc-wrap { margin-bottom:20px; }
.qc-row { display:flex; gap:8px; align-items:center; }
.qc-input {
  flex:1; background:var(--s1); border:1px solid var(--border2);
  color:var(--text); border-radius:6px; padding:9px 14px;
  font-family:var(--ff-body); font-size:14px; outline:none; transition:border 0.15s;
}
.qc-input:focus { border-color:var(--accent); }
.qc-input::placeholder { color:var(--muted); font-style:italic; }
.qc-btn { flex-shrink:0; }
.qc-extra {
  display:flex; gap:8px; align-items:center; margin-top:6px;
  animation: slideIn 0.15s ease;
}
.qc-sub-input {
  flex:1; background:var(--s1); border:1px solid var(--border2);
  color:var(--text); border-radius:6px; padding:7px 12px;
  font-family:var(--ff-body); font-size:13px; outline:none; transition:border 0.15s;
}
.qc-sub-input:focus { border-color:var(--accent); }
.qc-sub-input::placeholder { color:var(--muted); }
.qc-date { flex:0 0 auto; width:auto; }
.qc-cancel { flex-shrink:0; }

/* SECTION TITLE */
.section-eyebrow {
  font-family:var(--ff-mono); font-size:10px; color:var(--muted);
  text-transform:uppercase; letter-spacing:0.15em; margin-bottom:16px;
}

/* PRESENTATION */
.present-overlay {
  position:fixed; inset:0; background:#ffffff; z-index:1000;
  display:flex; flex-direction:column;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
.present-progress {
  height:2px; background:var(--border);
  flex-shrink:0;
}
.present-progress-bar { height:100%; background:var(--accent); transition:width 0.3s ease; }
.present-body {
  flex:1; display:flex; align-items:center; justify-content:center;
  padding:60px;
}
.present-card {
  max-width:780px; width:100%;
  animation: presentSlide 0.35s ease;
}
@keyframes presentSlide { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
.present-cat { display:flex; align-items:center; gap:10px; margin-bottom:28px; }
.present-cat-glyph { font-size:28px; }
.present-cat-label { font-family:var(--ff-mono); font-size:13px; letter-spacing:0.1em; text-transform:uppercase; }
.present-date { font-family:var(--ff-mono); font-size:13px; color:var(--muted2); margin-bottom:16px; }
.present-title {
  font-family:var(--ff-display); font-size:clamp(26px,4vw,46px);
  font-weight:700; line-height:1.2; margin-bottom:24px; color:var(--text);
}
.present-text { font-size:clamp(15px,1.8vw,19px); line-height:1.75; color:var(--muted2); white-space:pre-wrap; }
.present-footer {
  display:flex; align-items:center; justify-content:space-between;
  padding:20px 40px; flex-shrink:0; border-top:1px solid var(--border);
}
.present-nav { display:flex; gap:12px; }
.present-counter { font-family:var(--ff-mono); font-size:13px; color:var(--muted); }
.btn-close { background:none; border:1px solid var(--border); color:var(--muted2); padding:8px 16px; border-radius:6px; font-family:var(--ff-body); font-size:13px; cursor:pointer; }
.btn-close:hover { border-color:var(--muted2); color:var(--text); }
.btn-nav { background:var(--s2); border:1px solid var(--border2); color:var(--text); padding:8px 18px; border-radius:6px; font-size:18px; cursor:pointer; transition:all 0.15s; }
.btn-nav:hover { background:var(--s3); }
.btn-nav:disabled { opacity:0.25; cursor:not-allowed; }
.present-hint { font-family:var(--ff-mono); font-size:11px; color:var(--muted); }

.divider { border:none; border-top:1px solid var(--border); margin:20px 0; }

/* PRESENT FILTER PANEL */
.pf-anchor { position:relative; display:flex; gap:6px; align-items:center; }
.pf-panel {
  position:absolute; top:calc(100% + 8px); right:0;
  background:var(--s2); border:1px solid var(--border2);
  border-radius:10px; padding:16px 18px; min-width:440px; z-index:200;
  box-shadow:0 8px 32px rgba(0,0,0,0.5);
  animation:slideIn 0.15s ease;
}
.pf-section { margin-bottom:12px; }
.pf-section-label { font-family:var(--ff-mono); font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:0.1em; margin-bottom:6px; }
.pf-chips { display:flex; gap:5px; flex-wrap:wrap; }
.pf-chip {
  padding:3px 10px; border-radius:20px; border:1px solid var(--border2);
  font-size:11px; color:var(--muted2); background:none;
  font-family:var(--ff-body); cursor:pointer; transition:all 0.15s;
  display:flex; align-items:center; gap:4px;
}
.pf-chip.on { background:var(--s3); color:var(--text); border-color:var(--muted2); }
.pf-footer { display:flex; align-items:center; justify-content:space-between; margin-top:14px; padding-top:12px; border-top:1px solid var(--border); }
.pf-count { font-family:var(--ff-mono); font-size:11px; color:var(--muted2); }
.btn-filter { background:none; color:var(--muted2); border:1px solid var(--border2); }
.btn-filter:hover { border-color:var(--muted2); color:var(--text); }
.btn-filter.on { color:var(--accent); border-color:var(--accent); background:var(--accent-dim); }

/* SESSIONS */
.ses-hero {
  text-align:center; padding:28px 20px 20px;
  margin-bottom:24px; border-bottom:1px solid var(--border);
}
.ses-hero-hrs {
  font-family:var(--ff-display); font-size:clamp(40px,6vw,64px);
  font-weight:700; color:var(--accent); line-height:1; letter-spacing:-1px;
}
.ses-hero-label {
  font-family:var(--ff-mono); font-size:11px; color:var(--muted);
  text-transform:uppercase; letter-spacing:0.15em; margin-top:6px;
}
.ses-overview { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:16px; }
.ses-grand-total { text-align:right; }
.ses-grand-hrs { font-family:var(--ff-display); font-size:36px; font-weight:700; color:var(--accent); line-height:1; }
.ses-grand-label { font-family:var(--ff-mono); font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:0.1em; margin-top:3px; }
.ses-projects-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(185px,1fr)); gap:10px; margin-bottom:24px; }
.ses-project-card { background:var(--s1); border:1px solid var(--border); border-radius:8px; padding:14px; }
.ses-project-name { font-size:12px; color:var(--muted2); line-height:1.3; margin-bottom:8px; }
.ses-project-hrs { font-family:var(--ff-mono); font-size:22px; font-weight:600; color:var(--accent); line-height:1; }
.ses-project-unit { font-family:var(--ff-mono); font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:0.1em; margin-top:2px; }
.ses-add-card { background:var(--s1); border:1px solid var(--border2); border-radius:10px; padding:16px; margin-bottom:24px; }
.ses-form-grid { display:grid; grid-template-columns:2fr 1fr; gap:10px; margin-bottom:10px; }
.ses-dur-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:10px; }
.ses-form-footer { display:flex; gap:8px; align-items:center; }
.ses-form-notes { display:flex; gap:8px; align-items:center; flex:1; }
.ses-toggle { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--muted2); cursor:pointer; white-space:nowrap; user-select:none; }
.ses-toggle input { cursor:pointer; accent-color:var(--accent); }
.ses-list { display:flex; flex-direction:column; gap:8px; }
.ses-item { background:var(--s1); border:1px solid var(--border); border-radius:8px; padding:11px 16px; display:grid; grid-template-columns:auto auto auto 1fr auto; align-items:center; gap:14px; }
.ses-item-project { font-size:13px; font-weight:500; white-space:nowrap; }
.ses-item-date { font-family:var(--ff-mono); font-size:11px; color:var(--muted2); white-space:nowrap; }
.ses-item-dur { font-family:var(--ff-mono); font-size:13px; font-weight:600; color:var(--accent); white-space:nowrap; }
.ses-item-notes { font-size:12px; color:var(--muted2); font-style:italic; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ses-item-actions { display:flex; gap:4px; align-items:center; opacity:0; transition:opacity 0.15s; }
.ses-item:hover .ses-item-actions { opacity:1; }
.ses-item-editing { display:block !important; padding:14px 16px; }
.ses-edit-row { display:grid; grid-template-columns:2fr 1fr; gap:10px; margin-bottom:10px; }
.ses-edit-footer { display:flex; justify-content:flex-end; gap:8px; margin-top:4px; }

/* PROJECTS — STATUS SELECT */
.proj-status-select {
  font-size:11px; font-weight:600; padding:3px 8px; border-radius:3px;
  font-family:var(--ff-mono); letter-spacing:0.03em; border:1px solid;
  cursor:pointer; outline:none; white-space:nowrap;
}

/* PROJECTS — LIST */
.proj-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
.proj-tile {
  background:var(--s1); border:1px solid var(--border); border-radius:10px;
  overflow:hidden; cursor:pointer; text-align:left; transition:all 0.15s;
  padding:0; width:100%;
}
.proj-tile:hover { border-color:var(--border2); box-shadow:0 2px 12px rgba(0,0,0,0.06); transform:translateY(-1px); }
.proj-tile-img-wrap { position:relative; aspect-ratio:16/9; background:var(--s2); overflow:hidden; }
.proj-tile-img { width:100%; height:100%; object-fit:cover; display:block; }
.proj-tile-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:32px; color:var(--muted); }
.proj-tile-status { position:absolute; top:8px; right:8px; }
.proj-tile-body { padding:12px 14px 14px; }
.proj-tile-name { font-family:var(--ff-display); font-size:15px; font-weight:500; margin-bottom:6px; line-height:1.3; color:var(--text); }
.proj-tile-preview { font-size:12px; color:var(--muted2); line-height:1.55; margin-bottom:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.proj-tile-meta { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.proj-tile-hrs { font-family:var(--ff-mono); font-size:11px; font-weight:600; color:var(--accent); white-space:nowrap; }
.proj-tile-saas { font-size:11px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }

/* PROJECTS — STATUS BADGE */
.proj-status { font-size:11px; font-weight:600; padding:2px 8px; border-radius:3px; font-family:var(--ff-mono); letter-spacing:0.03em; border:1px solid; white-space:nowrap; }

/* PROJECTS — DETAIL */
.proj-detail { max-width:860px; }
.proj-back-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
.proj-tile-wrap { position:relative; }
.proj-tile-del {
  position:absolute; top:8px; left:8px; display:flex; gap:4px;
  opacity:0; transition:opacity 0.15s;
}
.proj-tile-wrap:hover .proj-tile-del { opacity:1; }

/* PROJECTS — CAROUSEL */
.proj-carousel { margin-bottom:24px; border-radius:10px; overflow:hidden; background:var(--s2); border:1px solid var(--border); }
.proj-carousel-main { position:relative; aspect-ratio:16/9; background:#0a0a0a; }
.proj-carousel-img { width:100%; height:100%; object-fit:contain; display:block; }
.proj-carousel-overlay {
  position:absolute; bottom:0; left:0; right:0; padding:12px 16px;
  display:flex; align-items:center; justify-content:space-between;
  background:linear-gradient(transparent,rgba(0,0,0,0.55));
}
.proj-carousel-nav {
  background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3);
  color:#fff; border-radius:4px; padding:5px 14px; font-size:16px;
  cursor:pointer; transition:all 0.15s;
}
.proj-carousel-nav:hover:not(:disabled) { background:rgba(255,255,255,0.3); }
.proj-carousel-nav:disabled { opacity:0.2; cursor:not-allowed; }
.proj-carousel-counter { font-family:var(--ff-mono); font-size:12px; color:rgba(255,255,255,0.8); }
.proj-carousel-del { position:absolute; top:8px; right:8px; display:flex; gap:4px; }
.proj-carousel-footer { padding:10px 14px; display:flex; align-items:center; gap:10px; }

/* PROJECTS — UPLOAD ZONE */
.proj-upload-zone {
  aspect-ratio:16/9; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:8px;
  cursor:pointer; transition:all 0.15s; padding:20px;
}
.proj-upload-zone.drag-over { background:var(--accent-dim); }
.proj-upload-zone.uploading { cursor:not-allowed; opacity:0.7; }
.proj-upload-icon { font-size:34px; color:var(--muted); }
.proj-upload-label { font-size:14px; color:var(--muted2); }

/* PROJECTS — DETAIL LAYOUT */
.proj-detail-hdr { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
.proj-detail-name { font-family:var(--ff-display); font-size:26px; font-weight:700; line-height:1.2; flex:1; margin:0; }
.proj-stats-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:24px; }
.proj-stat { background:var(--s1); border:1px solid var(--border); border-radius:8px; padding:14px 16px; }
.proj-stat-value { font-family:var(--ff-mono); font-size:18px; font-weight:600; color:var(--accent); line-height:1.2; margin-bottom:4px; word-break:break-word; }
.proj-stat-label { font-size:11px; color:var(--muted2); line-height:1.4; }
.proj-section { margin-bottom:22px; }
.proj-section-label { font-family:var(--ff-mono); font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:0.12em; margin-bottom:8px; }
.proj-section-text { font-size:14px; color:var(--muted2); line-height:1.7; white-space:pre-wrap; }
.proj-features-list { list-style:none; padding:0; display:flex; flex-direction:column; gap:6px; margin:0; }
.proj-features-list li { font-size:14px; color:var(--muted2); line-height:1.5; padding-left:18px; position:relative; }
.proj-features-list li::before { content:'◦'; position:absolute; left:0; color:var(--accent); }
.proj-links { display:flex; gap:10px; margin-top:24px; flex-wrap:wrap; }

/* VIEW TOGGLE */
.view-toggle-on { color:var(--accent) !important; border-color:var(--accent) !important; background:var(--accent-dim) !important; }

/* CARD SECTIONS — timeline display */
.tl-sections { margin-top:12px; display:flex; flex-direction:column; gap:8px; }
.tl-section { padding:8px 12px; border-left:2px solid var(--border2); background:var(--s2); border-radius:0 4px 4px 0; }
.tl-section-label { font-family:var(--ff-mono); font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted2); margin-bottom:4px; }
.tl-section-body { font-size:13px; color:var(--muted2); line-height:1.55; white-space:pre-wrap; }

/* CARD SECTIONS — form editor */
.section-form-item { display:flex; flex-direction:column; gap:6px; border-left:2px solid var(--border2); padding-left:12px; margin-bottom:10px; }

/* PRESENT MODE — sections */
.present-sections { margin-top:20px; display:flex; flex-direction:column; gap:12px; }
.present-section { padding:12px 16px; border-left:3px solid var(--border2); background:var(--s1); border-radius:0 6px 6px 0; }
.present-section-label { font-family:var(--ff-mono); font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:6px; }
.present-section-body { font-size:clamp(13px,1.5vw,16px); color:var(--muted2); line-height:1.6; white-space:pre-wrap; }
.present-detail-on { color:var(--accent) !important; border-color:var(--accent) !important; }

/* PROJECT MILESTONES */
.milestone-timeline { display:flex; flex-direction:column; gap:0; }
.milestone-item { display:flex; gap:14px; align-items:flex-start; }
.milestone-date-col { width:90px; flex-shrink:0; text-align:right; font-family:var(--ff-mono); font-size:11px; color:var(--muted); padding-top:3px; }
.milestone-connector { display:flex; flex-direction:column; align-items:center; flex-shrink:0; width:16px; }
.milestone-dot { width:10px; height:10px; border-radius:50%; background:var(--accent); flex-shrink:0; margin-top:4px; box-shadow:0 0 0 3px var(--accent-dim); }
.milestone-line { width:2px; flex:1; background:var(--border); min-height:24px; margin-top:4px; }
.milestone-content { flex:1; padding-bottom:20px; }
.milestone-item:last-child .milestone-content { padding-bottom:0; }
.milestone-type-badge { font-family:var(--ff-mono); font-size:10px; font-weight:600; padding:2px 6px; border-radius:3px; text-transform:uppercase; letter-spacing:0.05em; background:var(--s3); color:var(--muted2); flex-shrink:0; }
.milestone-title { font-size:14px; font-weight:500; color:var(--text); }
.milestone-description { font-size:13px; color:var(--muted2); line-height:1.55; margin-top:3px; white-space:pre-wrap; }
.milestone-form { background:var(--s2); border:1px solid var(--border2); border-radius:8px; padding:14px; margin-bottom:16px; }
.milestone-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; }
`;

export default CSS;
