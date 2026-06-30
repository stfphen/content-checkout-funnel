# Enterprise Prospecting — Module Design Spec

> **Status: MVP BUILT (2026-06-29).** An offline-capable MVP of this design now exists in the working
> tree (see brain note `2C-Enterprise-Prospecting`), built at the operator's explicit direction. This
> spec remains the reference design; the MVP follows it with two pragmatic deltas: (1) routes take
> `accountId` in the body rather than `[id]` segments; (2) committee contacts link to leads via
> `lead.metadata.accountId` rather than a `leads.account_id` column. Run `npm run migrate` + `npm run
> build` on a real machine before deploy, and fold this into the repo-stabilization line
> (`[[31-Current-Priorities]]`).
>
> Strategy: `enterprise-prospecting-playbook.md`. Prompt: `docs/prompts/enterprise-prospecting-master-prompt.md`.
> Brain note: `[[2C-Enterprise-Prospecting]]`.

---

## 1. Design principle: extend, don't fork

This is **not a new pipeline.** It is a thin **account-based orchestration layer** on top of modules
that already exist and work. The enterprise motion = the same lead lifecycle, run *account-first* with
*three approval gates* instead of contact-first with one.

| Need | Reuse (existing) | Net-new (small) |
|---|---|---|
| Find accounts | Batch Builder `lib/prospecting.js`, providers `lib/integrations/` | open-DB account search; ICP fit-scoring |
| Research | AI Deep Research `lib/leadResearch/researchLead.js` (two-stage) + `dossierSchema.js` | account dossier shape; campaign-scope stage |
| Contacts | Apollo/Hunter via existing routes; `leads` table (team-scoped) | account↔contact linkage |
| Enrich | `lib/enrichment/` (sales brief, signals) | — |
| Outreach | `lib/outreachSequence.js` (caps, suppression, human-approved) | tier-aware queue tagging |
| Storage | Postgres + `lib/store.js` (JSON fallback) | 2 tables (`target_accounts`, `account_campaigns`) |

Guardrails honored (from `CLAUDE.md` / `[[CLAUDE-Operating-Rules]]`): tenant/team-scoped, no hardcoding
one client/vertical/source, mock-data-first, graceful degradation per integration, **outreach
human-approved only**, never auto-send.

---

## 2. New concepts (the only genuinely new ideas)

1. **Target Account** — a company we're pursuing, with tier, fit score, firmographics, and a status
   through the gates. Distinct from a `lead` (a person). One account → many leads (contacts).
2. **Account Campaign** — a scoped, high-ticket creative concept attached to an account (name, big
   idea, deliverables, budget band, success metric, opener).
3. **Three gates** — explicit approval states an account must pass before contacts can be sourced
   (Gate 1), before contacts/campaign reach the queue (Gate 2), before send (Gate 3 = existing).

---

## 3. Data model (additions only — mirrors existing migration style)

New migration `006_enterprise_prospecting.sql` (follows the `001–005` pattern; everything `team_id NOT
NULL` for multi-tenant isolation, per migration 003).

```sql
-- target_accounts: a company we're pursuing (NOT a person)
CREATE TABLE target_accounts (
  id              TEXT PRIMARY KEY,
  team_id         TEXT NOT NULL,
  tenant_id       TEXT,                          -- optional: which tenant brand is pursuing it
  name            TEXT NOT NULL,
  domain          TEXT,
  segment         TEXT,                          -- 'enterprise' | 'mid-market'
  tier            SMALLINT,                      -- 1 | 2 | 3
  fit_score       SMALLINT,                      -- 0..100
  firmographics   JSONB DEFAULT '{}'::jsonb,     -- industry, headcount_band, revenue_band, hq_geo, ownership
  signals         JSONB DEFAULT '[]'::jsonb,     -- Stage-4 hooks (fact/source/why/confidence)
  dossier         JSONB DEFAULT '{}'::jsonb,     -- full master-prompt JSON output
  source_type     TEXT,                          -- 'open_db' | 'apollo' | 'manual' | 'csv'
  gate_status     TEXT NOT NULL DEFAULT 'sourced',
                  -- 'sourced' -> 'gate1_approved' -> 'researched' -> 'gate2_approved' -> 'in_outreach' | 'deprioritized'
  approved_by     TEXT,                          -- user id (Gate 1)
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_target_accounts_team        ON target_accounts(team_id);
CREATE INDEX idx_target_accounts_team_gate   ON target_accounts(team_id, gate_status);
CREATE UNIQUE INDEX uq_target_accounts_domain ON target_accounts(team_id, domain);  -- dedupe

-- account_campaigns: a scoped high-ticket creative concept for an account
CREATE TABLE account_campaigns (
  id               TEXT PRIMARY KEY,
  team_id          TEXT NOT NULL,
  account_id       TEXT NOT NULL REFERENCES target_accounts(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  big_idea         TEXT,
  deliverables     JSONB DEFAULT '[]'::jsonb,
  budget_band      TEXT,
  budget_rationale TEXT,
  success_metric   TEXT,
  outreach_opener  TEXT,
  status           TEXT NOT NULL DEFAULT 'draft', -- 'draft' -> 'gate2_approved' -> 'queued'
  approved_by      TEXT,
  approved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_account_campaigns_team    ON account_campaigns(team_id);
CREATE INDEX idx_account_campaigns_account ON account_campaigns(account_id);
```

**Linking contacts to accounts:** reuse the existing `leads` table; add a nullable
`leads.account_id TEXT` (FK to `target_accounts`) so a sourced committee contact is just a normal,
team-scoped lead that knows its account. This keeps the entire lead pipeline, enrichment, and outreach
working unchanged. `lib/store.js` gets `createTargetAccount`, `listTargetAccounts`,
`updateAccountGate`, `createAccountCampaign` — same team-scoped CRUD pattern as `createLead`.

