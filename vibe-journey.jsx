import { useState, useEffect, useCallback } from "react";
import {
  initLookups,
  loadTimeline, loadCaptures, loadSessions,
  addTimelineEntry, updateTimelineEntry, softDeleteCard, addCapture,
  addSession, updateSession, softDeleteSession,
} from './lib/db.js';

const CATS = {
  tooling:    { label: 'Tooling Decision',  color: '#4A9EDB', glyph: '⚙' },
  built:      { label: 'Thing I Built',     color: '#52C788', glyph: '◈' },
  learning:   { label: 'Key Learning',      color: '#F5A623', glyph: '◉' },
  wow:        { label: 'Wow Moment',        color: '#B07FE8', glyph: '✦' },
  aspiration: { label: 'Aspiration / Goal', color: '#E86161', glyph: '◎' },
  ideas:      { label: 'Idea / Wishlist',   color: '#A78BFA', glyph: '◐' },
  session:    { label: 'Session',           color: '#34D4D4', glyph: '◷' },
};

const THEMES = [
  { id: 'industry',   label: 'Industry',   color: '#4A9EDB' },
  { id: 'economics',  label: 'Economics',  color: '#F5A623' },
  { id: 'orgdesign',  label: 'Org Design', color: '#B07FE8' },
  { id: 'evidence',   label: 'Evidence',   color: '#52C788' },
  { id: 'leadership', label: 'Leadership', color: '#E86161' },
  { id: 'signal',     label: 'Signal',     color: '#c9a96e' },
  { id: 'unlock',     label: 'Unlock',     color: '#34D4D4' },
];

const toggleTheme = (themes, id) =>
  themes.includes(id) ? themes.filter(t => t !== id) : [...themes, id];

const PROJECTS = [
  'Dispatch (PI Planning Tool)',
  'Platform Org Structure',
  'Platform Roadmapping Tool',
  'Vibe Engineering Chronicle',
  'Vibe Engineering Strategy',
];

