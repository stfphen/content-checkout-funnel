# Mobile-First Responsive Audit — Content Checkout Funnel

**Date:** 2026-06-25
**Branch:** `claude/mobile-first-redesign-rzgotz`
**Scope:** Make the app genuinely mobile-first and usable on phones without regressing
desktop. This document is the Phase 1 audit; the prioritized fix plan follows in
[Phase 2](#phase-2--prioritized-fix-plan).

## Summary

`styles.css` is largely **desktop-first**: the funnel and admin grids are authored at full
width and torn down with `max-width` breakpoints (1080 / 880 / 560 / 370 / 1023). Several
data tables rely on `white-space: nowrap` + `overflow-x` (or a hard `min-width: 920px`) with
no small-screen fallback, so they can only be read by horizontal scrolling on a phone. The
admin shell nav is **already partly mobile-first** (fixed bottom bar by default → sidebar at
`min-width: 1024px`) but crowds 7 destinations into a 400px bar.

The repo already contains the correct reference pattern:
`components/funding/FundingSurveyWidget.module.css` (single-column base, enhanced with
`@media (min-width: 520px)`). A complete design-token layer exists in `styles.css` lines
1–94 (`--space-*`, `--text-*`, `--radius-*`, `--shadow-*`, colors, motion) and is reused for
all new rules.

**Technical constraint:** CSS custom properties cannot be used inside `@media` conditions,
so no `--bp-*` breakpoint tokens are added. New mobile-first rules standardize on
`min-width: 768px` and `min-width: 1024px`. Existing `max-width` overrides are kept where
inverting them would risk desktop; only rules tied to a listed bug are converted.

---

## A. Admin shell / navigation

| File | Problem | Fix |
|---|---|---|
| `components/admin/AdminTabbedShell.jsx:22-30` | 7-item bottom nav (Pipeline, Funding, Prospecting, Outreach, Calls, Tenants, Team); 10px labels; cramped at 360px | Split into ~4 primary tabs + a "More" overflow sheet on mobile |
| `styles.css` `.v2-nav-item` (~105-123) | Tap area only `flex:1`; 10px font; no min height | Enforce `min-height` ≥ 56px touch target on the mobile bar |
| `styles.css` `.v2-dashboard-main` (~159) | Hardcoded `padding-bottom: 100px` blunt buffer | Fluid `clamp()` so content clears the fixed nav on short screens |

Nav is already partly mobile-first; keep the fixed-bottom → sidebar structure, only reduce
item count and enlarge targets.

## B. Pipeline + funding review notice

| File | Problem | Fix |
|---|---|---|
| `app/admin/page.jsx:571+` `.funding-review` | Per-lead "Human review checklist" sprawls roughly mid-card on the Funding tab | Wrap in `<details>`, collapsed by default on mobile |
| `app/admin/page.jsx` (new) | No top-level signal of how many funding leads need human review | Pinned, dismissible banner counting leads where `buildReviewState(lead).isComplete === false` (data already computed at `app/admin/page.jsx:351`) |
| `styles.css` `.admin-notice` (~1356) + `.v2-admin-shell .admin-notice` (~3268) | Flows inline after header; not sticky/dismissible; can collide with the fixed bottom nav | Make sticky-top + dismissible toast style; add `scroll-margin-top` safety |

## C. Forms (field reduction)

| File | Problem | Fix |
|---|---|---|
| `app/admin/page.jsx:1258-1329` lead edit (13 fields) | Full desktop field set rendered on phones | Essential fields always (name, title, pipeline status, outreach status, lead score); advanced in a `<details>` "More options" |
| `styles.css` `.admin-form` (~1838) | Single-column already (good); disclosure needs styling | Style `<details>`/`summary` inside `.admin-form` |
| `styles.css` `.team-user-form` (~2285) | 2-col with no mobile collapse | 1-col base; 2-col at `min-width: 560px`+ |
| `styles.css` `.lead-detail-grid` (~2200) | 2-col at all sizes; compresses on phones | 1-col base; 2-col at `min-width: 1024px` |
| `components/admin/TenantBuilder.jsx`, `OutreachQueueBuilder.jsx` | Already single-col / `auto minmax(0,1fr) auto` | OK — verify only |

## D. Tables (card / stacked layout)

| File | Problem | Fix |
|---|---|---|
| `components/admin/CallsTable.jsx` + `.calls-table` (~2388) | 8 columns, `white-space: nowrap`, scroll-only | Drop nowrap; card/stacked layout via `data-label` at `< 768px` |
| `styles.css` `.team-users-table__row` (~2294) | `min-width: 920px` forces horizontal scroll | `min-width: unset` + 1-col card stack `< 768px` |
| `styles.css` `.outreach-metrics` (~2008) | 7-col grid → ~51px cells on phones | 2-col `< 560px` |
| `styles.css` `.admin-metrics` (~2648) | Stays 2-col at 560px | 1-col `< 560px` |
| `styles.css` `.admin-list--drafts pre` (~2462) | `overflow-x` on JSON blobs | Acceptable for code; left as-is |

## E. Funnel / checkout / tenant pages

| File | Problem | Fix |
|---|---|---|
| `styles.css` `.package` (~792) | `min-height: 520px` retained when stacked | `min-height: unset` `< 560px` |
| `styles.css` `.checkout-layout` (~881) | `gap: 54px` kept when stacked → wasted vertical space | Reduce gap `< 880px` |
| `styles.css` `.section__inner` (~654) / `.timeline li` (~747) | Gutters / index column too wide `< 370px` | Tighten gutters + shrink index column |
| `components/FunnelPage.jsx` grids (`.package-grid`, `.problem__grid`, `.faq-grid`) | Desktop-first; collapse only via max-width | Verify reflow; mostly already collapse at 880px |

Tenant-facing routes (`app/t/[slug]/page.jsx`, `app/page.jsx`) render `FunnelPage`, so they
inherit funnel fixes — no separate work.

---

## Breakpoint inventory

`max-width` breakpoints in `styles.css`: **1080, 880 (×4), 560 (×5), 370, 1023 (×2)**.
`min-width` breakpoints: **1024 (×6)** — used by the admin shell.

**Strategy:** author all NEW table/card/form rules mobile-first (base = smallest screen,
enhance with `min-width: 768px` / `min-width: 1024px`). Do **not** mechanically flip every
existing `max-width` rule — that maximizes desktop-regression risk for little gain. Invert
only the specific rules tied to a bug above.

## Viewport test matrix

| Width | Focus | Status |
|---|---|---|
| 360 | smallest phone — overflow, nav, tables | to verify |
| 375 | iPhone SE/Mini | to verify |
| 390 | iPhone 12-15 | to verify |
| 414 | large phone | to verify |
| 768 | tablet — table card→row transition | to verify |
| 1024 | desktop sidebar engages | to verify |
| 1280 | wide desktop unchanged | to verify |
| 375×667 (short) | nav clearance, sticky notice | to verify |
| 390×667 (short) | nav clearance, sticky notice | to verify |

Status filled in during Phase 3 verification.

---

## Phase 2 — Prioritized fix plan

Highest-impact / lowest-risk first; each item is one small commit on the feature branch.

0. **Audit doc** (this file). Risk: none.
1. **Funding review notice** — pinned dismissible banner + collapse per-lead checklist +
   sticky/dismissible `.admin-notice`. Files: `app/admin/page.jsx`,
   `components/admin/AdminTabbedShell.jsx`, `styles.css`. Desktop risk: low.
2. **Tables → card/stacked** — `CallsTable`, `.team-users-table`, `.outreach-metrics`,
   `.admin-metrics`. Files: `CallsTable.jsx`, `styles.css`. Desktop risk: low (gated `<768px`).
3. **Mobile nav simplification** — ~4 primary + "More" overflow, ≥56px targets, fluid
   bottom padding. Files: `AdminTabbedShell.jsx`, `styles.css`. Desktop risk: low.
4. **Mobile field reduction** — lead edit + `team-user-form` + `lead-detail-grid`. Files:
   `app/admin/page.jsx`, `styles.css`. Desktop risk: low.
5. **Funnel / checkout polish** — `.package`, `.checkout-layout`, `.section__inner`,
   `.timeline`. Files: `styles.css`, `FunnelPage.jsx` (spot-check). Desktop risk: very low.
6. **Targeted breakpoint hygiene** — convert only bug-tied rules to mobile-first; apply the
   FundingSurveyWidget base-then-`min-width` pattern to new shared classes. Desktop risk: low.

## Acceptance criteria

- No horizontal overflow / clipped content at 360–1280px or at short heights.
- All data tables present a readable stacked/card layout on phones (no nowrap scroll-only).
- Mobile nav: fewer top-level destinations, larger touch targets, no nested maze.
- Mobile forms show only essential fields; advanced collapsed behind a disclosure.
- Funding review notification renders in a fixed, expected, dismissible position everywhere.
- Desktop layout visually unchanged where it was already fine.
