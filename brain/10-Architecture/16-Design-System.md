---
title: 16 · Design System & Mobile-First
type: reference
tags: [architecture, design]
status: stable
updated: 2026-06-30
source: DESIGN.md, docs/prompts/ui-ux-overhaul.md, docs/specs/ui-overhaul-audit.md, docs/specs/ui-overhaul-build-plan.md, docs/specs/mobile-audit.md
---

# Design System & Mobile-First

## Stack additions
- **Fonts** (`next/font/google`, wired in `app/layout.jsx`): **Geist** (`--font-sans`, body **and** headings) + **Geist Mono** (`--font-mono`, data/numbers/code). One calm technical-premium family for everything; `--font-display` simply **aliases** `--font-sans`. *Never redefine these vars in CSS or they clobber the webfonts.* (Swapped from the earlier Inter/Sora pairing in the Direction C overhaul — see below.)
- **framer-motion** — scroll reveals, hero stagger, admin tab transitions.
- **lucide-react** — admin nav + toggle icons.

## Design tokens (`styles.css :root`, ~82KB stylesheet)
- **Brand tokens are a contract** — `--blue`, `--blue-dark`, `--accent` are injected **per tenant** by `lib/branding.js`. Never override in base/theme rules. See [[15-Multi-Tenancy]].
- Semantic surface tokens: `--bg`, `--surface`, `--surface-2`, `--border`, `--fg`, `--fg-muted` (these are what dark theme re-points).
- Scales: type `--text-xs … --text-7xl`; spacing `--space-1 … --space-24`.
- Elevation: `--shadow-sm` / `--shadow` / `--shadow-lg` / `--shadow-brand`.
- Motion: `--ease-out`, `--ease-spring`, `--dur-fast` / `--dur` / `--dur-slow`.

## Dark mode (admin only)
- Scoped to `.v2-admin-shell[data-theme="dark"]` — the public funnel never has this ancestor (light = best for conversion + tenant branding).
- Mechanism: the dark scope **re-points palette tokens** so existing `var(--white)` etc. flip automatically; brand tokens stay put so tenant accents still pop.
- Toggle in `AdminTabbedShell.jsx`: persisted to `localStorage` (`admin-theme`), defaulted from `prefers-color-scheme`, resolved post-mount (no hydration flash; shell hidden until resolved).

## Motion conventions
- `components/motion/Reveal.jsx` — wrap a section's inner container; fades/slides up once on scroll.
- `components/motion/Stagger.jsx` — `Stagger` + `StaggerItem` for grids/lists.
- Admin tab panels cross-fade (`AdminTabPanel`).
- **All motion disabled under `prefers-reduced-motion`** (component-level `useReducedMotion` + global CSS fallback).

## Mobile-first overhaul (shipped — see [[51-Timeline]] 2026-06-26)
The app was originally **desktop-first** (max-width breakpoints 370/560/880/1023 + one `min-width:1024px`). A 3-phase overhaul made it mobile-first.
- **Reference pattern:** `components/funding/FundingSurveyWidget.module.css` (single-column base, enhanced at `min-width`).
- **Constraint:** CSS custom properties **cannot** be used in `@media` conditions — standardize on base / `min-width:768px` / `min-width:1024px`.
- **Changes shipped:** bottom nav capped at ≤5 slots + "More" overflow sheet (`AdminTabbedShell`); admin tables stack into labeled cards on small screens (`CallsTable`, `.v2-table`); advanced lead-edit fields collapse behind "More" / `<details>`; funding review checklist pinned to top of lead card; funnel/checkout grids made mobile-first with `minmax` guards.
- **Test viewports:** 360/375/390/414/768/1024/1280 + 375×667/390×667 + short heights.
- Audit doc: `docs/specs/mobile-audit.md`.

## Full UI/UX + performance overhaul — Phases 0–5 SHIPPED on `feature/ui-overhaul` (Direction C)
A gated, multi-phase reskin of the **whole product** (admin shell + all tabs + public funnel/checkout)
to a modern-SaaS standard, trimming CSS/bundle weight. Brief at `docs/prompts/ui-ux-overhaul.md`; it
**preserves the contracts above** — per-tenant brand tokens, admin-scoped dark mode, mobile-first
`min-width` breakpoints, and the `next/font` vars. The Phase-1 gate **chose Direction C — "Editorial
brand-forward"**: one language in two densities (editorial funnel with big type / whitespace / accent
bands; quieter, denser admin with restrained accent + hairline borders), mostly-flat elevation,
restrained 10px radii, AA-by-construction against any tenant accent. Work lives on branch
`feature/ui-overhaul`.

Phase status (all phases run 2026-06-30; build + 202 tests green; final numbers in `docs/specs/ui-overhaul-build-plan.md`):
- ✅ **Phase 0** — `integration/ui-overhaul` (committed enterprise MVP `87f94a6`) + `feature/ui-overhaul`; perf baseline captured.
- ✅ **Phase 1** — audit + design language + throwaway preview (`docs/specs/ui-overhaul-audit.md`, `docs/specs/ui-preview.html`); Direction C chosen.
- ✅ **Phase 2** — token foundation + `.ui-*` primitives. **Implemented as `color-mix` derivations over the semantic tokens** (state trios, `--surface-3`/`--fg-subtle`/`--border-subtle/-strong`, `--ring/--hover-fill/--active-fill/--overlay`, `--accent-band/-soft`) — **not** the `--n0…--n950` ramp (that lives only in `ui-preview.html`); brand tokens untouched. (Geist swap predates this run.) ⚠️ **Dark-mode correction (07-01, `f3f7eef`):** these derived tokens do **not** auto-adapt just by re-pointing primitives — declared only at `:root`, their `color-mix()` bakes in the LIGHT `--surface/--fg/--border` and inherits into the dark shell unchanged. They must be **re-declared inside `.v2-admin-shell[data-theme="dark"]`** to re-resolve against the dark primitives (now done for the `-bg/-fg`, border, interaction-fill and accent-band tokens). Any *new* derived token added at `:root` needs a matching dark-scope re-declaration.
- ✅ **Phase 3** — admin shell editorial refinement (accent nav active + eyebrows) + component states (`OutreachQueueBuilder` `.ui-empty`, `RecordingButton` error note).
- ✅ **Phase 4** — funnel + funding-widget cohesion (accent eyebrows on light sections; funding CTA `--on-blue`/`--danger`). *Light-touch — funnel was already editorial; deep per-surface reskin not exhaustive.*
- ✅ **Phase 5** — hero `next/image` → funnel Lighthouse **desktop 86→100, mobile 75→92** (LCP 15.7s→3.1s), CLS 0. *Admin code-split + CSS consolidation deferred (see build-plan "follow-ups").*
- ⚠️ **Before merge (deferred-items pass, 07-01 — in progress):** ✅ funding review-banner reposition done (sticky/dismissible/tokenized, `f3f7eef`); ✅ dark-mode derived-token bug fixed (same commit). **Still open:** deep table/panel reskin, CSS consolidation (styles.css still ~88.7 kB), optional admin code-split, and full browser visual-regression QA across all breakpoints (narrow widths via the iframe harness — the automation window won't shrink below ~500px).

See [[51-Timeline]] · [[52-Decision-Log]].

Up: [[10-Architecture-MOC]]
