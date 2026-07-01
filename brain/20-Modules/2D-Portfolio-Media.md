---
title: 2D · Portfolio / References & Media Library
type: module
tags: [module, tenancy, ai, media]
status: living
updated: 2026-07-01
---

# Portfolio / References & Media Library

> **Status: PROPOSED — design/plan only, not built.** Gated behind repo stabilization
> ([[31-Current-Priorities]]), like [[2C-Enterprise-Prospecting]] was. This note is the plan of record;
> update it as phases land. Decision rationale in [[52-Decision-Log]] (2026-07-01).

## Purpose
Give each tenant funnel a **dynamic "Portfolio & References" section** that shows real work (video/image
case studies, client logos, testimonials, result metrics) chosen to be **relevant to that client's
business** — plus a **team-scoped Media Library** so assets are uploaded once and reused across tenants,
and an **easy admin editor** for the hero + funnel media/copy. Selection of which pieces appear is
**AI-assisted** (the [[2A-Tenant-Builder]] proposes a relevant set from the tagged library; a human
approves). Must honor the no-hardcoding invariant ([[15-Multi-Tenancy]]) — one library, tag-driven,
no single client/industry baked in.

Replaces/augments today's placeholder: the funnel's `output` section renders **text-only** tiles
(`output.tiles` = `["TALKING HEAD","UGC",…]`, an `aria-hidden` decorative grid in
`components/FunnelPage.jsx:270-283`). There is **no real portfolio media anywhere yet**.

## Scope (4 capabilities)
1. **Funnel section** — per-tenant `portfolio` + `references` config sections, rendered dynamically.
2. **Media Library** — real upload + reusable, tagged, team-scoped assets (new table + storage seam).
3. **AI-assisted selection** — extend Tenant Builder to pick relevant library assets by tag.
4. **Admin editor** — pick/reorder media + edit hero copy inline, with draft→publish + live preview.

## Key files (planned)
- Config shape / defaults: `lib/defaultTenant.js` — add `portfolio` + `references` sections + normalize them.
- Validation: `lib/tenantValidation.js` — add `["portfolio","items"]` + `["references","testimonials"]` /
  `["references","logos"]` to `ARRAY_PATHS`; per-item sanitize (id, kind, alt, tags, caption, link).
