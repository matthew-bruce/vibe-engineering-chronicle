# Chronicle — TODO & Backlog

> Items marked `[DEMO]` are high priority for the next stakeholder presentation.
> Items marked `[ARCH]` require architectural decisions before building.
> Items marked `[AI]` require Claude API integration.

---

## Immediate — Pending From Last Session

- [ ] **Fact or Fiction SQL** — query DB for exact titles of Rosie cancer vaccine card and DJI vacuum card, then add "For your team: Fact or Fiction?" sections to each
- [ ] **Log session** — Chronicle, 27 March 2026, ~4 hours. Log via Claude Code prompt or Sessions tab
- [ ] **Push docs to repo** — CLAUDE.md, TODO.md, HANDOVER.md

---

## Next Claude Code Session (Priority Order)

- [ ] **Enrichment Engine** `[AI]` `[ARCH]` `[DEMO]` — Supabase Database Webhook on card INSERT → Edge Function `enrich-card` → Claude API → writes back impact, relevance, ai_themes, ai_audience, ai_summary with `_source = 'ai'`. UI shows AI-suggested values in amber — confirm or dismiss with one click. Set `ANTHROPIC_API_KEY` in Supabase Edge Function secrets first.
- [ ] **Benefits UI** — add/edit/delete benefits against cards. Benefit type selector from `benefit_types` lookup (26 types). Many-to-many card linking. Full CRUD.
- [ ] **Capture API endpoint** — POST `/api/capture` on Vercel accepting structured JSON, writes card directly to Supabase. Stops conversation leakage. Enables capture from Teams, scripts, Claude chat sessions.
- [ ] **scoreCard() DB integration** — verify `scoreCard()` reads `template_min_sections` / `template_max_sections` from fetched `slide_templates` DB rows, not hardcoded thresholds. Refactor if hardcoded.
- [ ] **Clickable theme/category pills** — clicking a pill navigates to `/timeline?category=X` or `/timeline?theme=X`. Timeline reads URL params on load and pre-applies filter. Bookmarkable, shareable.
- [ ] **Source URL on Timeline cards** — `card_source` rendered as a clickable link/button on Timeline cards (already done in Present mode).

---

## Short Term (Next 1-2 Sessions)

- [ ] **Enrichment Engine — on-demand sweep** `[AI]` — "Re-enrich all cards" button. Re-evaluates every card against current context. Shows a diff of what changed.
- [ ] **Enrichment Engine — monthly scheduled sweep** `[AI]` — Supabase scheduled Edge Function. Relevance drift in both directions. Each update includes a note on what changed and why.
- [ ] **Enrichment audit log** — store every enrichment event per card (mode, timestamp, what changed, why). Surface in card detail view as a history timeline.
- [ ] **User Guide accessible from the app** — Help/About modal, styled to match app
- [ ] **Filter persistence** — remember last active filters between sessions
- [ ] **Card relationships** — link related cards (e.g. an Idea that became a Thing I Built)

---

## Medium Term

- [ ] **Business case generator** `[AI]` — filter by Economics + Evidence, select benefits, generate structured business case document. Claude API writes narrative from cards and benefit statements.
- [ ] **PIR / project close-out evidence** `[AI]` — at project close, sweep all linked cards and benefits, generate Post-Implementation Review. Metrics prompted where data gaps exist.
- [ ] **OKR and goal tracking** — link cards and benefits to organisational targets, personal goals, OKRs. Chronicle surfaces progress as evidence accumulates.
- [ ] **Benefit detection sweep** `[AI]` — periodic sweep identifies benefit patterns across cards and proposes new benefit records. Builds the business case automatically.
- [ ] **Teams / Slack integration** — `/chronicle` command creates a card from a Teams or Slack message. Requires Capture API endpoint first. `[DEMO]`
- [ ] **Claude conversation hook** — structured JSON payload generated at end of chat sessions, sent to Capture API. Removes web form friction entirely.
- [ ] **Browser bookmarklet** — one click sends URL, title, selected text to Chronicle as a capture card.
- [ ] **Email to Chronicle** — forward email to Chronicle inbox, Edge Function parses and creates a draft card.
- [ ] **App #5 — Vibe Engineering Projects Dashboard** — standalone visual command centre. Per project: status, hours, live URL, SaaS replaced, cost avoided. Aggregate stats and Signal feed.
- [ ] **Present Mode — Signal shortcut** — one-click filter to Signal theme for instant leadership deck
- [ ] **Present Mode — shareable link** — read-only link to current filtered presentation
- [ ] **Themes management** — add custom themes from within the app

