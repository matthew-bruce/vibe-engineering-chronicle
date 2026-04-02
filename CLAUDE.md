# Chronicle — Claude Code Instructions

> Read this before touching any code.

---

## What This App Is

Chronicle is a personal Vibe Engineering knowledge OS. It captures cards (insights, learnings, wow moments, ideas, principles, tooling decisions) with categories, themes, impact scores, audience tags, named callout sections, and benefit links — and presents them as a filterable, themeable repository with a full-screen presentation mode and a Projects showcase.

It is built by someone living the vibe engineering journey, for that purpose. Every decision should reflect that it is a personal, opinionated tool — not a generic project management app.

**Live URL:** https://vibe-engineering-chronicle.vercel.app
**Stack:** React 18 (Vite), Supabase (Postgres + Storage + Edge Functions), Vercel
**Tests:** 124 passing (Vitest)

---

## Current State

**Last session:** 27 March 2026

**Component structure:**
- `src/App.jsx` — root, Supabase boot, state, tab navigation, Standard/Detailed toggle
- `src/components/Timeline.jsx` — timeline with search, inline quick-capture bar, edit/delete, standard/detailed view
- `src/components/Sessions.jsx` — sessions tab with hero stat
- `src/components/PresentMode.jsx` — full-screen presentation, complete rebuild with template registry
- `src/components/CardForm.jsx` — shared add/edit card form including sections CRUD
- `src/components/Projects.jsx` — projects showcase tab with milestones
- `src/components/ProjectMilestones.jsx` — vertical timeline CRUD for milestones
- `src/lib/supabase.js` — Supabase client initialisation
- `src/lib/db.js` — ALL data access functions (never call Supabase from components)
- `src/lib/cats.js` — dynamic categories fetched from DB at runtime (mutable, fallback pre-seeded)
- `src/lib/slideTemplates.jsx` — template registry + scoreCard() function
- `src/constants.js` — THEMES, PROJECTS, utilities
- `src/styles.js` — CSS template literal

**Capture tab:** Removed. Replaced with inline quick-capture bar at top of Timeline.

**Routing:** React Router in place. /timeline (default), /projects, /sessions. URL params: /timeline?category=X, /timeline?theme=X for filtered views.

**Next priorities:**
1. Enrichment Engine — Supabase Database Webhook + Edge Function + Claude API
2. Benefits UI — add/edit/delete benefits against cards, link cards to benefits
3. Capture API endpoint — POST endpoint for external card creation (stops conversation leakage)

---

## Golden Rules — Non-Negotiable

### 1. Always write unit tests
Every new component, hook, utility function, or data access function must have a unit test. Use Vitest. Tests live in `__tests__/` adjacent to the file they test. Do not ship untested code. Current count: 124 passing.

### 2. CRUD is always a requirement
If a user can create something, they can also edit and delete it. No exceptions. If you build an add form, you build the edit form and the delete confirmation. This is a default assumption, not an afterthought.

### 3. Soft deletes only
Never hard delete records. Set `deleted_at` timestamp instead. The UI filters these out. Applies to cards, sessions, projects, benefits, milestones, sections — everything.

### 4. Confirm before destructive actions
Every delete must show a confirmation prompt before executing. No silent deletes.

### 5. Duration as days/hours/minutes
Session durations are stored as integer minutes in the DB. Always display as human-readable strings — `2h 30m`, `1d 4h`, `45m`. Never show raw minutes to the user.

### 6. UK date format
All user-facing dates in `en-GB` format: `24 Mar 2026`. Never ISO strings in the UI.

### 7. Supabase is the source of truth
No localStorage for new features. All data through Supabase. `db.js` is the only place database calls are made — never call Supabase directly from components.

