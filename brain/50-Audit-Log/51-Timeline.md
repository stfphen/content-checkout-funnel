---
title: 51 · Project Timeline
type: log
tags: [audit]
status: living
updated: 2026-07-02
---

# Project Timeline

Chronological history, reconstructed from repo docs + git. **Append newest entries at the top.**
Dates are from doc timestamps / commit themes; treat older "status" claims as point-in-time snapshots.

## 2026-07
- **07-03 (evening)** — **DEPLOYED: dgtlmag.com now runs `main` @ `44187af`** (YouTube hero feature +
  polish; operator ran scp + ssh with the pre-built clean bundle — first bundle to correctly
  **exclude `.env`/`.env.local`**, and **no `seed:tenants`** so Tenant-Editor edits on prod rows
  survive). Cutover watched externally: new-code marker (`/api/admin/media/youtube-resolve`)
  flipped 404→405 at 18:02 with zero downtime (site 200 throughout). **Post-deploy smoke green:**
  all 5 funnels + www/TLS + admin login 200; youtube-resolve returns 401 JSON unauthenticated;
  default funnel pixel-stable (0 `--fp-*` vars); hero image LCP intact. `YOUTUBE_API_KEY` verified
  locally (Data API path); operator to confirm it's in the VPS `.env`. → `docs/DEPLOY_NEXT.md`.
- **07-03 (later)** — **YouTube hero polish (`fix/youtube-hero-polish` → `main`).** (1) A playing video
  now **replaces** the hero image outright: iframe at full opacity, poster fades to 0 via a
  `data-video-playing` attribute the player stamps on the hero container (chose the attribute over
  `:has()` — Chrome 149 showed a dynamic-invalidation quirk, and attributes survive React re-renders
  + old Safari). Shade gradient stays for headline legibility. (2) **True cover scaling**: cq-unit CSS
  replaced by JS sizing (`coverSize()` in `lib/media/youtube.js`, unit-tested; ResizeObserver for
  rotation/mobile) that is **content-aspect-aware** — oEmbed dims are captured at resolve time into
  `heroVideo.aspect`, so 4:3 classics/verticals get YouTube's in-player bars cropped, not letterboxed
  (verified live: oEmbed reports 1.3333 for a 4:3 video). (3) **Hidden-tab bug fixed**: the playback
  watchdog now waits for `visibilitychange → visible` before its clock starts — previously a
  background-tab visitor would arrive to a killed video. (4) `YOUTUBE_API_KEY=` added to
  `.env.example`. 289/289 + build green; CSS/geometry verified in-browser (transition-free computed
  checks; window occlusion pauses transitions). **Correction to yesterday's note:** the "googlevideo
  blocked" diagnosis was wrong — the automation Chrome window was merely occluded
  (`visibilityState: hidden` pauses embeds/autoplay/transitions); nothing is blocked on this network.
- **07-03** — **YouTube hero media SHIPPED (`feature/youtube-hero` → merged to `main`).** Tenant hero
  can now loop a **single video**, a **playlist in order**, or a **channel's uploads shuffled**
  (uploads playlist `UU…`, 200-item embed cap), configured in the Tenant Editor media slots:
  paste link → Detect (`/api/admin/media/youtube-resolve`; handles resolve via optional
  `YOUTUBE_API_KEY` or SSRF-guarded page fetch — live-verified against real YouTube incl.
  `@handle → UU…`) → video-vs-playlist choice for dual URLs → save via the audited edit-route
  media patch. Config: `media.heroVideo {url,kind,videoId,playlistId}` (sanitize coerces invalid
  to empty; media block now sanitized for the first time). Render: `YouTubeHeroPlayer` (IFrame API
  all kinds, reveal only on PLAYING, idle-deferred so the image stays LCP/poster, watchdog+onError
  → silent image fallback, reduced-motion = image only), wired into full-bleed (under the shade)
  and split hero variants; `.hero__video` cq-unit cover CSS. **286/286 tests + build green.**
  ⚠️ Verification note: this Mac's network/Chrome blocks googlevideo.com media delivery (even
  youtube.com itself can't play), so live playback could not be eyeballed locally — instead the
  blocked environment proved the graceful-degradation path end-to-end (player ready → no media →
  watchdog → image stays, zero errors). Playback needs an eyeball check on an unblocked network
  after deploy. Draft previews seeded: `/t/verify-yt-{video,playlist,channel}?preview=draft`.
- **07-03** — **REDEPLOYED: dgtlmag.com now runs `main` @ `14a746b`** — the consolidated tip is fully
  in production (security fixes C2/H1/H2/M1/M2, admin Dark Command-Center, funnel design control +
  media library). Pre-deploy: added the missing `./uploads:/app/public/uploads` compose mount
  (`14a746b`; standalone output snapshots `public/` at build time) with `chown 1000:1000` for the
  non-root `node` user; wipe now preserves `.env` + `uploads/` + `backups/`. VPS run clean end-to-end:
  DB backup → migration **007** applied → **seed:tenants 5/5** (the `upsertTenantConfig` slug fix
  proved out on the previously-colliding `on-home-decor`) → container recreated → local 200.
  **External smoke green:** all 5 funnels + `/admin/login` 200; hero via `/_next/image`; default funnel
  pixel-stable (0 `--fp-*` vars in served HTML). Note: `data-theme="dark"` only renders on the authed
  admin shell (`AdminTabbedShell`), not the login page — eyeball the dark command-center at next login.
  Remaining ops: C1 key rotation + H3 strong `POSTGRES_PASSWORD` (operator deferred, "later"),
  Stripe webhook registration, uptime monitor. → [[41-Deployment-Runbook]] · [[53-Known-Issues]].
