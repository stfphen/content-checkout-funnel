---
title: 16 · Design System & Mobile-First
type: reference
tags: [architecture, design]
status: stable
updated: 2026-06-27
source: DESIGN.md, docs/prompts/mobile-first-ui-overhaul.md, docs/specs/mobile-audit.md
---

# Design System & Mobile-First

## Stack additions
- **Fonts** (`next/font/google`, wired in `app/layout.jsx`): **Inter** (`--font-sans`, body/UI) + **Sora** (`--font-display`, headlines). *Never redefine these vars in CSS or they clobber the webfonts.*
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

Up: [[10-Architecture-MOC]]