### 8. Environment variables only
Supabase credentials in `.env.local` — never hardcoded:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY` (for Edge Functions)

### 9. Files under 300 lines
If a file is growing beyond 300 lines, split it. Components should do one thing.

### 10. Categories are dynamic
Never hardcode category UUIDs or slugs. Categories are fetched at runtime via `initLookups()` in `db.js` and stored in `src/lib/cats.js`. New categories added to the DB appear automatically in the UI.

### 11. Thing I Built cards are for NEW standalone apps only
Never create a "Thing I Built" card for a feature, update, bug fix, or improvement to an existing app. Project evolution belongs in `project_milestones`. A milestone is appropriate for a major new capability.

---

## Data Model (Schema v1.4 — 15 tables)

| Table | Purpose |
|---|---|
| `cards` | Every card — timeline moments, captures, principles, all just cards |
| `categories` | User-manageable categories — fetched dynamically at runtime |
| `themes` | 7 tags applied to cards and projects |
| `card_categories` | Many-to-many: cards ↔ categories |
| `card_themes` | Many-to-many: cards ↔ themes |
| `card_sections` | Named callout blocks per card (Key insight, For your team, etc.) |
| `projects` | Vibe engineering projects with showcase fields |
| `project_themes` | Many-to-many: projects ↔ themes |
| `project_milestones` | Retrospective milestone timeline per project |
| `sessions` | Time logged against a project |
| `attachments` | Images/files — Supabase Storage |
| `benefits` | Evidenced outcomes linked to cards |
| `benefit_types` | Lookup: 26 types across cost/time/quality/capability/cultural |
| `card_benefits` | Many-to-many: cards ↔ benefits |
| `slide_templates` | Template registry for Present mode — data-driven layout selection |

**Key fields on cards:**
- `card_impact` — int 1–5, CHECK constraint at DB level
- `card_impact_source` — enum: `ai`, `human`
- `card_audience` — enum: `beginner`, `practitioner`, `leadership`, `universal`
- `card_relevance` — enum: `current`, `review`, `dated`, `evergreen`
- `card_relevance_source` — enum: `ai`, `human`
- `card_template_preference` — text FK to `slide_templates.template_slug` (AI or human override)
- `card_ai_summary`, `card_ai_themes`, `card_enriched_at` — enrichment fields
- `card_event_date` — nullable (null = capture card)
- `card_source` — attribution/URL for the insight

**Categories (dynamic, 8 in DB):**
- Wow Moment #B07FE8 ✦
- Key Learning #F5A623 ◉
- Tooling Decision #4A9EDB ⚙
- Thing I Built #52C788 ◈
- Aspiration / Goal #E86161 ◎
- Idea / Wishlist #A78BFA ◐
- Capture #9ca3af ◌ (virtual, no DB row — quick capture cards)
- Principle #0F6E56 ◆

---

## Present Mode — Template Registry

`src/lib/slideTemplates.jsx` contains:

**TEMPLATE_REGISTRY** — maps slugs to renderer functions:
- `standard` — meta, title, body, source button
- `detailed-single` — meta, title, body, stacked sections, benefit callout
- `detailed-two-col` — meta, title, body, 2 sections side-by-side, benefit
- `detailed-three-col` — meta, title, body, 3 sections grid, benefit
- `detailed-overflow` — meta, title, body, 4+ sections stacked, benefit

**scoreCard(card, detailMode)** — precedence:
1. If not detailMode → always `standard`
2. If `card.card_template_preference` is set → use that value
3. Otherwise score by section count: 0–1→single, 2→two-col, 3→three-col, 4+→overflow

**Adding a new template:** Add a renderer to TEMPLATE_REGISTRY + a row to `slide_templates` table. No other changes needed.

---

## Enrichment Engine (planned — next major session)

Three modes, all using Supabase Edge Functions + Claude API (claude-sonnet-4-6):

1. **Real-time on INSERT** — Database Webhook fires on card INSERT → Edge Function → Claude API → writes back impact, relevance, ai_themes, ai_audience, ai_summary with `_source = 'ai'` — UI shows in amber
2. **On-demand sweep** — button in UI re-enriches all cards
3. **Monthly scheduled sweep** — relevance drift in both directions, with audit note on what changed

Evergreen cards (human-flagged) are never re-evaluated by any sweep.

---

## What Not to Do

- Do not call Supabase directly from components — use `db.js` only
- Do not store computed values in the DB — calculate from raw data
- Do not show raw minutes to users
- Do not hardcode credentials or category UUIDs
- Do not hard delete records
- Do not build create without edit and delete
- Do not skip tests
- Do not use localStorage for new features
- Do not create "Thing I Built" cards for feature updates — use project milestones
- Do not hardcode template logic outside `slideTemplates.jsx`

---

*Last updated: 27 March 2026*