- **07-02 (night)** — **DEPLOYED: dgtlmag.com now runs `main` @ `814f861`** (first production sync since
  the months-old snapshot — ships the UI overhaul, Portfolio P0, enterprise MVP, migration 006). Operator
  ran the tar-bundle sequence (runbook Path A; DB backed up first, `.env` preserved). Two failed attempts
  first: (1) `seed:tenants` hit `tenants_slug_key` — prod already had an `on-home-decor` row under a
  different id; **fixed in `lib/store.js` `upsertTenantConfig`** (PG path now resolves by `(team_id, slug)`
  before the id-keyed insert, matching file-store semantics; verified against a decoy collision on local
  pg; 208/208 + build) — and the `&&` chain meant `up -d --build` never ran; (2) second run's paste showed
  fully-cached layers + `curl` connection-reset, which was just boot timing. **External smoke green:** all
  5 tenant funnels + `/admin/login` 200, `www` 200/TLS, new-build hero via `/_next/image`, funded-growth
  funding markup, portfolio section correctly absent (no tenant populated). Unverified from outside:
  whether the VPS `seed:tenants` re-run used the fixed image (tenants render from built-ins either way).
  **VPS is one deploy behind current `main`** — the `716e5b2` redeploy (migrations 007, uploads volume)
  is the next ship. → [[41-Deployment-Runbook]] · `docs/DEPLOY_NEXT.md` · [[53-Known-Issues]].
- **07-02 (late)** — **Repo CONSOLIDATED: everything merged to `main` @ `716e5b2` and PUSHED; redeploy-ready.**
  Sequence: committed the audit tree's doc WIP + a chore commit tracking the taste-skill pack /
  audit docs / brand asset (root `.obsidian/` + `.claude/worktrees/` gitignored) → merged
  `audit/2026-07-02` (`718e472`, clean) → merged `feature/funnel-design-control` (`716e5b2`; only
  the two brain logs conflicted, resolved as chronological unions — styles.css/store.js/16-Design-System
  auto-merged). **Gates: 272/272 tests (208 base + 26 audit + 38 funnel), clean build, migration 007
  applied to local pg, runtime smoke green** (default funnel pixel-stable with 0 `--fp-*` vars, DB
  tenants render, dark-cinematic preview correct, admin login 200). Removed a stale clean `/tmp`
  deploy-main worktree (operator-approved) that was blocking the main checkout. `npm audit` = 2
  moderate, **accepted as L6** (postcss via next; no non-breaking fix). `docs/DEPLOY_NEXT.md`
  refreshed for `716e5b2` (migrations 006+007, seed:tenants, **`public/uploads` volume**, MEDIA_*
  vars, dark-first admin note). Remaining before/at redeploy: operator SSH deploy, C1/H3 rotations,
  H4 unsubscribe, pg dedupe parity; PR #2 (`origin/feature/prospect-enrichment-integration`) still
  open on GitHub. Historical `backup/*`/`wip/*`/`rescue/*` branches untouched per the 07-01 decision.
- **07-02** — **Funnel Design Control upgrade SHIPPED on `feature/funnel-design-control`** (per
  `docs/PROMPT_FUNNEL_DESIGN_CONTROL.md`; worked in an isolated worktree off `main` to avoid the
  admin-command-center WIP in the main tree). All four features: **(1) design directions** — 5
  data-driven token specs (`lib/tenantBuilder/designDirections.js`), `design` block in config,
  `--fp-*` CSS layer with per-literal fallbacks, FunnelPage section registry + hero variants
  (full-bleed/split/typographic), picker cards in TenantBuilder, 4 new `next/font` display faces
  (preload:false); **(2) tenant editing** — `lib/tenantBuilder/editTenant.js` (allowlist merge,
  clobber-proof via schema, defaultPackageId repair) + `configDiff.js`, `/api/admin/tenants/edit`
  (NL + deterministic patch modes, GET draft), TenantEditor panel (prompt box, changed-paths diff,
  per-section forms, direction switcher, publish/republish); **(3) copy limits** —
  `copyLimits.js` single table → schema maxLength/min-maxItems + advisory warnings (no truncation),
  SYSTEM_PROMPT rewritten (benefit-led, char budgets, no fabricated media URLs); **(4) media
  library** — migration `007_media_assets` (+ ensureSchema mirror + file-store branch), `lib/media/`
  local provider behind `getStorageProvider()`, magic-byte upload validation (no SVG, 10MB),
  `/api/admin/media` (POST/GET/DELETE + reference check), `mediaId` slots (hero/portfolio/logos)
  resolved server-side by `resolveTenantMediaConfig` in both public page routes, MediaPicker wired
  to every slot. **Verified:** `npm test` 246/246, `npm run build` green; dev-server render checks —
  all 5 direction previews show correct `data-direction`/hero variant/section order, mediaId hero
  resolves through next/image, default tenant renders with **zero** `--fp-*` vars (pixel-stable).
  Decisions in [[52-Decision-Log]]; docs: [[16-Design-System]] · [[14-Routes-Map]] ·
  [[2D-Portfolio-Media]] · [[43-Environment-Variables]]. **Merged to `main` 2026-07-02** together
  with `audit/2026-07-02` (this entry resolved as a chronological union in that merge).