const minsToHours = m => {
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

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const today = () => new Date().toISOString().slice(0, 10);

const STORAGE = { tl: 'vj-timeline-v1', cap: 'vj-capture-v1', ses: 'vj-sessions-v1' };

const SEED_DATA = {
  tl: [
    { id: 'seed-tl-15', date: '2026-03-01', category: 'tooling',    createdAt: new Date('2026-03-01').getTime(), themes: ['tooling', 'evidence'],                         title: 'Started with ChatGPT — and made every classic mistake',                                                   body: 'No admin rights, no localhost, no IDE. Built using web interfaces only — ChatGPT and Codex. Copy/pasting source files and compile errors between chat and GitHub manually. Conversations ground to a halt as context grew. Token consumption spiralled. It worked, but it was far from efficient. Every mistake was a lesson.' },
    { id: 'seed-tl-16', date: '2026-03-10', category: 'learning',   createdAt: new Date('2026-03-10').getTime(), themes: ['tooling', 'economics'],                        title: 'Do not use Chat to do Code\'s job — the copy/paste trap',                                                 body: 'Using a chat interface to write, debug and iterate code means manually piping source files, error messages and patches in every direction. Every prompt re-reads everything. The fix: use Chat for thinking and designing, use a coding agent for building and debugging. The agent reads the repo directly — no copy/pasting, no context degradation.' },
    { id: 'seed-tl-1',  date: '2026-03-17', category: 'wow',        createdAt: new Date('2026-03-17').getTime(), themes: ['evidence', 'tooling'],                         title: 'Hacked my corporate laptop to install a full local IDE',                                                   body: 'First week of Claude Pro subscription. Corporate network policies blocked NodeJS, VS Code, Git Bash installs. Together with Claude, navigated security policies, certificate issues and system restrictions to establish a complete local development environment. Astonishing how achievable it was.' },
    { id: 'seed-tl-17', date: '2026-03-17', category: 'wow',        createdAt: new Date('2026-03-17').getTime(), themes: ['evidence', 'tooling'],                         title: 'Chalk and cheese — the developer experience after just a few weeks',                                       body: 'From copy/pasting compile errors from Vercel into Chat and manually pasting source code back into GitHub — to Claude Code reading the repo directly, pushing automatically, Vercel deploying in seconds. Same person, same intent, dramatically different experience. The learning curve is real but it is weeks not months.' },
    { id: 'seed-tl-2',  date: '2026-03-21', category: 'wow',        createdAt: new Date('2026-03-21').getTime(), themes: ['industry', 'economics', 'signal'],             title: 'SaaS is dead — the SaaSpocalypse realisation',                                                            body: 'The realisation that Atlassian, Workday, Figma, Salesforce, Mural, ProductPlan etc. can be replaced by bespoke internally-built tools — faster, cheaper, and better fitted to actual workflows. Companies that have charged monthly licenses for products they\'ve failed to improve deserve to be displaced.' },
    { id: 'seed-tl-3',  date: '2026-03-24', category: 'wow',        createdAt: new Date('2026-03-24').getTime(), themes: ['evidence', 'unlock', 'orgdesign'],             title: 'Dispatch demo at PI Planning — colleague suggested buying a tool, I\'d already built one',                body: 'At a PI Planning event, a colleague suggested spending money on a SaaS PI Planning orchestration tool that integrates with Azure and Jira. Replied: I\'ve already built one. Demoed Dispatch — a working PI Planning tool built using Claude Code in roughly 15 hours. First time some people on the team saw the real power of vibe engineering.' },
    { id: 'seed-tl-4',  date: '2026-03-24', category: 'learning',   createdAt: new Date('2026-03-24').getTime(), themes: ['orgdesign', 'signal', 'leadership'],           title: 'The best people to solve workflow problems are those who suffer them every day',                            body: 'We are rarely consulted when processes change, yet we\'re the ones with the deepest understanding of what\'s broken. That makes us the best Product Owners and change agents. Give people the power to fix their own problems and we can streamline and automate our day-to-day — and make the job fun again.' },
    { id: 'seed-tl-5',  date: '2026-03-24', category: 'learning',   createdAt: new Date('2026-03-24').getTime(), themes: ['industry', 'economics', 'signal', 'leadership'], title: 'Why enterprise users hate their own software — for the right reasons',                                     body: 'Tools like SuccessFactors and PlanView aren\'t hated because they\'re SaaS. They\'re hated because: they were built for the buyer (procurement, HR leadership, finance) not the user; they get sold once and then the vendor coasts; they\'re complex enough that switching feels impossible, removing all accountability; they solve compliance and reporting needs dressed up as productivity tools.' },
    { id: 'seed-tl-6',  date: '2026-03-24', category: 'tooling',    createdAt: new Date('2026-03-24').getTime(), themes: ['tooling'],                                     title: 'Claude Projects vs GitHub Repos — not the same thing',                                                   body: 'A Claude Project is a conversation context on claude.ai — holds chat history, memory and instructions. A GitHub Repo is where code lives — Claude Code on the web connects to this. Workflow: use Claude Chat to design and generate → push to GitHub repo → use claude.ai/code to build and iterate.' },
    { id: 'seed-tl-7',  date: '2026-03-24', category: 'learning',   createdAt: new Date('2026-03-24').getTime(), themes: ['economics', 'signal', 'leadership'],           title: 'The true cost of procurement is invisible until you add it up',                                           body: 'Vendor demos, evaluation committees, negotiation, onboarding, training, the \'we need enterprise tier for SSO\' conversation. For a mid-sized tool that\'s potentially six figures of internal time — and you still end up with 70% of what you wanted.' },
    { id: 'seed-tl-8',  date: '2026-03-24', category: 'aspiration', createdAt: new Date('2026-03-24').getTime(), themes: ['orgdesign', 'leadership'],                     title: 'Build a unified internal platform at RMG — zero procurement, zero SaaS dependency',                       body: 'Independently deployable apps, shared design system, shared Azure repo, integrated with BAU tooling we want to keep. No budget needed, no full dev team, no vendor evaluations. Just problems to solve, basic vibe engineering capability, and an Azure repo.' },
    { id: 'seed-tl-9',  date: '2026-03-24', category: 'ideas',      createdAt: new Date('2026-03-24').getTime(), themes: ['evidence', 'orgdesign'],                       title: 'Fifth app — a Vibe Engineering dashboard surfacing stats across all PoCs',                                body: 'A visual dashboard showing all vibe engineering projects, time invested per project, productivity multipliers, SaaS spend avoided, and key milestones. The evidence base for making the case internally.' },
    { id: 'seed-tl-10', date: '2026-03-24', category: 'wow',        createdAt: new Date('2026-03-24').getTime(), themes: ['industry', 'economics', 'signal'],             title: 'AI token costs could exceed employee salaries — right now, not in five years',                            body: 'Jason Calacanis spending $300/day on a single AI agent. Mark Cuban\'s numbers: 8 agents to match one employee = $1,200/day, more than double a typical US salary. App-level token consumption has grown 10x in two years outpacing cost reductions. The wave will be moderated by economics before regulation.' },
    { id: 'seed-tl-11', date: '2026-03-24', category: 'learning',   createdAt: new Date('2026-03-24').getTime(), themes: ['tooling', 'economics'],                        title: 'Right model, right job — don\'t burn reasoning tokens on tasks that don\'t need them',                   body: 'Use cheaper models for data gathering and simple tasks. Reserve expensive high-reasoning models for complex final output. As one person put it: \'I don\'t want to burn down half an Amazon rainforest every time I create a new org chart because I picked the wrong model for the job.\'' },
    { id: 'seed-tl-12', date: '2026-03-24', category: 'wow',        createdAt: new Date('2026-03-24').getTime(), themes: ['signal', 'leadership', 'orgdesign'],           title: 'RMG\'s green brand and unchecked AI energy consumption are on a collision course',                        body: 'RMG claims to be the UK\'s number one green-emissions CO2-friendly parcel and logistics carrier. Unmanaged AI adoption — wrong models, agent swarms, heavy token consumption — carries a real carbon cost that could directly contradict that brand promise. \'Right model for the right job\' is not just a cost strategy at RMG — it\'s a green strategy.' },
    { id: 'seed-tl-13', date: '2026-03-24', category: 'learning',   createdAt: new Date('2026-03-24').getTime(), themes: ['orgdesign', 'leadership', 'signal'],           title: 'The three states of Vibe Engineering acceptance',                                                         body: 'As a change agent, different people are in different camps. Camp 1 — The Dismissive: sceptical, needs proof not evangelism, lead with a demo. Camp 2 — The Practitioner: understands the tools, needs governance and direction. Camp 3 — The Organisational: sees the structural shift, needs a framework and roadmap. Diagnose the camp before you open your mouth.' },
    { id: 'seed-tl-14', date: '2026-03-24', category: 'wow',        createdAt: new Date('2026-03-24').getTime(), themes: ['industry', 'signal', 'economics'],             title: 'The model you use today is the worst you will ever use for the rest of your life — Kevin Weil, CPO OpenAI', body: 'Paraphrased by Brad Gerstner on the All-In Podcast alongside Anthropic revenue figures — $1B ARR in Dec 2024 to $19B ARR by March 2026, growing 10x annually for three consecutive years. Claude Code alone hit $2.5B ARR in nine months from zero. Everything built tonight was built with the dumbest version of this technology that will ever exist. It only gets more capable from here.' },
    { id: 'seed-tl-18', date: '2026-03-24', category: 'ideas',      createdAt: new Date('2026-03-24').getTime(), themes: ['evidence', 'orgdesign', 'economics'],          title: 'App #5 — Vibe Engineering Projects Dashboard',                                                            body: 'A visual command centre for all vibe-engineered tools and PoCs at RMG. Per project: name, status, hours invested, live URL, SaaS replaced, cost avoided, date started. Aggregate stats: total hours, total SaaS spend avoided, productivity multiplier vs traditional procurement. Timeline view of the journey. Signal feed from Chronicle. The dashboard is itself a vibe-engineered app — demoing it to the CTO simultaneously demonstrates the capability it describes.' },
  ],
  cap: [
    { id: 'seed-cap-1', createdAt: new Date('2026-03-24').getTime(), themes: ['economics', 'signal', 'leadership'], text: 'When the cost of building a bespoke tool drops to roughly the same as onboarding a SaaS product, the entire procurement and vendor evaluation process becomes an organisational liability.',                                                                                                                                                                                                  source: 'Vibe Engineering strategy conversation' },
    { id: 'seed-cap-2', createdAt: new Date('2026-03-24').getTime(), themes: ['orgdesign', 'leadership', 'signal'],  text: "The question to put to leadership isn't 'can we do this?' — Dispatch already answers that. It's: what is your governance model for when individuals and teams start building their own solutions? Because that's coming whether leadership plans for it or not.",                                                                                                                             source: 'Vibe Engineering strategy conversation' },
    { id: 'seed-cap-3', createdAt: new Date('2026-03-24').getTime(), themes: ['industry', 'unlock', 'evidence'],     text: 'A man with no medical background used AI to design a personalised mRNA cancer vaccine for his dog Rosie — and it appears to be working. First personalised cancer vaccine ever designed for a dog. Built in under two months using ChatGPT, AlphaFold and Grok, with UNSW researchers. Tumour shrank ~75%.',                                                                                  source: 'Paul Conyngham / The Australian / Fortune, Mar 2026' },
    { id: 'seed-cap-4', createdAt: new Date('2026-03-24').getTime(), themes: ['industry', 'evidence', 'tooling'],    text: 'AI strategist Sammy Azdoufal used Claude Code to reverse engineer his DJI Romo vacuum\'s protocol so he could drive it with a PS5 controller. He accidentally gained access to ~7,000 strangers\' vacuums across 24 countries — live camera feeds, microphones, floor plans. He reported it responsibly. The tool he used: Claude Code.',                                                  source: "Tom's Hardware / The Verge / Fortune, Feb 2026" },
  ],
  ses: [
    { id: 'seed-ses-1', project: 'Platform Roadmapping Tool', date: '2026-03-03', durationMins: 420,  notes: "Work to date on Platform Roadmapping Tool (approx.) which got us an initial two variants on ChatGPT Codex, then we moved to Claude for a re-write and it's much better, but still a way to go before a workable PoC.", createdAt: new Date('2026-03-03').getTime() },
    { id: 'seed-ses-2', project: 'Platform Org Structure',    date: '2026-03-04', durationMins: 360,  notes: 'Work to date on Platform Org Structure (approx.) which has got us nearly to the point where the structure works and the drag/drop is reliable. Needs another 1-2 sessions to get to a working PoC.',                       createdAt: new Date('2026-03-04').getTime() },
    { id: 'seed-ses-3', project: 'Dispatch (PI Planning Tool)',date: '2026-03-19', durationMins: 1500, notes: 'Work to date on Dispatch (approx.) which has got it to well beyond a PoC stage, with a working import function, canonical data layer, and completed features including Sorting Frame and Dashboard.',                        createdAt: new Date('2026-03-19').getTime() },
    { id: 'seed-ses-4', project: 'Vibe Engineering Chronicle', date: '2026-03-24', durationMins: 120,  notes: 'Created the concept of Chronicle to show a basic timeline of my journey into Vibe Engineering, as a way to capture WOW moments, key learnings, project ideas, tooling decisions etc. with the aim that I use it to help organise my thoughts and as a way to bring my team and peers up to speed on the journey.', createdAt: new Date('2026-03-24').getTime() },
    { id: 'seed-ses-5', project: 'Vibe Engineering Chronicle', date: '2026-03-25', durationMins: 240,  notes: 'Strategy and build session. Designed and built Chronicle v1 from scratch — Timeline, Capture tab, Sessions tracker, Present Mode with filters. Added six categories including Ideas, seven themes including Signal and Unlock, and Benefit field. Seeded 18 timeline entries covering the full vibe engineering journey to date. Discussed and drafted two versions of the Head of / Director of Engineering Productivity job description for RMG. Captured 20+ insights, signals and wow moments. Established theme taxonomy, three camps of acceptance framework, Fact or Fiction deck. Created README, TODO, USER_GUIDE and PROPOSITION documentation. Total across all projects now 44 hours.', createdAt: new Date('2026-03-25').getTime() },
  ],
};

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
  background:rgba(201,169,110,0.08); border-left:3px solid var(--accent);
}
.tl-benefit-label {
  font-family:var(--ff-mono); font-size:10px; color:var(--muted2);
  text-transform:uppercase; letter-spacing:0.08em; margin-bottom:3px;
}
.tl-benefit-text { font-size:13px; color:var(--accent); line-height:1.4; }

