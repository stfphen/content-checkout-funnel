# UI/UX Overhaul — Phase 1 Audit + Design Language

> **Phase 1 deliverable** for the full UI/UX + performance overhaul
> (`docs/prompts/ui-ux-overhaul.md`). Verified against the code on branch
> `feature/ui-overhaul` (off `integration/ui-overhaul`). **No app code changed in this phase.**
> Companion artifact: `docs/specs/ui-preview.html` (open in a browser; toggle light/dark + accent).
>
> **This document ends with a decision gate** — pick a design direction before any token/app code
> is written (Phase 2).

---

## 0. Performance baseline (measured 2026-06-29)

Captured on the macOS host, production build (`npm run build`) + `npm run start` + Lighthouse
(`npx lighthouse`, Chrome headless). These are the **"before" numbers** Phase 5 must beat.

### Build — First Load JS
| Route | Route size | First Load JS |
|---|---|---|
| `/` (funnel) | 133 B | **151 kB** |
| `/t/[slug]` (tenant funnel) | 132 B | **151 kB** |
| `/admin` | 26.7 kB | **169 kB** |
| `/admin/login` | 257 B | 103 kB |
| Shared by all | — | 102 kB |

Shared chunk breakdown: `chunks/1255` 46.2 kB + `chunks/4bd1b696` 54.2 kB + ~1.9 kB other.

### Stylesheet
- `styles.css` — **82,630 bytes (~82.6 KB)**, single global file, 4107 lines.

### Lighthouse — funnel `/` (Performance category)
| Metric | Desktop | Mobile (default throttling) |
|---|---|---|
| **Performance score** | **86** | **75** |
| First Contentful Paint | 0.3 s | 0.9 s |
| **Largest Contentful Paint** | 2.6 s | **15.7 s** ⚠️ |
| Total Blocking Time | 0 ms | 80 ms |
| Cumulative Layout Shift | 0 | 0 |
| Speed Index | 0.7 s | 1.3 s |

**Headline:** LCP is the only thing keeping the funnel under 90. The hero is a plain
`<img className="hero__image" src={tenant.media.heroImage}>` (`FunnelPage.jsx:152`) — **not
`next/image`**, so it has no optimization, responsive `srcset`, `priority`/`fetchpriority`, or
intrinsic dimensions. On throttled mobile that yields a 15.7 s LCP. `public/assets` is 1.7 MB.
Fixing the hero (and `brandbar__logo`, also a raw `<img>`) is the single biggest perf lever and the
key to Lighthouse ≥ 90 mobile. TBT/CLS are already healthy.

### Tests
- `npm test` → **202 pass / 0 fail** on the baseline.

---

## 1. Surface audit

Conventions: **D** = dated/inconsistent visuals · **S** = missing/weak component states
(empty/loading/error) · **R** = responsive/overflow risk (cross-ref `docs/specs/mobile-audit.md`).

### 1.1 Foundation — `styles.css`, `app/layout.jsx`, `lib/branding.js`, `components/motion/*`
| Issue | Where | Notes |
|---|---|---|
| **D** Three accreted "make it consistent" redesign layers coexist | `styles.css` premium-polish ~2971+, unification/"ONE card treatment" ~3312+, phase sections ~3559+ | The 3446 comment literally says it reconciles "the 3 legacy patterns". Heavy duplicate rules; the root cause of the 82 KB. |
| **D** Two class-naming generations | `.v2-*` (`.v2-admin-shell`, `.v2-nav-item`, `.v2-table`, `.v2-metric-pill`) vs BEM-ish (`.tenant-builder__*`, `.team-users-table__*`, `.button--primary`) | One file, two conventions. |
| **D** 72 hex literals **outside** `:root`; 112 `rgba()` literals | e.g. `#f5f5f7` (97/284/…), `#f2f2f7` (229), `#17171a` (759) | Should be tokens. The `rgba()` tints are why the dark block needs ~14 hand-patches (3101–3183). |
| **D** Status colors retyped instead of tokenized | green `#1b7f3a` / red `#b00020` ×8 (1940/1945/2192/2198/2345/2581/2700/2706); amber `#8a6d0b`(1702)/`#8a4b00`(2203); blue `#0a5bd3`(2712) | Collapse onto `--success`/`--danger`/`--warn`. |
| **D** Font naming drift | `app/layout.jsx` ships **Geist + Geist Mono** (`--font-sans`/`--font-mono`); `styles.css:83` aliases `--font-display → var(--font-sans)` (no Sora) | **Decision taken: keep Geist + Geist Mono.** Brief's "Inter/Sora" is obsolete. |
| **R** Breakpoint sprawl | 15 max-width (370/560/880/1023/1080) + 9 min-width (768×1/881×1/1024×7) | Consolidate to base / `min-width:768px` / `min-width:1024px` (keep 560). Orphan 1080 + near-dupe 881-vs-1024 should go. |
| Motion is clean | `Reveal.jsx`/`Stagger.jsx` both honor `useReducedMotion`; only consumer is `FunnelPage` | Good seam; preserve. |

