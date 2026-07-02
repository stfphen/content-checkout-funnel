# Content Checkout Funnel — Codebase Audit (2026-07-02)

**Scope:** full-repo audit per `docs/prompts/codebase-audit.md`, run with ten parallel area auditors, each finding verified against the actual code before acceptance. Work done on branch `audit/2026-07-02` (off `195c143`), leaving the uncommitted `feat/admin-command-center` WIP (`AdminTabbedShell.jsx`, `styles.css`) untouched.

**Headline:** the repo is in good shape and materially safer than the brain implied. Baseline health was already green; the injection surface is clean and no secret was ever committed. The audit fixed the code-side security backlog (SSRF, cross-team IDOR, public field injection, login brute-force) plus two real functional bugs, all with tests. **The repo is stable enough to resume feature work** once two ops items (key rotation, DB password) and one new High (`/api/unsubscribe` amplification) are handled.

---

## 1. Baseline health

| Check | Command | Result |
|---|---|---|
| Tests | `node --test tests/*.test.js` | **208/208 pass** at baseline → **234/234** after fixes (+26 new). |
| Build | `next build` | Clean (a one-off `.next` trace ENOENT was a stale-cache artifact; clean rebuilds pass). |
| Migrations | read `migrations/001–006` + `scripts/migrate.js` | Sorted, per-file transaction, advisory-locked, idempotent via `schema_migrations`. No ordering gaps; 20 tables all referenced by code, none missing. Drift is behavioral/index-level (below), not column-level. |

The known sandbox-only `core.test.js` file-store flake does not occur on this machine.

---

## 2. Status overview (per module)

- **Routing & admin shell — Solid.** All 8 admin nav tabs map to real panels; every form action / `router.push` / `fetch` target resolves; Next 15 async `params`/`cookies` are correctly awaited; client/server boundaries are right. Gaps were only missing `error.jsx`/`loading.jsx` (now added) and a duplicate DOM id inside the WIP shell (left for the WIP author).
- **Tenant/team isolation — Needs work → fixed.** The newer `requireRole` routes scope correctly, but a family of team-agnostic store primitives (`getLeadById`, `updateLeadResearch`, `updateUserStatus`) allowed cross-team read/write. **Fixed** (§3).
- **API routes — Needs work → mostly fixed.** Auth coverage is otherwise disciplined. The public lead surface had a mass-assignment hole (`/api/leads` **and** `/api/checkout`); **fixed**. Minor input-validation gaps (unbounded `maxResults`, NaN `dailySendCap`/`leadScore`) remain as low-severity open items.
- **Database layer — Solid (injection) / Needs work (parity & indexes).** Zero string-built queries — everything is parameterized. Real issues: Postgres `createLead` skips the dedupe the file store applies (prod creates duplicate leads); several hot tables are PK-only-indexed; bulk import / outreach enqueue are non-transactional N+1s. All **open** (§4).
- **Checkout & Stripe — Solid.** Webhook verifies the raw body with `constructEvent` and 400s on failure; price is resolved server-side (no amount tampering); keys are gitignored and never client-exposed. Idempotency hardening is a **low/med open item**.
- **Outreach & Twilio — Needs work.** All four production Twilio callbacks validate `X-Twilio-Signature`; suppression is enforced on every send path; secrets are env-only. Open: a double-submit send race, the unsubscribe amplification (now **H4**), and the unsigned transcription webhook (**L4**).
- **Lead pipeline / prospecting / batch builder — Needs work → partly fixed.** **Fixed:** no status-transition validation, and the buying-committee promotion collapsing to one lead. **Open:** file-store write race, batch-import non-idempotency, dedupe ignoring email-only leads.
- **Security & secrets — Solid.** bcrypt cost-12 async, CSPRNG session tokens stored hashed, correct cookie flags, server-side logout, no `dangerouslySetInnerHTML`, no committed secrets. Minor: login timing side-channel (**fixed**), iframe `src` allowlist (**L5**).
- **Dead code & drift — Solid.** ~24k LOC with no unused components or dependencies. Two orphan API routes (`admin/tenants/import`, `admin/leads/status`) and a duplicated `normalizeEmail`; the real drift is stale top-level `.md` docs.
- **Tests — Needs work.** Strong on pure logic; the Postgres branch of `lib/store.js` is never exercised and the money/isolation/injection paths lacked end-to-end coverage. The audit added isolation, public-input, SSRF, rate-limit, status-validation, permissions, and committee-dedupe suites.

