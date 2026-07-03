---
name: template-library-expander
description: Add one unit to the funnel template/asset library — a new design direction, section variant, vertical preset, or asset pack — following the established data contracts and the design-taste quality bar. Use when the user says "add a direction", "add a vertical", "new section variant", "expand the template library", or "add assets for <vertical>".
---

# Template Library Expander

Incremental additions to the template & asset library. For the initial full build, use `docs/prompts/template-library-master-prompt.md` instead.

## Always, before any work

1. Read `.agents/skills/design-taste-frontend/SKILL.md` — it governs every aesthetic decision here (dials, banned defaults, pre-flight audit).
2. Read the contracts: `lib/tenantBuilder/designDirections.js`, `lib/tenantBuilder/verticalPresets.js` (if present), `tests/design-directions.test.js`, and the `--fp-*` fallback layer in `styles.css`.
3. `git status --short --branch`; work on a small feature branch.
4. State a one-line Design Read + dial settings before writing tokens or components.

## Invariants (never break)

- `premium-agency` keeps an EMPTY `vars` object; existing tenants render byte-identical through CSS fallbacks.
- Every new direction defines the **complete** `DIRECTION_TOKEN_KEYS` set — no partial token specs.
- Directions never define `--blue` / `--accent` / `--on-blue`; tenant branding is the only accent.
- New display fonts: add to `app/layout.jsx` via `next/font` (`preload: false`) AND to `DIRECTION_FONT_VARIABLES`; the test suite cross-checks.
- Tenant config stores only `{ design: { direction, overrides } }` (+ `verticalPreset` if the module exists); tokens resolve at render time.
- Sourcing: original, reference-informed only. Study open templates for patterns; never copy code, markup, copy, or imagery. Log studied references in `docs/design-research/`.

## Unit playbooks

### New design direction
1. Pick identity per the taste skill: no Fraunces/Instrument Serif, no Inter-default, no banned palettes (AI purple, beige+brass). Rotate from the approved font pools.
2. Author the full token object + `heroVariant` + `sectionOrder` + `copyTone` + `preview` swatches in `designDirections.js`.
3. Extend tests (closed keys, font cross-check). Smoke-render a tenant on each archetype at desktop + 390px.
4. Run the mechanical pre-flight: hero viewport fit, eyebrow ≤ 1 per 3 sections, WCAG AA on CTAs/forms, shape + theme locks, copy self-audit.

### New section variant
1. Add the component under `components/funnel/sections/` (or the archetype's sections dir); register its id in the variant registry.
2. Default rendering must remain unchanged for tenants that don't select it.
3. Declare mobile collapse explicitly; implement loading/empty/error states if it takes dynamic data.
4. Verify it under at least 2 directions before shipping.

### New vertical preset
1. Research first: produce/refresh `docs/design-research/<vertical>.md` (converting section order, hero + proof patterns, copy register, imagery brief, vertical-specific anti-patterns).
2. Add the pure-data preset to `verticalPresets.js` (closed keys, `directionAffinity` ranked, copy frames, imagery brief).
3. Wire into `generateTenant.js` prompt selection; add a mock-brief generator test for the vertical.

### New asset pack
1. Follow `.agents/skills/imagegen-frontend-web/SKILL.md`: one horizontal image per section, correct aspect ratios, grading consistent with the target direction.
2. Name `{vertical}-{direction}-{section}-{nn}`; store library-scoped, not tenant-scoped.
3. No image-gen tool available → write the exact prompt sheet to `docs/design-research/asset-prompts.md` with target filenames and aspect ratios; never substitute div-based fake screenshots.

## Done means

`npm test` + `npm run build` green (report exact results), pre-flight audit passed on smoke renders, zero drift for existing tenants, brain updated (`51-Timeline.md`, `16-Design-System.md`, `52-Decision-Log.md` if an architectural choice was made), small commits pushed on the feature branch.