.theme-pills { display:flex; gap:4px; flex-wrap:wrap; margin-top:6px; }
.theme-pill {
  font-size:10px; font-weight:600; padding:2px 7px; border-radius:3px;
  font-family:var(--ff-mono); letter-spacing:0.03em; white-space:nowrap;
}

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

// ─── Shared form fields for add and inline edit ───────────────────────────────

function EntryFormFields({ form, onChange }) {
  const f = (k, v) => onChange(k, v);
  const catOptions = Object.entries(CATS).filter(([k]) => k !== 'session');
  const activeCat = CATS[form.category] || CATS.wow;
  return (
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
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span style={{width:10, height:10, borderRadius:'50%', background:activeCat.color, flexShrink:0, display:'inline-block'}} />
          <select className="form-select" value={form.category} onChange={e=>f('category',e.target.value)}>
            {catOptions.map(([k,v]) => <option key={k} value={k}>{v.glyph} {v.label}</option>)}
          </select>
        </div>
      </div>
      <div className="form-grid-full">
        <div className="form-label">Themes</div>
        <div className="theme-select-row">
          {THEMES.map(t => (
            <button key={t.id}
              className={`theme-chip ${form.themes.includes(t.id)?'selected':''}`}
              style={form.themes.includes(t.id)
                ? {background:t.color, borderColor:t.color, color:'#fff'}
                : {borderColor:t.color+'66', color:t.color}}
              onClick={() => f('themes', toggleTheme(form.themes, t.id))}
            >{t.label}</button>
          ))}
        </div>
      </div>
      <div className="form-grid-full">
        <div className="form-label">Benefit / so what? <span style={{opacity:0.5,fontWeight:400}}>(optional)</span></div>
        <input className="form-input" placeholder="e.g. Saves 6 weeks of procurement time per tool" value={form.benefit} onChange={e=>f('benefit',e.target.value)} />
      </div>
    </div>
  );
}