---

## 4. API routes (mirror `/api/admin/prospecting/*` conventions)

All under `requireRole` + team scoping (and must **not** repeat the enrich IDOR bug H2 — every handler
checks team ownership):

```
POST /api/admin/accounts/search          # open-DB + provider account search -> preview (Batch Builder pattern)
POST /api/admin/accounts/import          # import selected -> target_accounts (dedupe by domain)
POST /api/admin/accounts/score           # run account-fit-only prompt variant -> fit_score + tier
POST /api/admin/accounts/[id]/approve    # GATE 1: gate_status -> gate1_approved (audit-logged)
POST /api/admin/accounts/[id]/research   # Stages 2–4 via lib/leadResearch -> dossier + contacts(leads)
POST /api/admin/accounts/[id]/scope      # Stage 5 -> account_campaigns (draft)
POST /api/admin/accounts/[id]/approve-campaign  # GATE 2: verify contacts + approve campaign -> queue-ready
# GATE 3 = existing /api/admin/outreach/queue/send (unchanged, human-approved)
```

Every gate transition writes an `audit_logs` row (existing table) — who approved what, when.

---

## 5. The three gates as a state machine

```
sourced ──(Gate 1: POST /approve)──► gate1_approved ──(/research)──► researched
                                                                        │
                                              (/scope -> draft campaign) ▼
researched ──(Gate 2: /approve-campaign, verify contacts)──► gate2_approved/in_outreach
                                                                        │
                                       (contacts -> outreach_queue)     ▼
                              ───(Gate 3: existing /queue/send, human)──► sent
```

- **Gate 1** blocks provider/credit spend on bad-fit accounts (Apollo/Hunter cost + quotas).
- **Gate 2** blocks unverified/fabricated contacts and off-brand campaigns from ever queueing. The UI
  shows each contact's `email_status` (verified / pattern_unverified / unknown) so the operator
  verifies before approving.
- **Gate 3** is the existing standing rule — nothing auto-sends, ever.

A contact can only enter `outreach_queue` if its account is `gate2_approved`. Enforce in
`canSendQueueItem` (extend the existing cap/suppression check) — defense in depth.

---

## 6. AI usage & cost controls (reuse existing knobs)

Runs through `lib/ai/claudeBackend.js` (subscription path preferred, API-key fallback, clean
`AiNotConfigured` if neither). Reuse `LEAD_RESEARCH_MODEL` and `LEAD_RESEARCH_MAX_WEB_SEARCHES`
(default 8); add `ACCOUNT_FIT_MAX_WEB_SEARCHES` (default 3) for the cheap triage pass so scoring 100
accounts doesn't run full deep-research each. Route `maxDuration` mirrors the 120s research route.
No LLM feature is enabled in prod without the cost/guardrail decision already noted in
`[[34-Do-Not-Start-Yet]]`.

---

## 7. UI (extends the admin shell, no new app)

A new **"Accounts"** tab in `AdminTabbedShell` (sits beside Prospecting), mobile-first per the existing
design system:
- **Account board** grouped by `gate_status` (kanban-style: Sourced → Gate 1 → Researched → Gate 2 →
  In Outreach), with tier + fit_score pills (reuse the confidence-pill pattern from `LeadDeepResearch.jsx`).
- **Account detail** = firmographics, committee map (linked leads), signals, and the campaign concept,
  each gate an explicit approve button (audit-logged).
- Reuses existing components: provider preview (Batch Builder), deep-research confidence pills, outreach
  queue builder.

---

## 8. Build phases (mock-first, each independently shippable)

1. **Schema + store** — migration 006, `lib/store.js` CRUD, JSON-fallback parity. Mock seed: 5 accounts.
2. **Account sourcing + ICP scoring** — `lib/enterpriseProspecting/` (`buildAccountQuery`, `scoreAccountFit`),
   open-DB adapters (OpenCorporates/EDGAR) behind the `providerResponse.js` graceful-degradation shape.
3. **Gate 1 + research wiring** — approve endpoint + reuse `researchLead` for Stages 2–4; contacts → `leads` with `account_id`.
4. **Campaign scoping (Stage 5) + Gate 2** — `account_campaigns`, approve-campaign endpoint, contact verification UI.
5. **Outreach handoff** — tier-aware queue tagging; extend `canSendQueueItem` to require `gate2_approved`. (Gate 3 unchanged.)
6. **Accounts tab UI** + metrics (per-tier reply/meeting rates).

Each phase degrades gracefully (no key → "not configured"), is team-scoped, and ships with mock data
first per the standing decisions.

---

## 9. Open questions for the operator (resolve before Phase 2)

- Which open-DB adapters first — OpenCorporates (broad) vs. SEC EDGAR (US public, deep)? (Suggest both;
  EDGAR is free + no key.)
- Sales Navigator: manual-research-only at launch (recommended) or budget for the official API later?
- Default Tier-1 cap (how many marquee accounts to allow in `gate1_approved` at once) to protect
  provider quotas (Hunter free = 50/mo).

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Provider quota burn (Hunter 50/mo, Apollo limits) | Gate 1 before any sourcing; `ACCOUNT_FIT_MAX_WEB_SEARCHES=3` triage; Tier-1 cap |
| LinkedIn ToS / legal exposure | No scraping; official API + manual only (decision logged). See playbook §5d |
| Fabricated contacts hurting deliverability | `email_status` labels + Gate 2 verification; never queue unverified without explicit approve |
| Reintroducing IDOR (like enrich H2) | Every new route does `requireRole` + team-ownership check; covered by tests |
| Scope creep before repo is stable | Status = PROPOSED; do not start until `[[31-Current-Priorities]]` clears |
