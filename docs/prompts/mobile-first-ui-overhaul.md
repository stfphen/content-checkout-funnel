# Prompt: Mobile-First UI Overhaul — Content Checkout Funnel

> Paste below the line into terminal Claude from repo root. Three phases; **stop for
> approval after Phase 1 (audit) and Phase 2 (plan) before writing UI code.**

---

Work in the Content Checkout Funnel repo. Read `CLAUDE.md` + `docs/specs/` and treat every
guardrail as non-negotiable (tenant-aware, mobile-first, mock-data-only, no new APIs, never
auto-send outreach, keep admin nav working, don't overbuild). Run `git status -sb` first.

## Goal
Make the app genuinely mobile-first without regressing desktop. `styles.css` is desktop-first
(all `max-width` breakpoints: 560/880/1023/1080); tables use `white-space:nowrap` + horizontal
scroll with no small-screen fallback; admin forms inherit desktop columns. The correct pattern
already in repo is `components/funding/FundingSurveyWidget.module.css` (single-column base,
enhanced at `min-width`) — use it as the reference for everything.

## Confirmed problems
1. **Mobile nav too complex** — `components/admin/AdminTabbedShell.jsx` (7-item bottom nav) +
   `.v2-nav-*` in `styles.css` (~91–180). Fewer destinations, bigger touch targets, no nested maze.
2. **Too many mobile fields** — lead/contact edit in `app/admin/page.jsx` (~300+), `.admin-form`
   (~2256–2280). Show only essential fields on phones; collapse the rest or make desktop-only.
3. **Funding review notification mispositioned** — opens ~halfway down the pipeline. Trace the
   `notice` prop (`app/admin/page.jsx` ~241), `.admin-notice`, `lib/funding/review.js`. Move to a
   fixed, expected, dismissible spot (pinned top banner / toast).
4. **Tables/divs don't snap to vertical resolutions** — `CallsTable.jsx` (`.calls-table` nowrap),
   `.v2-table`, `.admin-list`, and funnel grids `.package-grid`/`.problem__grid`/`.faq-grid`
   (`FunnelPage.jsx`). Add card/stacked layouts; don't rely on horizontal scroll.
5. **More throughout** — treat 1–4 as examples; find every component breaking at small/short viewports.

## Phase 1 — Audit only (NO code)
Write `docs/specs/mobile-audit.md`: every non-responsive route/component grouped by area (shell/nav,
pipeline+notice, forms, tables, funnel/checkout, tenant pages); for each give file, problem, one-line
fix. List the `max-width` breakpoints to invert. Test 360/375/390/414/768/1024/1280 + short heights
(375×667, 390×667); note failures. Reuse CSS vars in `styles.css` 1–90 — no Tailwind, no new deps.
**Stop and show me the audit.**

## Phase 2 — Plan (NO code)
Ordered, highest-impact/lowest-risk-first fix plan (expected: funding-notice → tables → mobile nav →
field reduction → funnel/checkout → global breakpoint inversion). Each item: scope, files, acceptance
criteria, desktop risk. **Stop and show me the plan.**

## Phase 3 — Implement (after approval)
One feature branch off integration; small focused commits per item. Mobile-first CSS: base = smallest
screen, enhance up with `min-width`. Never break desktop; verify each breakpoint after each change.
Reuse `lib/types` (don't redefine enums/status). Stay tenant-aware + mock-data; don't auto-send;
don't invent APIs/grants.

## Acceptance (all must pass)
- No overflow/clipping at 360–1280px or short heights.
- Tables present readable stacked/card layout on phones.
- Mobile nav: fewer top-level items, larger touch targets, no nested maze.
- Mobile forms show only essential fields; rest collapsed/desktop-only.
- Funding notification fixed, expected, dismissible on all sizes.
- Desktop unchanged where already fine.

## Verification (report exact commands + results)
`npm run lint` · `npm run build` · manual check at every breakpoint above · summarize files changed +
high-level diff. On failure, keep going / report blocker — don't mark complete. No force push, reset,
worktree deletion, or clean without my explicit confirmation.
