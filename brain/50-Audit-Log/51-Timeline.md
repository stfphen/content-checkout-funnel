---
title: 51 · Project Timeline
type: log
tags: [audit]
status: living
updated: 2026-06-27
---

# Project Timeline

Chronological history, reconstructed from repo docs + git. **Append newest entries at the top.**
Dates are from doc timestamps / commit themes; treat older "status" claims as point-in-time snapshots.

## 2026-06
- **06-27** — **ON Home Decor** onboarded as a built-in tenant: `onHomeDecorTenant` wired into `builtInTenants()` (`lib/store.js`) and the `npm run seed:tenants` list. Toronto/GTA interior-design + paint funnel migrated from a standalone Lovable site; `$200` *Curated Paint Selection* entry offer (`curated-paint-selection`) laddering up to room styling, kitchen/bath, and full-home renovation design. See [[63-Tenants-Catalog]].
- **06-27** — Added [[Architecture]] overview note (single-page map: components, tenant system, admin dashboard) under `10-Architecture/`; linked from [[10-Architecture-MOC]].
- **06-27** — 🧠 Built this Obsidian knowledge vault (`brain/`) consolidating all project context.
- **~06-26** — **Mobile-first UI overhaul** merged to `main` (audit U1–U5): bottom nav capped at ≤5 + "More" sheet, admin tables → stacked cards, advanced lead fields collapsed, funding review checklist pinned, funnel grids mobile-first with `minmax` guards. Phase 1 audit → `docs/specs/mobile-audit.md`.
- **~06-25** — Telephony deepening: Calls-tab dialpad for ad-hoc calls; **owner-gated call delete** (email-gated to `stephen@dgtlgroup.io`); in-app **Deepgram transcription + Claude summary** (no Twilio CI dependency) with manual Transcribe button; authenticated recording proxy so Twilio recordings play in-browser; Twilio Conversational Intelligence + Claude summaries.
- **~06-24/25** — Telephony foundation: **mock provider + simulated call lifecycle**, real recording + consent webhook, recording player UI. Provider seam (`getProvider`) for twilio/telnyx/mock.
- **06-22** — Dockerfile updated (non-root node user so the Claude Agent SDK CLI works in-container).
- **06-21** — **Go-live progress (RESUME_HERE):** Live **502 fixed** — root cause Next.js 15 bound to container-id hostname instead of `0.0.0.0`; fixed via `HOSTNAME=0.0.0.0` in `docker-compose.yml`; site returns 200. GitHub set as source of truth (`origin/main`). Branch hygiene: 9 local + 7 remote merged branches pruned (recoverable bundle kept). Diagnosed VPS running a months-old snapshot (`9e11b81`) with no unique work — ready to fast-forward.
- **06-20** — **Go-Live Plan authored** (12 phases). Branding: per-tenant app icon + DM lightning default. `.env.example` expanded.
- **06-18** — **PROJECT_STATUS snapshot:** `main` stable with PR #2 (AI prospect enrichment) merged. `feature/funding-program-v1` adds Funding Program V1 + real Stripe checkout, verified on local Postgres (**101/101 tests**, clean build). Worktree cleanup: removed 10 redundant enrichment worktrees/branches (backup retained). Production status observed: DNS/TLS healthy but `https://dgtlmag.com/` returning **502** (app container down).
- **06-17** — Demo flow documented. Funding admin engine ported from `project-worker-2`.
- **~06-09 to 06-16** — Project foundation: Next.js SaaS scaffold, tenant funnels, admin login, lead pipeline V1, prospecting batch builder, outreach sequence V1, CSV import, migrations 001–005, Docker/Traefik setup, design-system reskin (Inter/Sora + framer-motion).

## How to read the snapshots
PROJECT_STATUS (06-18) and RESUME_HERE (06-21) reference branches (`feature/funding-program-v1`,
`project-worker-2`) that have since been merged/superseded — current `main` already contains funding +
Stripe + telephony + mobile-first. Always re-confirm with `git log` ([[47-Git-Workflow]]).

Up: [[50-Audit-Log-MOC]]
