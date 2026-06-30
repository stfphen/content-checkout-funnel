# UI/UX Overhaul — Phase 2 Build Plan + Token Spec

> **Phase 2 deliverable.** Companion to `docs/specs/ui-overhaul-audit.md`. Branch `feature/ui-overhaul`.
> **Decision taken (Phase 1 gate): Direction C — "Editorial brand-forward".**
> This document is the **ordered build plan** for the whole overhaul. It must be approved before any
> token/app code is written. Phase 2 implements **only items 1–2 (the foundation)**; later items are
> Phases 3–5, each shipped one surface per commit behind its own gate.

---

## Direction C — design language (concrete)

One language, **two densities**: the **funnel** is editorial (big type, whitespace, accent-led
section devices); the **admin** inherits a **quieter, denser** version (restrained accent, hairline
borders, tighter spacing) so operator tables stay scannable.

- **Type:** Geist, dramatic display↔body contrast. Headlines large, weight 680–720, tracking
  `-0.02em`, line-height 1.05–1.15; body 16px / relaxed leading; numbers in Geist Mono. An
  `.eyebrow` kicker (uppercase, letterspaced, accent or muted) introduces sections.
- **Whitespace:** generous vertical section rhythm on the funnel (large `--space` steps at
  `min-width:1024px`); admin keeps compact rhythm.
- **Accent as a section device:** hero + select funnel sections use **accent bands** (full or tinted)
  with `--on-blue` text; accent rules/dividers, large accent CTAs, featured pricing in accent. Admin
  uses accent only for primary action / active nav / focus / selection.
- **Elevation:** mostly flat — type, rules, and 1px borders carry structure; shadows reserved for
  popovers/modals/toasts. **Radii** restrained (`--radius` 10px).
- **Accessible by construction:** every accent surface uses `--on-blue` (luminance-picked) for AA;
  focus ring `--ring` derived from accent; ≥44px touch targets; reduced-motion honored. Must hold for
  **any** tenant accent — validated against a non-default accent at each step.

---

## Token spec (item 1) — `styles.css :root` + dark re-point

**Keep names** for everything dark mode/branding depend on; **add** primitives + missing semantics;
**alias** legacy tokens to the new ramp so existing rules don't visually shift.

### `:root` (light)
```
/* neutral ramp (primitives) — editorial near-neutral */
--n0 #ffffff  --n50 #f8f9fb  --n100 #eef1f5 --n200 #e1e6ec --n300 #cfd6df
--n400 #97a0ad --n500 #69717e --n600 #4b515c --n700 #363b44 --n800 #20242b
--n900 #12151a --n950 #0a0c0f
/* legacy aliases (back-compat; values ~match today) */
--white→--n0  --soft→--n50  --soft-2→--n100  --muted→--n500  --near-black→--n800  --black→--n900
/* state trios */
--success #0b8a5a  --success-bg #e7f5ee  --success-fg #076b46
--warn    #b07d0a  --warn-bg    #faf1d8  --warn-fg    #7d5806
--danger  #d23123  --danger-bg  #fdeae8  --danger-fg  #a3251a
/* brand — UNCHANGED, injected per tenant on .tenant-root */
--blue --blue-dark --accent --on-blue   (+ --brand→--blue, --brand-strong→--blue-dark)
/* semantic surfaces */
--bg→--n50 --surface→--n0 --surface-2→--n50 --surface-3→--n0
--border→--n200 --border-subtle→--n100 --border-strong→--n300
--fg→--n900 --fg-muted→--n500 --fg-subtle→--n400
--ring color-mix(srgb, var(--blue) 45%, transparent)
--hover-fill color-mix(srgb, var(--n900) 4%, transparent)
--overlay color-mix(srgb, var(--n950) 55%, transparent)
--accent-band color-mix(srgb, var(--blue) 10%, var(--surface))   /* editorial section tint */
/* scales (refine existing) */
type --text-xs 12 … --text-4xl 46 --text-5xl 58 --text-6xl 72 --text-7xl 88
space --space-1 4 … --space-24 96   radii --radius-sm 6 --radius 10 --radius-lg 16 --radius-pill 999
shadow/-sm/-lg (kept)   motion --ease-out/--ease-spring/--dur-fast/--dur/--dur-slow (kept)
```
### `.v2-admin-shell[data-theme="dark"]` (admin only)
Re-point `--n0…--n950` to the inverted ramp and `--bg #0a0c0f`, `--surface/-2/-3`, `--border(-subtle/
-strong)`, `--fg/-muted/-subtle`, `--success-bg/--warn-bg/--danger-bg` (via `color-mix` over the dark
surface), `--hover-fill` (white 6%), and the shadow set. **Brand tokens stay** → tenant accent still
pops. Because tints/status are now tokens, the ~14 legacy dark hand-patches (styles 3101–3183) can be
deleted in Phase 5.

