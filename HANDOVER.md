# Chronicle — Session Handover
*Written for a fresh Claude starting cold. Read this before anything else.*

---

## 1. What We're Building — The Full Vision

**Chronicle** is a personal Vibe Engineering knowledge OS, live at https://vibe-engineering-chronicle.vercel.app

The owner (Matt, senior tech leader at Royal Mail Group, London) is building a portfolio of internal vibe-engineered tools to replace SaaS dependencies and evidence a new Head/Director of Engineering Productivity role he is creating for himself. Chronicle is the tool that captures and presents that journey.

**The short version of what it does:**
Cards (called "nuggets" by Matt) are captured with categories, themes, named callout sections, impact scores, audience tags, and linked benefits. The Timeline presents them chronologically. Present Mode turns them into a presentation — replacing PowerPoint. The Projects tab showcases the tools built. Sessions tracks time invested.

**The longer vision:**
Chronicle is evolving toward an ambient intelligence platform — one that hooks into email, Teams, conversations, and daily workflows to capture evidence automatically, enrich it with AI, and assemble it on demand for appraisals, business cases, PIRs, and OKR tracking. Not a personal scratchpad. Something an organisation would pay for.

**The meta point:**
Chronicle was built using the exact tools and approach it describes. It proves the proposition by existing. When demoed to a director or CTO, the most powerful moment is answering "how long did this take?" — "One evening. With AI."

---

## 2. Decisions We've Locked In
*Don't re-litigate these unless Matt explicitly raises them.*

**Architecture**
- Supabase is the source of truth. No localStorage. `db.js` is the only place DB calls are made.
- Categories are fetched dynamically from Supabase at runtime via `initLookups()`. Never hardcoded.
- Present Mode uses a data-driven template registry (`slideTemplates.jsx`). New templates = new component + new DB row. Never hardcode layout logic.
- React Router is in place: `/timeline`, `/projects`, `/sessions`. URL params for filters: `/timeline?category=principle`.

