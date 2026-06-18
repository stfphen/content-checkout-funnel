# Live Demo Readiness Audit

_Last updated: 2026-06-18._

> **Status note:** Prospect enrichment (formerly PR #2) is **merged into `main`** (merge commit `81f0489`). It is no longer in review. The enrichment routes and UI ship on the stable line. The remaining blocker is **live-runtime verification** (Docker/Postgres bring-up + browser QA), not code review.

## Current MVP Features Completed

- Public tenant funnel pages rendered from tenant/domain configuration.
- Admin login at `/admin` with tenant import/export controls.
- Lead capture, CSV import, lead pipeline search/filter/sort/editing, duplicate indicators, scoring, and filtered CSV export.
- Prospecting Batch Builder with Google Places preview/import and optional Hunter/Apollo enrichment paths.
- Outreach Sequence V1 with templates, campaign records, queue preview, suppression list, approved Resend sending, follow-up dates, outreach events, and lightweight metrics.
- Dockerized Next.js app behind Traefik with a private Postgres service for VPS deployment.

## What Is Tested/Passing

- `npm test` passes: **76/76 tests** (verified 2026-06-18).
- `npm run build` passes with Next.js production compilation and route generation (30 routes, compiled successfully).
- Covered areas include tenant validation, CSV parsing/import mapping, Apollo request shape, lead scoring, duplicate detection, prospecting batch imports, outreach template rendering, queue eligibility, suppressions, send caps, Resend not-configured/success/failure responses, and follow-up date suggestions.

## Database Setup

- VPS/Docker path: `docker-compose.yml` runs `content-funnel` plus `content-funnel-postgres` on an internal Docker network. The app receives `DATABASE_URL=postgres://content_funnel:content_funnel@content-funnel-postgres:5432/content_funnel`.
- Local fallback path: if `DATABASE_URL` is absent, `lib/store.js` uses `data/app-store.json` and initializes default tenants/leads/outreach arrays.
- Note: `.env.example` includes a sample `DATABASE_URL` with host `postgres`; Docker Compose overrides it with `content-funnel-postgres`.

## Required Live Env Vars

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `DATABASE_URL` for Postgres-backed live data, supplied by Docker Compose unless overridden.
- `PUBLIC_APP_URL=https://dgtlmag.com`
- `RESEND_API_KEY` for approved outreach sends.
- `GOOGLE_PLACES_API_KEY` for Google Places prospecting.
- `HUNTER_API_KEY` for Hunter enrichment.
- `APOLLO_API_KEY` for Apollo enrichment.

## Likely Needed For dgtlmag.com To Work

- DNS `A` records for `@` and `www` pointing to `62.72.16.32`.
- Existing Traefik container and external Docker network named `traefik-public`.
- LetsEncrypt resolver named `letsencrypt` available in Traefik.
- Strong live `ADMIN_PASSWORD` and `SESSION_SECRET`; do not use defaults.
- Live `.env` present at `/opt/content-checkout-funnel/.env` before `docker compose up -d --build`.
- Verified Resend sender/domain that matches the sender email used in `/admin`.

## VPS/DNS/Traefik Checklist

- Confirm Hostinger DNS: `A @ 62.72.16.32`, `A www 62.72.16.32`.
- Confirm ports 80/443 are handled by Traefik and no competing web server is active.
- Confirm `traefik-public` exists before starting the app compose stack.
- Run `docker compose config` on the VPS before deploy.
- Verify `curl -I http://127.0.0.1:8088/` returns 200 from the app container.
- Verify `curl -I https://dgtlmag.com/` returns 200 with a valid TLS certificate.
- Check `docker logs content-checkout-funnel --tail=80` and `docker logs traefik --tail=80` after startup.

## Provider QA Checklist

- Google Places: confirm API key, billing, quota, and Places permissions; create a `med spas + Toronto` preview batch; import selected results; verify source metadata and duplicate handling.
- Hunter: confirm API key and account permissions; run domain search enrichment against known-company leads; verify not-configured behavior when the key is missing.
- Apollo: confirm API key and People API access; verify role keywords and company-domain searches; expect partial contact data because the current path may not return direct emails/phones.
- Resend: verify sender/domain externally; with `RESEND_API_KEY` absent, confirm approved send reports not-configured; with it present, send one approved queue item and confirm status, `lastContactedAt`, follow-up date, and outreach history update.

## Local Live-Runtime Verification — Results (2026-06-18)

A full local pass was run against a real Postgres instance (migrations applied, owner seeded) with the production-style server. Results:

- **Setup:** `npm run migrate` applied all 3 migrations; `npm run create-owner` seeded an owner; `npm test` = **76/76**; `npm run build` compiled (30 routes).
- **Public flow:** `/` → 200, `/t/funded-growth` → 200 (renders "Funded Growth"), `/admin` unauthenticated → 307 redirect to `/admin/login`. Funding-scan lead capture (`POST /api/leads`) created a scored lead (score 40) — **works**.
- **Admin flow (authenticated):** login → 303 to `/admin`; admin shell renders Dashboard/Pipeline/Prospecting/Outreach/Tenants. Funding-scan lead appears with computed **score**, **program matches**, **Generate Draft**, and **Enrich from Website** — **works**.
- **Draft email:** `POST /api/admin/drafts` → 303, real personalized draft created (subject "Funding fit next step for Acme Bakery") — **works**.
- **Prospecting (no keys):** Google/Hunter/Apollo all degrade gracefully (e.g. notice `GOOGLE_PLACES_API_KEY is not configured.`) — **works as designed**.
- **Enrichment:** `POST /api/admin/leads/enrich` runs end-to-end and degrades gracefully when the website fetch is blocked (notice "Website enrichment failed… Fetch returned 403"). The pipeline executes; only the outbound fetch is unavailable in a locked-down egress sandbox — **works; needs open egress to fully demo**.
- **Outreach:** `POST /api/admin/outreach/queue` queued 1 item ("Queued 1 outreach item."). Outreach events recorded were only `drafted` + `queued` — **no real email was sent** (no `RESEND_API_KEY`, send route not called).

### Blockers/findings found during this pass

- ⚠️ **Owner-team / tenant-team mismatch (demo-blocking if not handled).** The public funnels write leads to `team_default` (the team that owns the seeded `dgtlmag` tenant). `npm run create-owner` with a custom `TEAM_SLUG` creates a **separate** team, so that owner logs into an **empty** pipeline and will not see funnel/funding-scan leads. The session's active team is the owner's **earliest** membership (`team_memberships … order by created_at asc`), with no team switcher exercised here. **Fix for demo:** seed the demo owner onto the team that owns the public tenants (run `create-owner` with `TEAM_SLUG=default`, or whatever team owns the tenant being demoed).
- ⚠️ **Only the `dgtlmag` tenant is seeded in the DB.** `/t/funded-growth` renders from code config, but stored leads carry `tenant_id="funded-growth"` with no matching `tenants` row. Confirm the intended tenant/team ownership for funnel leads before the demo.
- ℹ️ **Production start command.** `npm run start` (`next start`) prints a warning under `output: standalone` and is not the production path. The Dockerfile correctly runs `node server.js` (standalone), which was verified serving `/` and `/t/funded-growth` at 200. Demo/prod should use the standalone server (Docker), not `npm run start`.

## Exact Blockers Before Live Demo

- Live DNS, Traefik network, TLS certificate issuance, and container reachability have not been verified on the VPS in this audit.
- Live admin credentials and `SESSION_SECRET` must be replaced with strong values before public access.
- Provider keys and account permissions for Google Places, Hunter, Apollo, and Resend still need live QA.
- Resend sender/domain verification must be completed before approved outreach sends can work.
- Production data path needs confirmation: live demo should use Docker Postgres, not the local JSON fallback.

## Recommended Next Sprint

- Do one VPS bring-up pass using the existing Hostinger checklist and verify HTTPS, `/admin`, and Postgres-backed persistence.
- Run the provider QA checklist with real keys and record expected not-configured versus successful-provider behavior.
- Add a short pre-demo smoke script for `/`, `/admin`, provider not-configured routes, and one read/write admin workflow.
- Harden live operations with rotated admin credentials, a generated `SESSION_SECRET`, and a documented backup/export path for Postgres data.
