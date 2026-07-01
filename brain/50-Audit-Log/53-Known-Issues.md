---
title: 53 · Known Issues, Risks & Tech Debt
type: log
tags: [audit, security]
status: living
updated: 2026-07-01
source: docs/SECURITY_REVIEW.md, status docs
---

# Known Issues, Risks & Tech Debt

Open problems. Full security analysis in [[61-Security-Review]]. **Update status here as items are fixed.**

## 🔴 Security — Critical
| ID | Issue | Location | Fix |
|---|---|---|---|
| **C1** | Live API keys were in plaintext `.env`, exposed in session logs (Resend/Google/Hunter/Apollo). | `.env` | Rotate all four. [[44-Secrets-And-Rotation]] |
| **C2** | **SSRF** in lead-enrichment website fetcher — follows redirects, no scheme allowlist, no block on localhost/169.254.169.254/RFC-1918. `websiteUrl` is attacker-controllable via **public** `POST /api/leads` + `/api/funding/survey`. | `lib/enrichment/website.js:370-382` | Scheme allowlist + private-IP block + redirect validation. [[24-Enrichment]] |

## 🟠 Security — High
| ID | Issue | Location | Fix |
|---|---|---|---|
| **H1** | No rate limiting anywhere (no `middleware.ts`); unthrottled bcrypt on login → brute-force/DoS. | global / `POST /api/admin/login` | Add rate limiting middleware. |
| **H2** | Cross-tenant **IDOR** — enrich routes use bare `getAdminSession()`, no `teamId` scoping. | `app/api/admin/leads/enrich/route.js:7-13`, `enrich-batch/route.js:9-20` | Use `requireRole` + team scope. [[21-Admin-Shell]] |
| **H3** | Weak prod DB password `content_funnel`. | VPS `.env` | Strong generated password. [[44-Secrets-And-Rotation]] |

## 🟡 Security — Medium / Low
| ID | Issue | Location |
|---|---|---|
| **M1** | Public endpoints let client set internal lead fields (`pipelineStatus`, `leadScore`, `assignedTo`, `tenantId`, `teamId`). | `/api/leads`, `/api/funding/survey` |
| **M2** | `tenantId`/`teamId` trusted from anonymous callers. | `lib/store.js:785` |
| **M3** | Unsubscribe is unauthenticated GET, not team-scoped. | `app/api/unsubscribe/route.js:5-16` |
| **L1** | `permissionDeniedResponse` returns 303 redirect even on JSON APIs. | `lib/permissions.js:67-69` |
| **L2** | `SESSION_SECRET` referenced in docs/`.env.example` but never read in code. | — |
| **L3** | Historic `.env.example` shipped `ADMIN_PASSWORD=change-this-password` placeholder. | — |

## ⚙️ Operational / tech debt
- ✅ **RESOLVED (06-29): stale `.git/*.lock` files cleared** — git ref ops work again (commits flowing on `feature/ui-overhaul`). No lock files remain.
- ✅ **RESOLVED (06-29): enterprise-prospecting MVP committed** (`87f94a6`); `lib/enterpriseProspecting/*`, `app/api/admin/accounts/**`, `AccountsPanel.jsx`, `migrations/006_*`, seed + tests are now tracked. ⚠️ Still run `npm run migrate` + `npm run build` on a real machine before deploy (sandbox lacks Linux SWC). [[2C-Enterprise-Prospecting]]
- **Pre-existing test flake in sandbox:** `tests/core.test.js` → "updateLeadResearch works in file-store mode" fails with `EPERM unlink data/app-store.json` (old test deletes the real store file; sandbox FS forbids it). Passes on a normal filesystem. Not a code defect; consider migrating that test to the `APP_STORE_PATH`-tmpdir isolation pattern. [[62-Testing]]
- **`next build` can't run in the cloud sandbox** (only the macOS SWC binary is vendored; no Linux/wasm SWC + no npm network). Build/typecheck must run on the operator's machine or CI.
- **Branch sprawl** (~15+ local + backups + wip/rescue + remotes) — needs consolidation. [[47-Git-Workflow]]
- **`team_default` workaround** — built-in tenants tied to one team; blocks clean multi-team onboarding. [[15-Multi-Tenancy]] / [[33-Sprint-2-Productization]]
- **No `lint` script** despite the mobile prompt referencing `npm run lint`. [[11-Tech-Stack]]
- **2 moderate npm advisories** (`npm install`) — not yet addressed.
- **VPS drift risk** — VPS has run snapshots far behind `main`; add an uptime monitor (Phase 12) to catch 502s automatically. [[42-Go-Live-Plan]]
- Provider hardening (retries/rate-limits/quota) outstanding. [[23-Prospecting]]
- **PLANNED-SURFACE (watch): media upload endpoints** — the proposed portfolio/media library
  ([[2D-Portfolio-Media]]) adds a file-upload surface (`POST /api/admin/media`). It must ship **after** the
  open security fixes and with: mime allowlist + magic-byte sniff, size caps, team-scoped IDOR checks
  (cf. H2), rate limiting (cf. H1), path-traversal-safe storage keys, and SSRF guards on any server-side
  URL fetch/thumbnailing (cf. C2). Do not point `next/image` at arbitrary uploaded remote hosts.

## Top-5 fix order (from the security review)
1. Rotate keys + strong DB password (C1, H3). 2. SSRF guard (C2). 3. Rate limiting (H1). 4. Fix the two enrich routes (H2). 5. Lock down public lead creation (M1/M2).

Up: [[50-Audit-Log-MOC]]
