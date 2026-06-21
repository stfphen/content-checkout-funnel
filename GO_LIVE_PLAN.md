# Go-Live Management Plan — Content Checkout Funnel

_Owner: FAYELLA · Created 2026-06-20 · Target domain: **dgtlmag.com** (VPS 62.72.16.32, Hostinger + Docker + Traefik)_

This is the front-to-back plan to take the project from its current half-deployed state to a fully live, real-data production deployment with working roles, AI, payments, email, telephony/call-forwarding, and the public funding survey.

---

## 0. Read this first — the three things that look alike

You flagged that close naming causes mix-ups. Here is the canonical map. **Always confirm which one you are in before touching anything.**

| Thing | Path | What it is | Role in go-live |
|---|---|---|---|
| **Repo 1 (CANONICAL — deploy this)** | `/Users/emery/content-checkout-funnel` | Real production build. Next.js 15 / React 19. Real integrations already wired: Anthropic + Claude Agent SDK, Stripe, Twilio telephony, Postgres (`pg`), bcrypt auth, migrations, admin API routes. Already half-deployed to dgtlmag.com. | **The live target. All go-live work happens here.** |
| **Repo 2 (REFERENCE ONLY)** | `/Users/emery/Claude/Projects/content-checkout-funnel` | "V2" clean rewrite. Next.js 14, TypeScript strict, **mock-only** (`lib/mock`, no real APIs), no git. Excellent specs in `docs/specs/`. | Architecture/spec reference. **Do not deploy. Do not split effort into it.** |
| **Funding survey widget** | Feature branches in Repo 1 (`funding-survey-v1`, `funding-survey-feature`, etc.) | The public survey funnel serving `funding.dgtlmag.com` / `grants.dgtlmag.com`. | **Not in `main` yet** — must be merged before deploy or the survey won't exist in the build. |

**Rule:** Repo 2's `CLAUDE.md` says "no real auth/db/payment/email/APIs until Milestone 8." That guardrail is about Repo 2. This plan IS the production-hardening work — but it executes against **Repo 1**, which already has the real integrations.

---

## 1. Where things actually stand today

**Working (verified locally):** `npm test` green (101/101 last full pass), `npm run build` clean. Admin shell + navigation, lead pipeline, prospecting/batch builder, outreach sequence, funding program V1, real Stripe checkout code, Twilio telephony layer — all present and tested against local Postgres.

**Blocking go-live right now:**

1. **`https://dgtlmag.com/` returns 502** — Traefik, DNS, and TLS are healthy; the Next.js app container is down/not started. This is the #1 fire.
2. **Funding survey not in `main`** — deploy source must be a branch that contains it.
3. **Live secrets not all set** — Stripe (live), Claude/Anthropic auth, and Twilio are empty; provider keys need re-adding on the VPS + rotation.
4. **~30 stale branches** create exactly the confusion you flagged; needs consolidation to one clean deployable line.

---

## 2. Phased plan (matches the tracked task list + live dashboard)

Phases are ordered by dependency. Phase 1 is the immediate fire; Phases 4–9 can run in parallel once the app is up and auth/DB are live.

### Phase 0 — Repo consolidation & branch hygiene
Lock Repo 1 as canonical. Merge funding-survey + telephony branches into one integration branch → `main`. Prune stale branches **only with your explicit confirmation** (CLAUDE.md: never delete/force-push without sign-off). Green test + build on the consolidated `main`.

### Phase 1 — Restore the live site (fix the 502) ← START HERE
SSH `root@62.72.16.32`, `cd /opt/content-checkout-funnel`. Run the remediation in `PRE_DEPLOY_CHECKLIST.md`: `docker compose ps`; read `docker logs content-checkout-funnel --tail=120` for a boot crash (usually a missing/invalid `DATABASE_URL` or `SESSION_SECRET`); bring up postgres then the app; confirm the container is on `traefik-public` and the loadbalancer port label is `3000`; back up the DB first. **Done = `curl -I https://dgtlmag.com/` → 200.**

### Phase 2 — Database live (Postgres, migrations, seed, backups)
Strong generated `POSTGRES_PASSWORD`. Run migrations 001–005. Create owner with **`TEAM_SLUG=default`** (critical — otherwise admin sees no built-in tenants or funnel leads). Optional demo seed. Prove `backup-db.sh` + `restore-db.sh` and set a backup cadence.

### Phase 3 — Auth, roles & live credentials
Generate strong `SESSION_SECRET` + owner/admin password (no defaults, ever). Verify the `owner/admin/sales` role model and `requireRole` guards on admin + telephony routes. Create real team-member accounts with correct roles.

### Phase 4 — Claude SDK / AI features live
Pick one Anthropic auth path: **`CLAUDE_CODE_OAUTH_TOKEN`** (Claude Max/Pro subscription via the Agent SDK — no per-token billing; run `claude setup-token`) **or** `ANTHROPIC_API_KEY` (pay-as-you-go fallback). Verify AI Tenant Builder, AI Deep Research, and Fill-missing-info live. Set `LEAD_RESEARCH_MODEL` + the web-search cap for cost control.

