---
title: 53 · Known Issues, Risks & Tech Debt
type: log
tags: [audit, security]
status: living
updated: 2026-07-13
source: docs/SECURITY_REVIEW.md, docs/audits/2026-07-02-codebase-audit.md, status docs
---

# Known Issues, Risks & Tech Debt

Open problems. Full security analysis in [[61-Security-Review]]. **Update status here as items are fixed.**
Latest sweep: `docs/audits/2026-07-02-codebase-audit.md` (branch `audit/2026-07-02`).

## 🔴 Security — Critical
| ID | Issue | Location | Fix |
|---|---|---|---|
| **C1** | Live API keys were in plaintext `.env`, exposed in session logs (Resend/Google/Hunter/Apollo). Confirmed **never git-committed** (07-02 audit). | `.env` | Rotate all four (ops). [[44-Secrets-And-Rotation]] |
| ✅ **C2 — RESOLVED (07-02)** | **SSRF** in enrichment fetcher. Fixed: `lib/enrichment/ssrfGuard.js` (scheme allowlist + private/reserved/metadata IP block + per-redirect-hop revalidation via `safeFetch`), wired into `website.js`. Tests: `tests/ssrf-guard.test.js`. | `lib/enrichment/website.js` | — [[24-Enrichment]] |

## 🟠 Security — High
| ID | Issue | Location | Fix |
|---|---|---|---|
| ✅ **H1 — PARTIALLY RESOLVED (07-02)** | Login now rate-limited (`lib/rateLimit.js`, 10/min/IP) + bcrypt-timing equalizer. Still no global middleware for the other public POSTs. | `POST /api/admin/login` done; `/api/leads`, `/api/checkout`, `/api/funding/survey` still unthrottled | Extend limiter to remaining public POSTs. |
| ✅ **H2 — RESOLVED (07-02)** | Enrich IDOR + a broader cross-team lead read/write class. Fixed: `getLeadById`/`updateLeadResearch` take `{teamId}` and filter both backends; enrich/enrich-batch/research/fill-missing/research-from-query/funding-review pass session team; enrich routes now `requireRole`. Also fixed cross-team `updateUserStatus` lockout. Tests: `tests/tenant-isolation.test.js`, `tests/users.test.js`. | `app/api/admin/leads/*`, `lib/store.js`, `lib/users.js` | — [[21-Admin-Shell]] |
| **H3** | Weak prod DB password `content_funnel`. | VPS `.env` | Strong generated password (ops). [[44-Secrets-And-Rotation]] |
| ✅ **H4 — RESOLVED (07-04)** | **Unsubscribe amplification.** Fixed: `/api/unsubscribe` requires an HMAC-signed token (`lib/outreach/unsubscribe.js`, {email,tenantId,teamId}) and writes a **team/tenant-scoped** suppression — no more `tenant_id=NULL` row that suppressed an address for every team. Added an RFC-8058 one-click POST + `List-Unsubscribe` headers on sends. Test: `tests/outreach-send.test.js` (H4 regression). | `app/api/unsubscribe/route.js` | — (Superseded M3.) |

