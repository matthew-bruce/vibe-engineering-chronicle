# Chronicle — TODO & Backlog

> Items marked `[DEMO]` are high priority for the next stakeholder presentation.
> Items marked `[ARCH]` require architectural decisions before building.
> Items marked `[AI]` require Claude API integration.

---

## In Progress / Next Session

- [ ] **Impact and Audience fields** — add to card add/edit form in UI. Fields exist in DB, not yet surfaced in the interface. Impact 1–5 selector, Audience dropdown (Beginner / Practitioner / Leadership / Universal)
- [ ] **Simplify Capture tab** — remove two-tier system, everything is just a Card added via a fast-entry form. No "promote" mechanic needed
- [ ] **Benefit field styling** — current red styling reads as an error. Restyle to amber/positive treatment
- [ ] **Session "Add to Timeline" toggle** — optionally surfaces a session as a Card on the Timeline

---

## Short Term (Next 1-2 Sessions)

- [ ] **Benefits table** `[ARCH]` — replace the simple card_benefit text field with a proper Benefits data model. Benefits are first-class records linked to cards many-to-many. A benefit has a type (from a lookup), a statement, and optional evidence URL. Benefit types cover: cost avoidance, cost reduction, time saved, cycle time reduced, manual process automated, capability unlocked, team empowered, decision quality improved, technical debt reduced, vendor lock-in reduced, knowledge retained, developer experience improved, governance improved, transparency increased, and more. Cards can have zero or many benefits. Benefits can be evidenced by multiple cards.
- [ ] **Enrichment Engine** `[AI]` `[ARCH]` — auto-enrichment on card INSERT via Supabase Database Webhook + Edge Function. Every card triggers enrichment the moment it lands in the DB — no manual step. Edge Function calls Claude API and writes back: card_impact (1-5), card_relevance (current/evergreen/review), card_ai_themes, card_ai_audience, card_ai_summary. All stored with a _source field (ai/human) so the UI shows "AI suggested" in amber. A separate scheduled Edge Function runs monthly and re-evaluates relevance on cards older than 90 days — flagging dated insights automatically. Human only intervenes to mark cards as "evergreen" (timeless principles that never decay) or to correct AI suggestions. Essentially zero manual enrichment effort.
- [ ] **Capture API endpoint** — a POST endpoint on the Vercel app that accepts structured JSON and writes a card directly to Supabase. Enables capture from Claude conversations, scripts, or any external source without using the web form.
- [ ] **User Guide accessible from the app** — Help / About modal linking to USER_GUIDE.md, styled to match the app
- [ ] **Search** — full text search across card title and body
- [ ] **Filter persistence** — remember last active filters between sessions
- [ ] **Total hours stat** — surface overall total hours prominently on Sessions tab as a hero number

---

## Medium Term

- [ ] **Business case generator** `[AI]` — filter by Economics + Evidence themes, select relevant benefits, and generate a structured business case document. Claude API writes the narrative from the cards and benefit statements. Export as PDF or shareable link.
- [ ] **PIR / project close-out evidence** `[AI]` — at project close, Chronicle sweeps all linked cards and benefits and generates a Post-Implementation Review document evidencing what was set out to achieve vs what was delivered. Metrics prompted where data gaps exist.
- [ ] **OKR and goal tracking** — link cards and benefits to organisational targets, personal goals, or OKRs. Chronicle surfaces progress toward each target as evidence accumulates.
- [ ] **Benefit detection sweep** `[AI]` — periodic Claude API sweep across all cards that identifies benefit patterns automatically and proposes new benefit records. Builds the business case without manual curation.
- [ ] **Teams / Slack integration** — /chronicle command creates a card from a Teams or Slack message. Requires Capture API endpoint first. Teams demo is a priority for internal showcase.
- [ ] **Claude conversation hook** — structured JSON payload generated at end of Claude chat sessions, sent to the Capture API endpoint. Removes web form friction entirely.
- [ ] **Browser bookmarklet** — one click on any webpage sends URL, title, and selected text to Chronicle as a capture card.
- [ ] **Email to Chronicle** — forward any email or article to a Chronicle inbox. Supabase Edge Function parses and creates a draft card.
- [ ] **App #5 — Vibe Engineering Projects Dashboard** — standalone visual command centre. Per project: status, hours, live URL, SaaS replaced, cost avoided. Aggregate stats and Signal feed from Chronicle.
- [ ] **Present Mode — Signal shortcut** — one-click filter to Signal theme only for instant leadership deck
- [ ] **Present Mode — narrative mode** — spoken intro per card, only visible in Present mode
- [ ] **Present Mode — shareable link** — read-only link to current filtered presentation
- [ ] **Card relationships** — link related cards (e.g. an Idea that became a Thing I Built)
- [ ] **Themes management** — add custom themes from within the app

