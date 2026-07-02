# Prompt: Full Codebase Audit, Fix & Roadmap Assessment

Copy everything below the line into a fresh Claude session (Fable 5) with this repo folder connected.

---

You are auditing the **Content Checkout Funnel** repo — a multi-tenant Next.js 15 / React 19 marketing-agency platform (tenant sales funnels, admin dashboard, lead pipeline, prospecting, outreach, batch builder, checkout, future Funding Program engine). Stack: Next.js App Router, Postgres (`pg`), Stripe, Twilio, Anthropic SDK. Your job: investigate the entire codebase, report its true current status, find and fix real bugs, update the project brain, and recommend concrete next steps.

## Phase 0 — Orient (do this first, before touching anything)
1. Read `CLAUDE.md`, then `brain/00-Index/00-Home.md` and follow its start-of-session checklist. Read `brain/50-Audit-Log/53-Known-Issues.md` and `52-Decision-Log.md` so you don't re-report known issues or contradict past decisions.
2. Run `git status --short --branch` and `git log --oneline -15`. Note uncommitted changes and any open PRs (especially PR #2, AI prospect enrichment). Do NOT reset, clean, or delete anything.
3. Skim `PROJECT_STATUS.md`, `NEXT_STEPS.md`, `RESUME_HERE.md`, and `LIVE_DEMO_READINESS.md` — then verify their claims against the actual code. Flag anywhere the docs say something the code contradicts.

## Phase 1 — Baseline health check
Run and record exact commands + results:
- `npm test` (node --test tests/*.test.js)
- `npm run build`
- `node scripts/migrate.js --dry-run` if supported, otherwise just read `migrations/` for ordering gaps, missing rollbacks, or schema/code mismatches.
If build or tests fail, fixing those failures is your top priority before anything else.

## Phase 2 — Systematic audit
Use parallel subagents where helpful. Audit each area and grade it (Solid / Needs work / Broken):

1. **Routing & admin shell** — every route under `app/`: broken links, dead pages, 404s in admin navigation, client/server component misuse, missing loading/error boundaries.
2. **Tenant isolation** — every DB query in `lib/` and API routes: does each one scope by tenant? Flag any query that could leak one tenant's leads, prospects, or orders to another. This is the highest-severity bug class in this app.
3. **API routes** — input validation, auth checks on every admin/mutation endpoint, error handling that swallows failures, inconsistent response shapes, unhandled promise rejections.
4. **Database layer** — SQL injection surface (string-built queries vs parameterized), N+1 patterns, missing indexes implied by query patterns, migration drift vs. code expectations.
5. **Checkout & Stripe** — webhook signature verification, idempotency, price/package integrity (can a client tamper with amounts?), test-vs-live key handling in `.env*`.
6. **Outreach & Twilio** — rate limiting, retry logic, opt-out handling, credential handling.
7. **Lead pipeline / prospecting / batch builder** — state-transition bugs, race conditions, orphaned records.
8. **Security & secrets** — confirm `.env` and `API_KEYS.md` are gitignored and no secrets are committed in history-visible files; check auth/session logic (bcryptjs usage, cookie flags), XSS in any rendered user/prospect data.
9. **Dead code & drift** — unused components, abandoned routes, dependencies in `package.json` not actually used, duplicated logic between `lib/` and route handlers.
10. **Tests** — what `tests/` actually covers vs. the critical paths above; list the 5 highest-value missing tests.

## Phase 3 — Fix
- Fix every **Broken**-grade item and any bug that is small, unambiguous, and low-risk (clear defect, obvious correct behavior, contained blast radius).
- For anything risky or architectural (auth redesign, schema changes, tenant-model changes): do NOT fix — write it up with a proposed approach and effort estimate instead.
- Follow the repo git workflow: small commits, run `npm test` and `npm run build` before each commit, never force-push or delete branches. Work on a branch, not directly on main.
- Never hardcode a single client, grant source, or service path — keep everything tenant-aware.

## Phase 4 — Update the brain
- Append a dated bullet per meaningful finding/fix to `brain/50-Audit-Log/51-Timeline.md`.
- Add new bugs/risks (fixed or open) to `brain/50-Audit-Log/53-Known-Issues.md`; mark resolved items resolved.
- Record any decisions made in `52-Decision-Log.md`.
- Update any architecture/module notes the audit proved stale, and bump their `updated:` dates.

## Phase 5 — Report & recommend
Deliver a final report (save as `docs/audits/YYYY-MM-DD-codebase-audit.md`) containing:
1. **Status overview** — one paragraph per module with its grade; overall stability verdict against the current priority ("stabilize before building more features").
2. **Fixed** — each bug: what it was, root cause, file(s), the fix, how verified.
3. **Open issues** — severity-ranked (Critical / High / Medium / Low) with proposed fixes and effort.
4. **Performance & functionality recommendations** — concrete, ranked: quick wins (caching, query batching, image/bundle size, route-level code splitting) vs. bigger bets (background jobs for outreach, funding-program data model, observability/logging, CI pipeline).
5. **Next steps** — a sequenced plan reconciling your findings with the existing roadmap (repo stabilization → PR #2 merge/close → admin shell → Funding Program → lead matching → sellable B2B packaging). Say explicitly whether the repo is stable enough to resume feature work, and what the single next action should be.

Rules: verify claims by reading actual code, not docs. Report exact commands and results. Prefer prose over bullet spam in the report. If you're uncertain whether something is a bug, say so rather than "fixing" working code.
