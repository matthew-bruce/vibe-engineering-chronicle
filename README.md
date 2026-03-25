# Vibe Engineering Chronicle

> *A personal record of the journey. Not a project management tool. Not a knowledge base. A living story — timestamped, categorised, and presentable.*

## What is it?

Chronicle is a lightweight web app for capturing and presenting your Vibe Engineering journey. It was itself built using vibe engineering — conceived, designed, and shipped in a single evening session using Claude and Claude Code.

The core idea: the people driving AI-assisted development inside organisations need a way to capture what they're learning, evidence what they're building, and tell that story to the people who need to hear it. Chronicle is that tool.

## Core Concepts

**Cards** — everything in Chronicle is a Card. A Card is a timestamped record with a category, optional themes, and an optional benefit statement. Cards are the atomic unit of your story.

**Moments** — Cards that appear on the Timeline. Every Card is a Moment by default — because everything happened at a point in time, even an idea you had on a Tuesday afternoon.

**The Timeline** — your journey in chronological order. Filterable by category and theme. The source of truth for your story.

**Capture** — the fast-entry route. Drop a raw thought, quote, or observation with minimal friction. It lands on the Timeline automatically, timestamped.

**Sessions** — a time tracker per project. Log how long you've spent on each vibe-engineered tool. The running totals become your productivity evidence.

**Present Mode** — a full-screen presentation view. Filter by category or theme before presenting, so you can tailor the story to the audience. No PowerPoint needed.

## Card Categories

| Category | Description |
|---|---|
| Wow Moment | Something that genuinely surprised or astonished you |
| Key Learning | Something you now know that you didn't before |
| Tooling Decision | A choice made about tools, stack, or approach |
| Thing I Built | A shipped product, feature, or prototype |
| Aspiration / Goal | Something you're working toward |
| Idea / Wishlist | Something to potentially build or explore — not yet committed |

## Themes

Tags that can be applied to any Card. Multiple themes per Card are supported.

`Industry` `Economics` `Org Design` `Evidence` `Leadership` `Signal` `Unlock`

**Signal** — executive-ready insights. Inspiring, provocative, or both. Use the Signal filter in Present Mode to pull a leadership-ready deck from your Chronicle automatically.

**Unlock** — moments where a capability that wasn't accessible before suddenly became possible. Organisational or individual doors opening.

## Projects Tracked

- Dispatch (PI Planning Tool)
- Platform Org Structure
- Platform Roadmapping Tool
- Vibe Engineering Chronicle
- Vibe Engineering Strategy

## Tech Stack

- React (Vite)
- localStorage for persistence (Supabase migration planned)
- Deployed on Vercel
- Built with Claude Code

## The Meta Point

Chronicle was built in a single evening session using the exact tools and approach it describes. The first entry on the Timeline is the session that created it. The app proves the proposition by existing.

---

*Draft · March 2026 · Built with Claude & Claude Code*