### 1.2 Admin shell + nav — `components/admin/AdminTabbedShell.jsx`, `app/admin/page.jsx`
| Issue | Where | Notes |
|---|---|---|
| **D** Nav label/touch density | `.v2-nav-item` ~10px label, tight padding | Reskin nav to ≥44px targets, legible labels, clear active state. |
| **S** No `loading.jsx`/Suspense for the shell | `app/admin/page.jsx` blocks on one big `Promise.all` (258–292) | No skeleton while the 1827-line server page resolves. |
| **D** `notice` is an unstyled flash | shell line 183 `.admin-notice` | URL-driven (`searchParams.notice`); make it a real toast/banner primitive. |
| OK Dark toggle, bottom-nav ≤5 + "More" overflow | `useAdminTheme`, lines 98–105 | Mechanism is sound — keep, reskin only. |

### 1.3 Admin tables — `CallsTable.jsx`, `.v2-table`, `.team-users-table`, `.lead-table`
| Issue | Where | Notes |
|---|---|---|
| **D/R** `white-space:nowrap` + `overflow-x` only | `.calls-table` (styles ~2384) | Reskin to a tokenized table shell; stacked cards < 1024px (per mobile-audit C). |
| **R** Hard `min-width:920–980px`, no media query | `.team-users-table__row` (~2302), `.lead-table__*` (~2476) | Card/stacked < 1024px. |
| **D** Three different table treatments | calls vs team vs lead | Unify into one table primitive + one "stack to cards" rule. |

### 1.4 Admin forms — inline lead/contact edit, `.admin-form`
| Issue | Where | Notes |
|---|---|---|
| **D** Plain inputs, inconsistent across forms | `.admin-form` (~1838/2248), tenant/outreach builders | One input/select/textarea style + focus ring. |
| **S** Empty states live in the page, not components | `page.jsx` `{!list.length ? <p>No … yet.</p> …}` (≈660/733/798/824/967/1010/1044/1059/1461/1720/1751/1791) | Replace ad-hoc text with a shared empty-state primitive. |

### 1.5 Admin components — `components/admin/*` (13 client components)
| Component | State gaps (S) |
|---|---|
| `RecordingButton.jsx` | **No error UX** (0 error handling). |
| `OutreachQueueBuilder.jsx` | **No error UX**, no loading flag. |
| `CallsTable.jsx`, `DialPad.jsx`, `LeadCallPanel.jsx` | No explicit loading flag (drive `router.refresh()`); inconsistent. |
| AI trio (`LeadDeepResearch`/`ResearchFromQuery`/`FillMissingButton`), `TenantBuilder`, `AccountsPanel` | Have loading + error, but each ad-hoc — **no shared skeleton/spinner/error primitive**. |
| All 13 | **Statically imported → zero code-splitting** (perf, §3). |

### 1.6 Public funnel — `components/FunnelPage.jsx` (463 L, client)
| Issue | Where | Notes |
|---|---|---|
| **D** Many bespoke section styles | hero/problem/system/process/output/packages/faq | Re-express on the shared type/space/elevation scale. |
| **Perf** Raw `<img>` hero + logo | lines 152, 157 | Convert to `next/image` (priority hero, lazy rest) — §3. |
| **S** Toast/submit states minimal | `submitLead` (35–146), toast (458–460) | Use the new toast + button-loading primitives. |
| OK Branding contract | `style={theme.vars}` on `.tenant-root` (149) | **Four vars** `--blue/--blue-dark/--accent/--on-blue` (`lib/branding.js:65-72`) — do not touch. |