---

## Primitives / utility classes (item 2) — small, documented, additive
`.btn` + `--primary/--secondary/--ghost/--danger` (+ loading spinner state); `.input/.select/
.textarea` + focus ring; `.card` (flat hairline); `.badge--neutral/success/warn/danger/accent`;
a table shell + `data-label` "stack to cards <1024px" rule; `.skeleton`; `.empty-state`; `.toast`
(reuse existing fixed/safe-area pattern); editorial `.eyebrow` + `.display` + `.section`/`.section--accent`
(accent band) for the funnel; a `:focus-visible` ring convention. All read only `var(--…)`.

---

## Ordered build sequence (lowest-risk first)

| # | Item | Scope | Key files | Acceptance | Risk |
|---|------|-------|-----------|------------|------|
| **1** | **Token layer** *(Phase 2)* | Refresh `:root`; add ramp/state/interaction tokens; alias legacy; rebuild dark re-point | `styles.css` 1–94 + dark block | Light + admin-dark + **non-default accent** render with no regressions on existing classes; `npm run build` + `npm test` green | **Med** — re-pointing primitives can shift rules using `--white/--soft` directly → mitigate via close-value aliases; diff-check screenshots |
| **2** | **Primitives** *(Phase 2)* | Add the documented utility classes above | `styles.css` new "primitives" section | Each primitive renders in light+dark+accent; AA contrast; visible focus; ≥44px; reduced-motion ok | **Low** — additive |
| — | **▶ Phase 2 gate** | Verify foundation; commit | — | Show foundation rendering, then proceed | — |
| **3** | **Admin shell + Pipeline** *(Phase 3, GATE after)* | Reskin shell chrome/nav + one representative tab; add empty/loading/error via new primitives | `AdminTabbedShell.jsx`, `app/admin/page.jsx` (pipeline regions), `styles.css` | Nav works; all breakpoints 360–1280 + short heights, light+dark; behavior/props intact | **Med** — nav is critical; reskin only, no logic |
| **4** | **Admin: Calls** | `CallsTable`/`DialPad`/`LeadCallPanel`/`RecordingButton` (add error UX); unify table shell | those + `styles.css` | Stacked cards <1024; states present | Med |
| **5** | **Admin: Funding** | Pin review checklist to a dismissible banner (per `mobile-audit.md` B) | `app/admin/page.jsx`, `styles.css` | Banner pinned/dismissible all sizes; review logic untouched | Med |
| **6** | **Admin: Prospecting / Accounts / Outreach** | `LeadDeepResearch`/`ResearchFromQuery`/`FillMissingButton`/`AccountsPanel`/`OutreachQueueBuilder` (add error UX) | those + `styles.css` | States present; tables stack | Low–Med |
| **7** | **Admin: Tenants / Team / Login** | `TenantBuilder`/`TenantBrandingSettings`/`TenantPhoneSettings`, team table, `admin/login` | those + `styles.css` | Forms unified; login on-brand | Low |
| **8** | **Funnel** *(Phase 4)* | Editorial reskin: hero/eyebrow/sections/accent bands/packages; keep light + conversion | `FunnelPage.jsx`, `styles.css` | Correct for any accent; no mobile regressions; AA on accent bands | Med — accent-dependent |
| **9** | **Checkout + funding widget** | Reskin checkout form + package cards; align `FundingSurveyWidget.module.css` to tokens | `FunnelPage.jsx`, `components/funding/*` | Stripe/`paymentLink` branch + survey logic intact | Med |
| **10** | **Performance pass** *(Phase 5)* | `next/image` hero+logo; `next/dynamic` heavy admin panels; CSS consolidation/dead-code; narrow motion; per-icon lucide; CLS guards | `FunnelPage.jsx`, `next.config`, admin imports, `styles.css` | Funnel Lighthouse ≥90; `/admin` first-load JS ↓; CSS <82.6KB; no CWV regression; tests green | Med |