- **07-02** — **Admin "Dark Command-Center" reskin Phases B–D shipped** (on `audit/2026-07-02`:
  `97f1252`, `35916a2`, `3e935bb`; the former uncommitted admin WIP is now committed). Admin-only —
  funnel + all contracts untouched, no logic/route/data changes. **Phase B:** admin is now
  **dark-first** (`useAdminTheme` defaults dark; toggle + light still work) with a deep
  command-center palette (`--bg #08080b` + accent tint, layered surfaces) and new accent/glow/
  elevation tokens (`--accent-fg/-tint/-line`, `--focus-glow`, `--glow`, `--card-grad`,
  `--card-shadow/-hi`) derived from `--blue` so any tenant accent works, AA. **Phase C:** bolder
  shell header + accent eyebrow, glowing sidebar active rail, KPI pills → elevated Geist-Mono metric
  cards. **Phase D:** panels/cards elevated (`--card-grad` + `--border-strong` + `--card-shadow`),
  inset inputs with glowing focus ring, uppercase table headers + row hover, hairline pill borders.
  SSR fix (`35916a2`): shell emits `data-theme="dark"` server-side so admin paints pre-JS (was
  hidden until the client resolved the theme; no hydration mismatch). Phase-A preview:
  `docs/specs/admin-command-center-preview.html`. Build clean + node tests green per commit;
  Phases C–D verified in-browser in **both dark + light** (elevated cards, glowing input focus,
  KPI header, readable pills); the **public funnel confirmed untouched** (no `.v2-admin-shell`, stays
  light, tenant accent `#C9A9A6` intact). ⚠️ Local dev-server was flaky — an environmental Next.js
  dev-tools/RSC bug (`segment-explorer-node`, cleared by a clean `.next`) + `output:standalone` vs
  `next start` mismatch + very slow hydration (cold loads need an interaction to reveal panels here;
  fine in prod). Build clean + `node --test` **234/234**. See [[16-Design-System]] / [[21-Admin-Shell]].
- **07-02** — **Full codebase audit + security fixes (branch `audit/2026-07-02`, off `195c143`).**
  Ran the `docs/prompts/codebase-audit.md` sweep with 10 parallel area auditors. Baseline was
  healthy: `npm test` 208/208, `npm run build` clean, SQL-injection surface clean, secrets never
  git-committed. **Fixed (all with tests; 234/234 green, build clean):**
  - **C2 SSRF** — new `lib/enrichment/ssrfGuard.js` (scheme allowlist + private/reserved/metadata
    IP block + per-redirect-hop revalidation via `safeFetch`); wired into `website.js`. See [[24-Enrichment]].
  - **H2 + cross-team lead IDOR** (broader than catalogued) — `getLeadById`/`updateLeadResearch`
    now take `{ teamId }` and filter on both backends; enrich/enrich-batch/research/fill-missing/
    research-from-query/funding-review routes all pass session team; enrich routes upgraded from
    bare `getAdminSession` to `requireRole`. New: cross-team `updateUserStatus` lockout closed
    (team-membership guard). See [[21-Admin-Shell]] / [[15-Multi-Tenancy]].
  - **M1/M2** — `sanitizePublicLeadInput()` whitelists public fields on `POST /api/leads` **and**
    `/api/checkout` (checkout had the same hole, uncatalogued); teamId/status/score/assignee no
    longer client-forgeable.
  - **H1** — in-process login rate limiter (`lib/rateLimit.js`, 10/min/IP) + bcrypt-timing
    equalizer on the user-miss path.
  - **Pipeline correctness (new)** — `updateLeadStatus` validates against `pipelineStatuses`
    (was silently corrupting/resetting); buying-committee promotion no longer collapses to one lead
    (email now distinguishes people in `shouldSkipReliableDuplicate`). See [[2C-Enterprise-Prospecting]].
  - **L1** — `permissionDeniedResponse` returns 401 JSON to fetch/XHR callers (redirect only for
    navigations); added admin `error.jsx`/`loading.jsx` boundaries.
  Open items written up in [[53-Known-Issues]] (M3 unsubscribe amplification, Stripe idempotency,
  file-store write race, DB indexes/dedupe parity, outreach double-send). Full report:
  `docs/audits/2026-07-02-codebase-audit.md`. C1/H3 (key rotation, DB password) remain ops-side.
