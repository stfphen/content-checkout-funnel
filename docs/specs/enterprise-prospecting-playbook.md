# Enterprise & Mid-Market Prospecting Playbook

> The strategy behind the tool. Read this to understand *why* the workflow is shaped the way it is;
> read `enterprise-prospecting-master-prompt.md` for the prompt that executes it and
> `enterprise-prospecting-module-spec.md` for how it's built into the app.
>
> Scope chosen with the operator: **enterprise (1000+) + mid-market (200–1000)**, sources =
> **LinkedIn (ToS-safe only) + Apollo/Hunter/Google Places + open databases + SEO/intent signals**,
> oversight = **three manual gates**.

---

## 1. The mental model: stop selling to companies, start selling to accounts

Mass cold outreach optimizes for *volume of sends*. Enterprise creative deals are won by optimizing
for *depth on a few right accounts*. This is **account-based marketing (ABM)**: pick a small set of
high-value accounts, treat each as a "market of one," and reach the **buying committee** inside it
with a tailored reason to care. A $150k creative campaign is never bought by one person reading one
cold email — it's bought by a committee that has seen a relevant, specific, well-timed point of view.

So the funnel inverts. Instead of *thousands of contacts → hope*, it's:

```
right ACCOUNTS  →  right PEOPLE in each  →  right TIMING (signals)  →  right OFFER (scoped campaign)
   (few, tiered)      (buying committee)       (a hook to act now)        (bold, specific, high-ticket)
```

Volume still happens — but only at the *last* step, after a human has confirmed the account, the
people, and the offer. That's what your existing batch outreach engine is for; this playbook front-loads
the precision so the automation isn't spraying.

---

## 2. Tier your accounts (effort follows value)

Not every target deserves the same effort. Three tiers, borrowed from standard ABM practice:

| Tier | Model | How many | Effort per account | Use when |
|---|---|---|---|---|
| **Tier 1** | 1:1 | 5–15 marquee names | Deep custom research + bespoke creative concept | Dream-logo accounts; biggest budgets |
| **Tier 2** | 1:few | 20–60, clustered by vertical/use-case | Light custom + shared campaign theme per cluster | Repeatable verticals with real budget |
| **Tier 3** | 1:many | 100s | Templated, signal-triggered | Mid-market at scale; feeds the batch engine |

The same research prompt runs across all tiers — you just run *more stages* on Tier 1 and *fewer* on
Tier 3. Tier 3 is where your automated email batch shines; Tiers 1–2 are where manual oversight earns
its keep.

---

## 3. Define the ICP before you touch a database

Sourcing without an Ideal Customer Profile is how you waste provider credits. For DGTL's high-ticket
creative offer, define ICP on three axes:

- **Firmographic:** segment (1000+ / 200–1000), industry verticals you can show proof in, geography
  (your chosen geos), ownership (public companies have public filings + budget cycles; private/PE-backed
  often move faster). Estimated marketing budget is the real qualifier — proxy it from headcount,
  revenue band, and ad/creative spend signals.
- **Signal/behavioral:** is something happening that creates a *reason to invest in creative now*?
  (rebrand, new CMO, funding, product launch, expansion, weak/aging brand presence vs. competitors).
- **Disqualifiers:** in-house agency of record already locked, recent big-agency win, no discernible
  marketing leadership, regulated-but-no-budget. Write these down — disqualifying fast is a feature.

A one-paragraph ICP statement, with explicit disqualifiers, is the single highest-leverage artifact
here. Everything downstream filters against it (Stage 1 `fit_score` in the master prompt).

---

## 4. Map the buying committee (the "correct contacts" problem, solved)

Your original ask was to find "the correct contacts." In enterprise, there is no *one* correct
contact — there's a **committee**, and you need to map roles, then find the person in each:

| Role | Who it usually is (creative/marketing deal) | What they care about |
|---|---|---|
| **Economic buyer** | CMO, VP Marketing, Head of Brand | Business outcome, ROI, risk, peer proof |
| **Champion** | Brand / Growth / Content / Demand-gen lead | Looking good internally; a partner who makes them win |
| **Influencers** | Creative director, Head of Digital, Comms/PR | Craft, fit, feasibility |
| **Blocker / gatekeeper** | Procurement, Legal, EA to the exec | Process, terms, vendor risk |
| **User** | Marketing managers who'll run the work | Workload, clarity, handoff |

Tactics that work: **start with the champion, not the economic buyer** (champions reply; they then
sell you internally), and always identify a **backup contact** because enterprise people change roles
constantly. The master prompt's Stage 2 forces this map and marks a primary + backup.

---

## 5. Sourcing: where to find accounts and people (and the LinkedIn trap)

You picked all four source types. Here's how to use each *correctly*, with the compliance lines drawn.

### 5a. Open databases — best for *accounts & firmographics* (free/cheap, fully clean)
- **OpenCorporates** — 210M+ companies across 140+ jurisdictions; legal name, registration, status,
  address, industry code, directors. Basic free; API from ~£99/mo. Great for confirming legal entity,
  ownership, and corporate structure of big targets.
- **SEC EDGAR** — free filings for US public companies: revenue, segments, risk factors, leadership.
  The cheapest way to size budget and find what a public company *says it's investing in*.
- **UK Companies House** — free API + bulk data for UK entities.
- Reality check: registries hold **firmographics only — no emails or phones.** They tell you *which*
  accounts and *how big*, never *who to email*. Pair them with a contact provider.

### 5b. Licensed providers — best for *contacts* (already wired into your app)
- **Apollo** (`lib/integrations/apollo.js`) — people search by domain + titles; your
  `defaultApolloRoles` already targets roles. This is your primary committee-contact source.
- **Hunter** (`lib/integrations/hunter.js`) — email-by-domain + pattern detection; verify or derive
  the `first.last@` pattern. Note free plan = 50 searches/mo — budget it for Tier 1/2 only.
- **Google Places** (`lib/integrations/googlePlaces.js`) — firmographic/branch data, better for
  local/mid-market than for global enterprise.

### 5c. SEO / intent signals — best for *timing & personalization*
This is what makes a cold email land. Mine, per account: tech/martech stack (what they run signals
budget + gaps), **open marketing job posts** (hiring a "Brand Manager" = active investment), funding
or earnings, recent launches, and **content/SEO gaps vs. competitors** (you sell creative — show the
gap you'd fill). These become the "why now" hooks (master prompt Stage 4).

### 5d. LinkedIn — the trap, and the only safe path
**Do not scrape LinkedIn, and do not buy data from anyone who does.** The legal picture:
- The *hiQ v. LinkedIn* line of cases established that scraping **public** data isn't a federal CFAA
  crime — but the same litigation also found scraping **breaches LinkedIn's User Agreement** (§8.2
  prohibits scraping/copying profiles). "Not a crime" ≠ "allowed."
- LinkedIn enforces aggressively: it bans accounts, pressured data brokers to remove company pages,
  and in 2025 **sued Proxycurl**, whose LinkedIn data API then shut down entirely. Building on scraped
  LinkedIn data is building on sand — and it risks your real accounts.

The **ToS-safe path** you chose:
1. **Manual research** — a human opens a public profile in their own browser to confirm a title or
   spelling, and pastes that fact in. Fine. (Your master prompt allows reasoning over operator-pasted
   public info; it forbids instructing scraping.)
2. **Official LinkedIn / Sales Navigator** — sanctioned, zero account risk. Note its *API* surfaces
   **company-level** firmographics/intent, **not** lead-level contact export; treat Sales Navigator as
   a manual account-research surface and get the actual emails from Apollo/Hunter.

> Decision recorded in the brain: **no LinkedIn scraping; official APIs + manual research only.** This
> mirrors your existing "funding matching is manual, not scraped" and "outreach human-approved" stances.

---

## 6. Scoping high-budget, creative campaigns (the offer)

Mass outreach with a generic "we do marketing" note will never close a six-figure creative deal. The
offer has to feel *built for them*. A scoped concept (master prompt Stage 5) has six parts:

1. **A named big idea** tied to a real signal ("You just launched X in Canada — here's the campaign
   that makes it impossible to ignore"). Specific > clever.
2. **3–5 concrete deliverables** so the budget feels real, not vague retainer.
3. **A budget band with rationale** — anchor high; enterprise budgets respect ambition, and a number
   makes the email a business conversation, not a brochure.
4. **A success metric** they'd report upward.
5. **One opener sentence** — the only line that has to earn the reply.
6. **Proof** — the closest case study / result you can show.

Sequencing the *send* of these (after the gates) follows the **1:1 / 1:few / 1:many** split: Tier 1
gets a bespoke concept per account; Tier 2 gets a per-cluster theme with light personalization; Tier 3
gets templated, signal-triggered variants that ride your existing batch engine.

---

## 7. The flow end-to-end (with the three gates)

```
   ┌─ SOURCE ─────────────┐   ┌─ RESEARCH ──────────┐   ┌─ SCOPE ───────┐   ┌─ OUTREACH ─────┐
   │ open DBs → accounts  │   │ master prompt        │   │ campaign      │   │ existing engine │
   │ ICP filter → shortlist│  │ Stages 1–4 (fit,    │   │ concept +     │   │ caps 25/day,    │
   │                       │  │ committee, contacts, │   │ budget band   │   │ 1/domain, supp. │
   │                       │  │ signals)             │   │ (Stage 5)     │   │                 │
   └──────────┬───────────┘   └─────────┬───────────┘   └──────┬────────┘   └───────┬─────────┘
   ▼ GATE 1: approve accounts + tier   ▼ GATE 2: verify contacts + approve campaign   ▼ GATE 3: approve send
   (human)                              (human)                                        (human, existing rule)
```

Gate 1 stops you burning provider credits on bad-fit accounts. Gate 2 stops unverified/fabricated
contacts and off-brand offers from ever reaching the queue. Gate 3 is your standing "outreach is
human-approved only" rule, unchanged. Automation does the *labor* (search, draft, dedupe, queue);
humans own every *decision*.

---

## 8. Metrics that tell you it's working

Track at two levels. **Account level:** accounts researched, % passing fit, committee coverage
(contacts found per account), Tier-1 meetings booked. **Message level (existing outreach metrics):**
reply rate, positive-reply rate, meeting rate, and *per-tier* not just blended — a 3% reply on Tier 3
and a 25% reply on Tier 1 average to a number that hides both truths. The goal metric for this whole
motion is **qualified meetings with in-ICP accounts**, not emails sent.

---

## 9. Compliance & reputation guardrails (non-negotiable)

- **No scraping LinkedIn**; no buying scraped data (§5d).
- **B2B-legitimate-interest basis** for contact data; role/company data over personal; no personal
  mobile numbers; honor unsubscribe/suppression (already in `outreachSequence.js`).
- **Deliverability is an asset** — the per-domain cap (1/day) and daily cap (25) exist to protect your
  sending reputation; enterprise ABM *wants* low volume / high relevance anyway.
- **Never fabricate** a contact, email, or firmographic. Unverified = labeled unverified.
- **Every fact carries a source + confidence.** Honesty about gaps is what makes the dossier usable.

---

## 10. First 2 weeks (how to actually start)

1. Write the one-paragraph ICP + disqualifiers (§3).
2. Pull 50–100 candidate accounts from open DBs + your knowledge; run the **account-fit-only** prompt
   variant to triage to a Tier-1 (10) / Tier-2 (30) shortlist. → **Gate 1**.
3. Run full research (Stages 2–5) on the Tier-1 ten; source committee contacts via Apollo/Hunter.
4. Scope one bespoke campaign concept per Tier-1 account. → **Gate 2**.
5. Hand verified contacts + approved concepts to the outreach queue. → **Gate 3** → send.
6. Review per-tier metrics weekly; feed learnings back into the ICP and the prompt's CONSTRAINTS block.