---

## Longer Term / Ideas

- [ ] **TypeScript migration** — use Opus model, Supabase CLI auto-generates DB types. After component structure fully stable.
- [ ] **Shared design system** — Chronicle, Dispatch, Platform Org, Platform Roadmap under one component library. RMG brand system.
- [ ] **Multi-user / team Chronicle** — shared Chronicle with individual attribution per Card
- [ ] **Weekly digest** `[AI]` — auto-generated summary of Cards added in the last 7 days
- [ ] **Mobile-optimised Capture** — stripped-back mobile view for quick Card capture
- [ ] **Present Mode — icon library integration** — for richer template designs
- [ ] **Present Mode — image support** — template that features an attachment image prominently
- [ ] **Present Mode — RMG brand theme** — apply Royal Mail design system to slide templates

---

## Design & UX Debt

- [ ] Royal Mail design system applied consistently throughout
- [ ] Empty states — improve illustrations and copy
- [ ] Accessibility audit — keyboard navigation, screen reader support, colour contrast
- [ ] Dark mode toggle — respect system preference

---

## Completed ✓

- [x] Supabase backend — localStorage replaced
- [x] Card CRUD with soft deletes and confirmation
- [x] Sessions tracker with hero stat and edit/delete
- [x] Component split — Timeline, Sessions, PresentMode, CardForm, Projects, ProjectMilestones, App
- [x] 124 unit tests passing
- [x] Projects showcase — tile grid, detail panel, problem/evolution/features, milestones
- [x] Card sections — named callout blocks (Key insight, For your team, etc.)
- [x] Standard / Detailed view toggle in header
- [x] Present mode — complete rebuild with template registry, scoreCard(), thumbnail strip, fullscreen, sticky nav, responsive
- [x] Principles category (#0F6E56 ◆) with 5 seed Principle cards
- [x] Dynamic category fetching from Supabase
- [x] React Router — /timeline, /projects, /sessions
- [x] Inline quick-capture bar on Timeline (Capture tab removed)
- [x] Search on Timeline with yellow highlight of matching terms
- [x] Benefits schema — benefit_types (26 types), benefits, card_benefits tables
- [x] Enrichment schema fields — card_impact_source, card_relevance, card_relevance_source, card_ai_summary, card_ai_themes, card_enriched_at
- [x] slide_templates table + card_template_preference field
- [x] Impact dots removed from standard view
- [x] All Categories / All Themes bulk toggles in Present mode filter
- [x] Delete project (soft delete) and edit project status in Projects tab
- [x] Project milestones — vertical timeline CRUD
- [x] Newest-first sort using card_created_at as tiebreaker

---

## Enrichment Engine — Detail

Three enrichment modes, all using Supabase Edge Functions + Claude API:

- [ ] **Mode 1 — Real-time on INSERT** — Supabase Database Webhook fires on every card INSERT. Edge Function calls Claude API immediately. Card arrives in UI already enriched. Zero manual effort.
- [ ] **Mode 2 — On-demand sweep** — "Re-enrich all cards" button. Re-evaluates every card. Shows diff of what changed.
- [ ] **Mode 3 — Periodic scheduled sweep** — Supabase cron, configurable weekly or monthly. Relevance drift in both directions. Each update includes a note on what changed and why.
- [ ] **Evergreen flag** — human-only override. Cards marked evergreen never re-evaluated.
- [ ] **Enrichment audit log** — every enrichment event per card: mode, timestamp, what changed, why.

---

*Last updated: 27 March 2026*
