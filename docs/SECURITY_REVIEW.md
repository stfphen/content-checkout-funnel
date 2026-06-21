# Security Review — Content Checkout Funnel (pre-go-live)

_Reviewed 2026-06-21 against the canonical repo. Code is about to be public on dgtlmag.com. Read-only review; no files changed._

**Overall:** the fundamentals are strong — bcrypt cost 12, DB-backed session tokens with 32 bytes entropy stored only as SHA-256, correct `httpOnly`/`secure`/`sameSite` cookies, fully parameterized SQL, verified Stripe **and** Twilio webhook signatures, server-resolved checkout pricing, human-approved-only outreach, and audit-log secret redaction. The real risks cluster in **live secret exposure, SSRF, missing rate limiting, and a cross-tenant IDOR**.

## CRITICAL

**C1 — Live API keys in plaintext `.env` (one set exposed during this work).** `RESEND_API_KEY`, `GOOGLE_PLACES_API_KEY`, `HUNTER_API_KEY`, `APOLLO_API_KEY` are real, active credentials. `.env*` is correctly gitignored and was **never committed** — but the values are live and were read during diagnosis. **Rotate all four** (see SECRETS_AND_ROTATION_RUNBOOK.md). Blast radius: send mail as your domain / drain Resend quota, steal Apollo+Hunter paid quota and data, abuse Google billing.

**C2 — SSRF in the lead-enrichment website fetcher.** `lib/enrichment/website.js:370-382` (`fetchPage`) fetches `lead.websiteUrl` with `redirect:"follow"` and no guard — no scheme allowlist, no block on `localhost`/`127.0.0.1`/`169.254.169.254` (cloud metadata)/RFC-1918. `websiteUrl` is attacker-controllable via the **public, unauthenticated** `POST /api/leads` and `POST /api/funding/survey`. On the VPS an attacker could make the server fetch internal services or the metadata endpoint. Fix: validate scheme, resolve host, reject loopback/link-local/private/reserved IPs, re-validate each redirect hop.

## HIGH

**H1 — No rate limiting anywhere, including admin login.** No `middleware.ts`, no throttling. `POST /api/admin/login` runs an unthrottled bcrypt compare per request → online brute-force + CPU-exhaustion DoS. Public `/api/leads` and `/api/funding/survey` are also unthrottled (lead spam + SSRF probing). Fix: per-IP + per-account backoff on login; basic limits on the public endpoints (a Next.js `middleware.ts` is the natural place).

**H2 — Cross-tenant IDOR in the two enrich routes.** `app/api/admin/leads/enrich/route.js:7-13` and `enrich-batch/route.js:9-20` authenticate with bare `getAdminSession()` instead of `requireRole(...)`, and don't scope by `teamId` (`getLeadById` takes no teamId; `enrich-batch` calls `listLeads({tenantId})` without teamId). A user in team A can enrich/overwrite team B's leads. Every other lead route scopes by `getSessionTeamId(session)`. Fix: use `requireRole(["owner","admin","sales"])` and scope all reads/writes by session teamId.

**H3 — Weak production DB password `content_funnel`.** Not in any tracked file (compose requires `POSTGRES_PASSWORD` via env with a fail-if-unset guard), but it is the value actually set in the VPS `.env`. Blast radius: full read/write to all tenant data, leads, users, password hashes, sessions. Fix: regenerate with `openssl rand -base64 32`, ensure Postgres only binds to the Docker network/localhost (it does in compose — confirm no host port is published).

## MEDIUM

**M1 — Public endpoints let the client set internal lead fields.** `POST /api/leads` and `/api/funding/survey` pass the body to `createLead`; a client can set `pipelineStatus`, `leadScore`, `assignedTo`, `tenantId`, `teamId`. Whitelist contact fields (name/email/phone/business/message); set status/score server-side.

**M2 — `tenantId`/`teamId` trusted from anonymous callers** (`lib/store.js:785`). An anonymous caller can inject leads into any team by supplying its ID. Validate `tenantId` resolves to a published tenant and derive `teamId` server-side.

**M3 — Unsubscribe is an unauthenticated GET, not team-scoped** (`app/api/unsubscribe/route.js:5-16`). Anyone can poison the suppression list; link-prefetchers can auto-unsubscribe recipients. Use a signed token and/or POST-confirm.

## LOW

**L1** — `permissionDeniedResponse` returns a 303 redirect to `/admin/login` even on JSON API routes (`lib/permissions.js:67-69`) — API clients get HTML instead of a clean 401. **L2** — `SESSION_SECRET` is referenced in docs/`.env.example` but **never read in code** (sessions are DB-backed random tokens); clarify the docs. **L3** — a historic `.env.example` shipped `ADMIN_PASSWORD=change-this-password` (placeholder, not live); confirm no instance ever used it.

## Verified solid (no action)

bcrypt cost 12 + 12-char minimum; `crypto.randomBytes(32)` session tokens hashed with SHA-256, 12h TTL re-checked each request; correct cookie flags; fully parameterized SQL (interpolated fragments only splice `$N` placeholders); Stripe raw-body signature + idempotent fulfillment + rejects missing secret; Twilio `validateRequest` against exact URL, inbound/status 403 on unsigned; outreach human-approved-only with suppression + daily/per-domain caps + HTML-escaped bodies; checkout pricing resolved server-side; audit log redacts secret-like keys; 28/30 admin routes enforce `requireRole`; no `dangerouslySetInnerHTML` anywhere.

## Top 5 fixes (priority order)

1. **Rotate all four live API keys** + confirm strong VPS Postgres password bound to localhost/Docker only. *(C1, H3 — before launch)*
2. **Add an SSRF guard** to `lib/enrichment/website.js`. *(C2 — before launch)*
3. **Add rate limiting** on `/api/admin/login` and the public lead/survey endpoints. *(H1 — before launch)*
4. **Fix the two enrich routes** — `requireRole` + teamId scoping. *(H2 — before launch)*
5. **Lock down public lead creation** — whitelist fields, derive tenant/team/status server-side. *(M1, M2 — just after)*