### Phase 5 — Payments (Stripe live)
Live `sk_live_` key. Register webhook `https://dgtlmag.com/api/webhooks/stripe` for `checkout.session.completed`; paste its `whsec_` into `STRIPE_WEBHOOK_SECRET`. Test full flow with card `4242 4242 4242 4242`; confirm `metadata.order.status = paid`, replay is a no-op, and graceful fallback when unset.

### Phase 6 — Email & batch outreach (Resend) at scale
Verify the Resend **sender domain** (SPF/DKIM/DMARC on dgtlmag.com) so batches deliver to inbox. Match the `/admin` sender email to the verified domain. Validate suppression + unsubscribe compliance, send caps, and a real batch through the outreach queue end-to-end.

### Phase 7 — Telephony & call forwarding for all team members
Buy/port a **+1** voice-capable Twilio number. Point Voice "A call comes in" → `/api/telephony/inbound` and status callback → `/api/telephony/status` (URLs must match `TELEPHONY_WEBHOOK_BASE_URL` byte-for-byte or signature verification fails). Add `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN`. In **admin → Tenants → Phone Settings**: enable telephony, set the tenant number, routing mode, **per-rep assignment + fallback** so inbound calls forward/ring each team member. Verify inbound routing, click-to-call, missed-call task, and call logging. Keep `recordingEnabled=false` until consent handling is in place.

### Phase 8 — Prospecting providers QA (Google / Hunter / Apollo)
Live-validate each key (Google Places billing/quota/permission; Hunter Free = 50 searches/mo; Apollo People API). Run a real preview batch + import, domain enrichment, and decision-maker search; verify source metadata, duplicate handling, and not-configured behavior. Plan retry/rate-limit/quota handling.

### Phase 9 — Frontend: funding survey + tenant funnels live
Deploy **from a branch containing the funding survey**. Add DNS `A` records for `funding` and `grants` → 62.72.16.32; verify `getTenantForHost` resolves them to the `funded-growth` tenant. Smoke the survey, CTA, tenant funnels, and package → checkout → confirmation with white-label theming on every public surface.

### Phase 10 — Secrets hygiene & key rotation
Rotate the four provider keys that appeared in session tool logs (never committed, but rotate to be safe). Confirm `.env*` git-ignored; only `.env.example` committed. Restrict the Google key to Places API + server IP. Update local + VPS `.env`, restart the stack. Document cadence in `API_KEYS.md`.

### Phase 11 — Full verification & live smoke tests
Hard gate before every deploy: `npm test` green + `npm run build` clean. Post-deploy smoke on the live URL: `/`, `/t/funded-growth`, funding subdomain, `/admin` login, one prospecting search, one outreach action, one Stripe test, one inbound call, one AI feature. Address the 2 moderate npm advisories. Run an independent verification pass with a subagent.

### Phase 12 — Launch hardening & ongoing ops
Uptime monitor on dgtlmag.com (catch the next 502 automatically), scheduled DB backups, log-review routine, incident + rollback runbook, confirm LetsEncrypt auto-renew. Then package into the sellable B2B offer (onboarding + reporting — Sprint 2).

---

## 3. The live env file checklist (VPS `/opt/content-checkout-funnel/.env`)

| Var | Purpose | Status to reach |
|---|---|---|
| `POSTGRES_DB/USER/PASSWORD` | Private Postgres | Strong generated password |
| `DATABASE_URL` | App → Postgres | Built from POSTGRES_* by compose |
| `OWNER_EMAIL/NAME`, `TEAM_NAME`, **`TEAM_SLUG=default`** | Owner + team | Set; slug MUST be `default` |
| `SESSION_SECRET` | Session signing | Strong generated, no default |
| `PUBLIC_APP_URL` / `NEXT_PUBLIC_APP_URL` | App origin | `https://dgtlmag.com` |
| `CLAUDE_CODE_OAUTH_TOKEN` **or** `ANTHROPIC_API_KEY` | AI features | One set |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Live checkout | `sk_live_` + dashboard `whsec_` |
| `RESEND_API_KEY` | Outreach email | Set + verified domain |
| `GOOGLE_PLACES_API_KEY` / `HUNTER_API_KEY` / `APOLLO_API_KEY` | Prospecting | Set + live-validated |
| `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TELEPHONY_WEBHOOK_BASE_URL` | Telephony | Set; base URL byte-exact |
| `OPENAI_API_KEY` | Optional LLM brief | Optional |

---

## 4. Guardrails (do not violate)

- Never delete worktrees, reset branches, force-push, or clean files without explicit confirmation.
- `git status --short --branch` before editing; `npm test` + `npm run build` before committing/deploying.
- Back up Postgres before every redeploy/migration.
- Outreach is human-approved only — never auto-send.
- Never commit secrets; live values live only in the VPS `.env`.
- Keep the work in **Repo 1**. Don't start parallel work in Repo 2.

---

## 5. What needs *your* hands (cannot be automated from here)

Issuing/pasting live secrets into third-party dashboards: Stripe live keys + webhook, Anthropic token, Twilio number purchase + Account SID/Auth Token, Resend domain DNS verification, and key rotations. Everything else (diagnosis, code, config, deploy commands, verification) can be driven from here with your VPS access.