### 1.7 Checkout / packages — regions inside `FunnelPage.jsx`
| Issue | Where | Notes |
|---|---|---|
| **D** Package cards + checkout form styled ad-hoc | packages 279–333, form 369–412 | Reskin via card + input primitives; keep featured/selected logic and the Stripe/`paymentLink` branch in `submitLead` intact. |

### 1.8 Funding widget — `components/funding/*` (CSS Modules)
| Issue | Where | Notes |
|---|---|---|
| **D** Separate styling system | `FundingSurveyWidget.module.css` (the mobile-first reference pattern) | Keep it a CSS Module, but align its visual values to the new tokens (it can read global CSS vars). |
| OK mobile-first | single-col base, enhance at `min-width:520px` | Reference pattern — preserve. |

### 1.9 Tenant preview — `app/t/[slug]/page.jsx`
Thin wrapper rendering `<FunnelPage>` — inherits all funnel findings; no separate work.

---

## 2. Token map

### 2.1 Keep unchanged (contracts)
- **Brand (per-tenant, inline on `.tenant-root`):** `--blue`, `--blue-dark`, `--accent`, `--on-blue`,
  plus aliases `--brand → --blue`, `--brand-strong → --blue-dark`. **Never** move to `:root`, rename,
  or hardcode. New design must read correctly for any accent.
- **Fonts:** `--font-sans` (Geist), `--font-mono` (Geist Mono) — injected by `next/font` on `<html>`.
  `--font-display` may stay an alias of `--font-sans` (no second webfont).
- **Semantic surfaces:** `--bg`, `--surface`, `--surface-2`, `--border`, `--fg`, `--fg-muted` — keep
  the names (dark mode re-points these). **Expand**, don't replace.

### 2.2 Add (new primitives → fed into the semantic layer)
- **Neutral ramp** (primitives): `--neutral-0 … --neutral-950` (≈11 steps). Today's neutrals are
  sparse (`--white/--soft/--soft-2/--muted/--near-black/--black`). The ramp feeds every semantic
  surface/border/text token and is the single thing dark mode re-points.
- **Semantic surfaces (expanded):** add `--surface-3` (raised/popover), `--fg-subtle` (tertiary
  text), `--border-subtle` / `--border-strong`.
- **State colors as token trios:** `--success`/`--success-fg`/`--success-bg`, same for `--warn`,
  `--danger`, plus `--info`. Collapses the 11+ retyped status hexes.
- **Interaction tokens:** `--ring` (focus ring; derived from accent via `color-mix`) + `--ring-offset`;
  `--hover-fill`, `--active-fill`, `--overlay` (replaces the ad-hoc `rgba(0,0,0,.0x)` tints the dark
  block hand-patches).
- **Keep & lightly refine** the existing scales: type `--text-xs…7xl`, spacing `--space-1…24`
  (4/8 rhythm), radii `--radius*`, shadows `--shadow*`, motion `--ease*`/`--dur*`.

### 2.3 How it maps (no brand-token contact)
```
primitives (neutral ramp, state hues)
        │ aliased by
semantic tokens  --bg --surface --surface-2 --surface-3 --border(-subtle/-strong)
                 --fg --fg-muted --fg-subtle --ring --hover-fill --overlay …
        │ consumed by
components (only via var(); never raw hex)

brand tokens  --blue --blue-dark --accent --on-blue   ← injected per tenant, untouched
dark mode = re-point the neutral ramp + a few semantic tokens under
            .v2-admin-shell[data-theme="dark"]  (brand tokens stay → accents still pop)
```
Net effect: the ~14 dark-mode hand-patches (3101–3183) largely disappear once tints/status are
tokenized, because re-pointing the ramp flows everywhere automatically.

---

## 3. Performance plan (maps to Phase 5)
1. **Hero/image LCP (biggest win):** `next/image` for `hero__image` (`priority`, `sizes`, intrinsic
   dims) + `brandbar__logo`; configure `images.remotePatterns` for tenant-supplied URLs. Targets the
   15.7 s mobile LCP → should move funnel mobile well past 90.
