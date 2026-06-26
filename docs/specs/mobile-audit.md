# Mobile-First Audit — Content Checkout Funnel

> Phase 1 deliverable. Verified against the code (exact files/lines). Companion to the
> implementation plan; see `docs/prompts/mobile-first-ui-overhaul.md` for the source brief.

## Summary

`styles.css` is desktop-first: it uses **only `max-width`** breakpoints (370 / 560 / 880 / 1023px)
plus a single `min-width: 1024px` for the desktop sidebar. Several admin tables hard-code
`min-width: 920–980px` with **no small-screen media query at all**, forcing horizontal scroll on
every phone. The inline lead editor renders ~13 fields on phones, the bottom nav packs 7 items, and
the funding "Human review checklist" renders mid-way down the lead-detail panel. The correct
mobile-first pattern already in the repo is `components/funding/FundingSurveyWidget.module.css`
(single-column base, enhanced at `min-width: 520px`) — used as the reference for everything below.

Reusable design tokens (`styles.css:1–90`): spacing `--space-1..-24`, `--radius/-sm/-lg/-xl`,
surfaces `--surface/-2`, `--border`, `--fg/-muted`, status colors `--success/--warn/--danger`,
brand `--blue/-dark`. Reusable fixed-position patterns: `.toast` (`984–1007`, uses
`env(safe-area-inset-bottom)`) and `.status-pill` (`1562+`).

## Breakpoints to invert (desktop-first → mobile-first)

| Value | Type today | Lines (examples) | Target |
|-------|-----------|------------------|--------|
| 370px | max-width | 1290 | small-phone tweaks (keep as base refinement) |
| 560px | max-width | 1105, 3399, 3418, 3427 | keep for small phones, but as enhancement-relative |
| 880px | max-width | 1023, 2619, 2930, 3396 | replace with `min-width:768px`/`1024px` enhancements |
| 1023px | max-width | 3408, 3435 | fold into mobile base + `min-width:1024px` |
| 1024px | **min-width** | 308, 315, 2832, 3035, 3104, 3811 | already mobile-first — keep |
| 520px | min-width (module) | FundingSurveyWidget.module.css:50 | reference pattern |

**Constraint:** CSS custom properties **cannot** be used in `@media` conditions
(`@media (min-width: var(--bp-md))` is invalid CSS). A breakpoint "token layer" can only be a
documented comment/convention — standardize on **base / `min-width:768px` / `min-width:1024px`**,
keeping `560` where already used. No Tailwind, no new deps.

## Findings by area

### A. Admin shell & nav — `components/admin/AdminTabbedShell.jsx`, `styles.css` ~91–180
| File:line | Problem | Fix (one line) |
|-----------|---------|----------------|
| `AdminTabbedShell.jsx:22–30` | 7-item bottom nav (Pipeline, Funding, Prospecting, Outreach, Calls, Tenants, Team) | Show ≤5 primary on mobile; overflow rest into a "More" sheet |
| `styles.css:~134` | `.v2-nav-item` label 10px, no horizontal padding | Add padding + min 44px touch target; legible label |
| `styles.css:111` | `.v2-nav-container width: min(400px, …)` → ~38px/item at 320px | Fewer items removes the squeeze; keep `min()` base |
| `AdminTabbedShell.jsx:128` | Header logout present; nav logout `desktop-only` | Acceptable — leave as-is |

### B. Pipeline + funding review notice — `app/admin/page.jsx:571–613`, `styles.css:1524–1560`, `lib/funding/review.js`
| File:line | Problem | Fix |
|-----------|---------|-----|
| `app/admin/page.jsx:571–613` | `.funding-review` "Human review checklist" is an inline **form** rendered after the survey block, before closer-handoff → lands mid-page on tall detail panels | Move to top of lead-detail as pinned `sticky` status banner (reuse `status-pill`); full checklist form in collapsed `<details>` (collapsed on mobile) |
| `styles.css:1524–1560` | `.funding-review` has no mobile-specific layout | Add base padding/typography; sticky header |
| `AdminTabbedShell.jsx:134` / `.admin-notice` | Generic `notice` banner renders at top correctly | Minor mobile padding only (low priority) |
| `lib/funding/review.js` | `FUNDING_REVIEW_ITEMS` / `buildReviewState` | **No change** — presentation only |

### C. Tables — critical, no mobile fallback today
| File:line | Problem | Fix |
|-----------|---------|-----|
| `styles.css:2384–2410` (`.calls-table`) | `white-space: nowrap` on all cells, 8 cols, only `overflow-x:auto` | Card/stacked below 1024px via `data-label`; drop nowrap on mobile |
| `styles.css:2302–2310` (`.team-users-table__row`) | `min-width:920px`, 6-col grid, **no media query** | Stack to 1-col card below 1024px |
| `styles.css:2476–2489` (`.lead-table__head/__row/__entry`) | `min-width:980px`, 5-col, **no media query** | Card/stacked below 1024px |
| `styles.css:2053–2057` (`.outreach-builder`) | 3-col ~800px min, collapses only at 880px | Base 1-col; 3-col at `min-width:1024px` |
| `styles.css:1924–1929` (`.lead-filters`) | ~740px min until 880px | Base 1-col; multi-col at `min-width:768px` |
| `styles.css:2200–2211` (`.lead-detail-grid`/`.lead-facts`) | 2-col until 880px, cramps 360–880px | Base 1-col; 2-col at `min-width:1024px` |
| `styles.css:1857–1862` (`.batch-builder`) | 2-col, 280px sidebar until 880px | Base 1-col; 2-col at `min-width:1024px` |
| `styles.css:1351` (`.admin-metrics`) | 5-col → 2-col at 880px, none for phones | Add 1-col base / 2-col at `min-width:560px` |

### D. Forms / field reduction — `app/admin/page.jsx` inline lead edit
| File:line | Problem | Fix |
|-----------|---------|-----|
| `app/admin/page.jsx` inline lead editor (~13 fields) | Full desktop field set shown on phones | Keep essentials (Status, Assigned To, Next Follow-up, Notes); advanced fields in `<details class="admin-form__more">` collapsed on mobile; all fields still submit |
| `styles.css:1838–1842, 2248–2267` (`.admin-form`) | Already single-column + `width:100%` | **No layout change** — only add `.admin-form__more` styling |
| `TenantBuilder.jsx` (4 fields), `OutreachQueueBuilder.jsx` form | Stack fine | No change (wrapper handled in C) |

### E. Funnel / checkout — `components/FunnelPage.jsx`, `styles.css`
| File:line | Problem | Fix |
|-----------|---------|-----|
| `styles.css:784, 689, 958, 714` (`.package-grid`/`.problem__grid`/`.faq-grid`/`.feature-row`) | Desktop-first `repeat(2|3,…)` base, collapse at 880px; `.feature-row`/`.faq-grid` lack `minmax(0,…)` guards | Mobile-first single-col base + `min-width` enhancement; add `minmax(0,1fr)` guards |
| `styles.css:882, 765` (`.checkout-layout`, `.content-grid`) | Work but inconsistent breakpoints | Align to mobile-first (low priority) |
| Checkout inputs | Already `width:100%`, 16px (no iOS zoom) | No change |

## Tested viewports (to re-verify after each fix)
360 · 375 · 390 · 414 · 768 · 1024 · 1280 (widths) and 375×667 · 390×667 (short heights).
**Expected after fixes:** no horizontal overflow/clipping; tables read as labeled stacked cards on
phones; nav ≤5 items with ≥44px targets; funding checklist pinned + collapsible; lead form shows
essentials only; desktop (≥1024px) visually unchanged.