- **07-02** — **Claude AI auth CONFIGURED (subscription path) — local + VPS.** Root cause of all
  AI features failing was simply no credentials: `aiMode()` was `"off"` everywhere. Minted a
  long-lived `CLAUDE_CODE_OAUTH_TOKEN` via `claude setup-token`; added to local `.env.local`
  (smoke-tested: `aiMode()` → `"subscription"`, real `generateJson` round-trip passed) and appended
  to the VPS `/opt/content-checkout-funnel/.env` by the operator over SSH, app container recreated.
  Deployed image verified subscription-capable (`@anthropic-ai/claude-agent-sdk` + musl build in
  node_modules, running as uid 1000 non-root). Prod smoke test (Deep Research in `/admin`) pending
  operator confirmation. See [[2B-AI-Backend]].
- **07-02** — **All five tenant funnels now live as DB rows.** Local `tenants` table previously held
  only `dgtlmag`/`dmtv`/`elixr`; added `fundedGrowthTenant` to `scripts/seed-tenants.js` and re-ran
  `npm run seed:tenants` — upserted all 5 (`dgtlmag`, `dmtv`, `elixr`, `on-home-decor`,
  `funded-growth`) into `team_default`. Verified each `/t/<slug>` renders its own branding from
  Postgres; `npm test` 208/208. In-code configs stay as seed source + fresh-DB fallback.
  ⚠️ Production (VPS) must re-run `npm run seed:tenants` at deploy for parity — see
  [[41-Deployment-Runbook]]. Catalog updated: [[63-Tenants-Catalog]].
- **07-02** — **`feature/portfolio-p0` MERGED to `main` (`a87a714`) and pushed (`be7babb`); deploy
  pending operator SSH.** The active line (UI overhaul Phases 0–5 + deferred-items pass + Portfolio P0 +
  AccountCard surfacing + brain/vault work) merged `--no-ff`; single conflict in this timeline resolved
  as a chronological union. Hard gate re-run **on the merged tip**: `npm test` 208/208 + `npm run build`
  green. `docs/DEPLOY_NEXT.md` refreshed for the new tip. Deploy blocked from the Mac: VPS
  `root@62.72.16.32` rejects key auth (password only — no key for it in `~/.ssh`), so the runbook
  sequence must be run interactively by the operator. Pre-verified: DNS `@`/`www` → `62.72.16.32` ✅,
  live site currently 200 on the old snapshot ✅. See [[41-Deployment-Runbook]] / `docs/DEPLOY_NEXT.md`.
- **07-02** — **Narrow-breakpoint QA of populated Pipeline/Calls PASSED — ui-overhaul before-merge
  checklist complete.** Recreated the iframe harness (temporary `public/qa-harness.html`, same-origin so
  the admin cookie flows; deleted after), reset the `qa-owner` login via `create-owner` upsert, and seeded
  12 leads + 10 calls into `qa-team` via a scratch script over `lib/store.js` (no calls seeder exists;
  `seed-funding-demo` hard-wires `team_default`). At 360/375/414: no horizontal document overflow on
  either tab (JS `scrollWidth` probe + screenshots); lead cards stack 1-col with ellipsis truncation and
  usable accordions; calls table stacks into `data-label` cards; Recording (play + Transcribe) and
  Outcome rows fit — the outcome `<select>` saves on change (no confirm-button crowding; Delete is
  owner-email-gated away). **No CSS changes needed.** Local migration 006 applied as a side effect
  (`npm run migrate`). → [[16-Design-System]] checklist closed; branch merge-ready.
- **07-02** — **Vault dashboard + product map added** (via the newly installed Obsidian skills):
  `00-Index/Vault-Dashboard.base` (Bases views over note frontmatter — living working set, stale radar
  grouped by status, modules, all-notes-by-folder, with a computed `days_stale`) and
  `00-Index/Product-Map.canvas` (JSON Canvas module map: acquisition → lead lifecycle → platform groups,
  file nodes linked to module notes, status-colored — green stable / yellow 2C MVP / orange 2D phased).
  Replaced the empty `Untitled.base`/`Untitled.canvas` strays. Home checklist now points to both; Home
  "status at a glance" refreshed to the `feature/portfolio-p0` active line; `01-How-To-Use-This-Vault`
  gained its missing `status: living`.
- **07-01 (late)** — **Repo CONSOLIDATED and PUSHED; deploy-ready.** `main` fast-forwarded from
  `83ea5d6` → **`cd0597e`** (enterprise-prospecting MVP + full UI/UX overhaul + brain syncs +
  funding-program docs merge) and **pushed to `origin/main`** — the delta since the last
  verified-green build (`13457df`, 202/202 tests) was proven docs/brain-only. Cleanup (conservative,
  per operator): full **all-refs backup bundle** at `~/content-funnel-backup-2026-07-01.bundle`;
  deleted 6 git-verified-merged branches (`integration/ui-overhaul`, `feature/ui-overhaul`,
  `feature/mobile-first`, `feature/per-tenant-app-icon`, `feat/enterprise-prospecting-mvp`,
  `feature/funding-program-docs`); removed the `funding-program-docs` worktree after merging;
  **kept** all `backup/*`/`*-wip`/`rescue/*`/divergent branches and all remotes.
  `feature/portfolio-p0` (active concurrent session) untouched — its portfolio work merges later.
  Deploy prep: `docs/DEPLOY_NEXT.md` records gate status, migration-006 requirement, new env vars
  (`SEC_EDGAR_USER_AGENT`, `OPENCORPORATES_API_TOKEN`), and the exact VPS sequence. Roadmap item 1
  (repo recovery) **done**; item 2 (sync VPS) is next. See [[31-Current-Priorities]] · [[41-Deployment-Runbook]].
