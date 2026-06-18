# Next Steps — Content Checkout Funnel

_Last updated: 2026-06-18. Written for future AI agents and maintainers. Keep items concrete and ordered._

## 1. Immediate next steps

1. **Merge `feature/funding-program-v1` → `main`.** Funding Program V1 + real Stripe checkout, verified end-to-end on local Postgres (101/101 tests, build clean). See `PROJECT_STATUS.md`.
2. **Remove the `project-worker-2` worktree** after the merge (its committed tip is in `main`; unique uncommitted work is ported + archived in `../worktree-rescue-20260617-2348/`).
3. **Provide keys.** Add Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) and optionally OpenAI; rotate the four existing provider keys. See `API_KEYS.md`.
4. **Deploy to `dgtlmag.com`.** Follow `DEPLOY_HOSTINGER.md` (note the **Team setup** requirement: `TEAM_SLUG=default`). Register the Stripe webhook endpoint `https://dgtlmag.com/api/webhooks/stripe`. Verify DNS/Traefik/TLS, then smoke the live URL.

## 2. Roadmap status (per `CLAUDE.md`)

1. ✅ Repo recovery and branch cleanup (redundant enrichment worktrees/branches removed; archive retained).
2. ✅ PR #2 (AI prospect enrichment) merged into `main`.
3. ✅ Admin shell/navigation stable (`AdminTabbedShell`, now with the Funding tab).
4. ✅ Funding Program module — V1 productized (admin tab, program matching, review checklist, outreach sequence, closer handoff, demo seed).
5. ✅ Funding connected to outreach (funding outreach sequence + merge fields) and lead matching (opportunity dashboard).
6. ⏳ Package into a sellable B2B offer — checkout is now real (Stripe); continue with onboarding + reporting (Sprint 2).

## 3. Sprint 2 productization roadmap

- Multi-tenant self-serve onboarding (tenant/brand setup; resolve the built-in-tenant/team association so new teams own their tenants without the `team_default` workaround).
- Stripe hardening: subscriptions for retainers, an admin payments/orders view (optional `orders` table), receipt/fulfillment emails.
- Provider hardening (Google/Hunter/Apollo/Resend): retries, rate limits, quota handling.
- Outreach sending at scale via Resend (approved domains, suppression, unsubscribe compliance).
- Reporting/dashboards (pipeline conversion, outreach metrics, funding match + payment outcomes).
- Funding opportunity ingestion (activate `lib/funding/ingestion.js`) with human-review gating.

## 4. Do not start yet

- ❌ **Automated live funding-source ingestion** — matching is intentionally manual/human-reviewed; needs a data-quality plan first.
- ❌ **Real outreach email sending at volume** — requires approved Resend domain + reviewed suppression/unsubscribe path.
- ❌ **LLM sales brief in production** without a cost/guardrail decision (works + falls back safely).
- ❌ **Stripe subscriptions** — current checkout handles one-time `payment`; subscription events (`invoice.paid`, `customer.subscription.*`) are a follow-up.