**Overall stability verdict:** meets the "stabilize before building more features" bar. No Broken-grade module; the highest-severity class (cross-tenant leakage) is now closed in code and covered by tests.

---

## 3. Fixed (this audit)

Each fix is small, contained, test-covered; suite + build green after each commit.

1. **C2 — SSRF in the enrichment fetcher.** `websiteUrl` is attacker-controllable via public `POST /api/leads` / `/api/funding/survey`, and `website.js` fetched with `redirect: "follow"` and no host restriction — reachable to loopback, RFC-1918, CGNAT, and `169.254.169.254`. New `lib/enrichment/ssrfGuard.js`: IPv4/IPv6 private/reserved/metadata classifier, `assertPublicUrl` (scheme allowlist + DNS-resolution check to defeat rebinding), and `safeFetch` (manual redirects, every hop revalidated). `fetchPage` routes through it; a blocked URL degrades to a normal not-ok result. *Verified:* `tests/ssrf-guard.test.js` (metadata IP, IPv4-mapped IPv6, non-http scheme, DNS-rebind, redirect-to-private).

2. **H2 + cross-team lead IDOR (broader than catalogued).** `getLeadById`/`updateLeadResearch` gained an optional `{ teamId }` filter on both backends; the enrich, enrich-batch, research, fill-missing, research-from-query, and funding-review routes now pass the session team, and the two enrich routes moved from bare `getAdminSession` to `requireRole`. Also closed a cross-team `updateUserStatus` lockout (team-membership guard). *Verified:* `tests/tenant-isolation.test.js`, updated `tests/users.test.js` + `tests/auth.test.js`.

3. **M1/M2 — public lead field injection.** New `sanitizePublicLeadInput()` whitelists client-settable fields on `POST /api/leads` **and** `/api/checkout` (checkout had the same, uncatalogued hole); `teamId`, `pipelineStatus`, `leadScore`, `assignedTo`, and arbitrary metadata are dropped and the owning team is resolved server-side. `/api/leads` also guards `request.json()`. *Verified:* `tests/public-lead-input.test.js`.

4. **H1 — login brute-force.** `lib/rateLimit.js` (in-process fixed-window, 10/min/IP) applied to `POST /api/admin/login`, plus a bcrypt-timing equalizer on the user-miss path. *Verified:* `tests/rate-limit.test.js`. (In-process only — a multi-instance deploy should move to a shared store.)

5. **L1 — wrong response type on 401.** `permissionDeniedResponse` now returns 401 JSON to fetch/XHR callers (only browser navigations redirect to login). *Verified:* `tests/permissions-response.test.js`.

6. **Pipeline: invalid status persistence (new).** `updateLeadStatus` validates against `pipelineStatuses` — Postgres previously stored arbitrary strings verbatim; the file store silently reset the lead to `new`. *Verified:* `tests/lead-status-validation.test.js`.

7. **Enterprise: buying-committee collapse (new).** Every committee contact shared `businessName`/`website`, so `shouldSkipReliableDuplicate` merged them into one lead while the response over-reported the count. Email is now a person-level dedupe identity; the promote loop counts only non-duplicates. *Verified:* `tests/committee-dedupe.test.js`.

8. **Admin resilience.** Added `app/admin/error.jsx` and `loading.jsx`.

---

## 4. Open issues (severity-ranked)

