# Chronicle — Claude Code Instructions

> Read this before touching any code.

---

## What This App Is

Chronicle is a personal Vibe Engineering journey tracker. It captures moments, insights, key learnings, wow moments, ideas, and tooling decisions — and presents them as a filterable, themeable knowledge repository with a full-screen presentation mode.

It is built by someone living the vibe engineering journey, for that purpose. Every decision should reflect that it is a personal, opinionated tool — not a generic project management app.

**Live URL:** https://vibe-engineering-chronicle.vercel.app \
**Stack:** React (Vite), Supabase (Postgres + Storage), Vercel

---

## Golden Rules — Read Before Every Session

### 1. Always write unit tests
Every new component, hook, utility function, or data access function must have a corresponding unit test. Use Vitest. Tests live in `__tests__/` adjacent to the file they test. Do not ship untested code.

### 2. CRUD is always a requirement
If a user can **create** something, they can also **edit** and **delete** it. No exceptions. If you are building a form to add a Card, you are also building the edit form and the delete confirmation. Treat this as a default assumption on every feature, not an afterthought.

### 3. Soft deletes only
Never hard delete records from the database. Set `deleted_at` timestamp instead. The UI filters these out. This applies to cards, sessions, projects — everything.

### 4. Confirm before destructive actions
Any delete action must show a confirmation prompt before executing. No silent deletes.

### 5. Duration is always displayed as days/hours/minutes
Session durations are stored as integer minutes in the DB. Display them as human-readable strings throughout — e.g. `2h 30m`, `1d 4h`, `45m`. Never display raw minutes to the user.

### 6. Dates in UK format
All dates displayed to the user should be in UK format: `24 Mar 2026`. Use `en-GB` locale throughout.

### 7. Component structure
This app started as a single `vibe-journey.jsx` monolith. As features are added, split into proper components. Each tab (Timeline, Sessions, Present) should be its own component. Forms should be their own components. Keep files under 300 lines where possible.

### 8. Supabase is the source of truth
Do not fall back to localStorage for new features. All data goes through Supabase. The localStorage migration is complete once the Supabase backend is wired up — after that, localStorage is dead.

### 9. Environment variables
Supabase credentials go in `.env.local` — never hardcoded. The variables are:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Data Model Summary

| Table | Purpose |
|---|---|
| `cards` | Every timeline moment, insight, and capture — all just cards |
| `categories` | User-manageable card categories (Wow Moment, Key Learning etc.) |
| `themes` | Tags applied to cards and projects (Signal, Unlock, Industry etc.) |
| `card_categories` | Many-to-many: cards ↔ categories |
| `card_themes` | Many-to-many: cards ↔ themes |
| `projects` | Vibe engineering projects being tracked |
| `project_themes` | Many-to-many: projects ↔ themes |
| `sessions` | Time logged against a project, optionally surfaced as a card |
| `attachments` | Images/files attached to cards or projects, stored in Supabase Storage |

**Key field notes:**
- `card_impact` — integer 1–5, CHECK constraint enforced at DB level
- `card_audience` — enum: `beginner`, `practitioner`, `leadership`, `universal`
- `project_status` — enum: `poc`, `in_progress`, `live`, `archived`
- `card_event_date` — when the moment happened (not when it was added to Chronicle)
- All FKs that reference soft-deleted records should be nullable

---

## Categories (seed data — user can add more)

| Name | Colour | Glyph |
|---|---|---|
| Wow Moment | #B07FE8 | ✦ |
| Key Learning | #F5A623 | ◉ |
| Tooling Decision | #4A9EDB | ⚙ |
| Thing I Built | #52C788 | ◈ |
| Aspiration / Goal | #E86161 | ◎ |
| Idea / Wishlist | #A78BFA | ◐ |

## Themes (seed data — user can add more)

| Name | Description |
|---|---|
| Industry | Market shifts, sector trends, what's coming |
| Economics | Cost, value, build vs buy arguments |
| Org Design | Structure, governance, empowering teams |
| Evidence | Proof points, demos, real stories |
| Leadership | Things to put directly to management |
| Signal | Executive-ready insights — inspiring, provocative, or both |
| Unlock | Moments where something previously impossible became possible |

---

## Projects (seed data)

- Dispatch (PI Planning Tool) — status: live
- Platform Org Structure — status: in_progress
- Platform Roadmapping Tool — status: poc
- Vibe Engineering Chronicle — status: live
- Vibe Engineering Strategy — status: in_progress

---

## What Not to Do

- Do not use `any` TypeScript types if TypeScript is introduced
- Do not store computed values in the DB (e.g. total session hours — calculate from session_duration_minutes)
- Do not show raw minutes to users
- Do not hardcode Supabase credentials
- Do not hard delete records
- Do not build a create form without also building edit and delete
- Do not skip tests

---

*Last updated: 25 March 2026*
