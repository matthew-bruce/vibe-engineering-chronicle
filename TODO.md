# Chronicle — TODO & Backlog

> Items marked `[DEMO]` are high priority for the next stakeholder presentation.
> Items marked `[ARCH]` require architectural decisions before building.

---

## In Progress / Next Session

- [ ] Simplify Capture tab — remove two-tier system, everything is just a Card added via a fast-entry form. No "promote" mechanic needed.
- [ ] Rename UI labels throughout — "Moments" for Timeline entries, "Cards" as the generic term, drop "entries" and "capture cards" language
- [ ] Session edit controls — inline edit form per session (date, duration in days/hours/minutes, notes, project)
- [ ] Session delete with confirmation
- [ ] Session "Add to Timeline" toggle — optionally surfaces a session as a Card on the Timeline

---

## Short Term (Next 1-2 Sessions)

- [ ] **Supabase backend** `[ARCH]` — replace localStorage with Supabase DB. Schema design needed first (see ARCHITECTURE.md when created). Key tables: cards, captures, sessions, projects
- [ ] **User Guide accessible from the app** — a Help or About page/modal linking to USER_GUIDE.md, styled to match the app
- [ ] **Card editing** — ability to edit any existing Card on the Timeline (title, body, date, category, themes, benefit)
- [ ] **Benefit field on Capture** — currently only on Timeline entries, should be on Capture too for consistency
- [ ] **Duration display** — show session durations as days/hours/minutes throughout, never raw minutes
- [ ] **Total hours stat** — surface the overall total prominently on the Sessions tab as a hero number

---

## Medium Term

- [ ] **App #5 — Vibe Engineering Projects Dashboard** — visual command centre for all vibe-engineered PoCs. Per project: status, hours, live URL, SaaS replaced, cost avoided. Aggregate stats: total hours, total SaaS avoided, productivity multiplier. Pulls Signal feed from Chronicle. The dashboard proves the proposition by existing.
- [ ] **Present Mode — narrative mode** — ability to add a brief spoken intro to each Card that only shows in Present mode (speaker notes equivalent)
- [ ] **Present Mode — export** — generate a shareable link to a read-only version of the current filtered presentation
- [ ] **Themes management** — ability to add custom themes beyond the default seven, from within the app
- [ ] **Card relationships** — ability to link related Cards (e.g. an Idea that led to a Thing I Built)
- [ ] **Search** — full text search across all Cards and Capture items
- [ ] **Filter persistence** — remember the last active filters between sessions

---

## Longer Term / Ideas

- [ ] **Multi-user / team Chronicle** — shared Chronicle for a vibe engineering team, with individual attribution per Card
- [ ] **Import from conversation** — ability to paste a Claude chat transcript and have Chronicle suggest Cards to extract
- [ ] **Slack / Teams integration** — drop a Card directly from a message via a bot or shortcut
- [ ] **Weekly digest** — auto-generated summary of Cards added in the last 7 days, emailed or surfaced in app
- [ ] **Evidence report generator** — one-click generation of a business case document from filtered Cards (Evidence + Economics themes)
- [ ] **Mobile-optimised Capture** — stripped-back mobile view for quick Card capture on the go

---

## Design & UX Debt

- [ ] Dark mode toggle — currently fixed dark theme, should respect system preference or user choice
- [ ] Royal Mail design system applied consistently throughout — some components still using original dark theme variables
- [ ] Present mode — add swipe gesture support for mobile
- [ ] Empty states — improve empty state illustrations and copy throughout
- [ ] Accessibility audit — keyboard navigation, screen reader support, colour contrast

---

## Known Issues

- Capture tab UI is overly complicated — the two-tier system (Capture → promote → Timeline) adds friction that contradicts the "everything is a Card" model. Simplification is the fix, not a patch.
- Session duration stored as raw minutes — needs display conversion throughout to days/hours/minutes
- No confirmation on delete for Timeline Cards (Sessions tab has it, Timeline does not)

---

*Last updated: 24 March 2026*