- **07-01** — **Enterprise AccountCard: research + campaign-scope now surfaced (`8b550fe`, `feature/ui-overhaul`).** User flagged that the Accounts tab showed no UI connection to research/campaign scopes. Root cause = two things: (a) all demo accounts sat at `gate1_approved` (pre-research), so the gated research/scope UI hadn't triggered; and (b) a real gap — the card computed & persisted a full research dossier + a 9-field campaign concept but rendered only 3 (`name/budgetBand/bigIdea`). Fix (`components/admin/AccountsPanel.jsx`, pure render of existing round-tripped data — no new logic/routes): added a **Research summary** block (dossier `businessProfile.summary` + source/confidence/date/public-data note) and **expanded the campaign block** (status pill, deliverables list, budget + rationale, success metric, outreach opener). Verified in-browser on a scoped account in admin dark mode. Enterprise-prospecting data path confirmed intact: `account_campaigns` columns → `mapAccountCampaignRow` → panel props all carry the fields. [[2C-Enterprise-Prospecting]]
- **07-01** — **UI overhaul deferred-items pass STARTED on `feature/ui-overhaul`** (Phase-0 re-run: repo already had Phases 0–5 committed; user chose "finish the deferred items"). First surface done + verified in browser (light + admin-dark, non-default `on-home-decor` accent): **(1) found & fixed a real pre-existing dark-mode token bug** — the Phase-2 derived tokens (`--*-bg/-fg`, `--border-subtle/-strong`, `--fg-subtle`, `--hover-fill/-active-fill`, `--accent-band/-soft`) are `color-mix()` over `--surface/--fg/--border` but declared **only at `:root`**, so they baked in the LIGHT primitives and inherited into the dark shell unchanged (state banners/fills/bands rendered light-on-dark). Fix: re-declare the same expressions inside `.v2-admin-shell[data-theme="dark"]` so they re-resolve against the dark primitives (percentages nudged for dark legibility); light mode + brand contract untouched. This **corrects the earlier "auto-adapt in dark mode" claim** in [[16-Design-System]] / the 06-30 entry below. **(2) Funding review notice reposition** (the long-open deferred item): `.admin-notice` is now a **sticky (top:12px), dismissible** banner (accessible close button — `role=status`, aria-label, 40px hit target, focus-visible ring), tokenized via new `--info-bg/-fg/-border` (removed hardcoded `rgba(0,113,227,…)`). Commit `f3f7eef`; **build green, `node --test` 208/208**. **(3) Table/panel reskin — QA-first, `78970d9`:** a DOM-luminance audit of **all 8 admin tabs in dark mode** (plus visual spot-checks) found the token fix had already made tables/panels cohesive — **no blanket reskin needed**. Only two light-baked spots remained: `.research-pill--*` (hardcoded Tailwind emerald/amber/red hex → re-mapped to the adaptive `--success/-warn/-danger` trios; ~9 stray hex removed) and browser `-webkit-autofill` (pale-blue fill on dark inputs → dark-scope autofill override). QA harness notes: admin is DB-auth-gated (seeded a throwaway `qa-owner` owner + enterprise demo data into `qa-team`); browser window can't shrink below ~500px so narrow breakpoints are tested via a same-viewport **iframe harness** (media queries respond to iframe width); the automation tab drops intermittently. **(4) CSS consolidation — dead-code prune, `cdd529d`:** ran a PostCSS transform cross-referenced against all component/app/lib source (literal + dynamic `base--${x}` usage) to remove **66 fully-dead rules** (legacy `.v2-table*`/`.v2-cell-business`/`.v2-status-select`/`.v2-action-button`, an old `.tenant-builder__*` structure superseded by the current `__result/__warnings/__actions/__hint`, `.repeatable-list*`/`.package-editor*`, `.lead-table*`, and the never-wired-in `.ui-card/.ui-badge/.ui-eyebrow/.ui-display/.ui-skeleton/.ui-error` primitives) + **9 grouped rules trimmed** (16 dead selector-parts dropped, all live selectors kept) + emptied `@media` blocks. **styles.css 94,809 → 86,135 B (−8.7 kB; net −2.5 kB vs the 88.7 kB Phase-0 baseline** despite the dark-token + banner additions). Dead-code only (unused selectors can't affect rendering); build green, `node --test` 208/208, admin dark shell/panels verified intact in-browser. **(5) Admin code-split — `c3425aa`:** the six off-default-tab panels (`AccountsPanel`, `CallsTable`, `OutreachQueueBuilder`, `TenantBuilder`, `TenantBrandingSettings`, `TenantPhoneSettings`) now load via `next/dynamic({ssr:false})`. Because `AdminTabPanel` unmounts inactive tabs, their chunks fetch on tab-open, not first paint. `ssr:false` isn't allowed in the server admin page, so the wrappers live in a new **client module `components/admin/lazyPanels.jsx`** (fixed-height card fallback → no CLS). Pipeline-tab panels stay eager. **/admin first-load JS 169 kB → 151 kB (−18 kB); route-specific 26.9 kB → 9.16 kB.** Build green, 208/208; verified in-browser that Accounts + Tenants load their deferred chunks and render fully, nav intact. **This resolves the build-plan's "admin first-load JS unchanged" gap.** Remaining (not blocking): a narrow-breakpoint pass over *populated* Pipeline/Calls tables. See [[16-Design-System]].
- **07-01** — **Portfolio P0 (config + render) SHIPPED** on `feature/portfolio-p0` (branched from
  `feature/ui-overhaul`). Per-tenant `portfolio` + `references` config sections with empty-array defaults
  (`lib/defaultTenant.js`), per-item sanitization (`lib/tenantValidation.js`: `src`/`thumbnail`/`link`
  limited to root-relative or http(s) — protocol-relative `//` rejected; `mediaType` allowlisted
  image|video|embed; tags coerced to string arrays; unusable entries dropped) + 3 new `ARRAY_PATHS`
  entries. Funnel renders new `PortfolioSection`/`ReferencesSection` between output and packages **only
  when populated** — empty tenants fall back to the `output.tiles` grid unchanged (verified via an
  isolated `APP_STORE_PATH` dev run: populated tenant shows both sections in order with local images via
  `next/image` + responsive embed iframe; emptied tenant renders no new markup). Real headings/alt (not
  the `aria-hidden` tile pattern), Reveal/Stagger motion, mobile-first `min-width` CSS on semantic tokens.
  Tests **208/208** + build green (`tests/portfolio-config.test.js` added). Direct `src` only — the media
  library/`mediaId` indirection is P1 → [[2D-Portfolio-Media]].
