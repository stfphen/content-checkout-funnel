# ON Home Decor — Website Rebuild Master Prompt

> Execution brief for a Claude Code session. Run it with the operator's media folder attached.
> Companion `/goal` condition: see "Compact goal string" at the bottom. The repo is the source of
> truth for every platform/offer fact; this document is the source of truth for the process.

## Mission

Rebuild the ON Home Decor website — the tenant at `/t/on-home-decor` — into a premium,
gallery-first interior-design site worthy of a $15K–$50K transformation offer, **in place** on the
existing tenant. Use the operator-supplied reference/portfolio media folder as the visual backbone.
The live site is not at risk while you work: production serves the tenant's DB row, so nothing
changes on prod until the operator deploys and runs the subset seed (see Delivery). Do not create a
new tenant unless the operator explicitly flips to the sibling-preview option in Open Decisions.

## First actions (in order)

1. Read `CLAUDE.md` and `brain/00-Index/00-Home.md`; run the start-of-session checklist
   (`31-Current-Priorities`, `53-Known-Issues`, latest `51-Timeline`, `git status --short --branch`).
2. **Invoke the `design-taste-frontend` skill** before any visual decision. State a one-line Design
   Read + dial settings. (Note: a `new-tenant-page` skill does NOT exist in this repo — the process
   authorities are this document, `docs/prompts/template-library-master-prompt.md` Phase 6, and the
   two build precedents below.)
