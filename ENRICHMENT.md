# Chronicle — Enrichment Engine

*How it works, how to configure it, and how to fix it when it does something stupid.*

---

## What It Is

The Enrichment Engine (EE) is an automated pipeline that reads every card in Chronicle and fills in intelligence that would otherwise require manual effort: impact score, relevance, suggested themes, intended audience, a one-line summary, and linked business benefits.

It uses a Large Language Model (LLM) — currently configured for Anthropic's Claude API, with Azure OpenAI as the planned enterprise alternative — to analyse card content and return structured data.

The result: you capture a raw thought, it arrives on the Timeline already scored, tagged, summarised, and where appropriate, linked to real business benefits. The gap between captured and usable is near zero.

---

## The Architecture

```
Card added to Chronicle
        ↓
Supabase Database Webhook fires on INSERT
        ↓
Edge Function: enrich-card
(serverless function, runs on nearest server, wakes on trigger)
        ↓
Snapshot current card state → card_versions
        ↓
LLM API called with card content + enrichment prompt
        ↓
LLM returns structured JSON
        ↓
Edge Function writes back to card in Supabase
        ↓
card_enriched_at updated, version note records enrichment date and source
        ↓
Card appears on Timeline fully enriched
```

**Key concept — the webhook:** A webhook is simply "when X happens, call Y." When a card is inserted into the database, Supabase automatically calls the Edge Function. No polling, no manual trigger, no human involvement.

**Key concept — the Edge Function:** A small piece of serverless code that lives in the cloud. It wakes up when called, does one job, and goes back to sleep. You pay nothing when it is idle.

**Key concept — the LLM API:** The Edge Function sends the card content as text to an LLM API endpoint with a structured prompt. The LLM returns JSON. The Edge Function writes that JSON back to the card. The LLM never stores the data — it just processes and responds.

---

## Three Trigger Modes

**Mode 1 — Real-time on INSERT**
Fires automatically every time a card is added. The card arrives on the Timeline already enriched within seconds. Zero manual effort required.

**Mode 2 — On-demand sweep**
A button in the app triggers enrichment across all cards. Includes cards previously enriched by AI — the EE re-evaluates everything unless a card is marked *evergreen*. Shows progress and a completion summary. Use this after a prompt change to re-apply improved logic across the full card library.

**Mode 3 — Monthly scheduled sweep**
Runs automatically on the first of each month. Re-evaluates relevance drift across all non-evergreen cards — a card that was marked *dated* may become *current* again as the field evolves. Each change includes a note explaining what changed and why, stored in the version history. Cards marked *evergreen* are never touched by any sweep, ever.

---

## What the LLM Returns

For every card, the EE produces:

| Field | Type | Description |
|---|---|---|
| `card_impact` | Integer 1–5 | How significant is this insight? |
| `card_relevance` | Enum | current, review, dated, evergreen |
| `card_ai_themes` | Array | Matching themes from the Chronicle taxonomy |
| `card_ai_audience` | Enum | beginner, practitioner, leadership, universal |
| `card_ai_summary` | Text | Single sentence, max 25 words |

---

## The AI Always Enriches — Versioning Is the Safety Net

The EE will enrich any card that is not marked *evergreen*. There is no human lock that permanently blocks AI re-enrichment — because the whole point of the EE is to keep the knowledge OS current, relevant, and well-organised automatically.

What versioning provides instead: before every enrichment write, a full snapshot of the card's current state is saved to `card_versions`. If the EE produces something wrong, you restore the previous version in one click. The safety net is rollback, not prevention.

Every version record stores:
- Full card snapshot at time of enrichment
- `versioned_by` — 'user' or 'enrichment_engine'
- `version_note` — e.g. "Pre-enrichment snapshot", "Monthly relevance sweep"
- `versioned_at` — exact timestamp

This means you can always see when the EE last reviewed a card, what it changed, and why.

---

## Benefits Detection

The EE runs a second pass on each card to identify whether any of Chronicle's 26 benefit types genuinely apply, and where they do — to articulate them in detail, not just name them.

