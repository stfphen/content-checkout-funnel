# Master Prompt — Template & Asset Library Build

> Paste everything below this line into a fresh Claude Code session at the repo root.
> Companion skill for later incremental additions: `.agents/skills/template-library-expander/`.

---

## ROLE

You are the design-engineering lead for this repo's funnel platform. Your mission: expand the landing-page generation system from its current 2-archetype × 5-direction setup into a **template and asset library** that produces noticeably higher-quality, vertical-aware landing pages — without breaking a single existing tenant.

Non-negotiable quality bar: every page this library produces must survive the full pre-flight audit in `.agents/skills/design-taste-frontend/SKILL.md`. That skill is your design constitution for this task. Read it in full before designing anything. Also read `.agents/skills/imagegen-frontend-web/SKILL.md` (asset generation) and `.agents/skills/image-to-code/SKILL.md` (reference translation).

## CONTEXT (verified repo facts — trust these, re-verify anything else)

- **Stack:** Next.js 15 / React 19 / Postgres, multi-tenant white-label funnels. Tenants render at `app/t/[slug]/page.jsx`.
- **Templates today:** two page archetypes — the default **funnel** (`components/FunnelPage.jsx`) and **showcase** (`components/showcase/ShowcasePage.jsx` + `components/showcase/sections/*`).
- **Design directions:** `lib/tenantBuilder/designDirections.js`. Five directions (premium-agency, editorial-minimal, bold-brutalist, warm-boutique, dark-cinematic). Each is **pure data**: a closed set of 30 `--fp-*` CSS tokens (`DIRECTION_TOKEN_KEYS`), a `heroVariant` (`full-bleed` / `split` / `typographic`), a `sectionOrder`, a `copyTone` brief consumed by the generator, fonts, and preview swatches. Tokens resolve at render time via `var(--fp-x, fallback)` in `styles.css`.
- **Contract rules (do not violate):** `premium-agency` has an EMPTY vars object and IS the CSS fallback layer — existing tenants must stay byte-identical. Directions never define `--blue`/`--accent`/`--on-blue`; per-tenant branding (`lib/branding.js`) flows through every direction. Tenant config stores only `{ design: { direction, overrides } }`.
- **Generation:** `lib/tenantBuilder/generateTenant.js` — Claude with structured output builds a tenant config (brand, ~13 copy sections per `DEFAULT_SECTION_ORDER`, packages, design ref) from a free-text brief + optional reference docs. `editTenant.js` mutates. Admin UI: `components/admin/TenantBuilder.jsx`, `TenantEditor.jsx`, `DesignDirectionPicker.jsx`.
- **Assets:** media library (migration 007), tenant-scoped uploads.
- **Tests:** `tests/design-directions.test.js` enforces the closed token set and cross-checks direction font stacks against `DIRECTION_FONT_VARIABLES` instantiated in `app/layout.jsx`. Suite is ~272 tests; must stay green.
- **Git guardrails (from CLAUDE.md):** `git status --short --branch` before editing; no resets/force-push/worktree deletion without explicit confirmation; small commits on a feature branch; run `npm test` and `npm run build` before claiming completion.

## DEFINITIONS (use these words precisely)

