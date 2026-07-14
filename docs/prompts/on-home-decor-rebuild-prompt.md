# ON Home Decor rebuild — process doc

> Reconstructed 2026-07-04. The goal brief for the rebuild referenced this file as its process
> source of truth, but it did not exist in any branch; the goal text itself served as the spec and
> this doc records that process so the remaining media phase (and any future rerun) is repeatable.
> Build state: PR #8 (`claude/rebuild-on-home-decor-e4mhuw`) shipped everything except the media
> phase, which is blocked on the operator's portfolio folder.

## Mission
Rebuild `/t/on-home-decor` into a premium, gallery-first Toronto interior-design site built around
the operator's real portfolio/reference photography. Live prod is safe: it serves the DB row;
changes ship only via operator deploy + `npm run seed:tenants -- --only on-home-decor` (never a
bare full seed on prod).

## Canonical facts (frozen — locked by tests/interiors-template.test.js)
- `lib/tenants/onHomeDecor.js`: id `tenant_on_home_decor`, slug `on-home-decor`,
  taupe `#8B7A5E` + blush `#C9A9A6`, tagline "Start with one colour.".
- Ladder ids/prices FROZEN: `curated-paint-selection` $200/colour (featured, checkout, Stripe
  20000 CAD) → `room-refresh-consultation` $500–$750 → `designer-room-styling` $1,500–$3,500 →
  `kitchen-bath-design-direction` $2,500–$7,500+ → `full-home-design-renovation-planning`
  $8,000–$25,000+ → `on-home-transformation-experience` $15,000–$50,000+ (enterprise).
- Contact Elena / contact@on-homedecor.com / 647-627-3803. Service areas: Toronto, GTA, North
  York, Scarborough, Etobicoke, Mississauga, Vaughan, Markham.
- NO hospitality/accommodation language. `fundingPromo` stays off. `logo: ""` until an asset exists.

## Phases

### Phase A — design block (DONE, 2242eef)
`design: { direction: "warm-boutique", verticalPreset: "local-trades-retail" }` on the funnel
template. Kept populated even after escalation so the silent funnel fallback stays correct.

### Escalation — bespoke `interiors` template (DONE, cc940eb; decision logged 2026-07-04)
Escalate beyond the funnel ONLY when requirements exceed what it expresses. Met three ways here:
(a) category-tagged form submissions (funnel sends no `category`; `FunnelPage` is untouchable),
(b) service-area band (no such funnel section), (c) room-by-room gallery + before/after pairs
(funnel portfolio is a flat grid). Pattern: `components/interiors/` + `Interiors.module.css` on
isolated `--in-*` vars (agency-build pattern), registry entry in
`components/templates/registry.js`, `template: "interiors"` + top-level `interiors` content block
(rides the sanitize passthrough; components read it defensively). Never touch `FunnelPage`,
`styles.css`, `defaultTenant`, `tenantValidation`, other tenants, showcase/agency.

Forms: one booking form, two intents, one CTA label per intent page-wide.
- `consultation-booking` (+`packageId: curated-paint-selection`) → POST `/api/checkout`
  (server-resolved price; Stripe fallback returns `captured`/`stripe_not_configured`).
- `project-inquiry` (+packageId of the selected rung) → POST `/api/leads`.
Whitelisted fields only (`lib/leadUtils.js` PUBLIC_LEAD_FIELDS); always `tenantId`/`tenantSlug`;
never send teamId or price.

### Phase 0 — media (REMAINING — blocked on the operator folder)
1. Obtain the operator portfolio/reference folder. **Real imagery only — no stock, no picsum, no
   generated interiors.** Until it exists the hero stays typographic and the gallery (and all
   `#gallery` anchors) stay suppressed — that is intentional, not a bug.
2. Inventory every file: subject, room, project grouping, and before/after pairing.
3. Optimize: hero ≤2000px, gallery ≤1600px, target ≤300KB, WebP. No repo dependency is needed;
   from a scratch dir with `npm i sharp`:
   ```js
   const sharp = require("sharp");
   // per file: sharp(src).rotate().resize({ width: MAX, withoutEnlargement: true })
   //   .webp({ quality: 78 }).toFile(dest);  // step quality down if > 300KB
   ```
4. Commit under `public/assets/on-home-decor/` (`hero.webp`, `projects/<project>/<room>.webp`,
   `projects/<project>/before-*.webp` / `after-*.webp`).
5. Populate the config (all slots already wired):
   - `media.heroImage` → `/assets/on-home-decor/hero.webp` + real `heroAlt`
     (replaces the DGTL placeholder `/assets/content-day-hero.png`);
   - `interiors.hero.image` + `imageAlt`;
   - `interiors.gallery.projects[]` → `{ id, title, location, summary, rooms: [{src, alt,
     caption}], beforeAfter: [{ before: {src, alt}, after: {src, alt}, caption }] }`;
   - `portfolio.items[]` (funnel-schema shape, so the fallback path shows work too — items
     without `src` are dropped by the sanitizer).
   Real, descriptive alt text per image. No logo in the folder → `logo` stays `""`, flag it.
6. Media map (hero pick, groupings, pairs, alt text) goes in the PR body.

### Verification gate (report exact commands/results — first pass recorded in PR #8)
- `npm test` · `npm run build`
- `npm run seed:tenants -- --only on-home-decor` + dev SSR section markers
  (`curl localhost:8088/t/on-home-decor`)
- Every form intent submitted through the real UI; leads verified tenant-scoped in the store
  (server-set `teamId`, correct `category`/`packageId`)
- $200 checkout end-to-end in Stripe-fallback mode (`captured` + `stripe_not_configured`)
- Sibling regression: `/t/dgtlmag`, `/t/dgtl-group` (roster row → `/t/on-home-decor`),
  `/t/dmtv-studio`, `/t/funded-growth`
- Playwright desktop 1440 + mobile 390, `reducedMotion: "reduce"`, slow scroll sweep before
  full-page capture; horizontal-overflow probe
- design-taste-frontend pre-flight audit (Design Read + dials stated up front)

### Deliver
Small commits on the designated branch, push, PR titled "ON Home Decor website rebuild". Update
brain: Timeline, Decision-Log, Tenants-Catalog, Known-Issues. End report with screenshots, exact
commands/results, and open items (logo asset, real testimonials, on-homedecor.com DNS/go-live,
prod gate: deploy runbook + seed `--only on-home-decor`).