// ─── Timeline View ────────────────────────────────────────────────────────────

const BLANK_FORM = { title:'', body:'', date:today(), category:'wow', themes:[], benefit:'' };

function TimelineView({ entries, allCount, filterCat, setFilterCat, onAdd, onUpdate, onDelete }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);

  const submit = () => {
    if (!form.title.trim()) return;
    onAdd({...form, id:uid(), createdAt:Date.now()});
    setForm(BLANK_FORM);
    setShow(false);
  };

  const startEdit = (e) => {
    setEditForm({ title:e.title, body:e.body||'', date:e.date, category:e.category, themes:e.themes||[], benefit:e.benefit||'' });
    setEditId(e.id);
    setConfirmDel(null);
    setShow(false);
  };

  const saveEdit = () => {
    if (!editForm.title.trim()) return;
    setEditId(null);
    onUpdate(editId, editForm);
  };

  return (
    <div>
      <div className="tl-header">
        <div>
          <div className="section-eyebrow">Personal Chronicle</div>
          <span className="tl-count">{allCount} {allCount === 1 ? 'entry' : 'entries'}</span>
        </div>
        <button className="btn btn-primary" onClick={() => { setShow(s => !s); setEditId(null); }}>
          {show ? '✕ Cancel' : '+ Add Entry'}
        </button>
      </div>

      {show && (
        <div className="form-card">
          <EntryFormFields form={form} onChange={(k,v) => setForm(p => ({...p,[k]:v}))} />
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
            const cat = CATS[e.category] || CATS.wow;
            const isEditing = editId === e.id;
            const editCat = isEditing ? (CATS[editForm.category] || cat) : cat;
            return (
              <div className="tl-entry" key={e.id}>
                <div className="tl-dot-wrap">
                  <div className="tl-dot" style={{background: isEditing ? editCat.color : cat.color}}/>
                </div>
                {isEditing ? (
                  <div className="tl-body" style={{borderLeftColor: editCat.color}}>
                    <EntryFormFields form={editForm} onChange={(k,v) => setEditForm(p => ({...p,[k]:v}))} />
                    <div className="form-actions">
                      <button className="btn btn-ghost" onClick={() => setEditId(null)}>Cancel</button>
                      <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
                    </div>
                  </div>
                ) : (
                  <div className="tl-body" style={{borderLeftColor:cat.color}}>
                    <div className="tl-head-row">
                      <div className="tl-meta">
                        <span className="tl-date">{fmtDate(e.date)}</span>
                        <span className="tl-cat-badge" style={{background:cat.color+'22', color:cat.color}}>{cat.glyph} {cat.label}</span>
                      </div>
                      <div className="tl-actions">
                        {confirmDel === e.id ? (
                          <>
                            <button className="btn btn-ghost btn-sm" style={{color:'#E86161',fontSize:11}} onClick={() => { onDelete(e.id); setConfirmDel(null); }}>Delete?</button>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setConfirmDel(null)}>✕</button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => startEdit(e)}>✎</button>
                            <button className="btn btn-ghost btn-sm btn-icon" title="Delete" onClick={() => setConfirmDel(e.id)}>🗑</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="tl-title">{e.title}</div>
                    {e.body && <div className="tl-text">{e.body}</div>}
                    {(e.themes||[]).length > 0 && (
                      <div className="theme-pills">
                        {(e.themes||[]).map(id => { const t = THEMES.find(x=>x.id===id); return t ? (
                          <span key={id} className="theme-pill" style={{background:t.color+'22',color:t.color}}>{t.label}</span>
                        ) : null; })}
                      </div>
                    )}
                    {e.benefit && (
                      <div className="tl-benefit">
                        <div className="tl-benefit-label">Benefit</div>
                        <div className="tl-benefit-text">{e.benefit}</div>
                      </div>
                    )}
                  </div>
                )}
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
  const [form, setForm] = useState({ text:'', source:'', themes:[] });
  const f = (k,v) => setForm(p => ({...p, [k]:v}));

  const submit = () => {
    if (!form.text.trim()) return;
    onAdd({...form, id:uid(), createdAt:Date.now()});
    setForm({ text:'', source:'', themes:[] });
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
        <div style={{marginTop:8}}>
          <div className="form-label" style={{marginBottom:5}}>Themes</div>
          <div className="theme-select-row">
            {THEMES.map(t => (
              <button key={t.id}
                className={`theme-chip ${form.themes.includes(t.id)?'selected':''}`}
                style={form.themes.includes(t.id)
                  ? {background:t.color, borderColor:t.color, color:'#000'}
                  : {borderColor:t.color+'66', color:t.color}}
                onClick={() => f('themes', toggleTheme(form.themes, t.id))}
              >{t.label}</button>
            ))}
          </div>
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
              {(e.themes||[]).length > 0 && (
                <div className="theme-pills">
                  {(e.themes||[]).map(id => { const t = THEMES.find(x=>x.id===id); return t ? (
                    <span key={id} className="theme-pill" style={{background:t.color+'22',color:t.color}}>{t.label}</span>
                  ) : null; })}
                </div>
              )}
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

// ─── Sessions View ────────────────────────────────────────────────────────────

const durToMins = (d, h, m) => (Number(d)||0)*1440 + (Number(h)||0)*60 + (Number(m)||0);

function SessionsView({ sessions, onAdd, onUpdate, onDelete, onAddTl }) {
  const blankForm = { project: PROJECTS[0], date: today(), durD: '', durH: '', durM: '', notes: '', addToTl: false };
  const [form, setForm] = useState(blankForm);
  const f = (k, v) => setForm(p => ({...p, [k]: v}));

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const ef = (k, v) => setEditForm(p => ({...p, [k]: v}));
  const [confirmDel, setConfirmDel] = useState(null);

  const startEdit = s => {
    const total = Number(s.durationMins) || 0;
    const d = Math.floor(total / 1440);
    const rem = total % 1440;
    const h = Math.floor(rem / 60);
    const m = rem % 60;
    setEditForm({ project: s.project, date: s.date, durD: d||'', durH: h||'', durM: m||'', notes: s.notes||'' });
    setEditId(s.id);
    setConfirmDel(null);
  };

  const saveEdit = id => {
    const mins = durToMins(editForm.durD, editForm.durH, editForm.durM);
    if (mins <= 0) return;
    onUpdate(id, { project: editForm.project, date: editForm.date, durationMins: mins, notes: editForm.notes });
    setEditId(null);
  };

  const submit = () => {
    const mins = durToMins(form.durD, form.durH, form.durM);
    if (mins <= 0) return;
    const entry = { project: form.project, date: form.date, durationMins: mins, notes: form.notes, id: uid(), createdAt: Date.now() };
    onAdd(entry);
    if (form.addToTl) {
      onAddTl({
        id: uid(), date: form.date, category: 'session',
        title: form.project,
        body: minsToHours(mins) + (form.notes ? ' — ' + form.notes : ''),
        themes: [], createdAt: Date.now(),
      });
    }
    setForm(blankForm);
  };

  const totalMins = sessions.reduce((s, x) => s + (Number(x.durationMins) || 0), 0);
  const minsFor = p => sessions.filter(s => s.project === p).reduce((s, x) => s + (Number(x.durationMins) || 0), 0);
  const sorted = [...sessions].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <div className="ses-overview">
        <div>
          <div className="section-eyebrow">Sessions</div>
          <span className="tl-count">{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} logged</span>
        </div>
        <div className="ses-grand-total">
          <div className="ses-grand-hrs">{minsToHours(totalMins)}</div>
          <div className="ses-grand-label">Total across all projects</div>
        </div>
      </div>

      <div className="ses-projects-grid">
        {PROJECTS.map(p => (
          <div className="ses-project-card" key={p}>
            <div className="ses-project-name">{p}</div>
            <div className="ses-project-hrs">{minsToHours(minsFor(p))}</div>
            <div className="ses-project-unit">logged</div>
          </div>
        ))}
      </div>

      <div className="ses-add-card">
        <div className="section-eyebrow" style={{marginBottom:12}}>Log a session</div>
        <div className="ses-form-grid">
          <div>
            <div className="form-label">Project</div>
            <select className="form-select" value={form.project} onChange={e => f('project', e.target.value)}>
              {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <div className="form-label">Date</div>
            <input className="form-input" type="date" value={form.date} onChange={e => f('date', e.target.value)} />
          </div>
        </div>
        <div className="ses-dur-row">
          <div>
            <div className="form-label">Days</div>
            <input className="form-input" type="number" min="0" placeholder="0" value={form.durD} onChange={e => f('durD', e.target.value)} />
          </div>
          <div>
            <div className="form-label">Hours</div>
            <input className="form-input" type="number" min="0" max="23" placeholder="0" value={form.durH} onChange={e => f('durH', e.target.value)} />
          </div>
          <div>
            <div className="form-label">Minutes</div>
            <input className="form-input" type="number" min="0" max="59" placeholder="0" value={form.durM} onChange={e => f('durM', e.target.value)} />
          </div>
        </div>
        <div className="ses-form-footer">
          <div className="ses-form-notes">
            <input className="form-input" placeholder="Notes (optional)" value={form.notes} onChange={e => f('notes', e.target.value)} style={{flex:1}} />
          </div>
          <label className="ses-toggle">
            <input type="checkbox" checked={form.addToTl} onChange={e => f('addToTl', e.target.checked)} />
            Add to Timeline
          </label>
          <button className="btn btn-primary" onClick={submit}>Log →</button>
        </div>
      </div>

      <hr className="divider" />
      <div className="section-eyebrow">{sorted.length > 0 ? 'All sessions — newest first' : 'No sessions logged yet'}</div>

      {sorted.length > 0 && (
        <div className="ses-list">
          {sorted.map(s => editId === s.id ? (
            <div className="ses-item ses-item-editing" key={s.id}>
              <div className="ses-edit-row">
                <div>
                  <div className="form-label">Project</div>
                  <select className="form-select" value={editForm.project} onChange={e => ef('project', e.target.value)}>
                    {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <div className="form-label">Date</div>
                  <input className="form-input" type="date" value={editForm.date} onChange={e => ef('date', e.target.value)} />
                </div>
              </div>
              <div className="ses-dur-row">
                <div>
                  <div className="form-label">Days</div>
                  <input className="form-input" type="number" min="0" placeholder="0" value={editForm.durD} onChange={e => ef('durD', e.target.value)} />
                </div>
                <div>
                  <div className="form-label">Hours</div>
                  <input className="form-input" type="number" min="0" max="23" placeholder="0" value={editForm.durH} onChange={e => ef('durH', e.target.value)} />
                </div>
                <div>
                  <div className="form-label">Minutes</div>
                  <input className="form-input" type="number" min="0" max="59" placeholder="0" value={editForm.durM} onChange={e => ef('durM', e.target.value)} />
                </div>
              </div>
              <input className="form-input" placeholder="Notes (optional)" value={editForm.notes} onChange={e => ef('notes', e.target.value)} style={{marginBottom:10}} />
              <div className="ses-edit-footer">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={() => saveEdit(s.id)}>Save</button>
              </div>
            </div>
          ) : (
            <div className="ses-item" key={s.id}>
              <span className="ses-item-project">{s.project}</span>
              <span className="ses-item-date">{fmtDate(s.date)}</span>
              <span className="ses-item-dur">{minsToHours(s.durationMins)}</span>
              <span className="ses-item-notes">{s.notes || '—'}</span>
              <div className="ses-item-actions">
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startEdit(s)} title="Edit">✎</button>
                {confirmDel === s.id ? (
                  <>
                    <button className="btn btn-ghost btn-sm" style={{color:'#E86161',fontSize:11}} onClick={() => { onDelete(s.id); setConfirmDel(null); }}>Confirm?</button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setConfirmDel(null)}>✕</button>
                  </>
                ) : (
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setConfirmDel(s.id)} title="Delete">🗑</button>
                )}
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
  const [sessions, setSessions] = useState([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [presenting, setPresenting] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [showPfPanel, setShowPfPanel] = useState(false);
  const [pfCats, setPfCats] = useState(() => Object.keys(CATS));
  const [pfThemes, setPfThemes] = useState(() => THEMES.map(t => t.id));
  const [pfSignalOnly, setPfSignalOnly] = useState(false);

  useEffect(() => {
    async function boot() {
      try {
        await initLookups();
        const [tlData, capData, sesData] = await Promise.all([
          loadTimeline(),
          loadCaptures(),
          loadSessions(),
        ]);
        setTl(tlData);
        setCap(capData);
        setSessions(sesData);
      } catch (err) {
        console.error('[Chronicle] Supabase load failed:', err);
        setLoadError(err.message ?? 'Failed to connect to database.');
      } finally {
        setReady(true);
      }
    }
    boot();
  }, []);

  const addTl = useCallback(async entry => {
    try {
      const saved = await addTimelineEntry(entry);
      setTl(p => [...p, saved]);
    } catch (err) { console.error('[Chronicle] addTl failed:', err); }
  }, []);

  const updateTl = useCallback(async (id, fields) => {
    try {
      await updateTimelineEntry(id, fields);
      setTl(p => p.map(e => e.id === id ? { ...e, ...fields } : e));
    } catch (err) { console.error('[Chronicle] updateTl failed:', err); }
  }, []);

  const delTl = useCallback(async id => {
    try {
      await softDeleteCard(id);
      setTl(p => p.filter(e => e.id !== id));
    } catch (err) { console.error('[Chronicle] delTl failed:', err); }
  }, []);

  const addCap = useCallback(async entry => {
    try {
      const saved = await addCapture(entry);
      setCap(p => [saved, ...p]);
    } catch (err) { console.error('[Chronicle] addCap failed:', err); }
  }, []);

  const delCap = useCallback(async id => {
    try {
      await softDeleteCard(id);
      setCap(p => p.filter(e => e.id !== id));
    } catch (err) { console.error('[Chronicle] delCap failed:', err); }
  }, []);

  const addSes = useCallback(async entry => {
    try {
      const saved = await addSession(entry);
      setSessions(p => [...p, saved]);
    } catch (err) { console.error('[Chronicle] addSes failed:', err); }
  }, []);

  const delSes = useCallback(async id => {
    try {
      await softDeleteSession(id);
      setSessions(p => p.filter(s => s.id !== id));
    } catch (err) { console.error('[Chronicle] delSes failed:', err); }
  }, []);

  const updateSes = useCallback(async (id, fields) => {
    try {
      await updateSession(id, fields);
      setSessions(p => p.map(s => s.id === id ? { ...s, ...fields } : s));
    } catch (err) { console.error('[Chronicle] updateSes failed:', err); }
  }, []);

  const promote = useCallback(async (cap) => {
    const entry = {
      title:    cap.text.length > 80 ? cap.text.slice(0, 78) + '…' : cap.text,
      body:     cap.source ? `${cap.text}\n\n— ${cap.source}` : cap.text,
      date:     today(),
      category: 'learning',
      themes:   cap.themes ?? [],
      benefit:  '',
    };
    try {
      const [saved] = await Promise.all([
        addTimelineEntry(entry),
        softDeleteCard(cap.id),
      ]);
      setTl(p => [...p, saved]);
      setCap(p => p.filter(e => e.id !== cap.id));
      setTab('timeline');
    } catch (err) { console.error('[Chronicle] promote failed:', err); }
  }, []);

  const sorted = [...tl]
    .filter(e => filterCat === 'all' || e.category === filterCat)
    .sort((a,b) => new Date(a.date) - new Date(b.date));

  const allSorted = [...tl].sort((a,b) => new Date(a.date) - new Date(b.date));
  const presentFiltered = allSorted.filter(e => {
    if (!pfCats.includes(e.category)) return false;
    if (pfSignalOnly && !(e.themes||[]).includes('signal')) return false;
    const et = e.themes || [];
    if (pfThemes.length < THEMES.length && et.length > 0 && !et.some(t => pfThemes.includes(t))) return false;
    return true;
  });

  const togglePfCat = k => setPfCats(p => p.includes(k) ? p.filter(x=>x!==k) : [...p, k]);
  const togglePfTheme = id => setPfThemes(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);

  if (!ready) return <div style={{background:'#ffffff',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af',fontFamily:'monospace',fontSize:13}}>connecting…</div>;
  if (loadError) return <div style={{background:'#ffffff',height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,color:'#E86161',fontFamily:'monospace',fontSize:13}}><div style={{fontSize:22}}>⚠</div><div>Database connection failed</div><div style={{color:'#9ca3af',fontSize:11}}>{loadError}</div></div>;

  return (
    <>
      <style>{CSS}</style>
      {presenting && presentFiltered.length > 0 && (
        <PresentMode entries={presentFiltered} startIndex={0} onClose={() => setPresenting(false)} />
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
              <div className="pf-anchor">
                <button
                  className={`btn btn-filter btn-sm ${showPfPanel?'on':''}`}
                  onClick={() => setShowPfPanel(s => !s)}
                >⊞ Filter</button>
                <button className="btn btn-present" onClick={() => { setShowPfPanel(false); setPresenting(true); }}>▶ Present</button>
                {showPfPanel && (
                  <div className="pf-panel">
                    <div className="pf-section">
                      <div className="pf-section-label">Categories</div>
                      <div className="pf-chips">
                        {Object.entries(CATS).map(([k,v]) => (
                          <button key={k} className={`pf-chip ${pfCats.includes(k)?'on':''}`}
                            style={pfCats.includes(k)?{borderColor:v.color,color:v.color}:{}}
                            onClick={() => togglePfCat(k)}
                          >{v.glyph} {v.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="pf-section">
                      <div className="pf-section-label">Themes</div>
                      <div className="pf-chips">
                        {THEMES.map(t => (
                          <button key={t.id} className={`pf-chip ${pfThemes.includes(t.id)?'on':''}`}
                            style={pfThemes.includes(t.id)?{borderColor:t.color,color:t.color}:{}}
                            onClick={() => togglePfTheme(t.id)}
                          >{t.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="pf-section" style={{marginBottom:0}}>
                      <div className="pf-chips">
                        <button className={`pf-chip ${pfSignalOnly?'on':''}`}
                          style={pfSignalOnly?{borderColor:'var(--accent)',color:'var(--accent)'}:{}}
                          onClick={() => setPfSignalOnly(s => !s)}
                        >⚡ Signal entries only</button>
                      </div>
                    </div>
                    <div className="pf-footer">
                      <span className="pf-count">{presentFiltered.length} of {tl.length} entries selected</span>
                      <button
                        className="btn btn-present btn-sm"
                        disabled={presentFiltered.length === 0}
                        onClick={() => { setShowPfPanel(false); setPresenting(true); }}
                      >▶ Present selected ({presentFiltered.length})</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="tabs">
              <button className={`tab ${tab==='timeline'?'on':''}`} onClick={() => setTab('timeline')}>Timeline</button>
              <button className={`tab ${tab==='sessions'?'on':''}`} onClick={() => setTab('sessions')}>Sessions</button>
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
              onUpdate={updateTl}
              onDelete={delTl}
            />
          ) : tab === 'sessions' ? (
            <SessionsView
              sessions={sessions}
              onAdd={addSes}
              onUpdate={updateSes}
              onDelete={delSes}
              onAddTl={addTl}
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
