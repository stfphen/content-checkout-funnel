---
title: 52 · Decision Log
type: log
tags: [audit]
status: living
updated: 2026-06-29
---

# Decision Log

The "why" behind how things are built. Append new decisions at the top with a date.

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-29 | **Product-wide UI/UX overhaul will be a token-preserving reskin, not a styling rewrite.** | The brief (`docs/prompts/ui-ux-overhaul.md`) keeps the existing `styles.css` token architecture, the per-tenant brand-token contract, admin-scoped dark mode, and the mobile-first `min-width` pattern — reskinning within them rather than introducing Tailwind/CSS-modules churn. Lowest regression risk across tenants and dark mode. [[16-Design-System]] |
| 2026-06-29 | **The overhaul brief is aesthetic-agnostic — quality bars, not a fixed look.** | Operator chose to define measurable standards (system consistency, hierarchy/density, AA contrast against arbitrary tenant accents, purposeful motion, perf budgets) and let the executor propose the visual direction for approval at the Phase-1 gate, rather than prescribing one style up front. [[16-Design-System]] |
| 2026-06-29 | **Quota-staged sourcing: cheap/broad sources for search, expensive for research.** | SEC EDGAR + OpenCorporates + Google Places power search; Apollo + Hunter + Claude run per-account behind Gate 1 — so credits/quota (Hunter free = 50/mo) are only spent on approved accounts. Every adapter degrades to mock. [[2C-Enterprise-Prospecting]] |
| 2026-06-29 | **Enterprise prospecting MVP built now** (overriding the "do-not-start-until-stable" hold). | Operator explicitly directed a full working MVP. Mitigated risk by building additively + mock-first + fully tested, so existing modules don't regress. [[2C-Enterprise-Prospecting]] |
| 2026-06-29 | **Account routes use `accountId` in the request body, not dynamic `[id]` segments.** | Avoids Next 15 async-params footguns; matches existing leads-route convention (`leadId` in body). [[2C-Enterprise-Prospecting]] |
| 2026-06-29 | **Committee contacts link to leads via `lead.metadata.accountId`, not a `leads.account_id` column.** | MVP: avoids editing the large lead normalizer (which had adjacent uncommitted WIP); reuses the entire lead pipeline. New lead source `enterprise_prospect`. Revisit a real column later if querying by account gets heavy. [[2C-Enterprise-Prospecting]] |
| 2026-06-29 | **Enterprise prospecting will EXTEND existing modules, not fork a new pipeline.** | Account-based layer reuses Batch Builder + Deep Research + Outreach; only 2 tables + a thin orchestration lib are new. Lower risk, keeps lead pipeline/outreach unchanged. [[2C-Enterprise-Prospecting]] |
| 2026-06-29 | **No LinkedIn scraping for prospecting — official API + manual research only.** | ToS §8.2 prohibits scraping; *hiQ* says public scraping isn't a CFAA crime but is still a ToS breach; LinkedIn sues/bans (Proxycurl shut down 2025). Mirrors "funding matching is manual, not scraped." [[2C-Enterprise-Prospecting]] |
| 2026-06-29 | **Three manual approval gates for the enterprise motion** (account+tier → contacts+campaign → send). | Operator chose maximum control; protects provider quotas, blocks fabricated contacts, preserves "outreach human-approved only." [[2C-Enterprise-Prospecting]] · [[26-Outreach]] |
| 2026-06-27 | **ON Home Decor migrated into the multi-tenant platform**, not kept as a standalone site. | Reuse the existing funnel/admin/checkout/telephony stack instead of maintaining a separate Lovable app; productized as a low-friction `$200` paint-selection entry offer that ladders into styling + renovation packages. [[63-Tenants-Catalog]] · [[15-Multi-Tenancy]] |
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