- **Archetype** — a page-level React template: section components + layout skeleton (funnel, showcase, and the new one you'll add).
- **Direction** — a token/typography/motion identity applied to any archetype (the `--fp-*` layer).
- **Vertical preset** — a new data layer you will create: per-industry section order, copy frames, proof patterns, imagery brief, and recommended direction pairings. Verticals in scope: **(a) agency/creative services, (b) professional services B2B (consulting, legal, accounting, funding advisory), (c) SaaS/tech & ecommerce, (d) local/trades & retail (contractors, clinics, real estate, fitness).**
- **Section variant** — an alternate composition for one section (e.g., three hero variants exist today; you will add more per section).
- **Template (deliverable unit)** — one archetype × direction combination rendering correctly with real section variants and assets. Target: **15 shipped templates = 3 archetypes × 5 directions**, each validated against at least 2 verticals.

## SOURCING POLICY (licensing — strict)

Build **original, reference-informed** work. You may study open template galleries and open-source templates (HTML5UP, Cruip free tier, Tailwind community templates, shadcn/ui blocks, Awwwards/Landbook/SaaS Landing Page galleries) to extract *patterns*: section rhythms, grid structures, trust-building sequences, hero compositions, pricing layouts. You may **not** copy code, markup structure wholesale, copy, or imagery from any of them. Everything committed must be original and safe for white-label resale. Record studied references in a `docs/design-research/` note per vertical so provenance is auditable.

## EXECUTION PHASES

Work in phases. Each phase ends with a commit and a one-line report: what shipped, what's next, exact test/build results. Do not start a later phase with a failing earlier phase.

### Phase 0 — Recon (no writes)
1. Read `brain/00-Index/00-Home.md`, `brain/10-Architecture/16-Design-System.md`, `brain/20-Modules` funnel notes, `brain/50-Audit-Log/53-Known-Issues.md`.
2. Read in full: `designDirections.js`, `FunnelPage.jsx`, `ShowcasePage.jsx` + its sections, `generateTenant.js`, `styles.css` (the `--fp-*` fallback layer), `tests/design-directions.test.js`, the three design skills.
3. `git status --short --branch`. If the tree is dirty or mid-merge, STOP and ask the user how to proceed. Then create branch `feature/template-library`.
4. Output a ≤20-line architecture summary proving you understand the direction contract, and your plan deltas if reality differs from this prompt.

### Phase 1 — Vertical pattern research
For each of the 4 verticals, produce `docs/design-research/<vertical>.md` (≤120 lines each):
- The 5–7 section archetypes that actually convert in that vertical and their canonical order (e.g., local trades: proof-first, license/insurance trust block, service-area, before/after gallery; SaaS: product-shot hero, logo wall, feature bento, pricing, integration strip).
- 3 hero patterns with layout notes (not code).
- Trust/social-proof patterns specific to the vertical.
- Copy register: tone, headline length norms, CTA verbs that fit, jargon to avoid.
- Imagery brief: subjects, aspect ratios, photographic vs. illustrative, per design direction.
- Anti-patterns: the AI-slop tells for this vertical (per the taste skill's banned defaults — e.g., beige+brass for premium consumer, purple gradients for SaaS).
Use web research for galleries; cite what you studied. **No code in this phase.**

### Phase 2 — Architecture extension (design before build)
Propose, get user sign-off, then implement:
1. **Vertical presets module** — `lib/tenantBuilder/verticalPresets.js`, pure data like `designDirections.js`: `{ id, label, sectionOrder, sectionVariantPrefs, copyFrames, proofPattern, imageryBrief, directionAffinity: [...ranked direction ids] }`. Closed-key, tested, same discipline as `DIRECTION_TOKEN_KEYS`.
2. **Section variant registry** — a data-driven way for a section to render one of N compositions (e.g., `packages: "cards" | "comparison" | "single-offer"`, `proof: "logo-wall" | "stat-band" | "case-strip" | "testimonial-editorial"`). Variants live as components under `components/funnel/sections/` (extract from `FunnelPage.jsx` incrementally if needed — behind identical default rendering).
3. **Third archetype** — a **conversion-lite "authority" archetype** (long-form credibility page: editorial narrative, deep proof, single CTA) complementing funnel (transactional) and showcase (portfolio). Same tenant-config contract, selected per tenant. Note: showcase components exist but their route wiring may be incomplete/staged — verify in Phase 0 and report the delta.
4. **Backwards compatibility proof:** existing tenants with no `verticalPreset` and default variants must render byte-identical. Write the tests first (extend `design-directions.test.js` pattern: closed keys, every preset's directions exist, every variant id resolves).

### Phase 3 — Build the 15-template matrix (batched)
Batch by archetype (funnel → authority → showcase). For each direction × archetype:
1. Declare a one-line **Design Read** and dial settings (taste skill §0–1) before touching code.
2. Implement/verify all section variants that archetype needs in that direction's tokens. New directions' typography must follow the taste skill's serif discipline and font pools — the existing five directions are frozen as-is (Fraunces/Instrument stay), but nothing NEW may default to Fraunces/Instrument Serif, Inter, or the banned palettes.
3. Run the taste skill **pre-flight audit** on a rendered smoke tenant: hero viewport fit, ≤1 eyebrow per 3 sections, zigzag cap, no duplicate CTA intent, WCAG AA on every CTA/form, shape-consistency lock, theme lock, copy self-audit.
4. Screenshot or `curl` smoke each combination at desktop + 390px mobile. A template is "shipped" only after audit + tests + build pass.
Commit per batch, not per file.

### Phase 4 — Asset library
1. Seed the media library with a **starter asset pack per vertical × direction**: hero images, section supports, texture/background plates — generated via the imagegen skill's rules (one horizontal image per section, correct aspect ratios, direction-consistent grading). Store under tenant-agnostic library scope with descriptive names (`saas-dark-cinematic-hero-01`).
2. If no image-gen tool is available in the session, generate the complete **prompt sheet** instead (`docs/design-research/asset-prompts.md`) with exact prompts, aspect ratios, and target filenames, and leave labeled placeholder slots — never div-based fake screenshots (taste skill §4.8).
3. Extend the generator so imagery briefs from the vertical preset flow into media selection.

### Phase 5 — Wire into generation
Update `generateTenant.js` so the structured-output prompt:
1. Infers or accepts a `verticalPreset`, selects archetype + direction via `directionAffinity` (admin can override in `TenantBuilder.jsx`/`DesignDirectionPicker.jsx`).
2. Injects the preset's copy frames + the direction's `copyTone` + the taste skill's copy rules (20-word subtext cap, no fake-precise numbers, one copy register) into the generation prompt.
3. Emits section-variant choices as part of the config.
Add generator-level tests with mock briefs from each vertical asserting valid preset/direction/variant combos.

### Phase 6 — Verification & handoff (mandatory)
1. `npm test` and `npm run build` — report exact commands and results.
2. Smoke-render the full matrix (3 archetypes × 5 directions) + 1 generated tenant per vertical; run the mechanical pre-flight counts (eyebrow count, CTA-intent dedupe, contrast) on each.
3. Confirm zero visual drift for existing production tenants (default path untouched).
4. Update the brain: `51-Timeline.md` entry, `52-Decision-Log.md` (architecture decisions), `16-Design-System.md` (new presets/variants/archetype), `53-Known-Issues.md` for anything deferred.
5. Final report: files changed, template matrix status table, deferred items.

## HARD QUALITY RULES (distilled — the full skill still governs)

- No AI-default aesthetics: no purple-gradient SaaS heroes, no beige+brass "premium," no Inter-by-default, no three-equal-feature-cards, no centered-hero-over-mesh unless the direction explicitly is that.
- Every template needs real imagery slots — no text-only pages, no fake div screenshots.
- One accent (tenant brand `--blue`) per page; directions provide neutrals + type + shape, never a competing accent.
- Mobile collapse declared explicitly per section variant.
- Every section variant renders correct loading/empty/error states where it takes dynamic data (packages, portfolio, references).
- If you cannot make a combination good, ship fewer templates at higher quality and say so — a 12-template matrix that passes audit beats 15 that don't.

## INTERACTION CONTRACT

Ask at most one clarifying question per phase, only when genuinely blocked. Get explicit sign-off at the end of Phase 2 before building. Never delete, reset, or force-push. If the working tree has uncommitted or conflicted files at start, stop and ask.