---

## Longer Term / Ideas

- [ ] **TypeScript migration** — migrate with Opus model, use Supabase CLI to auto-generate DB types. After component structure is fully stable.
- [ ] **Shared design system** — unify Chronicle, Dispatch, Platform Org, Platform Roadmap under one shared component library. Consistent Royal Mail branding across all apps.
- [ ] **Multi-user / team Chronicle** — shared Chronicle with individual attribution per Card
- [ ] **Weekly digest** `[AI]` — auto-generated summary of Cards added in the last 7 days
- [ ] **Mobile-optimised Capture** — stripped-back mobile view for quick Card capture on the go
- [ ] **Copilot integration** — explore card creation from GitHub Copilot interactions in VS Code

---

## Design & UX Debt

- [ ] Royal Mail design system applied consistently throughout
- [ ] Present mode — swipe gesture support for mobile
- [ ] Empty states — improve illustrations and copy throughout
- [ ] Accessibility audit — keyboard navigation, screen reader support, colour contrast
- [ ] Dark mode toggle — respect system preference or user choice

---

## Completed

- [x] Supabase backend — localStorage replaced with Supabase DB
- [x] Card editing and soft delete — inline edit and delete with confirmation on all cards
- [x] Sessions tracker — time logged per project, edit and delete controls
- [x] Component split — monolith split into Timeline, Sessions, Capture, PresentMode, CardForm, App
- [x] Unit tests — 47 passing across db.js and CardForm
- [x] Projects showcase tab — tile grid with detail panel, problem, evolution, key features, stats
- [x] Present mode with category and theme filters
- [x] Six categories including Ideas
- [x] Seven themes including Signal and Unlock
- [x] Benefit field on cards
- [x] Schema: cards, categories, themes, projects, sessions, attachments, card_categories, card_themes, project_themes

---

*Last updated: 25 March 2026*

---

## Enrichment Engine — Detail

Three enrichment modes, all using Supabase Edge Functions + Claude API:

- [ ] **Mode 1 — Real-time on INSERT** `[AI]` — Supabase Database Webhook fires on every card INSERT. Edge Function calls Claude API immediately. Card arrives in UI already enriched with impact, relevance, themes, audience, and summary. Zero manual effort.

- [ ] **Mode 2 — On-demand sweep** `[AI]` — "Re-enrich all cards" button in the UI. Re-evaluates every card against current context. Useful before presentations or after major industry shifts. Shows a diff of what changed.

- [ ] **Mode 3 — Periodic scheduled sweep** `[AI]` — Supabase scheduled Edge Function, configurable weekly or monthly. Re-evaluates all cards for relevance drift in both directions — decay AND increase. Cards that were ahead of their time may become more relevant as the industry catches up. Each update includes a note explaining what changed and why — transparency builds trust in the automation.

- [ ] **Relevance schema fields** — add card_impact, card_impact_source, card_relevance, card_relevance_source, card_ai_summary, card_ai_themes, card_ai_audience, card_enriched_at to cards table. _source fields distinguish AI-assigned from human-confirmed values.

- [ ] **Evergreen flag** — human-only override. Cards marked evergreen are never re-evaluated by any sweep. Timeless principles, not time-sensitive observations.

- [ ] **Enrichment audit log** — store a record of every enrichment event per card: mode (insert/demand/scheduled), timestamp, what changed, and why. Surfaces in the card detail view as a history timeline.
