# Prompt: Full UI/UX + Performance Overhaul — Content Checkout Funnel

> Paste everything below the line into terminal Claude from the repo root. This is a **gated,
> multi-phase workflow**. Claude must **stop for explicit approval** after Phase 1 (audit +
> design language), Phase 2 (foundation plan), and the first reskinned surface in Phase 3
> before continuing. Aesthetic is **agnostic** — Claude proposes the look, the human approves it.

---

Work in the **Content Checkout Funnel** repo. Before anything else: read `CLAUDE.md`, read
`brain/00-Index/00-Home.md` and follow its start-of-session checklist, and read
`brain/10-Architecture/16-Design-System.md`, `brain/20-Modules/21-Admin-Shell.md`, and the
prior overhaul prompt `docs/prompts/mobile-first-ui-overhaul.md`. Run `git status --short --branch`
first. Treat every guardrail below as **non-negotiable**.

## Mission
Give the entire product — the **admin backend** (`/admin` shell + every tab/component) **and** the
**public funnel + checkout** — a complete top-to-bottom UI/UX overhaul: a fresh, cohesive skin with
the polish of best-in-class modern SaaS, plus a measurable **performance** improvement. This is a
reskin and refinement, **not** a rewrite of business logic, data flow, or routes. Nothing about what
the app *does* should change — only how it looks, feels, and performs.

## Non-negotiable contracts (do NOT break these)
1. **Per-tenant brand tokens are a contract.** `--blue`, `--blue-dark`, `--accent` are injected at
   runtime per tenant by `lib/branding.js`. Never hardcode or override them in base/theme rules.
   The new design must look correct for *any* tenant accent, not one brand.
2. **Semantic surface tokens drive theming.** Build everything on `--bg`, `--surface`,
   `--surface-2`, `--border`, `--fg`, `--fg-muted` (plus the type/space/shadow/motion scales).
   These are what dark mode re-points — use tokens, never raw hex, in components.
3. **Admin dark mode stays scoped** to `.v2-admin-shell[data-theme="dark"]`. The public funnel
   stays **light** (best for conversion + tenant branding) — do not give it a dark ancestor.
4. **Fonts are wired via `next/font`** in `app/layout.jsx`: Inter (`--font-sans`) + Sora
   (`--font-display`). Never redefine these CSS vars or you clobber the webfonts.
5. **CSS custom properties cannot be used in `@media` conditions.** Standardize breakpoints on
   base / `min-width:768px` / `min-width:1024px`. Stay **mobile-first** (base = smallest screen,
   enhance up) — the reference pattern is `components/funding/FundingSurveyWidget.module.css`.
6. **Motion via framer-motion**, and **all motion must respect `prefers-reduced-motion`**
   (component `useReducedMotion` + global CSS fallback).
7. **Tenant-aware, mock-data-first, no new business APIs, never auto-send outreach, keep admin
   navigation working** at every step.

## Quality bars (the aesthetic is yours to propose — these are the standard it must hit)
The look is intentionally **not** prescribed. Propose a direction and prove it against these bars:
- **Visual system, not screens.** One coherent language — a defined type scale, a spacing rhythm
  (e.g. 4/8px base), a restrained color/elevation system, consistent radii and border treatment —
  applied uniformly. No one-off styling.
- **Hierarchy & density.** Clear primary/secondary/tertiary emphasis; information-dense where
  operators need it (tables, pipeline) without feeling cramped; calm and uncluttered.
- **Accessible by construction.** WCAG AA contrast in **both** light and admin-dark, against
  arbitrary tenant accents; visible focus states; keyboard-navigable; hit targets ≥44px on touch.
- **Purposeful motion.** Transitions clarify state changes and spatial relationships; nothing
  gratuitous; everything degrades cleanly under reduced-motion.
- **Polished primitives.** Buttons, inputs, selects, tabs, cards, tables, badges, toasts, modals,
  empty states, loading/skeleton states, and error states all feel like one family.
- **Consistency over cleverness.** Predictable patterns beat novel ones in an operator tool.

## Performance bars (measure before and after; report numbers)
- Trim the CSS payload (`styles.css` is a single ~82KB file) — consolidate, dead-code, and split
  where it helps; no unused rules.
- Code-split and lazy-load heavy admin panels/components; keep the initial admin bundle lean.
- Leverage **Next.js 15 / React 19**: prefer server components, stream where sensible, memoize hot
  client components, avoid unnecessary client JS.
- Audit the framer-motion footprint; import narrowly; don't ship animation code to routes that
  don't animate.
- Optimize fonts (already `next/font`) and any images/icons (`lucide-react` — import per-icon).
- Eliminate layout thrash / CLS; reserve space for async content with skeletons.
- **Targets:** Lighthouse Performance ≥ 90 on the funnel; admin first-load JS reduced vs. baseline;
  no Core Web Vitals regressions. State the baseline you measured against.

