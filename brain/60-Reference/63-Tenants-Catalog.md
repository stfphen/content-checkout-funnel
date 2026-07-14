---
title: 63 · Tenants Catalog
type: reference
tags: [reference, tenancy]
status: stable
updated: 2026-07-04
---

# Tenants Catalog

The built-in (seeded) tenants. All register under `team_default` ([[15-Multi-Tenancy]]). **All five
now live as DB rows** (2026-07-02): `npm run seed:tenants` upserts every one of them — including
`funded-growth` — into the `tenants` table, so they render from Postgres and are editable in the
admin Tenant Builder. The in-code configs remain the seed source and the fallback for a fresh/unseeded
DB (`builtInTenants()` in `lib/store.js` covers default, funded-growth, on-home-decor only).
New tenants can be generated via the AI [[2A-Tenant-Builder]].

| Tenant | Slug | Config file | Notes |
|---|---|---|---|
| **Default** | (host root) | `lib/defaultTenant.js` | The base `dgtlmag.com` funnel; `normalizeTenantConfig` defaults. Seeded as `tenant_dgtlmag`. |
| **DGTL Funded Growth Studio** | `funded-growth` | `lib/funding/tenant.js` (`fundedGrowthTenant`) | The Funding Program funnel. Served on `funding.dgtlmag.com` + `grants.dgtlmag.com`. Now in `seed:tenants`. [[29-Funding-Program]] |
| **DMTV** | `dmtv` | `lib/tenants/dmtv.js` | Built-in brand config. DB row only (not in `builtInTenants()` fallback). |
| **DMTV Studio** | `dmtv-studio` | `lib/tenants/dmtvStudio.js` | DMTV's standalone brand page: `template: "showcase"` renders `components/showcase/ShowcasePage.jsx` instead of FunnelPage. Bespoke content in the top-level `showcase` block (edited in the config file + reseed — the admin Tenant Builder has no editors for it, and reseeding clobbers admin edits). Domain `studio.dmtv.dgtlmag.com` (never `dmtv.dgtlmag.com` — host resolution must stay deterministic vs the `dmtv` row). DB row only. |
| **ELiXR** | `elixr` | `lib/tenants/elixr.js` | Built-in brand config. DB row only (not in `builtInTenants()` fallback). |
| **ON Home Decor** | `on-home-decor` | `lib/tenants/onHomeDecor.js` | Toronto/GTA interior design + paint (`on-homedecor.com`). Rebuilt 2026-07-04 (PR #8): `template: "interiors"` renders `components/interiors/InteriorsPage.jsx` (fifth template, isolated `--in-*` vars); bespoke content in the top-level `interiors` block (config file + reseed only, like `showcase`/`agency`); `design: warm-boutique + local-trades-retail` keeps the funnel fallback correct. Default package `curated-paint-selection` ($200/colour, the only checkout/Stripe package — first bespoke template with live checkout via `/api/checkout`) laddering to room styling, kitchen/bath, and full-home renovation design. Lead intents: `consultation-booking` and `project-inquiry` (+packageId). Still in `builtInTenants()` + `seed:tenants` (`--only on-home-decor` on prod). Media live (07-04, two rounds): 35 real WebP assets under `public/assets/on-home-decor/` (hero + 8 gallery projects + 2 before/after pairs). Logo still `""`, no testimonials. |
| **DGTL Group** | `dgtl-group` | `lib/tenants/dgtlGroup.js` | The agency's own brand page (2026-07-04): `template: "agency"` renders `components/agency/AgencyPage.jsx`. Bespoke content in the top-level `agency` block (config file + reseed only, like `showcase`). Domains `dgtlgroup.io`/`www.dgtlgroup.io` (not yet pointed at the platform). Reuses the canonical Content Day package ids, inquiry-led (no Stripe on this page); funding band cross-sells `/t/funded-growth`; white-label roster links the DMTV Studio / ELiXR / ON Home Decor pages. DB row only (not in `builtInTenants()` fallback) — must be seeded (`--only dgtl-group` on prod). No founder name printed (unresolved public/internal discrepancy). |

## Tenant config model
- Each calls `normalizeTenantConfig(...)` to fill media/routing/checkout/defaults.
- Holds: hero/sections, packages (+ optional Stripe price), brand tokens (`--blue`/`--blue-dark`/`--accent`), domains, telephony, app icon.
- Lifecycle: draft (`saveTenantDraftConfig`) → publish (`publishTenantConfig`); `duplicateTenantConfig`; validated by `lib/tenantValidation.js`.
- Resolution: by host (`getTenantForHost`) or slug (`/t/[slug]`). Preview drafts via `/t/[slug]?preview=draft`.
- Optional top-level `template` field selects the page renderer via `components/templates/registry.js` (`"showcase"` → ShowcasePage, `"authority"` → AuthorityPage, `"agency"` → AgencyPage, `"interiors"` → InteriorsPage; unset/unknown → FunnelPage). Unknown top-level fields (e.g. `template`, `showcase`, `authority`, `agency`, `interiors`) pass through normalize/sanitize/storage untouched — locked in by `tests/tenant-template.test.js` + `tests/agency-template.test.js` + `tests/interiors-template.test.js`.

Related: [[15-Multi-Tenancy]] · [[2A-Tenant-Builder]] · [[29-Funding-Program]] · [[16-Design-System]]

Up: [[60-Reference-MOC]]
