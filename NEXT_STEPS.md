# Next Steps — Content Checkout Funnel

_Last updated: 2026-06-18. Written for future AI agents and maintainers. Keep items concrete and ordered._

> PR #2 (prospect enrichment) is **merged into `main`** as of 2026-06-18 (merge commit `81f0489`). Do not attempt to merge it again. There are no open PRs.

## 1. Immediate next steps

1. **Live-runtime verification (top blocker).** Stand up Postgres (`docker compose up`), run migrations, seed an admin/team user, log into `/admin`, and confirm the full `DEMO_FLOW.md` path renders end-to-end in a browser — including the enrichment UI (Enrich button, enrichment summary panel, sales brief). This is the one gap not covered by unit tests/build (76/76 passing) and the gate before any controlled live demo.
2. **Branch/worktree cleanup (with confirmation only).** The enrichment sub-feature branches listed in `PROJECT_STATUS.md` are now subsumed into `main` and are cleanup candidates. Per repo policy, **do not delete worktrees or branches without explicit user confirmation.**

## 2. Sprint 1 remaining work

Tracks the roadmap in `CLAUDE.md`:

1. ✅ Repo recovery and branch cleanup (worktree cleanup now unblocked; pending confirmation).
2. ✅ Merge or close PR #2 (merged into `main`, 2026-06-18).
3. ✅ Stabilize admin shell/navigation (`AdminTabbedShell` on `main`).
4. ✅ Build Funding Program module (Funded Growth Engine V2 + manual matching on `main`).
5. ⏳ Connect funding opportunities to lead matching and outreach (matching exists; wire matched opportunities into the outreach queue/sequence).
6. ⏳ Package the product into a sellable B2B offer (see Sprint 2).

## 3. Sprint 2 productization roadmap

- Multi-tenant onboarding flow (self-serve tenant/brand setup).
- Billing + checkout for service packages.
- Harden real provider integrations (Google/Hunter/Apollo/Resend): retries, rate limits, quota handling.
- Outreach sending at scale via Resend (approved domains, suppression list, unsubscribe compliance).
- Reporting/dashboards (pipeline conversion, outreach metrics, funding match outcomes).
- Productize prospect enrichment (cost controls + guardrails for the optional LLM brief).

## 4. Do not start yet

- ❌ **Real outreach email sending at volume.** Requires an approved Resend domain plus a reviewed suppression/unsubscribe/compliance path. Keep sends gated until that review is done.
- ❌ **Automated live funding-source ingestion.** Matching is intentionally manual/human-reviewed right now; do not wire automated ingestion without a data-quality plan.
- ❌ **LLM sales brief in production without cost + guardrail review.** It works and falls back safely, but production usage needs a budget/guardrail decision.
- ❌ **Deleting worktrees/branches without explicit user confirmation.** PR #2 is merged, so the enrichment sub-feature branches are cleanup candidates — but per repo policy, never delete worktrees or branches without explicit confirmation.