**The first question is always: does this card warrant a benefit at all?**

Not every card has a tangible business benefit. A Wow Moment that is an interesting observation, a Signal that is a market trend — these may have no direct organisational benefit worth stating. The EE does not force-fit. A card with no genuine benefit gets none.

Cards most likely to have benefits: Thing I Built, Tooling Decision, Key Learning, Principle. Cards least likely: Wow Moment, Idea/Wishlist (unless the idea has been partially evidenced).

**Where benefits are identified, the EE produces:**

```json
{
  "has_benefits": true,
  "benefits": [
    {
      "benefit_type_id": "uuid",
      "confidence": "confirmed|probable|aspirational",
      "headline": "one-line benefit statement",
      "detail": "two to three sentences fleshing out the benefit, what it means in practice, what evidence exists, what would need to happen to confirm it fully",
      "rationale": "one sentence explaining why this benefit applies to this card specifically"
    }
  ]
}
```

**Confidence levels:**

- **Confirmed** — explicitly evidenced by the card content with specifics. The benefit can be stated in a business case as fact.
- **Probable** — real signal, but needs validation, scale, or further evidence. Worth stating with appropriate caveats.
- **Aspirational** — plausible future outcome, not yet evidenced. Use sparingly. Never overstate scope.

**Maximum 3 benefits per card.** Quality over quantity — a business case built on 3 well-evidenced benefits is stronger than one padded with 8 weak ones.

**Benefits are stored in `card_benefits`** with `benefit_confidence`, `headline`, `detail`, and `rationale` fields. Displayed on cards with confidence colour coding: Confirmed = green, Probable = amber, Aspirational = grey.

**The EE never deletes human-added benefits.** It only adds.

---

## Tweaking the EE

All enrichment behaviour is controlled by the prompt sent to the LLM inside `supabase/functions/enrich-card/index.ts`. If the EE is:

- Scoring impact too high → tighten the impact rubric in the prompt
- Over-tagging Signal → add a conservative instruction for Signal specifically
- Writing summaries that are too long → reduce the word limit
- Missing obvious themes → add examples to the theme descriptions
- Force-fitting benefits → strengthen the "has_benefits: false" instruction
- Under-articulating benefits → expand the detail field instructions

Change the prompt, redeploy the Edge Function, run the on-demand sweep. Changes apply immediately to all future enrichments and can be re-run against existing cards.

---

## Changing the LLM Provider

The EE is designed to be provider-agnostic. The current implementation uses Anthropic's Claude API. Switching to Azure OpenAI requires environment variable changes only:

```
LLM_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment
```

No code changes. No architecture changes. When RMG's Azure OpenAI enterprise access is available, this is a five-minute swap.

---

## Environment Variables

Set in Supabase Dashboard → Edge Functions → Secrets:

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API access |
| `SUPABASE_SERVICE_ROLE_KEY` | Available automatically in Edge Function environment |
| `SUPABASE_URL` | Available automatically in Edge Function environment |

---

## Files

| File | Purpose |
|---|---|
| `supabase/functions/enrich-card/index.ts` | Main enrichment Edge Function |
| `supabase/functions/enrich-sweep/index.ts` | On-demand and scheduled sweep |
| `supabase/migrations/add_card_versions.sql` | Versioning table migration |
| `supabase/migrations/add_benefit_confidence.sql` | Benefit confidence and detail fields |
| `supabase/migrations/setup_enrich_cron.sql` | Monthly scheduled sweep cron setup |
| `lib/__tests__/enrichment.test.js` | Unit tests |

---

## Open Questions

- Card relationships — linking cards that explain or evidence each other. `card_relationships` table planned. EE should eventually suggest relationships automatically.
- Section label rename — "Use in a room" → "How to land it" globally across existing cards.
- LLM provider switch to Azure OpenAI once RMG enterprise access is confirmed.
- Benefits detection pass — second EE pass per card, confidence levels, detail field. Prompt ready, not yet built.

---

*Last updated: 3 April 2026*