## Surface inventory (everything in scope)
**Admin** — `app/admin/page.jsx` (shell) + `app/admin/login/page.jsx`;
`components/admin/AdminTabbedShell.jsx` (tabs: Dashboard / Pipeline / Prospecting / Outreach /
Tenants / Funding / Calls + bottom nav + dark toggle); tables (`CallsTable.jsx`, `.v2-table`,
`.admin-list`); forms (`.admin-form`, lead/contact edit); `DialPad.jsx`, `LeadCallPanel.jsx`,
`RecordingButton.jsx`, `LeadDeepResearch.jsx`, `ResearchFromQuery.jsx`, `FillMissingButton.jsx`,
`OutreachQueueBuilder.jsx`, `TenantBuilder.jsx`, `TenantBrandingSettings.jsx`,
`TenantPhoneSettings.jsx`; the funding review notice/banner.
**Public** — `components/FunnelPage.jsx` (funnel + survey), checkout/package flows, the funding
survey widget set (`components/funding/*`), `app/t/[slug]/page.jsx` tenant preview.
**Foundation** — `styles.css` (`:root` tokens + all rules), `app/layout.jsx`,
`components/motion/Reveal.jsx` + `Stagger.jsx`.

---

## Phase 1 — Audit + Design Language (NO production code)
Produce **`docs/specs/ui-overhaul-audit.md`**:
- **Audit:** inventory every surface above; for each, note what's dated/inconsistent (color, type,
  spacing, components, states, empty/loading/error gaps) with file references.
- **Token map:** the current token system, what to keep, what to add (e.g. missing neutral steps,
  state colors, focus ring), and how the new language maps onto `--bg/--surface/--border/--fg/...`
  **without touching the brand-token contract**.
- **Design language proposal:** the direction you recommend (type scale, spacing rhythm, radii,
  elevation, color/neutrals, motion principles), justified against the quality bars — plus 1–2
  alternatives so the human can choose. Optionally build a single throwaway static preview
  (`docs/specs/ui-preview.html`) showing the proposed primitives (buttons/inputs/cards/table/badges)
  in light + dark against a sample tenant accent. **No changes to app code.**
- **Performance baseline:** current `npm run build` output (admin + funnel first-load JS),
  `styles.css` size, and a Lighthouse run on the funnel. Record the numbers.

**Stop. Show me the audit + the proposed design language and ask me to pick a direction.**

## Phase 2 — Foundation plan + token layer (plan first, then approval, then code)
Write the **ordered build plan** (lowest-risk foundation first): token refactor → primitives →
admin shell → admin tabs → funnel → checkout → performance pass. Each item: scope, files,
acceptance criteria, theming/regression risk. **Stop and show me the plan.**
After approval, implement **only the foundation** on a feature branch off the integration branch:
the refreshed token set in `styles.css :root`, the dark re-point block, typography, and a small,
documented set of reusable primitives/utility classes. Verify light + dark + a non-default tenant
accent still render correctly. Small, focused commits.

## Phase 3 — Reskin, surface by surface (after foundation approved)
Reskin in the approved order, **one surface per commit**, mobile-first, on the same feature branch.
Start with the **admin shell + one representative tab**, then **stop and show me that first surface**
before continuing through the rest. For each surface: apply the new primitives/tokens, add proper
empty/loading/error states, keep all existing behavior and props intact, and verify at
360/375/390/414/768/1024/1280 + short heights (375×667, 390×667) in both light and dark.
**Never break admin navigation. Reskin only — do not change logic, data, or routes.**

## Phase 4 — Public funnel + checkout
Same approach for `FunnelPage.jsx`, the funding survey widget, and checkout/package flows. Keep the
funnel **light**, conversion-focused, and correct for arbitrary tenant branding. Don't regress the
mobile-first work already shipped.

## Phase 5 — Performance pass
Execute the performance bars above. Re-measure against the Phase 1 baseline and **report the
before/after numbers** (build output, first-load JS, CSS size, Lighthouse).

## Acceptance (all must pass)
- One cohesive, modern visual system applied consistently across admin + funnel, light + dark.
- Works for **any** tenant accent; brand-token contract untouched; dark mode still scoped to admin.
- AA contrast, visible focus, keyboard nav, ≥44px touch targets; reduced-motion honored.
- All component states present (default/empty/loading/error). No behavior, data, or route changes.
- No overflow/clipping 360–1280px or at short heights; admin nav works everywhere.
- Performance improved vs. baseline with no Core Web Vitals regression; funnel Lighthouse ≥ 90.

## Verification (report exact commands + results)
`npm run build` (the lint gate — there is **no** `npm run lint` script) · `npm test`
(`node --test tests/*.test.js`) · `npm run dev` on port 8088 for manual checks at every breakpoint
above in light + dark with a non-default tenant · Lighthouse before/after. Summarize files changed
and a high-level diff. On failure, keep going or report the blocker — **do not** mark complete.

## Guardrails (hard stops)
Tenant-aware + mock-data-first; no new business APIs; never auto-send outreach; keep admin nav
working at all times. Small branches, small commits, one integration branch. **Never** delete
worktrees, reset branches, force-push, or `git clean` without my explicit confirmation. Never edit
the same files in two worktrees at once. When the work is meaningful, update the project brain
(Timeline / Decision-Log / affected Design-System note) per `CLAUDE.md`.
