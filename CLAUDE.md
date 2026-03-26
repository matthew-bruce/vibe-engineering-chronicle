# Chronicle — Claude Code Instructions

> Read this before touching any code.

---

## What This App Is

Chronicle is a personal Vibe Engineering knowledge OS. It captures cards (insights, learnings, wow moments, ideas, tooling decisions) with categories, themes, impact scores, audience tags, and benefit links — and presents them as a filterable, themeable repository with a full-screen presentation mode and a Projects showcase.

It is built by someone living the vibe engineering journey, for that purpose. Every decision should reflect that it is a personal, opinionated tool — not a generic project management app.

**Live URL:** https://vibe-engineering-chronicle.vercel.app
**Stack:** React 18 (Vite), Supabase (Postgres + Storage + Edge Functions), Vercel
**Tests:** 62 passing (Vitest)

---

## Current State

**Component structure (split from monolith — March 2026):**
- `src/App.jsx` — root, Supabase boot, state, tab navigation
- `src/components/Timeline.jsx` — timeline tab with inline edit/delete
- `src/components/Sessions.jsx` — sessions tab with hero stat
- `src/components/Capture.jsx` — simplified fast-entry capture
- `src/components/PresentMode.jsx` — full-screen presentation overlay
- `src/components/CardForm.jsx` — shared add/edit card form
- `src/components/Projects.jsx` — projects showcase tab
- `src/lib/supabase.js` — Supabase client initialisation
- `src/lib/db.js` — all data access functions
- `src/constants.js` — CATS, THEMES, PROJECTS, utilities
- `src/styles.js` — CSS template literal

**Last session:** 25 March 2026 — Supabase migration, component split, 62 unit tests, Projects showcase tab, Benefits schema, UI improvements (Impact/Audience fields, Capture simplification, Sessions hero stat)

**Next priorities:**
- Enrichment Engine — Supabase Edge Function + Database Webhook + Claude API
- Benefits UI — add/edit/delete benefits against cards
- Capture API endpoint — POST endpoint for external card creation
- Impact/Relevance schema fields migration

---

## Golden Rules — Non-Negotiable

### 1. Always write unit tests
Every new component, hook, utility function, or data access function must have a unit test. Use Vitest. Tests live in `__tests__/` adjacent to the file they test. Do not ship untested code. Current count: 62 passing.

### 2. CRUD is always a requirement
If a user can create something, they can also edit and delete it. No exceptions. If you build an add form, you build the edit form and the delete confirmation. This is a default assumption, not an afterthought.

### 3. Soft deletes only
Never hard delete records. Set `deleted_at` timestamp instead. The UI filters these out. Applies to cards, sessions, projects, benefits — everything.

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

---

## Data Model

| Table | Purpose |
|---|---|
| `cards` | Every card — timeline moments, captures, all just cards |
| `categories` | User-manageable categories (Wow Moment, Key Learning etc.) |
| `themes` | Tags applied to cards and projects |
| `card_categories` | Many-to-many: cards ↔ categories |
| `card_themes` | Many-to-many: cards ↔ themes |
| `projects` | Vibe engineering projects being tracked |
| `project_themes` | Many-to-many: projects ↔ themes |
| `sessions` | Time logged against a project |
| `attachments` | Images/files for cards or projects — Supabase Storage |
| `benefits` | Evidenced outcomes linked to cards |
| `benefit_types` | Lookup: 26 types across cost/time/quality/capability/cultural |
| `card_benefits` | Many-to-many: cards ↔ benefits |

**Key field constraints:**
- `card_impact` — int 1–5, CHECK constraint at DB level
- `card_audience` — enum: `beginner`, `practitioner`, `leadership`, `universal`
- `card_relevance` — enum: `current`, `review`, `dated`, `evergreen`
- `card_impact_source` / `card_relevance_source` — enum: `ai`, `human`
- `project_status` — enum: `poc`, `in_progress`, `live`, `archived`
- `card_event_date` — when the moment happened, nullable (null = capture card)
- Soft delete pattern: `*_deleted_at` nullable timestamp on every main table

---

## Enrichment Engine (planned — next session)

Cards are enriched automatically on INSERT via:
1. Supabase Database Webhook fires on every card INSERT
2. Calls Edge Function `enrich-card`
3. Edge Function calls Claude API (claude-sonnet-4-6)
4. Returns: impact, relevance, ai_themes, ai_audience, ai_summary
5. Writes back to card with `_source = 'ai'`
6. UI shows AI-suggested values in amber — confirm or dismiss

Separate scheduled Edge Function runs monthly for relevance drift in both directions.

---

## What Not to Do

- Do not call Supabase directly from components — use `db.js` functions only
- Do not store computed values in the DB — calculate from raw data
- Do not show raw minutes to users
- Do not hardcode credentials
- Do not hard delete records
- Do not build create without edit and delete
- Do not skip tests
- Do not use `any` if TypeScript is introduced
- Do not use localStorage for new features

---

*Last updated: 25 March 2026*