## 🟡 Security — Medium / Low
| ID | Issue | Location |
|---|---|---|
| ✅ **M1/M2 — RESOLVED (07-02)** | `sanitizePublicLeadInput()` whitelists public fields on `POST /api/leads` **and** `/api/checkout` (checkout had the same uncatalogued hole); teamId/status/score/assignee no longer client-forgeable. `funding/survey` was already safe. Test: `tests/public-lead-input.test.js`. |
| **M3** | Folded into **H4** above (unsubscribe). |
| ✅ **L1 — RESOLVED (07-02)** | `permissionDeniedResponse` now returns 401 JSON to fetch/XHR callers; navigations still redirect. Test: `tests/permissions-response.test.js`. |
| **L2** | `SESSION_SECRET` referenced in docs/`.env.example` but never read in code. |
| **L3** | Historic `.env.example` shipped `ADMIN_PASSWORD=change-this-password` placeholder. |
| **L4 (NEW)** | `telephony/transcription` webhook accepts unsigned requests (proceeds when `X-Twilio-Signature` absent); the other four telephony callbacks hard-require a valid signature. Low impact (limited to our own account's transcripts). | `app/api/telephony/transcription/route.js` |
| **L5 (NEW)** | Portfolio embed `<iframe src>` has no scheme allowlist (admin-controlled data, so low risk). | `components/FunnelPage.jsx` |
| **L6 — ACCEPTED (07-02)** | `npm audit`: 2 moderate — postcss <8.5.10 XSS in CSS-stringify output, bundled by **next** (every next release 9.3.4→16.x-canary pins a vulnerable postcss, so no non-breaking fix exists; `npm audit fix --force` would downgrade next to 9.3.3 — never do that). Build-time-only surface. Re-check on each next upgrade. | `node_modules/next` (transitive) |

## 🐛 Functional / correctness (NEW — 07-02 audit)
- ✅ **RESOLVED: pipeline status not validated on update.** `updateLeadStatus` now rejects statuses outside `pipelineStatuses` (Postgres stored junk verbatim; file store silently reset the lead to `new`). Test: `tests/lead-status-validation.test.js`.
- ✅ **RESOLVED: buying-committee promotion collapsed to one lead per account.** All committee members shared domain+business+website, so `shouldSkipReliableDuplicate` merged them; the response over-reported `promotedLeads`. Fixed: email now distinguishes people in dedupe; promotion counts only non-duplicates. Test: `tests/committee-dedupe.test.js`.
- **OPEN — pg-vs-file-store dedupe parity (HIGH):** the Postgres `createLead` branch inserts unconditionally — `shouldSkipReliableDuplicate` runs **only** in file-store mode. In production (DATABASE_URL set) re-imports create duplicate leads and never return the `skippedDuplicate` flag callers rely on. No DB unique constraint either. Fix: replicate the dedupe in the pg branch (or a partial unique index + `on conflict do nothing`). `lib/store.js` `createLead`.
- **OPEN — file-store write race (HIGH, dev/CI path only):** every mutation is an unserialized read-modify-write of `data/app-store.json` with a non-atomic full-file write. Concurrent requests lose updates; a crash mid-write truncates the store. Prod uses Postgres so impact is dev/CI. Fix: in-process write mutex + temp-file+rename. `lib/store.js`.
- ✅ **RESOLVED (07-04): outreach double-send race.** The send engine now claims each item via an atomic `claimOutreachQueueItem` (approved→sending compare-and-set; Postgres `UPDATE … WHERE status='approved'`, file-store mutex) before sending, so a concurrent/double-submit loses the race and is skipped. `lib/outreach/sendQueue.js` + `lib/store.js`. Test: `tests/outreach-send.test.js` (double-send).
- **OPEN — Stripe webhook idempotency (LOW/MED):** no persisted `event.id` dedup (only a read-then-write on `order.status`); the `leadMissing` path ACKs 200 (loses the event); no idempotency key on session create. Benign today, dangerous once fulfillment gains side effects. Fix: `processed_stripe_events(event_id PK)` insert-or-ignore before fulfilling; return 500 on lead-lookup error. `app/api/webhooks/stripe/route.js`.
- **OPEN — batch import non-idempotent / no double-submit guard (MED):** re-running an import re-increments counts and can double-create non-dedupable rows; a mid-loop throw leaves the batch non-completed. Fix: guard on `batch.status`, per-row try/catch, recompute (not add) counts. `app/api/admin/prospecting/batches/import/route.js`.
- **OPEN — no delete path for leads/batches/accounts (INFO):** only `deleteCall` exists (cascades correctly). Stale `batchId`/`campaignId`/`metadata.accountId` refs are never cleaned; bad records can only be removed by hand-editing the store.

## ⚡ Performance (NEW — 07-02 audit, DB layer)
- **Missing indexes (MED):** `outreach_*` and `prospecting_batches` have PK-only indexes but are queried by `tenant_id` join + `created_at/updated_at` order; `leads`/`calls` tenant-only filters can't use the team-leading composite indexes; audit-log team filter is an unindexable `metadata->>'teamId'` expression. Concrete `CREATE INDEX` list in the audit report — propose as migration `007_performance_indexes.sql`.
- **N+1 write loops (MED):** bulk lead import, outreach enqueue (+per-item event) run per-row INSERTs with no surrounding transaction. Fix: multi-row INSERT inside `withTransaction`.

## ⚙️ Operational / tech debt
- ✅ **RESOLVED (07-13): stale `.git/index.lock` cleared — commits flowing again.** The 0-byte
  `index.lock` (left by the 07-04 auto-sync commit `bf69c62`) that had silently blocked every commit
  since is gone: FAYELLA committed `4d12dfe` on the Mac (07-12 23:10) and no `.git/*.lock` files remain.
  The 07-07→07-12 brain edits it had held up are being committed by the 07-13 daily sync. Automation
  still must not delete lock files (see [[CLAUDE-Operating-Rules]]); this failure recurred once already
  (06-29 → 07-11), so watch for it after future auto-sync commits.
- **OPEN — Higgsfield trial fulfillment stuck (07-11, blocks scroll-world generation):** trial
  Stripe checkout completed via Apple Pay ($0 card-setup, no money charged) but Higgsfield's
  `payment-success` page 404s and the account stayed `free` (transactions empty, trial pending);
  the MCP connector session then invalidated. Reconnect + re-verify DONE later 07-11: account
  STILL free (0 transactions, generation refused) — fulfillment broken on Higgsfield's side.
  Next: user escalates to Higgsfield support/Discord with the receipt — **do not check out
  again**. ⚠️ If the trial
  DOES activate, it auto-renews to Plus **$49/mo after 3 days** unless "cancel auto-renewal" is
  said in a Higgsfield-MCP chat. Runbook: `prototypes/dgtl-scroll-world/spec/journey.md`.
- **Cowork sandbox network allowlist is fixed at boot** (07-11): mid-session settings changes
  don't apply; higgsfield.ai/api/upload/result-CDN, storage.googleapis.com and GitHub release
  assets are blocked; background processes are killed between bash calls (45 s cap). Any
  long-running or byte-heavy external pipeline must run host-side (MCP / Chrome extension) or
  in a fresh session after widening network access. [[51-Timeline]]
- ✅ **RESOLVED (06-29): stale `.git/*.lock` files cleared** — git ref ops work again (commits flowing on `feature/ui-overhaul`). No lock files remain.
- ✅ **RESOLVED (06-29): enterprise-prospecting MVP committed** (`87f94a6`); `lib/enterpriseProspecting/*`, `app/api/admin/accounts/**`, `AccountsPanel.jsx`, `migrations/006_*`, seed + tests are now tracked. ⚠️ Still run `npm run migrate` + `npm run build` on a real machine before deploy (sandbox lacks Linux SWC). [[2C-Enterprise-Prospecting]]
- **Pre-existing test flake in sandbox:** `tests/core.test.js` → "updateLeadResearch works in file-store mode" fails with `EPERM unlink data/app-store.json` (old test deletes the real store file; sandbox FS forbids it). Passes on a normal filesystem. Not a code defect; consider migrating that test to the `APP_STORE_PATH`-tmpdir isolation pattern. [[62-Testing]]
- **`next build` can't run in the cloud sandbox** (only the macOS SWC binary is vendored; no Linux/wasm SWC + no npm network). Build/typecheck must run on the operator's machine or CI.
- **Branch sprawl** (~15+ local + backups + wip/rescue + remotes) — needs consolidation. [[47-Git-Workflow]]
- **`team_default` workaround** — built-in tenants tied to one team; blocks clean multi-team onboarding. [[15-Multi-Tenancy]] / [[33-Sprint-2-Productization]]
- **No `lint` script** despite the mobile prompt referencing `npm run lint`. [[11-Tech-Stack]]
- **2 moderate npm advisories** (`npm install`) — not yet addressed.
- **VPS drift risk** — ✅ RESOLVED 2026-07-03: VPS runs the current tip (`main@14a746b`, smoke green;
  migrations 006+007 applied, 5/5 tenants seeded, uploads volume mounted). Keep it current via
  `docs/DEPLOY_NEXT.md`. Still missing: an uptime monitor (Phase 12) to catch 502s automatically.
  [[42-Go-Live-Plan]]
- Provider hardening (retries/rate-limits/quota) outstanding. [[23-Prospecting]]
- **PLANNED-SURFACE (watch): media upload endpoints** — the proposed portfolio/media library
  ([[2D-Portfolio-Media]]) adds a file-upload surface (`POST /api/admin/media`). It must ship **after** the
  open security fixes and with: mime allowlist + magic-byte sniff, size caps, team-scoped IDOR checks
  (cf. H2), rate limiting (cf. H1), path-traversal-safe storage keys, and SSRF guards on any server-side
  URL fetch/thumbnailing (cf. C2). Do not point `next/image` at arbitrary uploaded remote hosts.

## 🎨 Template library — deferred polish (07-04 build, from the visual audit)
- **Full-bleed hero dead band:** on image-backed heroes the brandbar + content sit ~200px down at
  desktop and ~550px on mobile (headline lands near/below the first fold; mitigated by the sticky
  bottom CTA bar). Pre-existing flagship design, so left frozen — revisit as a hero-variant option,
  not a global change. [[16-Design-System]]
- **Output section band is near-black in every direction** (`.section--black`): fine for
  premium-agency/dark-cinematic, jarring on warm-boutique/editorial-minimal. A per-direction surface
  needs a new `--fp-*` token → unfreezes the closed `DIRECTION_TOKEN_KEYS` set; deferred deliberately.
- **Split hero × large display sizes:** editorial/dark serif h1 clamps don't fit 5+ word headlines in
  a half-width column. Mitigated (B2B preset no longer forces split; generator caps hero headlines at
  3-5 words); the token-level fix (split-specific size) is deferred with the same unfreeze caveat.
- **`.brandbar__login` ghost button** can be near-invisible over bright hero photos (needs a scrim or
  stroke treatment).
- **Package grid renders full-width stacked cards at ≥1440px** on some directions — audit flagged it
  as looking unfinished; pre-existing behavior, evaluate a 3-up desktop rule against prod tenants first.
- **Logo slots show placeholder photography** until real client marks are uploaded per tenant
  (`docs/design-research/asset-prompts.md` documents the policy); vertical × direction asset packs not
  yet generated (prompt sheet ready).
- **TenantEditor has no vertical/variant UI** — preset + sectionVariants are settable via manual patch
  only; the builder-side picker exists. Small follow-up if operators want to retune existing tenants.

## 🏷️ DGTL Group agency page — open items for the team (07-04 build)
- **Founder name NOT printed anywhere** on `/t/dgtl-group`: public snippets say CEO "Will Giroux",
  internal anchors reference owner "Stephen" (stephen@dgtlgroup.io). Needs team confirmation before
  any name goes on the page.
- **dgtlgroup.io visual identity unverified:** the live site returned 403 through this session's
  egress (search snippets only). The page is designed from the logo asset + verified facts; wants a
  human eyeball pass against the real site.
- **No real work imagery yet:** the page is deliberately typographic (no picsum stand-ins next to
  real artist names). Needs: hero/results/about stills from the team, then image slots added to the
  `agency` block.
- **Domain go-live plan:** config claims `dgtlgroup.io`/`www.dgtlgroup.io`, but DNS still points at
  the WordPress-ish site. Plan needed: point the domain at the platform (Traefik host rule + cert),
  seed prod with `npm run seed:tenants -- --only dgtl-group`, then verify host resolution.
- **DMTV shown as a client brand on DGTL's page:** fine (it is DGTL's platform), but the DGTL↔DMTV
  relationship was previously internal-only knowledge — flag to the team that it is now public copy.
- **Observation (dev-mode):** every `/t/<slug>` page's RSC payload appears to serialize the full
  tenants array (other brands' configs visible in any page's HTML source). Pre-existing (also true
  of `dmtv-studio`), mostly-public marketing content, but worth confirming on a prod build and
  trimming the payload to the resolved tenant.

## Fix order — remaining after the 07-02 audit
Code-side C2/H2/M1/M2/L1 and login-H1 are **done**. Remaining, in order:
1. **Ops:** rotate the four provider keys + set a strong prod DB password (C1, H3).
2. **H4:** lock down `/api/unsubscribe` (signed token + team scope + POST) — global outreach-suppression hole.
3. **DB parity:** pg-side dedupe in `createLead` (prod is creating duplicate leads today).
4. Extend rate limiting to the remaining public POSTs; add `007_performance_indexes.sql`.
5. Stripe idempotency + outreach double-send + file-store write mutex.

Up: [[50-Audit-Log-MOC]]