**Cards and taxonomy**
- Everything is a Card. Categories distinguish type.
- Signal is a **theme** (checkbox), not a category. Do not create a Signal category.
- Capture cards have no category selector — they land as `capture` type, no themes required.
- **Thing I Built** cards are ONLY for genuinely new standalone apps. Never for features, updates, or improvements. Those belong in `project_milestones`.
- Project evolution (schema changes, new features, milestones) belongs in `project_milestones`, not on the Timeline.
- The Principles category (#0F6E56 ◆) is for tool-agnostic principles only. If a principle references a specific tool, it is a Convention not a Principle.

**Card sections**
- Cards have named callout sections stored in `card_sections` (Key insight, For your team, Use in a room, etc.)
- Standard view = title/body/themes/benefit only
- Detailed view = full card with sections rendered as callout blocks
- Toggle lives in the app header alongside the Present button

**Present mode**
- The goal is to never use PowerPoint again. Chronicle must be rich enough to present on demand.
- Thumbnail strip is collapsed by default, expandable via accordion in the bottom bar.
- Fullscreen uses the browser native Fullscreen API.
- Exit from Present mode shows a post-presentation filtered list view — not the full timeline.
- Template selection is automatic via `scoreCard()`. Human or AI can set `card_template_preference` to override.

**Benefits**
- Benefits are a first-class evidence layer, NOT card annotations.
- Many-to-many: one card can evidence multiple benefits, one benefit can be evidenced by multiple cards.
- 26 benefit types across 5 categories (cost, time, quality, capability, cultural) are seeded in `benefit_types`.
- The simple `card_benefit` text field remains as a "quick benefit note" — informal, not the real benefits mechanism.

**Enrichment**
- Impact and Relevance are AI-assigned by default, human-confirmable.
- `_source` fields (`card_impact_source`, `card_relevance_source`) distinguish AI vs human values — shown as amber "AI suggested" in UI.
- Relevance can increase as well as decrease. A card ahead of its time may become more relevant later.
- `evergreen` relevance = human-only override, never re-evaluated by any automated sweep.
- Three enrichment modes: real-time on INSERT, on-demand, monthly scheduled.

**Principles (the meta-principle)**
- Principles are tool-agnostic by definition.
- If something references a specific tool, it's a Convention not a Principle.
- The test: "Would this still be true if we switched every tool tomorrow?"

---

## 3. Critical Context a Fresh Claude Would Miss

**Matt's language**
- "Nugget" = a valuable insight worth saving as a card. When Matt says "that's a nugget" — capture it immediately, flag the type, format it with sections if it deserves them. Proactively call out nuggets Matt hasn't flagged.
- "Chronicle" not "Vibe Coded" — the app was renamed. Never refer to it as "Vibe Coded".
- "Vibe Engineering" not "vibe coding" when referring to Matt's internal approach at RMG.

**Always do at the start of every conversation**
Ask Matt whether this session should be logged against one of his active projects (Dispatch, Platform Org Structure, Platform Roadmapping Tool, Vibe Engineering Chronicle). At the end, remind him to log session duration in Chronicle's Sessions tab.

**Active projects (for session logging)**
- Dispatch (PI Planning Tool) — Live
- Platform Org Structure — In Progress
- Platform Roadmapping Tool — PoC
- Vibe Engineering Chronicle — Live
- (Vibe Engineering Strategy was soft-deleted — not an active project)

**Non-obvious technical constraints**
- Claude Code Web cannot edit `.env.local` directly — use Vercel environment variables instead
- Supabase RLS is enabled on all tables — every new table needs a policy
- `card_event_date` is nullable — NULL means it's a capture card (no specific date)
- Session duration is stored as integer minutes — always display as Xh Xm, never raw minutes
- `cats` object in `lib/cats.js` is mutable — non-session keys are cleared and repopulated from DB on each `initLookups()` call. The `session` slug is virtual and never overwritten.
- `scoreCard()` in `slideTemplates.jsx` — template selection is by section count unless `card_template_preference` is set. Verify this reads from DB rows not hardcoded thresholds.

**Things that have bitten us**
- Integer overflow on `attachment_sort_order` — never use `Date.now()` as a sort order, always use max+1
- PostgreSQL CTEs don't allow `values (cte.column)` — use `select` pattern instead
- Claude Code on web sometimes creates a feature branch instead of committing to main — check GitHub for open PRs after big sessions
- Hardcoded UUIDs in `db.js` were caught and replaced with runtime lookups — never let them creep back

**Card count and schema state**
- 32+ cards in Supabase (as of 27 March 2026)
- 86 card_sections rows
- 26 benefit types seeded
- 5 Principle cards with 2-3 sections each
- 5 projects (Vibe Engineering Strategy soft-deleted)
- 5 sessions, 44+ hours tracked
- Schema version 1.4, 15 tables

**Key signals and quotes Matt wants preserved**
- "SaaS is dead" / "The SaaSpocalypse" — intentionally provocative
- "The filtering isn't a feature — it's the product"
- "SuccessFactors being replaced by something built to evidence the case for replacing SuccessFactors"
- "The model you use today is the worst you will ever use for the rest of your life" — Kevin Weil
- "If the business can change its requirements faster than your tool can respond, your tool is permanently at risk. If your tool can be updated faster than the business can change its mind — you are always ahead."
- Jevons Paradox — AI exposes commodity work as worthless AND unlocks previously unviable niche problems. Both forces happen simultaneously.

---

## 4. What Comes Next

**Immediate — pending from last session**
- [ ] Run the Fact or Fiction SQL — add "For your team: Fact or Fiction?" sections to the Rosie the dog cancer vaccine card and the DJI vacuum hacker card. First query the DB to confirm the exact card titles before inserting sections.
- [ ] Log the Chronicle session (27 March 2026, ~4 hours) via Claude Code prompt or manually in the app
- [ ] Push updated CLAUDE.md, TODO.md, HANDOVER.md to the GitHub repo

**Next Claude Code session — in priority order**

1. **Enrichment Engine** — the demo showpiece. Build:
   - Supabase Database Webhook firing on card INSERT
   - Edge Function `enrich-card` calling Claude API (claude-sonnet-4-6)
   - Returns: card_impact (1-5), card_relevance, card_ai_themes, card_ai_audience, card_ai_summary
   - Writes back with `_source = 'ai'`
   - UI shows AI-suggested fields in amber with confirm/dismiss
   - Set `ANTHROPIC_API_KEY` in Supabase Edge Function secrets first

2. **Benefits UI** — add/edit/delete benefits against cards, benefit type selector from `benefit_types` lookup, many-to-many card linking

3. **Capture API endpoint** — POST `/api/capture` on Vercel accepting structured JSON, writes directly to Supabase. This stops conversation leakage — nuggets from chat sessions can be sent directly without a web form.

4. **Clickable theme/category pills** — navigate to `/timeline?category=X` or `/timeline?theme=X`. Already designed, not yet built.

5. **Source URL rendering** — `card_source` shown as a clickable link/button on cards (already done in Present mode, needs doing on Timeline cards too)

**Upcoming SQL to run**
- Fact or Fiction sections (query card titles first, then insert)
- Nothing else pending — schema is complete for current features

---

## 5. Open Questions

**Unresolved — pick these up in the new chat:**

1. **Fact or Fiction card titles** — what are the exact titles of the Rosie cancer vaccine card and the DJI vacuum card in the DB? Need to query before writing the SQL to add "For your team: Fact or Fiction?" sections.

2. **scoreCard() DB integration** — verify that `scoreCard()` in `slideTemplates.jsx` reads `template_min_sections` and `template_max_sections` from the fetched `slide_templates` DB rows, not from hardcoded if/else thresholds. If hardcoded, refactor to fetch templates from Supabase on PresentMode mount.

3. **Jevons Paradox card** — needs to be added to Chronicle. Title: "Jevons Paradox and AI — the same force that exposes commodity work as worthless is unlocking specialised problems that were never worth solving before." Category: Wow Moment. Themes: Signal, Industry, Economics. Sections written and ready — ask for the SQL or add manually.

4. **Present mode on mobile** — tested visually but not confirmed on a real device. The controls are now sticky (top and bottom bars) but worth confirming the fullscreen API works on iOS Safari specifically.

5. **TypeScript migration** — intentionally deferred until component structure is fully stable. Use Opus model when the time comes. Supabase CLI can auto-generate DB types.

6. **Shared design system** — Chronicle, Dispatch, Platform Org, Platform Roadmap should eventually share a component library and RMG brand system. Not now, but it's coming.

7. **Teams/Slack integration** — needs the Capture API endpoint first. Teams demo is a priority for the internal showcase. Once the endpoint exists, a Teams bot is a thin wrapper around it.

---

## Tech Stack Reference

- **Frontend:** React 18, Vite, React Router
- **Backend:** Supabase (Postgres, Storage, Edge Functions)
- **Deployment:** Vercel (auto-deploys from main branch)
- **Testing:** Vitest (124 passing)
- **AI:** Claude API via Supabase Edge Functions (for Enrichment Engine)
- **Environment:** Claude Code Web for development

---

*Last updated: 27 March 2026 — end of extended build session*
