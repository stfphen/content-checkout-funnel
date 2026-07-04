---
name: new-tenant-page
description: End-to-end playbook for building a new standalone, bespoke page/site for a tenant or client brand in this repo (content-checkout-funnel). Use when asked to "build a new page/site for <brand>", "redesign <tenant>'s site as a new page", or "onboard <client> with a custom landing page". Covers brand research, the tenant + template-registry architecture, taste-driven design, lead-pipeline form wiring, the full verification ladder, brain updates, and PR delivery. Proven by the DMTV Studio build (PR #4, /t/dmtv-studio).
---

# New Tenant Page Playbook

Build a new, independent, high-design page for a tenant WITHOUT touching the shared funnel
template or destabilizing existing tenants. A "new page" in this repo means **a new tenant
config row with its own slug**, rendered by a template chosen via the config's `template`
field. Everything below is the process that shipped DMTV Studio, with the exact contracts
and the bugs it caught.

## Phase 0 — Orient

1. Read the brain first: `brain/00-Index/00-Home.md`, `brain/60-Reference/63-Tenants-Catalog.md`,
   `brain/10-Architecture/15-Multi-Tenancy.md`. Open only what the task needs.
2. `git status --short --branch`. Work on the designated feature branch; small commits.

## Phase 1 — Research (parallel subagents)

Launch in parallel, then continue when both report:

- **Codebase explore agent** (skip if the brain is current): existing tenant configs, the
  template registry, reusable section components, test conventions.
- **Brand research agent** (web/social) with these REQUIRED deliverables:
  - Verified official profile URLs (site, Instagram, YouTube, TikTok, LinkedIn).
  - Embeddable media: YouTube video IDs, Instagram reel codes, thumbnail URLs.
  - Visual identity (palette, wordmark treatment) and tone of voice with examples.
  - An explicit confidence rating, and when the brand name is ambiguous, the candidate
    entities ruled out with evidence. Never let the agent guess silently.

Sandbox note: this environment often blocks youtube.com / img.youtube.com / picsum.photos
egress. Hot-linked thumbnails and embeds still work for real visitors at runtime; verify
markup and layout locally, and flag media for an eyeball check after deploy.

## Phase 2 — Architecture (non-negotiable rules)

- **Tenant page == tenant config row.** A new independent page = a new tenant with a fresh
  unique slug (e.g. `dmtv` → `dmtv-studio`). No new route files: `app/t/[slug]/page.jsx`
  serves every slug; `app/page.jsx` serves host-resolved tenants.
- **Renderer selection** goes through `components/templates/registry.js`, keyed by the
  config's top-level `template` field (`"showcase"` → ShowcasePage; unset/unknown →
  FunnelPage). Register new templates by template id, NEVER by tenant slug (product rule:
  no hardcoding one client).
- **Reuse before building.** If the brand's section list fits the existing showcase
  template (hero video, packages carousel + inquiry, video wall, series + submission form,
  featured video, about, film strips, FAQ, partnering, team tracks), author a config with a
  `showcase` content block and ship with zero new components. Only add a new template
  (own directory `components/<template>/` + CSS module) when the section shapes genuinely
  don't fit.
- **Do not modify**: `components/FunnelPage.jsx`, `styles.css`, `lib/defaultTenant.js`,
  `lib/tenantValidation.js`, `lib/store.js` (unless adding to `builtInTenants` was asked).
- **Config passthrough guarantee**: normalize/sanitize/storage are spread-based, so unknown
  top-level fields (`template`, bespoke content blocks) survive untouched. Bespoke blocks
  get NO sanitization, so they are seed-authored only, and components must read them with
  defensive defaults: `tenant.showcase?.reels || []`.

## Phase 3 — Author the tenant config (`lib/tenants/<name>.js`)

Export `normalizeTenantConfig({...})` (mirror `lib/tenants/dmtvStudio.js`). Checklist:

- [ ] `id: "tenant_<snake_slug>"`, unique `slug`, `status: "active"`, `template` set.
- [ ] `domains` must NOT collide with a sibling tenant's host (host resolution must stay
      deterministic; DMTV Studio uses `studio.dmtv.dgtlmag.com`, never `dmtv.dgtlmag.com`).
- [ ] `defaultPackageId` matches a package id; validation requires ≥ 1 package with unique
      ids and a valid `action`. Package ids double as carousel data and lead tags.
- [ ] `media.heroVideo` in the `sanitizeHeroVideo` shape:
      `{ url, kind: "video"|"playlist"|"channel", videoId, playlistId }`.
- [ ] All bespoke section content in ONE top-level block (e.g. `showcase: {...}`), copy
      pre-written to taste-skill standards (see Phase 4), placeholders honestly labeled
      (content categories, not invented film titles or fake stats).

## Phase 4 — Design

- **Invoke the `design-taste-frontend` skill** and declare the design read + dial values
  before writing markup. DMTV Studio read: creative-agency/music-network, dials 9/7/3.
- Styling lives in a **route-code-split CSS module** (`components/<template>/<X>.module.css`,
  precedent `FundingSurveyWidget.module.css`). Never add page styles to `styles.css` or
  the layout: a layout-level global would ship bytes to every route including admin.
- The module's root class owns its world (background, color, min-height) because global
  body rules still apply. Use page-scoped custom properties (e.g. `--sc-*`) set inline
  from `tenant.brand` colors. NEVER touch the funnel's `--blue`/`--blue-dark`/`--accent`
  or `--fp-*` contract tokens.
- Fonts already loaded `preload: false` in `app/layout.jsx`: `--font-grotesk`
  (Space Grotesk 500/700), `--font-bricolage` (Bricolage Grotesque 400/700), Geist,
  Geist Mono, `--font-fraunces`, `--font-instrument`. Adding a face = one `next/font`
  block with `preload: false`, nothing else.
- Reuse: `components/YouTubeHeroPlayer.jsx` (muted looping hero video; the global
  `.hero__video` / `.is-playing` classes work inside any `position: relative` +
  `overflow: hidden` parent, reduced-motion handled), `components/motion/Reveal.jsx`
  and `Stagger.jsx` (scroll reveals, reduced-motion handled), `lucide-react` icons.

## Phase 5 — Forms → the existing lead pipeline

Every public form POSTs JSON to `/api/leads`. The contract (verified):

- Only `PUBLIC_LEAD_FIELDS` survive (`lib/leadUtils.js:142-169`): business/name/contact,
  email, phone, url, address fields, `category`, `notes`, `packageId`, `tenantId`,
  `tenantSlug`, `contactTitle`.
- `source` is FORCED to `public_form` and `metadata` is DROPPED. All tagging must ride on
  `category` (admin-filterable), `packageId`, `contactTitle`, and `notes`.
- ALWAYS include `tenantId` + `tenantSlug` (drives team scoping in `createLead`).
- Tag by intent, e.g.: `category: "minute-of-music"` + `packageId`, `"package-inquiry"`,
  `"brand-partnership"`, `"team-application-<role>"` + `contactTitle: "SALES"`.
- Known caveat (accept + document): per-tenant duplicate suppression collapses two
  submissions with the same email into one lead row.
- Build ONE shared form component per template, parameterized by fields + a
  `mapPayload(values)` callback. Pre-filled selects (package/role pickers): remount with
  `key={selectedId}` so `defaultValue` updates on selection.

## Phase 6 — Register and seed

- Add the config to the array in `scripts/seed-tenants.js` (idempotent upsert by slug).
- `builtInTenants()` in `lib/store.js` only if the tenant must exist without seeding
  (most brand tenants, like `dmtv`, are DB-row-only).
- `npm run seed:tenants` (works against Postgres via `DATABASE_URL` or the JSON file store
  fallback at `data/app-store.json`).

## Phase 7 — Verification ladder (run ALL of it; each rung caught a real bug)

