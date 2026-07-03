---
title: 00 · Home (Master MOC)
type: moc
tags: [moc, home]
status: living
updated: 2026-07-02
---

# 🏠 Home — Content Checkout Funnel

> **Read this first in every session.** This is the master Map of Content for the project brain.

## What this project is
A **multi-tenant, white-label B2B sales-funnel + admin platform** for DGTL-style creative &
marketing services, plus a **funding-readiness ("grant opportunity") engine** for Canadian
businesses. Built on **Next.js 15 / React 19 / Postgres**. See [[11-Tech-Stack]] and
[[12-Repo-Structure]].

One-line mental model: *prospects enter through tenant-branded funnels → become leads →
get enriched / researched / scored → routed into outreach, telephony, checkout, or funding
review → all tenant-scoped, permissioned, and audit-logged.*

## 🚦 Start-of-session checklist (for Claude)
1. Read [[31-Current-Priorities]] and [[53-Known-Issues]].
2. Run `git status --short --branch` (guardrails in [[47-Git-Workflow]]).
3. Skim the latest entries in [[51-Timeline]].
4. Re-read [[CLAUDE-Operating-Rules]] before any git/file mutation.
5. For module work, open the matching note in [[20-Modules-MOC]].
6. Visual overviews: [[Vault-Dashboard.base|Vault dashboard]] (note health/staleness) · [[Product-Map.canvas|Product map]] (module flow).

## 🗺️ The four maps
- 🏛️ [[10-Architecture-MOC]] — how the system is built.
- 🧩 [[20-Modules-MOC]] — what each subsystem does (deep notes).
- 🛣️ [[30-Roadmap-MOC]] — where it's going.
- ⚙️ [[40-Operations-MOC]] — how to run, deploy, and secure it.

## 📚 Supporting maps
- 📓 [[50-Audit-Log-MOC]] — history, decisions, issues, session logs.
- 🔎 [[60-Reference-MOC]] — security, testing, tenants, external services.

## ⭐ Most-referenced notes
- [[CLAUDE-Operating-Rules]] — hard guardrails (mirrors repo `CLAUDE.md`).
- [[12-Repo-Structure]] — full directory tree.
- [[13-Data-Model]] — DB tables & migrations.
- [[14-Routes-Map]] — every page + API route.
- [[43-Environment-Variables]] — every env var and what it powers.
- [[42-Go-Live-Plan]] — the 12-phase production plan.
- [[29-Funding-Program]] — the biggest/newest subsystem.

## 🧭 Status at a glance (2026-07-02, post-consolidation)
- **Current priority:** redeploy the consolidated tip, then the remaining ops/security items. See [[31-Current-Priorities]].
- **Active branch:** `main` @ `716e5b2`, **pushed** — consolidation merged `audit/2026-07-02` (security fixes C2/H1/H2/M1/M2/L1 + admin **Dark Command-Center** reskin) and `feature/funnel-design-control` (design directions, tenant editor, copy limits, media library + migration 007). **272/272 tests + build green + runtime smoke on the merged tip.**
- **Deploy target:** `dgtlmag.com` on Hostinger VPS `62.72.16.32` — **LIVE at `main@44187af` (2026-07-03 evening: YouTube hero shipped, smoke green, zero-downtime cutover)**. Production tracks `main`. See `docs/DEPLOY_NEXT.md` / [[41-Deployment-Runbook]].
- **Biggest open risks:** C1 key rotation + H3 DB password (ops), **H4** unsubscribe global-suppression amplification, pg-vs-file-store dedupe parity (HIGH), outreach double-send / Stripe idempotency / batch-import idempotency; `npm audit` 2 moderate accepted (L6). See [[53-Known-Issues]].
- **Recently shipped:** Funnel Design Control (5 design directions, draft editor, media library) · codebase audit fixes · dark-first admin. See [[51-Timeline]] / [[16-Design-System]] / [[2D-Portfolio-Media]].
- **Next big build:** redeploy → remaining security/ops items → PR #2 (prospect enrichment) decision → Sprint-2 productization. See [[33-Sprint-2-Productization]].

---
*Maintained as a living document. When project reality changes, update the relevant note and add a line to [[51-Timeline]].*