**Verification each item:** `npm run build` + `npm test`; `npm run dev` :8088 manual check at
360/375/390/414/768/1024/1280 + 375×667/390×667, light + admin-dark, with a non-default tenant accent.
Commits stay small (one surface per commit in Phases 3–4). Brain updated at the end
(`51-Timeline`, `52-Decision-Log`: Direction C + baseline/font decisions, `16-Design-System`).

---

## Phase 2 gate
On approval I implement **items 1–2 only** (token layer + primitives) in `styles.css`, additive and
back-compatible, verify light + admin-dark + a non-default accent, commit, and show the result before
starting the admin reskin (item 3).

---

## Execution results (2026-06-29/30)

Approved to run end-to-end. Shipped on `feature/ui-overhaul` (off `integration/ui-overhaul`),
small commits, **build + 202 tests green at every step**.

### Performance — before → after
| Metric | Baseline | After | Target |
|---|---|---|---|
| Funnel Lighthouse **desktop** | 86 (LCP 2.6s) | **100** (LCP 0.7s) | ≥90 ✅ |
| Funnel Lighthouse **mobile** | 75 (LCP 15.7s) | **92** (LCP 3.1s) | ≥90 ✅ |
| Funnel CLS | 0 | 0 | no regression ✅ |
| Funnel first-load JS | 151 kB | 157 kB | +6 kB (next/image client cost; image **bytes** down ~10×) |
| `/admin` first-load JS | 169 kB | 169 kB | unchanged (see follow-up) |
| `styles.css` | 82.6 kB | 88.7 kB | +6 kB token/primitive layer (consolidation deferred) |

The hero LCP fix (1.74 MB raw `<img>` → `next/image` resized WebP/AVIF + `priority`) drove the
funnel score win — the primary target — comfortably past 90 on both presets.

### Shipped
1. **Token foundation + primitives** (`styles.css`): state-color trios, surface/text/border tiers,
   interaction tokens (`--ring/--hover-fill/--active-fill/--overlay`), editorial accent devices,
   and the `.ui-*` primitive set. Additive + back-compatible; new tokens `color-mix` over semantic
   tokens so they auto-adapt in admin dark mode. Brand tokens untouched.
2. **Admin shell editorial refinement**: accent-forward nav active state + eyebrows, tokenized hover.
3. **Admin component states**: `RecordingButton` playback-error note; `OutreachQueueBuilder` empty
   states → `.ui-empty`.
4. **Funnel + funding cohesion**: Direction-C accent eyebrows on light sections; funding widget CTA
   uses `--on-blue` (AA on light accents) + `--danger` error.
5. **Perf**: hero/LCP via `next/image` (the headline win).

### Honest gaps / follow-ups (need browser-based visual-regression QA)
- **Deep per-surface reskin not exhaustive.** Tables (calls/team/lead), the remaining admin panels
  (DialPad, LeadCallPanel, Tenant*, AccountsPanel, the AI trio), the funding review-banner reposition,
  and full checkout/package restyle were **not** individually reworked — they inherit the new tokens
  but weren't pixel-reskinned. Each needs verification at 360–1280 + short heights, light + dark.
- **Admin first-load JS unchanged.** `next/dynamic` with SSR on gave no reduction (panels render
  during SSR); a real cut needs `ssr:false` lazy **client** tab-panels — an architectural change, not
  a reskin. Reverted to keep the tree honest.
- **CSS consolidation deferred.** The 3 accreted redesign layers + 72 stray hex + 112 rgba weren't
  collapsed; the foundation *added* ~6 kB. Dead-coding safely requires CSS-coverage + visual diffing.
- **Breakpoint/visual verification was limited** this run (Chrome extension not connected); correctness
  rests on build + 202 tests + disciplined mobile-first token CSS + Lighthouse. A manual pass at all
  breakpoints in light + admin-dark with a non-default tenant accent is still recommended before merge.
