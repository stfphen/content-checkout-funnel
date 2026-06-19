# Design System — UI Redesign (preview)

Branch: `ui-redesign-preview`. A bold/editorial visual refresh layered on top of the
existing structure. No class names or DOM were restructured — this is a new skin +
motion, so it can be A/B compared against `main` with low risk.

## Stack additions
- `next/font/google` — **Inter** (`--font-sans`, body/UI) + **Sora** (`--font-display`,
  headlines). Wired in `app/layout.jsx`; never redefine these vars in CSS or they clobber the webfonts.
- `framer-motion` — scroll reveals, hero stagger, admin tab transitions.
- `lucide-react` — consistent admin nav + toggle icons.

## Design tokens (`styles.css` `:root`)
- **Brand tokens are a contract.** `--blue`, `--blue-dark`, `--accent` are injected
  per tenant by `lib/branding.js`. Never override them in base/theme rules.
- Semantic surface tokens: `--bg`, `--surface`, `--surface-2`, `--border`, `--fg`,
  `--fg-muted` (these are what the dark theme re-points).
- Scales: type `--text-xs … --text-7xl`, spacing `--space-1 … --space-24`.
- Elevation: layered `--shadow-sm` / `--shadow` / `--shadow-lg` + `--shadow-brand`.
- Motion: `--ease-out`, `--ease-spring`, `--dur-fast` / `--dur` / `--dur-slow`.

## Dark mode (admin only)
- Scoped to `.v2-admin-shell[data-theme="dark"]`. The public funnel never has this
  ancestor, so it is unaffected (light = best for conversion + tenant branding).
- Mechanism: the dark scope **re-points the palette tokens** (`--white`, `--soft`,
  `--black`, `--muted`, `--line`, …) so the many existing `var(--white)` etc. usages
  flip automatically. Brand tokens stay put so tenant accents still pop.
- Toggle lives in `AdminTabbedShell.jsx`: persisted to `localStorage` (`admin-theme`),
  defaulted from `prefers-color-scheme`, resolved post-mount to avoid hydration
  mismatch. Shell is hidden until `data-theme` resolves (no flash).

## Motion conventions
- `components/motion/Reveal.jsx` — wrap a section's inner container; it becomes the
  motion element (no extra nesting) and fades/slides up once on scroll.
- `components/motion/Stagger.jsx` — `Stagger` + `StaggerItem` for grids/lists (cards,
  timeline, packages) so children cascade in.
- Admin tab panels cross-fade on switch (`AdminTabPanel`).
- All motion is disabled under `prefers-reduced-motion` (component-level via
  `useReducedMotion` + a global CSS fallback).

## Reduced motion
`@media (prefers-reduced-motion: reduce)` neutralizes transitions/animations and
disables smooth scroll globally.