**Critical / High**
- **C1 / H3 (ops):** rotate the four provider keys that sat in plaintext `.env` (never git-committed); set a strong prod DB password. Effort: ~30 min ops.
- **H4 — unsubscribe amplification (NEW).** The unauthenticated GET writes a `tenant_id = NULL` suppression, and `listOutreachSuppressions` returns null-tenant rows for **every** team — so anyone can globally suppress an arbitrary email/domain across all tenants, and link-scanners auto-unsubscribe recipients. Fix: HMAC-signed token in the email link, scope the suppression to the lead's team/tenant, move the mutation to POST. Effort: ~half day (touches outreach link generation).
- **DB dedupe parity (HIGH).** Postgres `createLead` inserts unconditionally; dedupe runs only in file-store mode, so production creates duplicate leads on every re-import and never sets `skippedDuplicate`. Fix: replicate the check in the pg branch or add a partial unique index + `on conflict do nothing`. Effort: ~half day + a migration.
- **File-store write race (HIGH, dev/CI only).** Unserialized read-modify-write with non-atomic full-file writes → lost updates / truncation under concurrency. Prod uses Postgres. Fix: in-process write mutex + temp-file+rename. Effort: ~half day.

**Medium**
- Extend rate limiting to the other public POSTs (`/api/leads`, `/api/checkout`, `/api/funding/survey`).
- Outreach double-send race (`queue/send`): add a compare-and-set `approved→sent`.
- Stripe idempotency: persist `event.id` (unique) before fulfilling; return 500 (not 200) on lead-lookup error; idempotency key on session create.
- Batch import: guard on `batch.status`, per-row try/catch, recompute counts.
- Add `007_performance_indexes.sql` (see Performance below).
- Input validation: clamp `maxResults`, treat `dailySendCap <= 0` as the fallback cap, guard `leadScore` with `Number.isFinite`.

**Low**
- **L4:** require a valid signature on the `telephony/transcription` webhook.
- **L5:** allowlist the portfolio embed `<iframe src>` scheme.
- **L2/L3:** dead `SESSION_SECRET` doc references; historic `.env.example` placeholder.
- Dead code: remove the two orphan routes (`admin/tenants/import`, `admin/leads/status`) after confirming no planned use; de-duplicate `normalizeEmail`.

---

## 5. Performance & functionality recommendations

**Quick wins (ranked)**
1. `007_performance_indexes.sql` — tenant/`created_at` composites on `outreach_*`, `prospecting_batches`, and tenant-only paths for `leads`/`calls`; a functional index on `audit_logs((metadata->>'teamId'), created_at)`; `outreach_suppression_list(email)`/`(domain)`. Pure additive win.
2. Batch the two per-row INSERT loops (lead import, outreach enqueue) into multi-row INSERTs inside one transaction — removes the N+1 and makes partial failure atomic.
3. Pg-side `createLead` dedupe (also a correctness fix) via `on conflict do nothing returning`.

**Bigger bets**
- Move outreach sending to a background job with retry/backoff (today it's a synchronous request loop) and a shared-store rate limiter.
- Add the Stripe `processed_stripe_events` table + a `withTransaction` helper for multi-step fulfillment.
- Observability: structured request logging + an uptime monitor on `dgtlmag.com` (Phase 12) to catch 502s; a CI pipeline running `npm test` + `npm run build` on push (there is none today, and the Postgres store branch is untested).
- Highest-value missing tests: Stripe webhook signature+idempotency+fulfillment; a mock-`pg` parity harness so the production store branch is exercised; the outreach send-loop cap/suppression integration.

---

## 6. Next steps (reconciled with the roadmap)

1. **Ops security (now):** rotate keys + DB password (C1/H3).
2. **H4:** lock down `/api/unsubscribe` — it's the one remaining internet-facing High.
3. **DB dedupe parity:** stop prod from creating duplicate leads (correctness, not just perf).
4. **Then resume the roadmap:** finish/land the `feat/admin-command-center` WIP → deploy `main` to `dgtlmag.com` (still pending) → Sprint-2 productization. PR #2 is already merged; admin shell is stable.
5. Fold the Medium/Low open items into the productization sprint (indexes migration, rate-limit extension, Stripe idempotency, input clamps).

**Single next action:** rotate the four provider keys and set a strong prod DB password (C1/H3) — the only remaining Critical/High that this code audit could not fix itself, and a prerequisite for the pending go-live.

*Rules followed: claims verified against code, not docs; exact commands/results reported; risky/architectural items written up rather than "fixed."*