2. **Admin code-split:** `next/dynamic` for heavy non-default panels — `CallsTable`(+`DialPad`),
   `OutreachQueueBuilder`, `AccountsPanel`, the three `Tenant*` settings; `LeadCallPanel`/
   `LeadDeepResearch` are per-lead → wrap at panel/row level. Trims the 169 kB `/admin` first load.
3. **CSS diet:** consolidate the 3 redesign layers, dead-code unused rules, tokenize 72 hex + 112
   rgba. Target meaningfully < 82.6 KB.
4. **framer-motion:** keep narrow (already isolated to `Reveal`/`Stagger`/`AdminTabPanel`); ensure no
   animation JS ships to non-animating routes.
5. **Icons:** confirm per-icon `lucide-react` imports (already named imports — verify tree-shaking).
6. **CLS guard:** reserve space with skeletons for async admin content (currently CLS 0 — keep it 0).

---

## 4. Design language proposal

The aesthetic was deliberately left open; this is a recommendation + alternatives. **Final pick is
yours** (see the gate). All three honor every contract in §2.1 and the quality bars.

Shared across all three (non-negotiable craft): 4/8px spacing rhythm; a real type scale with display
vs body distinction (via weight/size on Geist, not a new font); WCAG AA in light + admin-dark against
arbitrary accents; visible accent-derived focus ring; ≥44px touch targets; purposeful, reduced-motion-
safe transitions; one family of primitives (button/input/select/tabs/card/table/badge/toast/modal +
empty/loading/error/skeleton).

### ▶ Direction A — **"Operator Calm" (recommended)** — Linear/Vercel/Stripe-dashboard lineage
- **Neutrals:** near-monochrome cool-gray ramp; surfaces separated by **1px hairline borders +
  near-flat elevation** (shadows reserved for popovers/modals). Calm, dense, fast to scan.
- **Type:** Geist; tight headline tracking, generous body line-height; numbers in Geist Mono for
  tables/prices/metrics.
- **Radii:** restrained (`8–12px`). **Accent:** used sparingly — primary action, active nav, focus,
  selection — so any tenant accent reads as intentional, never decorative.
- **Why it wins the bars:** maximizes hierarchy + density for an operator tool; least likely to fight
  arbitrary tenant accents; smallest CSS surface; ages well. **Best fit for the admin cockpit.**

### ▶ Direction B — **"Warm SaaS"** — friendlier, more consumer
- Warmer off-white neutrals, **larger radii (12–16px)**, **soft layered shadows** as the primary
  separation (fewer hard borders), slightly more accent tint in surfaces/badges.
- Trade-off: cozier funnel, but softer hierarchy and heavier elevation can feel less precise in dense
  tables, and surface tints risk clashing with some tenant accents (needs careful `color-mix`).

### ▶ Direction C — **"Editorial Brand-Forward"** — funnel-led
- Bigger display type, more whitespace, accent used as a hero/section device; admin inherits a quieter
  version. High visual impact on the funnel.
- Trade-off: most styling work, highest risk to density/consistency in admin, and most accent-
  dependent — more QA across tenants.

**Recommendation:** **Direction A** for the whole product, with the funnel getting slightly more
generous spacing/type within the same system (one language, two densities). It best satisfies
"consistency over cleverness," "hierarchy & density," and "works for any tenant accent," and it's the
lightest to ship and maintain. `docs/specs/ui-preview.html` renders Direction A's primitives in light
+ admin-dark against a sample tenant accent (toggle in the page).

---

## 5. Decision gate (Phase 1 → Phase 2)

Confirm before any token/app code:
1. **Design direction** — A (recommended) / B / C / blend?
2. **Accent in preview** — the sample accent shown is fine, or supply a real tenant's `primaryColor`
   to sanity-check contrast?
3. Anything in §1–§4 to reprioritize before I write the Phase-2 foundation plan?

On approval, Phase 2 delivers the ordered build plan, then the token foundation + primitives in
`styles.css` (additive; no behavior/route changes), verified in light + admin-dark + a non-default
tenant accent.
