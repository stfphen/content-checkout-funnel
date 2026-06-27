---
title: 52 · Decision Log
type: log
tags: [audit]
status: living
updated: 2026-06-27
---

# Decision Log

The "why" behind how things are built. Append new decisions at the top with a date.

| Date | Decision | Rationale |
|---|---|---|
| 2026-06 | **Repo 1 is canonical; Repo 2 is reference-only.** | Repo 1 has the real integrations + git + is half-deployed. Splitting effort into the V2 mock rewrite caused confusion. [[02-Glossary]] |
| 2026-06 | **`team_default` + `TEAM_SLUG=default` for built-in tenants.** | Built-in tenants/leads scope to one internal team; owner must join it to see them. Workaround until self-serve onboarding. [[15-Multi-Tenancy]] |
| 2026-06 | **Funding matching is manual + human-reviewed, not auto-ingested.** | Compliance: never claim eligibility/approval; data-quality risk in scraping. `ingestion.js` left as a safe future boundary. [[29-Funding-Program]] |
| 2026-06 | **Outreach is human-approved only; no auto-send.** | Deliverability + compliance; avoids spam/reputation damage. [[26-Outreach]] |
| 2026-06 | **Provider-neutral telephony; mock provider first.** | Zero-cost demo, env-only flip to live Twilio; SDK isolated in `lib/telephony/`. [[28-Telephony]] |
| 2026-06 | **Single-rep routing only for now; team-ring deferred.** | Ship working routing; parallel-ring needs a `<Dial>` multi-`<Number>` design. [[28-Telephony]] |
| 2026-06 | **Two AI auth paths; subscription preferred.** | `CLAUDE_CODE_OAUTH_TOKEN` avoids per-token billing; `ANTHROPIC_API_KEY` is the fallback. [[2B-AI-Backend]] |
| 2026-06 | **Graceful degradation for every integration.** | App must build/run/demo without any external key; each returns "not configured". |
| 2026-06 | **Stripe optional; falls back to Payment Links / lead capture.** | Lets the funnel work pre-Stripe; checkout activates when `STRIPE_SECRET_KEY` set. [[27-Checkout-Payments]] |
| 2026-06 | **JSON file store fallback when `DATABASE_URL` unset.** | Local dev without Postgres; production must use Postgres. [[13-Data-Model]] |
| 2026-06 | **Dark mode admin-only, via token re-pointing.** | Public funnel stays light (conversion + tenant branding); flips existing `var()` usages without rewrites. [[16-Design-System]] |
| 2026-06 | **`HOSTNAME=0.0.0.0` in compose.** | Next.js 15 bound to container-id host → Traefik 502. [[51-Timeline]] |
| 2026-06 | **Mobile-first via `min-width` enhancement; no Tailwind/new deps.** | CSS custom props can't be used in `@media`; keep the existing stack. [[16-Design-System]] |

Up: [[50-Audit-Log-MOC]]
