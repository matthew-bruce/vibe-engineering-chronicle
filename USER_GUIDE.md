# Chronicle — User Guide

> Your questions, answered. Updated as features are built.

---

## Getting Started

### What is Chronicle for?
Chronicle is a personal record of your Vibe Engineering journey. Use it to capture what you're learning, evidence what you're building, and tell that story to your team or leadership — without needing PowerPoint.

### How do I add my first Card?
Go to the **Timeline** tab and click **+ Add Moment**. Give it a title, pick a date (it defaults to today), choose a category, and optionally add notes, themes, and a benefit statement. Hit **Add to Timeline**.

### What's the difference between Timeline and Capture?
**Timeline** is for Cards you're adding thoughtfully — you know what category they are, you've got something to say about them.

**Capture** is for speed — you heard something interesting, had a thought, saw a quote. Drop it in Capture before you forget it. It lands on the Timeline automatically, timestamped.

---

## Cards

### What categories are available?
- **Wow Moment** — something that genuinely surprised you
- **Key Learning** — something you now know that you didn't before
- **Tooling Decision** — a choice about tools, stack, or approach
- **Thing I Built** — a shipped product, feature, or prototype
- **Aspiration / Goal** — something you're working toward
- **Idea / Wishlist** — something to potentially build or explore

### What are themes?
Themes are tags you apply to Cards to make them filterable and findable. A Card can have multiple themes. Available themes:

| Theme | Use it for |
|---|---|
| Industry | Market shifts, sector trends, what's coming |
| Economics | Cost, value, build vs buy arguments |
| Org Design | Structure, governance, empowering teams |
| Evidence | Proof points, demos, real stories |
| Leadership | Things to put directly to management |
| Signal | Executive-ready insights — inspiring, provocative, or both |
| Unlock | Moments where something previously impossible became possible |

### What is the Benefit field?
An optional one-liner that answers "so what?" for this Card. Keep it concrete — e.g. *"Saves 6 weeks of procurement time per tool"* or *"Removes dependency on £40k/year SaaS licence."* These benefit statements are the raw material of your business case.

### Can I edit a Card after adding it?
Not yet — editing is on the roadmap. For now, delete and re-add if something needs correcting.

---

## Sessions

### What is a Session?
A Session is a logged block of time spent working on a specific project. Sessions give you evidence of how long things actually take — which is your productivity argument when talking to leadership.

### How do I log a Session?
Go to the **Sessions** tab, select a project, enter a date, duration (in days, hours, and minutes — all optional), and any notes. Hit **Log Session**.

### Can I edit or delete a Session?
Yes — each Session has edit and delete controls. Click edit to update any field inline.

### Should Sessions appear on the Timeline?
When logging a session, toggle **Add to Timeline** on if the session is significant enough to be part of your story. Most sessions don't need to be on the Timeline — but a first session on a new project, or a session where something major was shipped, probably does.

---

## Present Mode

### How do I start a presentation?
Once you have Cards on the Timeline, a **▶ Present** button appears in the header. Click it to enter full-screen presentation mode.

### How do I filter what appears in the presentation?
Click **Filter presentation** before hitting Present. Choose which categories and themes to include. The slide count updates live as you adjust. Hit **Present selected (N)** to start with only matching Cards.

**Tip:** Filter by **Signal** theme to instantly pull a leadership-ready deck from your Chronicle — no manual curation needed.

### How do I navigate in Present mode?
Use the **← →** arrow keys on your keyboard, or click the navigation buttons at the bottom. Press **Escape** to exit.

---

## Data & Storage

### Where is my data stored?
Currently in your browser's localStorage. This means your data is stored on the device and browser you're using. It will not sync across devices.

### Will my data be lost if I clear my browser?
Yes — clearing browser data or localStorage will remove your Chronicle data. A Supabase cloud backend is planned which will solve this.

### Can I use Chronicle on my phone?
Yes — the app is responsive. Capture in particular is designed for quick mobile use.

---

## Roadmap

See [TODO.md](./TODO.md) for the full feature backlog.

Coming soon:
- Card editing
- Supabase backend (data syncs across devices)
- Shareable presentation links
- Evidence report generator

---

*Last updated: 24 March 2026 · Built with Claude & Claude Code*