- **07-01** — **Portfolio / references + media library DESIGNED (not built).** Planned a per-tenant funnel
  "Portfolio & References" section (real video/image case studies, client logos, testimonials, result
  metrics) that today has no equivalent — the funnel's `output` section renders only `aria-hidden`
  **text tiles** (`components/FunnelPage.jsx:270-283`). Operator chose: (1) a **real upload + team-scoped
  media library** (new `media_assets` table / migration `007`, storage-provider seam mirroring telephony,
  mock/URL-first with graceful degradation) with **assets referenced by `mediaId` — never inlined into
  `tenants.config`** to keep configs lean; (2) **AI-assisted selection** — extend [[2A-Tenant-Builder]]'s
  `TENANT_OUTPUT_SCHEMA` to pick relevant library assets by `industry`/`format` tags (retrieval of existing
  `mediaId`s, not fabricated URLs; human-approved via draft→publish); (3) a **plan-only** deliverable
  captured in the brain. New config sections `portfolio` + `references` + validation `ARRAY_PATHS` entries;
  new admin `MediaLibrary` + `FunnelContentEditor` (the first direct hero/media/copy editor — today copy is
  only AI-regenerated or JSON-imported). 5-phase additive rollout, gated behind repo stabilization. Flagged
  that the new upload surface amplifies open security gaps (SSRF C2, rate-limit H1, IDOR H2, type-sniffing).
  Plan of record: [[2D-Portfolio-Media]]. See [[52-Decision-Log]] · [[33-Sprint-2-Productization]].

