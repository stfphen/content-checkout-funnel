# Project Status — Content Checkout Funnel

_Last updated: 2026-06-18. This file is written for both humans and future AI agents. Keep it factual; update it whenever branch/PR state changes._

## 1. Current stable branch status

- **`main` @ `81f0489`** is the stable line (PR #2 merged: AI prospect enrichment, on top of PR #3 project stabilization + Funded Growth Engine V2).
- `main` passes `npm test` (**76/76 tests**) and `npm run build` (30 routes, compiled successfully).
- `main` includes: team auth (Postgres-backed), permissions, audit logging, team-scoped store, tenant validation, funded growth tenant + engine, manual funding program/category matching, outreach queue, batch builder, and the current `AdminTabbedShell` admin navigation.

## 2. Open PRs and what they contain

| PR | Branch | Contents | State |
|----|--------|----------|-------|
| **#3** | `integration/project-stabilization` | Team auth, permissions, audit logging, team-scoped store, tenant validation, Funded Growth Engine V2, manual funding matching, admin shell, `CLAUDE.md` | **Merged into `main`** (`395f0d7`) |
| **#2** | `feature/prospect-enrichment-integration` @ `8d8f454` | Prospect enrichment: website enrichment, social profile discovery, enrichment metadata helpers (`mergeLeadMetadata`, `updateLeadResearch`), deterministic sales-intelligence brief, optional LLM sales brief, single-lead enrich route (`/api/admin/leads/enrich`), batch enrich route (`/api/admin/leads/enrich-batch`), Google auto-enrich option, and enrichment UI (summaries + "Enrich from Website" buttons) integrated into the admin lead cards | **Merged into `main`** (merge commit `81f0489`, merged 2026-06-18). Validated: 76/76 tests pass, build passes |

> Note: PR #2 is now merged. There are **no open PRs**. Enrichment shipped to `main` on top of the PR #3 stabilization line.

## 3. Stable features (on `main`)

- Tenant-based content checkout funnel (`/t/[slug]`)
- Admin dashboard with `AdminTabbedShell` navigation
- Lead pipeline (team-scoped, duplicate-aware)
- Prospecting (Google Places, Hunter, Apollo)
- Outreach queue + outreach sequence helpers
- Batch builder (prospecting batches)
- Funded Growth Engine V2 + funding scan capture
- Manual funding program / category matching
- Team auth, permissions, audit logging, tenant validation

## 4. Features still draft / in review

- **None in review.** Prospect enrichment (formerly PR #2) is now **merged into `main`**: website enrichment, social profile discovery, deterministic sales brief, optional LLM brief, single-lead + batch enrich routes, Google auto-enrich, and enrichment UI are all on the stable line.
- The remaining gap is **not code review** but **live-runtime verification** — see "Known risks" below and `NEXT_STEPS.md`.

## 5. Known risks

- ⚠️ **Live admin runtime needs Postgres (top open risk).** Auth is database-backed (`getAdminSession` → `DATABASE_URL` + seeded `users`/`sessions`/`team_memberships`). The enrichment UI is confirmed via build + unit tests, but **end-to-end GUI rendering has not yet been exercised** against a live DB-backed admin. This live-runtime verification (Docker/Postgres + browser QA) is the current top blocker before a controlled live demo — see `NEXT_STEPS.md` and `DEMO_FLOW.md`.
- **External providers require keys.** Google/Hunter/Apollo/Resend and the optional LLM brief (`OPENAI_API_KEY`) return clear "not-configured" responses without keys; the LLM brief always falls back to the deterministic brief.
- **Auto-enrich adds latency / external calls** during Google import; it is capped, but should be load-checked before heavy use.
- **Funding ingestion is manual.** Program/category matching is human-reviewed; there is no automated live funding-source ingestion yet.
- `npm install` reports **2 moderate severity vulnerabilities** (not addressed; `npm audit` for details).

## 6. Local worktree cleanup status

Many worktrees exist. Now that PR #2 is merged, the following enrichment sub-feature branches (all at `0538b33`) are **subsumed into `main`** and are cleanup candidates:

- `feature/admin-enrichment-ui`, `feature/batch-enrichment`, `feature/enrichment-signal-interfaces`, `feature/google-auto-enrich-option`, `feature/lead-enrichment-api`, `feature/optional-llm-sales-brief`, `feature/prospect-enrichment-core`, `feature/sales-intelligence-brief`, `feature/social-profile-discovery`, `feature/website-enrichment`

Separate, review individually before any cleanup: `pr-1-demo`, `worker-2-task`, `feature/funding-program-docs`.

> Per repo policy: **do not delete worktrees or branches without explicit confirmation.** Treat the list above as candidates, not actions.
