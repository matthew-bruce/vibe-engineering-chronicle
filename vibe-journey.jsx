import { useState, useEffect, useCallback } from "react";

const CATS = {
  tooling:    { label: 'Tooling Decision',  color: '#4A9EDB', glyph: '⚙' },
  built:      { label: 'Thing I Built',     color: '#52C788', glyph: '◈' },
  learning:   { label: 'Key Learning',      color: '#F5A623', glyph: '◉' },
  wow:        { label: 'Wow Moment',        color: '#B07FE8', glyph: '✦' },
  aspiration: { label: 'Aspiration / Goal', color: '#E86161', glyph: '◎' },
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const today = () => new Date().toISOString().slice(0, 10);

const STORAGE = { tl: 'vj-timeline-v1', cap: 'vj-capture-v1' };

const SEED_DATA = {
  tl: [
    { id: 'seed-tl-1',  date: '2026-03-17', category: 'wow',        createdAt: new Date('2026-03-17').getTime(), title: 'Hacked my corporate laptop to install a full local IDE',                                         body: 'First week of Claude Pro subscription. Corporate network policies blocked NodeJS, VS Code, Git Bash installs. Together with Claude, navigated security policies, certificate issues and system restrictions to establish a complete local development environment. Astonishing how achievable it was.' },
    { id: 'seed-tl-2',  date: '2026-03-21', category: 'wow',        createdAt: new Date('2026-03-21').getTime(), title: 'SaaS is dead — the SaaSpocalypse realisation',                                                  body: 'The realisation that Atlassian, Workday, Figma, Salesforce, Mural, ProductPlan etc. can be replaced by bespoke internally-built tools — faster, cheaper, and better fitted to actual workflows. Companies that have charged monthly licenses for products they\'ve failed to improve deserve to be displaced.' },
    { id: 'seed-tl-3',  date: '2026-03-24', category: 'wow',        createdAt: new Date('2026-03-24').getTime(), title: 'Dispatch demo at PI Planning — colleague suggested buying a tool, I\'d already built one',        body: 'At a PI Planning event, a colleague suggested spending money on a SaaS PI Planning orchestration tool that integrates with Azure and Jira. Replied: I\'ve already built one. Demoed Dispatch — a working PI Planning tool built using Claude Code in roughly 15 hours. First time some people on the team saw the real power of vibe engineering.' },
    { id: 'seed-tl-4',  date: '2026-03-24', category: 'learning',   createdAt: new Date('2026-03-24').getTime(), title: 'The best people to solve workflow problems are those who suffer them every day',                  body: 'We are rarely consulted when processes change, yet we\'re the ones with the deepest understanding of what\'s broken. That makes us the best Product Owners and change agents. Give people the power to fix their own problems and we can streamline and automate our day-to-day — and make the job fun again.' },
    { id: 'seed-tl-5',  date: '2026-03-24', category: 'learning',   createdAt: new Date('2026-03-24').getTime(), title: 'Why enterprise users hate their own software — for the right reasons',                           body: 'Tools like SuccessFactors and PlanView aren\'t hated because they\'re SaaS. They\'re hated because: they were built for the buyer (procurement, HR leadership, finance) not the user; they get sold once and then the vendor coasts; they\'re complex enough that switching feels impossible, removing all accountability; they solve compliance and reporting needs dressed up as productivity tools.' },
    { id: 'seed-tl-6',  date: '2026-03-24', category: 'learning',   createdAt: new Date('2026-03-24').getTime(), title: 'Claude Projects vs GitHub Repos — not the same thing',                                          body: 'A Claude Project is a conversation context on claude.ai — holds chat history, memory and instructions. A GitHub Repo is where code lives — Claude Code on the web connects to this. Workflow: use Claude Chat to design and generate → push to GitHub repo → use claude.ai/code to build and iterate.' },
    { id: 'seed-tl-7',  date: '2026-03-24', category: 'learning',   createdAt: new Date('2026-03-24').getTime(), title: 'The true cost of procurement is invisible until you add it up',                                  body: 'Vendor demos, evaluation committees, negotiation, onboarding, training, the \'we need enterprise tier for SSO\' conversation. For a mid-sized tool that\'s potentially six figures of internal time — and you still end up with 70% of what you wanted.' },
    { id: 'seed-tl-8',  date: '2026-03-24', category: 'aspiration', createdAt: new Date('2026-03-24').getTime(), title: 'Build a unified internal platform at RMG — zero procurement, zero SaaS dependency',             body: 'Independently deployable apps, shared design system, shared Azure repo, integrated with BAU tooling we want to keep. No budget needed, no full dev team, no vendor evaluations. Just problems to solve, basic vibe engineering capability, and an Azure repo.' },
    { id: 'seed-tl-9',  date: '2026-03-24', category: 'aspiration', createdAt: new Date('2026-03-24').getTime(), title: 'Fifth app — a Vibe Engineering dashboard surfacing stats across all PoCs',                       body: 'A visual dashboard showing all vibe engineering projects, time invested per project, productivity multipliers, SaaS spend avoided, and key milestones. The evidence base for making the case internally.' },
    { id: 'seed-tl-10', date: '2026-03-24', category: 'wow',        createdAt: new Date('2026-03-24').getTime(), title: 'AI token costs could exceed employee salaries — right now, not in five years',                  body: 'Jason Calacanis spending $300/day on a single AI agent. Mark Cuban\'s numbers: 8 agents to match one employee = $1,200/day, more than double a typical US salary. App-level token consumption has grown 10x in two years outpacing cost reductions. The wave will be moderated by economics before regulation.' },
    { id: 'seed-tl-11', date: '2026-03-24', category: 'learning',   createdAt: new Date('2026-03-24').getTime(), title: 'Right model, right job — don\'t burn reasoning tokens on tasks that don\'t need them',          body: 'Use cheaper models for data gathering and simple tasks. Reserve expensive high-reasoning models for complex final output. As one person put it: \'I don\'t want to burn down half an Amazon rainforest every time I create a new org chart because I picked the wrong model for the job.\'' },
    { id: 'seed-tl-12', date: '2026-03-24', category: 'wow',        createdAt: new Date('2026-03-24').getTime(), title: 'RMG\'s green brand and unchecked AI energy consumption are on a collision course',              body: 'RMG claims to be the UK\'s number one green-emissions CO2-friendly parcel and logistics carrier. Unmanaged AI adoption — wrong models, agent swarms, heavy token consumption — carries a real carbon cost that could directly contradict that brand promise. \'Right model for the right job\' is not just a cost strategy at RMG — it\'s a green strategy.' },
  ],
  cap: [
    { id: 'seed-cap-1', createdAt: new Date('2026-03-24').getTime(), text: 'When the cost of building a bespoke tool drops to roughly the same as onboarding a SaaS product, the entire procurement and vendor evaluation process becomes an organisational liability.',                                                                                                                                                                                                                                                source: 'Vibe Engineering strategy conversation' },
    { id: 'seed-cap-2', createdAt: new Date('2026-03-24').getTime(), text: "The question to put to leadership isn't 'can we do this?' — Dispatch already answers that. It's: what is your governance model for when individuals and teams start building their own solutions? Because that's coming whether leadership plans for it or not.",                                                                                                                                                                               source: 'Vibe Engineering strategy conversation' },
    { id: 'seed-cap-3', createdAt: new Date('2026-03-24').getTime(), text: 'A man with no medical background used AI to design a personalised mRNA cancer vaccine for his dog Rosie — and it appears to be working. First personalised cancer vaccine ever designed for a dog. Built in under two months using ChatGPT, AlphaFold and Grok, with UNSW researchers. Tumour shrank ~75%.',                                                                                                                                       source: 'Paul Conyngham / The Australian / Fortune, Mar 2026' },
    { id: 'seed-cap-4', createdAt: new Date('2026-03-24').getTime(), text: 'AI strategist Sammy Azdoufal used Claude Code to reverse engineer his DJI Romo vacuum\'s protocol so he could drive it with a PS5 controller. He accidentally gained access to ~7,000 strangers\' vacuums across 24 countries — live camera feeds, microphones, floor plans. He reported it responsibly. The tool he used: Claude Code.',                                                                                                      source: "Tom's Hardware / The Verge / Fortune, Feb 2026" },
  ],
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=JetBrains+Mono:wght@400;500&family=Figtree:wght@300;400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root {
  --bg: #080808;
  --s1: #111111;
  --s2: #181818;
  --s3: #222222;
  --border: #2a2a2a;
  --border2: #333;
  --text: #e4ddd4;
  --muted: #5a5a5a;
  --muted2: #888;
  --accent: #c9a96e;
  --accent-dim: rgba(201,169,110,0.12);
  --accent-glow: rgba(201,169,110,0.25);
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
  background:var(--accent); color:#000;
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
  background:var(--accent); color:#000; border-color:var(--accent);
}
.btn-primary:hover { background:#dbbe84; }
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
.cat-chip.selected { color:#000; font-weight:600; }

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

/* CAPTURE */
.cap-input-area { margin-bottom:24px; }
.cap-input-row { display:flex; gap:8px; align-items:flex-end; }
.cap-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:12px; }
.cap-card {
  background:var(--s1); border:1px solid var(--border);
  border-radius:10px; padding:16px; transition:border-color 0.15s;
  display:flex; flex-direction:column; gap:10px;
}
.cap-card:hover { border-color:var(--border2); }
.cap-text { font-size:14px; line-height:1.65; color:var(--text); font-style:italic; }
.cap-source { font-size:12px; font-family:var(--ff-mono); color:var(--muted2); }
.cap-card-time { font-size:11px; font-family:var(--ff-mono); color:var(--muted); }
.cap-card-actions { display:flex; gap:6px; justify-content:flex-end; }

/* SECTION TITLE */
.section-eyebrow {
  font-family:var(--ff-mono); font-size:10px; color:var(--muted);
  text-transform:uppercase; letter-spacing:0.15em; margin-bottom:16px;
}

/* PRESENTATION */
.present-overlay {
  position:fixed; inset:0; background:#040404; z-index:1000;
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
`;

// ─── Presentation Mode ────────────────────────────────────────────────────────

function PresentMode({ entries, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const entry = entries[idx];
  const cat = entry ? CATS[entry.category] : null;

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') setIdx(i => Math.min(i+1, entries.length-1));
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setIdx(i => Math.max(i-1, 0));
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [entries.length, onClose]);

  if (!entry) return null;
  const pct = entries.length > 1 ? (idx / (entries.length - 1)) * 100 : 100;

  return (
    <div className="present-overlay">
      <div className="present-progress"><div className="present-progress-bar" style={{width:`${pct}%`}}/></div>
      <div className="present-body">
        <div className="present-card" key={entry.id}>
          <div className="present-cat">
            <span className="present-cat-glyph">{cat.glyph}</span>
            <span className="present-cat-label" style={{color:cat.color}}>{cat.label}</span>
          </div>
          <div className="present-date">{fmtDate(entry.date)}</div>
          <div className="present-title">{entry.title}</div>
          {entry.body && <div className="present-text">{entry.body}</div>}
        </div>
      </div>
      <div className="present-footer">
        <button className="btn-close" onClick={onClose}>✕ Close</button>
        <span className="present-counter">{idx + 1} / {entries.length}</span>
        <div className="present-nav">
          <span className="present-hint">← → or click</span>
          <button className="btn-nav" onClick={() => setIdx(i => Math.max(i-1,0))} disabled={idx===0}>←</button>
          <button className="btn-nav" onClick={() => setIdx(i => Math.min(i+1,entries.length-1))} disabled={idx===entries.length-1}>→</button>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline View ────────────────────────────────────────────────────────────

function TimelineView({ entries, allCount, filterCat, setFilterCat, onAdd, onDelete }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title:'', body:'', date:today(), category:'wow' });
  const f = (k, v) => setForm(p => ({...p, [k]:v}));

  const submit = () => {
    if (!form.title.trim()) return;
    onAdd({...form, id:uid(), createdAt:Date.now()});
    setForm({ title:'', body:'', date:today(), category:'wow' });
    setShow(false);
  };

  return (
    <div>
      <div className="tl-header">
        <div>
          <div className="section-eyebrow">Personal Chronicle</div>
          <span className="tl-count">{allCount} {allCount === 1 ? 'entry' : 'entries'}</span>
        </div>
        <button className="btn btn-primary" onClick={() => setShow(s => !s)}>
          {show ? '✕ Cancel' : '+ Add Entry'}
        </button>
      </div>

      {show && (
        <div className="form-card">
          <div className="form-grid">
            <div>
              <div className="form-label">Title *</div>
              <input className="form-input" placeholder="e.g. First tried Claude Code" value={form.title} onChange={e=>f('title',e.target.value)} />
            </div>
            <div>
              <div className="form-label">Date</div>
              <input className="form-input" type="date" value={form.date} onChange={e=>f('date',e.target.value)} />
            </div>
            <div className="form-grid-full">
              <div className="form-label">Notes / Detail</div>
              <textarea className="form-textarea" placeholder="What happened? What did you learn? How did it feel?" value={form.body} onChange={e=>f('body',e.target.value)} />
            </div>
            <div className="form-grid-full">
              <div className="form-label">Category</div>
              <div className="cat-select-row">
                {Object.entries(CATS).map(([k,v]) => (
                  <button
                    key={k} className={`cat-chip ${form.category===k?'selected':''}`}
                    style={form.category===k ? {background:v.color, borderColor:v.color} : {borderColor:v.color+'55', color:v.color}}
                    onClick={() => f('category',k)}
                  >{v.glyph} {v.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>Add to Timeline</button>
          </div>
        </div>
      )}

      <div className="filter-row">
        <button className={`fchip ${filterCat==='all'?'on':''}`} onClick={() => setFilterCat('all')}>All</button>
        {Object.entries(CATS).map(([k,v]) => (
          <button key={k} className={`fchip ${filterCat===k?'on':''}`} onClick={() => setFilterCat(k)}
            style={filterCat===k?{borderColor:v.color,color:v.color}:{}}
          >{v.glyph} {v.label}</button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="empty">
          <div className="empty-title">The journey starts here.</div>
          <div className="empty-sub">Add your first entry — when did you first encounter vibe coding? What tool did you pick up first?</div>
          <button className="btn btn-primary" onClick={() => setShow(true)}>+ Add First Entry</button>
        </div>
      ) : (
        <div className="tl-list">
          {entries.map(e => {
            const cat = CATS[e.category];
            return (
              <div className="tl-entry" key={e.id}>
                <div className="tl-dot-wrap">
                  <div className="tl-dot" style={{background:cat.color}}/>
                </div>
                <div className="tl-body" style={{borderLeftColor:cat.color}}>
                  <div className="tl-head-row">
                    <div className="tl-meta">
                      <span className="tl-date">{fmtDate(e.date)}</span>
                      <span className="tl-cat-badge" style={{background:cat.color+'22', color:cat.color}}>{cat.glyph} {cat.label}</span>
                    </div>
                    <div className="tl-actions">
                      <button className="btn btn-ghost btn-sm btn-icon" title="Delete" onClick={() => onDelete(e.id)}>✕</button>
                    </div>
                  </div>
                  <div className="tl-title">{e.title}</div>
                  {e.body && <div className="tl-text">{e.body}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Capture View ─────────────────────────────────────────────────────────────

function CaptureView({ entries, onAdd, onDelete, onPromote }) {
  const [form, setForm] = useState({ text:'', source:'' });
  const f = (k,v) => setForm(p => ({...p, [k]:v}));

  const submit = () => {
    if (!form.text.trim()) return;
    onAdd({...form, id:uid(), createdAt:Date.now()});
    setForm({ text:'', source:'' });
  };

  return (
    <div>
      <div className="tl-header">
        <div>
          <div className="section-eyebrow">Quick Capture</div>
          <span className="tl-count">Ideas, quotes, and observations to come back to</span>
        </div>
      </div>

      <div className="cap-input-area">
        <div style={{marginBottom:8}}>
          <div className="form-label">Capture a thought, quote, or insight</div>
          <textarea className="form-textarea" placeholder={'"The best code is the code you didn\'t write." — or your own observation, link, or idea...'} value={form.text} onChange={e=>f('text',e.target.value)} style={{minHeight:72}} />
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input className="form-input" placeholder="Source / attribution (optional)" value={form.source} onChange={e=>f('source',e.target.value)} style={{flex:1}} />
          <button className="btn btn-primary" onClick={submit}>Capture →</button>
        </div>
      </div>

      <hr className="divider"/>
      <div className="section-eyebrow">{entries.length} captured{entries.length > 0 ? ' — promote anything significant to the Timeline' : ''}</div>

      {entries.length === 0 ? (
        <div className="empty">
          <div className="empty-title">Nothing captured yet.</div>
          <div className="empty-sub">Heard something interesting? Saw a tweet? Had a lightbulb moment? Drop it here before it disappears.</div>
        </div>
      ) : (
        <div className="cap-grid">
          {entries.map(e => (
            <div className="cap-card" key={e.id}>
              <div className="cap-text">"{e.text}"</div>
              {e.source && <div className="cap-source">— {e.source}</div>}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'auto'}}>
                <span className="cap-card-time">{new Date(e.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>
                <div className="cap-card-actions">
                  <button className="btn btn-ghost btn-sm" title="Promote to timeline" onClick={() => onPromote(e)}>↑ Timeline</button>
                  <button className="btn btn-ghost btn-sm btn-icon" title="Delete" onClick={() => onDelete(e.id)}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState('timeline');
  const [tl, setTl] = useState([]);
  const [cap, setCap] = useState([]);
  const [ready, setReady] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [filterCat, setFilterCat] = useState('all');

  useEffect(() => {
    const load = (key, seed) => {
      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && parsed.length > 0) {
          console.log(`[Chronicle] ${key}: loaded ${parsed.length} entries from localStorage`);
          return parsed;
        }
        console.log(`[Chronicle] ${key}: localStorage was ${parsed ? 'empty []' : 'null'} — applying seed (${seed.length} entries)`);
        return seed;
      } catch (e) {
        console.log(`[Chronicle] ${key}: parse error (${e.message}) — applying seed`);
        return seed;
      }
    };
    setTl(load(STORAGE.tl, SEED_DATA.tl));
    setCap(load(STORAGE.cap, SEED_DATA.cap));
    setReady(true);
  }, []);

  useEffect(() => { if (ready) { try { localStorage.setItem(STORAGE.tl, JSON.stringify(tl)); } catch {} } }, [tl, ready]);
  useEffect(() => { if (ready) { try { localStorage.setItem(STORAGE.cap, JSON.stringify(cap)); } catch {} } }, [cap, ready]);

  const addTl = useCallback(entry => setTl(p => [...p, entry]), []);
  const delTl = useCallback(id => setTl(p => p.filter(e => e.id !== id)), []);
  const addCap = useCallback(entry => setCap(p => [entry, ...p]), []);
  const delCap = useCallback(id => setCap(p => p.filter(e => e.id !== id)), []);

  const promote = useCallback((cap) => {
    // Moves a capture to the timeline with pre-filled form
    const entry = {
      id: uid(),
      title: cap.text.length > 80 ? cap.text.slice(0,78)+'…' : cap.text,
      body: cap.source ? `${cap.text}\n\n— ${cap.source}` : cap.text,
      date: today(),
      category: 'learning',
      createdAt: Date.now()
    };
    setTl(p => [...p, entry]);
    setCap(p => p.filter(e => e.id !== cap.id));
    setTab('timeline');
  }, []);

  const sorted = [...tl]
    .filter(e => filterCat === 'all' || e.category === filterCat)
    .sort((a,b) => new Date(a.date) - new Date(b.date));

  if (!ready) return <div style={{background:'#080808',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#444',fontFamily:'monospace',fontSize:13}}>loading…</div>;

  return (
    <>
      <style>{CSS}</style>
      {presenting && sorted.length > 0 && (
        <PresentMode entries={sorted} startIndex={0} onClose={() => setPresenting(false)} />
      )}
      <div className="app">
        <header className="hdr">
          <div className="hdr-left">
            <div className="hdr-glyph">⟡</div>
            <div>
              <div className="hdr-title">Vibe Coded</div>
              <div className="hdr-sub">A personal chronicle · {tl.length} entries</div>
            </div>
          </div>
          <div className="hdr-right">
            {tl.length > 0 && (
              <button className="btn btn-present" onClick={() => setPresenting(true)}>▶ Present</button>
            )}
            <div className="tabs">
              <button className={`tab ${tab==='timeline'?'on':''}`} onClick={() => setTab('timeline')}>Timeline</button>
              <button className={`tab ${tab==='capture'?'on':''}`} onClick={() => setTab('capture')}>
                Capture {cap.length > 0 && <span className="badge">{cap.length}</span>}
              </button>
            </div>
          </div>
        </header>
        <main className="main">
          {tab === 'timeline' ? (
            <TimelineView
              entries={sorted}
              allCount={tl.length}
              filterCat={filterCat}
              setFilterCat={setFilterCat}
              onAdd={addTl}
              onDelete={delTl}
            />
          ) : (
            <CaptureView
              entries={cap}
              onAdd={addCap}
              onDelete={delCap}
              onPromote={promote}
            />
          )}
        </main>
      </div>
    </>
  );
}