3. Study the proven precedents before building:
   - **DGTL Group agency build** (PR #5): `lib/tenants/dgtlGroup.js`, `components/agency/`,
     `tests/agency-template.test.js` — the newest bespoke-template build, including the lifted
     package-selection pattern and the one-CTA-per-intent rule.
   - **DMTV Studio showcase** (PR #4): `lib/tenants/dmtvStudio.js`, `components/showcase/`.
   - **Template library**: `lib/tenantBuilder/designDirections.js`, `verticalPresets.js`,
     `sectionVariants.js`, `components/funnel/sections/`, and `resolveDesign` — the restyle path.
4. Locate the attached media folder (ask the operator for the path if it is not obvious in the
   session). Do not start building sections until the media inventory (Phase 0) is done.

## Canonical facts (verified against the repo — do not drift)

- Config: `lib/tenants/onHomeDecor.js` — id `tenant_on_home_decor`, slug `on-home-decor`, domains
  `on-homedecor.com` / `www.on-homedecor.com`. Brand: taupe `#8B7A5E` primary + blush `#C9A9A6`
  accent (warm-luxury palette), tagline "Start with one colour.", eyebrow "Toronto Interior Design
  & Paint Consultation". **No logo asset exists.** Hero image is currently borrowed from Content
  Day (`/assets/content-day-hero.png`) — replacing it with real decor imagery is mandatory.
- Offer ladder (ids are canonical — they drive lead + checkout tagging; keep prices unless the
  operator says otherwise): `curated-paint-selection` $200/colour (featured, `action: "checkout"`,
  Stripe `{ amount: 20000, currency: "cad" }`) → `room-refresh-consultation` $500–$750/room →
  `designer-room-styling` $1,500–$3,500/room → `kitchen-bath-design-direction` $2,500–$7,500+ →
  `full-home-design-renovation-planning` $8,000–$25,000+ → `on-home-transformation-experience`
  $15,000–$50,000+ (also the `enterprise.packageId`).
- Contact: lead "Elena", `contact@on-homedecor.com`, `647-627-3803`, Toronto. Service areas:
  Toronto, GTA, North York, Scarborough, Etobicoke, Mississauga, Vaughan, Markham.
- **Built-in tenant**: one of only three in `builtInTenants()` (`lib/store.js`) — the config file is
  the live fallback when no DB row exists. Prod has a DB row (a historic slug-collision is on
  record in the Timeline), so the prod gate is: operator deploy + `npm run seed:tenants -- --only
  on-home-decor`. Never run a bare full seed against prod.
- Today the tenant has **no `template` field, no `design` block, and empty `portfolio`/`references`**
  — it renders the classic FunnelPage in the premium-agency default look.
- Content rule from the Lovable migration (config header): **no hospitality/accommodation
  language**. This is an interior-design + paint-consultation brand, period.
- `fundingPromo` is disabled. A home-renovation funding cross-sell is plausible but is an operator
  decision — leave it off unless explicitly enabled.

## Phase 0 — Media ingest (before any section work)

1. Inventory the attached folder: list every file, dimensions, and what it shows. Classify:
   hero candidates / project-gallery shots / before-after pairs / detail-texture shots / any logo
   or brand mark / anything unusable (blurry, off-brand, watermarked → set aside, note it).
2. Optimize for web: resize to sensible maxima (hero ≤2000px wide, gallery ≤1600px, thumbs ≤800px),
   re-encode (WebP or high-quality JPEG; target ≤300KB per gallery image, hero may be larger),
   strip EXIF. Commit under `public/assets/on-home-decor/` with descriptive kebab-case names.
3. Build the media map: which image is the hero, which belong to which project/room, before/after
   pairings, and one line of real alt text per image (describe the room, not the brand).
4. **Real media only.** No picsum, no stock, no generated interiors posing as portfolio work. If a
   section has no real imagery, the section gets a typographic treatment or is cut — same policy as
   the DGTL page. If the folder contains no logo, keep `logo: ""` and flag it as an open item.
5. Rendering: local `/`-prefixed images ride `next/image` automatically (`HeroImage`/`MediaImage`
   in `components/funnel/sections/shared.jsx`) — keep paths local, never hotlink.

## Phase A vs Phase B — the template decision (same rule as the DGTL build)

**Phase A (start here): restyle the existing funnel.** Add to the config:
`design: { direction: "warm-boutique", verticalPreset: "local-trades-retail" }` (cream/warm-brown
editorial-luxury direction; the preset's prefs are full-bleed hero, single-offer packages,
testimonial-editorial references — its `directionAffinity[0]` is warm-boutique). Populate
`portfolio.items` (schema + sanitization locked by `tests/portfolio-config.test.js`; item shape
`{ id, title, caption, client, result, mediaType, src, thumbnail, alt, tags, link }`), swap the
hero image, refresh copy where the media enables stronger proof. This ships the fastest and
exercises the template library.

**Phase B (escalate only if justified): bespoke `interiors` template.** If the media inventory
wants section shapes the funnel cannot express — before/after sliders, room-by-room galleries, a
project case-study wall — register a new `interiors` template in
`components/templates/registry.js` with its own `components/interiors/` directory + CSS module on
isolated `--in-*` vars, following the agency build pattern exactly (config-driven sections reading
a top-level `interiors` block with defensive defaults; sections null out when absent; lead form
cloning the `AgencyLeadForm` payload contract). Write the justification into the Decision Log.
A rich portfolio folder usually justifies Phase B — but decide from the actual media, not ambition.

**Hard boundaries either way:** never modify `components/FunnelPage.jsx`, `styles.css`,
`lib/defaultTenant.js`, `lib/tenantValidation.js`, any other tenant config, or the showcase/agency
templates. Preserve the `$200` Stripe checkout exactly (`action: "checkout"` + stripe block on
`curated-paint-selection`). Keep all six package ids unchanged.

## Section brief

1. **Hero** — real interior photography from the folder, the "Start with one colour." ladder story,
   primary CTA = book the $200 Curated Paint Selection. Warm-luxury, editorial; not dark-tech.
2. **Offer ladder** — the six packages as a laddered narrative ($200 entry → $50K transformation),
   entry package featured with real checkout; upper packages inquiry/booking-led.
3. **Project gallery / before-after** — the centerpiece, built from the media map. Real projects,
   real rooms; captions state room + scope (+ result if the operator supplies one). No invented
   metrics, no fake client names.
4. **Process** — the existing 4-step consultation flow, tightened.
5. **Testimonials** — only if the operator supplies real quotes (name + context); otherwise omit.
6. **FAQ** — refresh the existing 9 items against the new page; keep the no-payment disclaimer.
7. **Service-area band** — the 8 GTA areas, plainly.
8. **Booking/consultation form** — `/api/leads` with only whitelisted fields
   (`lib/leadUtils.js`), always `tenantId`/`tenantSlug`. Categories: `consultation-booking`
   (+ `packageId` from the selected package) for the main form; `project-inquiry` (+ packageId) if
   a second high-ticket form is warranted. One CTA label per intent, page-wide.

## Verification ladder (report exact commands + results)

1. `npm test` and `npm run build` — green, zero new failures.
2. Local seed (`npm run seed:tenants -- --only on-home-decor`) + dev server: SSR-check
   `/t/on-home-decor` for every section marker; submit every form and verify leads stored scoped to
   `tenant_on_home_decor`; drive the `$200` checkout path end-to-end in Stripe-fallback mode
   (no `STRIPE_SECRET_KEY` → lead capture + disclaimer).
3. Sibling regression: `/t/dgtlmag`, `/t/dgtl-group` (its white-label roster links here — the row
   copy should still match reality), `/t/dmtv-studio`, `/t/funded-growth` unchanged.
4. Screenshots desktop (1440) + mobile (390) with `reducedMotion: "reduce"` + a slow scroll sweep
   (whileInView must latch before full-page capture — see the DGTL build notes), plus the
   design-taste pre-flight audit on both.
5. Brain updates: `51-Timeline` entry; `52-Decision-Log` (Phase A/B choice + rationale);
   `63-Tenants-Catalog` row refresh; `53-Known-Issues` open items.

## Delivery

Small commits on the session's designated branch (media → config → template work → tests → brain),
push, open a PR titled "ON Home Decor website rebuild". End the report with: screenshots, exact
commands/results, and the open-items list — at minimum: logo asset (if none supplied), real
testimonial sourcing, `on-homedecor.com` DNS/go-live status, and the prod rollout gate (deploy
runbook + `seed:tenants -- --only on-home-decor`; remind the operator a bare full seed would
clobber Tenant-Editor edits on other rows).

## Open decisions (operator may flip; defaults chosen)

- **In-place vs sibling preview:** default in-place (prod is seed-gated). To flip: build on slug
  `on-home-decor-v2` (DB-row-only, DMTV-Studio-style), then promote by copying the config over the
  real tenant after approval and deleting the preview row.
- **Funding cross-sell:** default off. To flip: reuse the compliance-safe framing from
  `lib/funding/tenant.js` verbatim (never claim eligibility/approval).
- **Price/copy changes to the ladder:** default keep canonical values; any change needs the
  operator's word in the session.