## 2026-06
- **06-30** — **UI/UX overhaul prompt revised to add a Phase 0 preflight gate** (uncommitted working-tree change to `docs/prompts/ui-ux-overhaul.md`, on `feature/ui-overhaul`). The overhaul workflow now opens with **Phase 0 — Preflight / Repo-State Report**: before touching code the executor must inventory `git status`/`stash`/`log`/`diff`, bucket every change by effort (enterprise-prospecting, mobile, brain, this UI work) as committed/uncommitted/stashed, flag collisions on shared files (`styles.css`, `AdminTabbedShell.jsx`, `app/admin/page.jsx`), capture a build+test baseline, and recommend a safe starting branch — then stop for approval. Also strengthens guardrails: explicit "no app code until Phase 0 + 1 approved," all perf baselines re-anchored to the **Phase-0** numbers (was "Phase 1"), `git stash` added to the hard-stop list, and the Accounts tab folded into the surface inventory. Effectively documents the gate the already-shipped build followed. See [[16-Design-System]].
- **06-30** — **UI/UX overhaul executed end-to-end (Phases 0–5) on `feature/ui-overhaul`.** Approved to run all phases to completion (off a new `integration/ui-overhaul` that first **committed the enterprise-prospecting MVP** `87f94a6`, clearing the dirty-tree blocker). Shipped in small commits, **build + 202 tests green throughout**: (1) token foundation + `.ui-*` primitives — **implemented via `color-mix` over the semantic tokens** (state-color trios, `--surface-3`/`--fg-subtle`/`--border-subtle/-strong`, `--ring/--hover-fill/--active-fill/--overlay`, `--accent-band/-soft`), **not** a literal `--n0…--n950` ramp (that lived only in the throwaway preview/spec); new tokens auto-adapt in admin dark mode, brand tokens untouched; (2) admin shell editorial refinement (accent nav active + eyebrows); (3) admin component states (`RecordingButton` error note, `OutreachQueueBuilder` `.ui-empty`); (4) funnel + funding-widget cohesion (accent eyebrows on light sections, funding CTA `--on-blue`/`--danger`); (5) **perf headline — hero `<img>` (1.74 MB) → `next/image`**, taking funnel **Lighthouse desktop 86→100 (LCP 2.6s→0.7s), mobile 75→92 (LCP 15.7s→3.1s)**, CLS held at 0. **Honest gaps (need browser visual-regression QA before merge):** deep per-surface reskin of tables + remaining admin panels not exhaustive (they inherit tokens only); funding review-banner reposition not done; admin first-load JS unchanged (`next/dynamic` with SSR gave no cut — needs `ssr:false` client tab-panels, reverted); CSS consolidation deferred (foundation *added* ~6 kB → 88.7 kB). Final results recorded in `docs/specs/ui-overhaul-build-plan.md`. See [[16-Design-System]] · [[52-Decision-Log]].
- **06-29 (late)** — **UI/UX overhaul moved from proposal → BUILD; brain re-verified.** On branch `feature/ui-overhaul`, Phases 1–3 of the overhaul are now implemented (was "planning only" earlier today): **Phase 1** = audit + design language + throwaway preview (`docs/specs/ui-overhaul-audit.md`, `docs/specs/ui-preview.html`) and the Phase-1 gate **chose Direction C — "Editorial brand-forward"** ([[52-Decision-Log]]); **Phase 2** = token foundation + primitives per `docs/specs/ui-overhaul-build-plan.md` (see the corrected 06-30 entry above — implemented via `color-mix` over the semantic tokens, **not** the `--n0…--n950` ramp this line originally described); **Phase 3** = admin shell editorial refinement + admin component states (`OutreachQueueBuilder`, `RecordingButton`). **Typeface swapped to Geist + Geist Mono** (`app/layout.jsx` now imports `Geist`/`Geist_Mono`; `--font-display` aliases `--font-sans`) — replaces the prior Inter/Sora pairing. Per-tenant brand-token contract, admin-scoped dark mode, and mobile-first `min-width` pattern all preserved. (Funnel reskin + perf pass have since shipped — see the 06-30 entry above.) See [[16-Design-System]]. — **Enterprise-prospecting MVP is now COMMITTED** (`87f94a6`); the stale `.git/*.lock` files are gone and git ref ops work again, clearing two operational items in [[53-Known-Issues]]. Brain refreshed via the setup-project-brain skill (notes reconciled to current `feature/ui-overhaul` reality; stray empty `Untitled.*` Obsidian artifacts removed).
- **06-29** — **Full UI/UX + performance overhaul prompt engineered** (planning only — no app code): authored `docs/prompts/ui-ux-overhaul.md`, a gated multi-phase task-completion workflow to reskin the **entire** product (admin shell + all tabs/components + public funnel/checkout) to a modern-SaaS standard and cut CSS/bundle weight. Direction is **aesthetic-agnostic** (measurable quality bars; the executor proposes the look for human approval at the Phase-1 gate); **scope = admin + funnel**; **contracts preserved** — per-tenant brand tokens (`--blue/--accent`), admin-scoped dark mode, mobile-first `min-width` pattern, `next/font` Inter/Sora. Phases: audit + design language → token foundation → admin reskin → funnel reskin → perf pass, each behind an approval gate. Status **proposed**, gated behind repo stabilization ([[31-Current-Priorities]]). See [[16-Design-System]] · [[52-Decision-Log]].
- **06-29** — **Enterprise prospecting: REAL data sourcing wired** (was mock-only). New adapters `lib/integrations/secEdgar.js` (free, no key) + `lib/integrations/openCorporates.js` (token optional); `lib/enterpriseProspecting/sourcing.js` composes EDGAR + OpenCorporates + Google Places for **search** (deduped, fit-scored, **mock fallback**) and Apollo + Hunter + EDGAR-firmographics + Claude for **research** (Gate-1-gated). Search route now async/real; research action enriches real contacts. +10 tests (mocked fetch: adapter mapping, degradation, fallback) → **31 feature tests, full suite 201/202** (1 pre-existing EPERM). `.env.example` adds `SEC_EDGAR_USER_AGENT`, `OPENCORPORATES_API_TOKEN`. Outreach still manual/human-approved.
- **06-29** — **Enterprise prospecting (ABM) MVP BUILT** (working tree, on `main`; uncommitted — see Known Issues re: stale git lock). Account-based motion implemented end-to-end and runs offline with zero keys: migration 006 + team-scoped store CRUD (`target_accounts`, `account_campaigns`) with JSON-fallback parity; `lib/enterpriseProspecting/` (gate state machine, deterministic ICP fit-scoring/tiering, campaign-concept builder, mock sourcing, Gate-2→lead promotion); 3 API routes (`/api/admin/accounts{,/search,/action}`, all `requireRole` + team-scoped + audit-logged); Accounts admin tab (`AccountsPanel.jsx`); demo seed (`npm run seed:enterprise-demo`). **21 new tests pass; full suite 191/192** (the 1 fail is a pre-existing sandbox EPERM in `core.test.js`, unrelated). Ultra-reviewed by 3 parallel agents (security/guardrails/JSX); applied security hardening (team-context guards, import cap, tenant-access validation). Contacts feed the **existing human-approved** outreach — no auto-send. ⚠️ Run `npm run migrate` + `npm run build` on a real machine (sandbox lacks Linux SWC).
- **06-29** — **Enterprise prospecting (ABM) designed (not built):** authored an account-based motion for high-ticket creative campaigns targeting enterprise (1000+) + mid-market (200–1000). Deliverables: engineered master prompt (`docs/prompts/enterprise-prospecting-master-prompt.md`), strategy playbook (`docs/specs/enterprise-prospecting-playbook.md`), module design spec (`docs/specs/enterprise-prospecting-module-spec.md`), brain note [[2C-Enterprise-Prospecting]]. Extends Batch Builder + Deep Research + Outreach (no fork); proposes 2 tables (`target_accounts`, `account_campaigns`) + `leads.account_id`; **3 approval gates** before the human-approved queue. Sources = open DBs + Apollo/Hunter + SEO/intent; **LinkedIn no-scrape** (official API + manual only). Status **proposed** — gated behind repo stabilization ([[31-Current-Priorities]]).
- **06-29** — **Mobile funnel bugfix:** brandbar `Log in` button was stretching full-width and overflowing on phones (≤560px). Root cause: the global `.button { width:100% }` mobile rule (intended for stacked hero CTAs) also matched `.brandbar__login`. Fixed in `styles.css` by resetting `.brandbar__login` to `width:auto; flex:0 0 auto` inside the ≤560px query, and hiding the secondary tagline at ≤370px so the logo + login sit cleanly on one row.
- **06-27** — **ON Home Decor** onboarded as a built-in tenant: `onHomeDecorTenant` wired into `builtInTenants()` (`lib/store.js`) and the `npm run seed:tenants` list. Toronto/GTA interior-design + paint funnel migrated from a standalone Lovable site; `$200` *Curated Paint Selection* entry offer (`curated-paint-selection`) laddering up to room styling, kitchen/bath, and full-home renovation design. See [[63-Tenants-Catalog]].
- **06-27** — Added [[Architecture]] overview note (single-page map: components, tenant system, admin dashboard) under `10-Architecture/`; linked from [[10-Architecture-MOC]].
- **06-27** — 🧠 Built this Obsidian knowledge vault (`brain/`) consolidating all project context.
- **~06-26** — **Mobile-first UI overhaul** merged to `main` (audit U1–U5): bottom nav capped at ≤5 + "More" sheet, admin tables → stacked cards, advanced lead fields collapsed, funding review checklist pinned, funnel grids mobile-first with `minmax` guards. Phase 1 audit → `docs/specs/mobile-audit.md`.
- **~06-25** — Telephony deepening: Calls-tab dialpad for ad-hoc calls; **owner-gated call delete** (email-gated to `stephen@dgtlgroup.io`); in-app **Deepgram transcription + Claude summary** (no Twilio CI dependency) with manual Transcribe button; authenticated recording proxy so Twilio recordings play in-browser; Twilio Conversational Intelligence + Claude summaries.
- **~06-24/25** — Telephony foundation: **mock provider + simulated call lifecycle**, real recording + consent webhook, recording player UI. Provider seam (`getProvider`) for twilio/telnyx/mock.
- **06-22** — Dockerfile updated (non-root node user so the Claude Agent SDK CLI works in-container).
- **06-21** — **Go-live progress (RESUME_HERE):** Live **502 fixed** — root cause Next.js 15 bound to container-id hostname instead of `0.0.0.0`; fixed via `HOSTNAME=0.0.0.0` in `docker-compose.yml`; site returns 200. GitHub set as source of truth (`origin/main`). Branch hygiene: 9 local + 7 remote merged branches pruned (recoverable bundle kept). Diagnosed VPS running a months-old snapshot (`9e11b81`) with no unique work — ready to fast-forward.
- **06-20** — **Go-Live Plan authored** (12 phases). Branding: per-tenant app icon + DM lightning default. `.env.example` expanded.
- **06-18** — **PROJECT_STATUS snapshot:** `main` stable with PR #2 (AI prospect enrichment) merged. `feature/funding-program-v1` adds Funding Program V1 + real Stripe checkout, verified on local Postgres (**101/101 tests**, clean build). Worktree cleanup: removed 10 redundant enrichment worktrees/branches (backup retained). Production status observed: DNS/TLS healthy but `https://dgtlmag.com/` returning **502** (app container down).
- **06-17** — Demo flow documented. Funding admin engine ported from `project-worker-2`.
- **~06-09 to 06-16** — Project foundation: Next.js SaaS scaffold, tenant funnels, admin login, lead pipeline V1, prospecting batch builder, outreach sequence V1, CSV import, migrations 001–005, Docker/Traefik setup, design-system reskin (Inter/Sora + framer-motion).

## How to read the snapshots
PROJECT_STATUS (06-18) and RESUME_HERE (06-21) reference branches (`feature/funding-program-v1`,
`project-worker-2`) that have since been merged/superseded — current `main` already contains funding +
Stripe + telephony + mobile-first. Always re-confirm with `git log` ([[47-Git-Workflow]]).

Up: [[50-Audit-Log-MOC]]
