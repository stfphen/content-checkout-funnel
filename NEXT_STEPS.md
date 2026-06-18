# Next Steps — Content Checkout Funnel

_Last updated: 2026-06-17. Written for future AI agents and maintainers. Keep items concrete and ordered._

## 1. Immediate next steps

1. **Live-runtime verify PR #2.** Stand up Postgres (`docker-compose up`), seed an admin/team user, log into `/admin`, and confirm the enrichment UI renders end-to-end (Enrich button, enrichment summary panel, sales brief). This is the one gap not covered by unit tests/build. See `DEMO_FLOW.md`.
2. **Review and merge PR #2** (`feature/prospect-enrichment-integration` → `main`). The branch is conflict-free, up to date with `main`, and passing tests/build.
3. **After merge:** clean up the subsumed enrichment sub-feature worktrees/branches listed in `PROJECT_STATUS.md` (with confirmation).

## 2. Sprint 1 remaining work

Tracks the roadmap in `CLAUDE.md`:

1. ✅ Repo recovery and branch cleanup (in progress — worktree cleanup pending PR #2 merge).
2. ⏳ Merge or close PR #2 (ready; awaiting review/merge).
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
- ❌ **Deleting worktrees/branches before PR #2 merges.** They are still the integration sources; cleanup is post-merge and requires explicit confirmation.
- ❌ **Any app-code refactor bundled into the PR #2 merge.** Keep the merge clean; do feature work in follow-up branches.