- Media data layer: `lib/store.js` — `media_assets` CRUD (team-scoped) + JSON-file fallback parity.
- Storage seam: `lib/media/` — `getStorageProvider()` (mirrors telephony's `getProvider`): `local`/`data-url`
  MVP → S3-compatible / DO Spaces / Supabase Storage in prod. Every path **degrades to URL/embed only**.
- AI selection: `lib/tenantBuilder/generateTenant.js` — extend `TENANT_OUTPUT_SCHEMA` so the model returns
  **references to existing `mediaId`s** + captions (retrieval, not fabricated URLs). Shares [[2B-AI-Backend]].
- API: `POST /api/admin/media` (multipart upload), `POST /api/admin/media/url` (register URL/embed),
  `GET /api/admin/media` (list/filter by tag), `DELETE /api/admin/media` (by `mediaId` in body — matches the
  leads/accounts body-param convention). All `requireRole` + team-scoped + audit-logged ([[21-Admin-Shell]]).
- UI: `components/admin/MediaLibrary.jsx` (grid, drag-drop upload, tag editor, filter) +
  `components/admin/FunnelContentEditor.jsx` (hero copy + hero image + portfolio picker, draft→publish,
  live `FunnelPage` preview). Funnel render: new `<PortfolioSection>` in `components/FunnelPage.jsx`.
- Data: new table `media_assets` (migration `007`) → [[13-Data-Model]].

## Data model (planned)
**`media_assets`** (migration `007`, team-scoped like everything else — [[15-Multi-Tenancy]]):
`id`, `team_id NOT NULL`, `kind` (`image`|`video`|`embed`), `url`/`storage_key`, `mime`, `bytes`,
`width`/`height`/`duration`, `thumbnail_url`, `title`, `alt`, `tags` (jsonb: `industry[]`, `format[]`,
`client`), `source` (`upload`|`url`|`embed`), `created_by`, timestamps. Indexed on `(team_id, tags)`.

**Config additions** (stored in `tenants.config` jsonb, draft→publish via `saveTenantDraftConfig` /
`publishTenantConfig`):
- `portfolio`: `{ eyebrow, headline, body, items:[{ mediaId, caption, client, result, tags }] }`
- `references`: `{ eyebrow, headline, testimonials:[{ quote, name, company, mediaId? }], logos:[mediaId] }`

**Key rule — assets live in `media_assets`, referenced by `mediaId` from config; never inline the bytes.**
The config JSON stays lean; only small icons keep the existing data-URL pattern (`brand.appIcon` ≤512KB,
`lib/branding/appIcon.js`). This avoids bloating every tenant config (the store is 82KB `lib/store.js` +
`data/app-store.json` fallback).

## Data flow
```
Admin uploads/links media ─► /api/admin/media ─► storage seam ─► media_assets (team-scoped, tagged)
                                                                        │
Tenant Builder (AI) reads brief + library ─► proposes portfolio.items[mediaId] by tag match ─┐
Admin edits/reorders in FunnelContentEditor ─► saveTenantDraftConfig ─► publishTenantConfig ──┤
                                                                                              ▼
Visitor hits funnel ─► getTenantForHost/BySlug ─► FunnelPage ─► PortfolioSection resolves mediaId→asset
```

## AI-assisted selection
The model is given the client brief **plus the team's tagged library** and returns which `mediaId`s fill
`portfolio.items` (industry + format relevant to the client) with draft captions/section copy. It
**selects from existing assets** — it does not invent URLs. Human reviews in draft, then publishes (keeps
the human-approval pattern used across outreach/funding). Fallbacks: library empty or AI not configured →
tag auto-match or manual pick. Tag taxonomy (`industry`, `format`) is data-driven, not hardcoded.

## Storage seam / env (planned)
Provider-neutral, mock/local-first (the project invariant — every integration degrades to "not
configured"): dev = local disk under `public/uploads/<team>/…` or small-image data-URL; prod = S3-compatible
object store (**DO Spaces fits the deploy target** — [[41-Deployment-Runbook]]) via signed uploads. New env
(→ [[43-Environment-Variables]]): `MEDIA_STORAGE_PROVIDER`, `MEDIA_BUCKET`, `MEDIA_*_KEY`, size/mime caps.
Without them configured, only URL/embed registration works.

## ⚠️ Gotchas / open issues → [[53-Known-Issues]]
- **New upload surface amplifies open security gaps.** Must ship with: mime/type allowlist + magic-byte
  check (not just extension), size caps, **team-scoped IDOR checks** (cf. H2), rate limiting (cf. H1),
  path-traversal-safe storage keys, and **SSRF guards** on any server-side URL fetch/thumbnailing (cf. C2).
- **Do not point `next/image` at arbitrary uploaded remote hosts** — precedent set 2026-06-30
  ([[52-Decision-Log]]): local `/`-prefixed → `next/image`; remote → plain `<img>`/own-domain/signed URL.
- **Accessibility:** the current `output` tiles are `aria-hidden` decorative; a real portfolio must be
  accessible — require `alt` on every asset, real captions, keyboard-navigable media/embeds.
- **Design contracts:** section must be mobile-first (`min-width` pattern), AA against any tenant accent,
  and reuse `Reveal`/`Stagger` motion — [[16-Design-System]]. Brand-token contract untouched.
- **Video cost/egress:** MVP prefers embeds (Vimeo/YouTube) + uploaded poster; native video upload waits
  for the object-store phase.

## Phases (each additive, mock-first, behind an approval gate; tests + build green before merge)
- **P0 — Config + render.** Add `portfolio`/`references` sections + validation + defaults; render from config
  (falls back to `output.tiles`). No new infra.
- **P1 — Media Library (no object store).** `media_assets` + admin manager with URL/embed + small data-URL
  upload only; works offline, degrades gracefully.
- **P2 — Real storage + security.** Object-storage seam, real file/video upload, thumbnailing, + the security
  hardening above (SSRF/rate-limit/IDOR/type-sniffing).
- **P3 — Editor + funnel polish.** `FunnelContentEditor` (hero copy + hero image picker + portfolio
  picker/reorder) with live preview; mobile/AA/motion polish on the section.
- **P4 — AI-assisted selection.** Tag-constrained retrieval in the Tenant Builder + captions.

## Related
[[2A-Tenant-Builder]] · [[2B-AI-Backend]] · [[15-Multi-Tenancy]] · [[13-Data-Model]] · [[16-Design-System]] ·
[[21-Admin-Shell]] · [[33-Sprint-2-Productization]] · [[53-Known-Issues]] · [[61-Security-Review]] · [[63-Tenants-Catalog]]

Up: [[20-Modules-MOC]]