1. **Config tests** in `tests/<name>.test.js` using plain `node --test` + `assert/strict`.
   node cannot import JSX, so test lib modules only (NOT the registry/components):
   `template` survives `sanitizeTenantConfig`, `validateTenantConfig(...).ok === true`
   (the field is `ok`, not `valid`), heroVideo sanitizes playable, domains don't collide.
2. `npm test` — run the FULL suite. If unrelated tests fail, stash and re-run to prove
   they're pre-existing (missing `npm install` in a fresh container is the usual cause).
3. `npm run build` — catches CSS Modules issues. Gotcha: `composes: someClass` requires
   `someClass` to be defined EARLIER in the same file, or the build fails.
4. Dev server (`npm run dev`, port 8088): curl the new page's SSR HTML for section
   markers; curl a sibling tenant page (`/t/dmtv`) to confirm untouched rendering.
5. **Dash audit** on VISIBLE text only (the RSC flight payload legitimately contains
   config JSON, so strip scripts first):
   `curl -s URL | python3 -c "import sys,re; h=re.sub(r'<script[^>]*>.*?</script>','',sys.stdin.read(),flags=re.S); t=re.sub(r'<[^>]+>',' ',h); print(t.count(chr(0x2014)), t.count(chr(0x2013)))"`
   Both counts must be 0 (taste-skill em-dash ban).
6. **Screenshots** with `playwright-core` (install in the scratchpad, not the repo) +
   preinstalled Chromium at `/opt/pw-browsers/chromium-*/chrome-linux/chrome`,
   `args: ["--no-sandbox"]`. Desktop 1440x900 + mobile 390x844. Framer `whileInView`
   sections stay at opacity 0 in fast fullPage stitches: probe each section with
   `scrollIntoView` + ~1s settle and screenshot per section instead of trusting one
   fullPage capture. Broken thumbnails = sandbox egress, not a bug; verify structure.
7. **Forms end-to-end**: submit at least one form through the real browser (fill inputs,
   click submit, assert the success note) and the rest via curl with exact payloads.
   Then read the store (`data/app-store.json` leads array, or DB) and assert each lead
   landed with the right `tenantId`, `category`, `packageId`, `notes`.
8. Run the `design-taste-frontend` Pre-Flight Check against the screenshots (eyebrow
   count, CTA intent dedupe, contrast, hero discipline).

## Gotchas library

- YouTube `maxresdefault.jpg` doesn't exist for every video → `onError` fallback to
  `hqdefault.jpg` (always exists) on the `<img>`.
- Remote images must be plain `<img>`, not `next/image` (no `images.remotePatterns` in
  `next.config.mjs`; same precedent as FunnelPage's SmartImage).
- Instagram content: designed link cards, NOT `embed.js` (heavy script, CLS, and IG
  thumbnails require oEmbed tokens to hot-link).
- Click-to-load video facades: thumbnail button → swap to `youtube-nocookie.com/embed`
  iframe with `autoplay=1` on click. Keeps LCP on a plain image.
- Nav solid-on-scroll: IntersectionObserver on a 1px top sentinel (needs `position:
  relative` on the page root). NEVER `window.addEventListener("scroll", ...)`.
- Smooth `scrollIntoView`/`scrollBy` calls: gate `behavior` on `useReducedMotion()`.

## Phase 8 — Close out

1. **Brain updates** (per CLAUDE.md): dated bullet in `brain/50-Audit-Log/51-Timeline.md`;
   `brain/50-Audit-Log/52-Decision-Log.md` rows for any architecture decision; new row +
   `updated:` bump in `brain/60-Reference/63-Tenants-Catalog.md`; touch
   `brain/10-Architecture/14-Routes-Map.md` if routing facts changed.
2. Final `npm test` + `npm run build`, then commit (small, descriptive) and
   `git push -u origin <branch>`.
3. PR only when the user asks. Body: what shipped, how the registry keeps existing
   tenants byte-identical, test/build results, and an explicit "for the client team"
   list (placeholder media, unconfirmed pricing/handles).
4. Report exact commands, results, and files changed. Flag anything that needs an
   unblocked-network eyeball check (video playback, hot-linked thumbnails).
