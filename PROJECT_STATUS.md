# Project Status — Content Checkout Funnel

_Last updated: 2026-06-18. Written for both humans and future AI agents. Keep it factual; update whenever branch/PR state changes._

## 1. Current branch status

- **`main` @ `af3e695`** is the stable line: PR #2 (AI prospect enrichment) merged (`81f0489`) plus production-prep commits. Passes `npm test` and `npm run build`.
- **`feature/funding-program-v1`** (active) contains Funding Program V1 productization + real Stripe checkout, fully verified on local Postgres. Ready to merge to `main`.

## 2. What `feature/funding-program-v1` adds

- **Funding Program V1**
  - Additive port of the funding admin engine from `project-worker-2` (no enrichment/branding regression): `lib/funding/programDatabase.js` (richer program DB + `matchFundingProgramsForInput`), kept alongside the existing `matching.js` triage engine.
  - Admin **Funding tab**: opportunity dashboard, per-lead program matches, funding-scan lead cards.
  - **Human review checklist** (`lib/funding/review.js` + `/api/admin/funding/review`) — completion gated on required items; reviewer + timestamp persisted on lead metadata.
  - **Closer handoff summary** (`lib/funding/handoff.js`).
  - **Funding outreach sequence** (intro / fit-summary / book-a-call) in `lib/outreachSequence.js`.
  - **Demo seed**: `npm run seed:funding-demo` (idempotent funded-growth leads across all match states).
- **Real Stripe Checkout + webhooks** (`lib/payments/stripe.js`, `/api/checkout`, `/api/webhooks/stripe`) — activates only when `STRIPE_SECRET_KEY` is set; otherwise falls back to Payment Links / lead capture. Per-package `stripe` config in tenant configs.

## 3. Verification (done)

- `npm test`: **101/101 pass.** `npm run build`: clean.
- Live local Postgres pass: `migrate` → `create-owner` → `seed:funding-demo`; admin login; Funding tab, scan leads, review checklist (gated + persisted), closer handoff all render; enrichment UI + white-label branding intact (regression guards); funded-growth funnel renders the `fundedOpportunity` section; checkout falls back to capture without Stripe; webhook rejects unsigned requests (400).

## 4. Known risks / notes

- **Team setup matters.** Built-in tenants register under `team_default`; public-funnel and funding-scan leads are scoped there. The operating owner must be created in that team (`TEAM_SLUG=default`) to see them. Documented in `DEPLOY_HOSTINGER.md` ("Team setup").
- **External providers require keys.** Resend/Google/Hunter/Apollo keys are present in the local `.env` (git-ignored). Stripe + optional OpenAI must be provided. See `API_KEYS.md` (incl. rotation guidance).
- **Funding data is manual** — human-reviewed program categories; no automated live ingestion yet (`lib/funding/ingestion.js` is a future boundary).
- `npm install` reports 2 moderate-severity advisories (not addressed).

## 5. Worktree / branch cleanup (done)

- Removed the 10 redundant enrichment worktrees + branches (all at `0538b33`, subsumed by merged PR #2), plus `feature/prospect-enrichment-integration` and `pr-1-demo` (tips reachable from `main`). Backup: `../worktree-rescue-20260617-2348/`.
- **Kept:** `main`, `feature/funding-program-v1`, `project-worker-2` (remove after the funding merge — its committed tip is in `main` and its unique uncommitted work is now ported + archived), and `feature/funding-program-docs` (unmerged; left untouched).

## 6. Next

1. Merge `feature/funding-program-v1` → `main`.
2. Remove the `project-worker-2` worktree (post-merge).
3. Provide Stripe (+ optional OpenAI) keys; rotate the four existing provider keys (`API_KEYS.md`).
4. Run the VPS deploy runbook (`DEPLOY_HOSTINGER.md`) — DNS/Traefik/TLS + register the Stripe webhook.
