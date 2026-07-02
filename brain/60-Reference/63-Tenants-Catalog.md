---
title: 63 · Tenants Catalog
type: reference
tags: [reference, tenancy]
status: stable
updated: 2026-07-02
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
| **ELiXR** | `elixr` | `lib/tenants/elixr.js` | Built-in brand config. DB row only (not in `builtInTenants()` fallback). |
| **ON Home Decor** | `on-home-decor` | `lib/tenants/onHomeDecor.js` | Toronto/GTA interior design + paint (`on-homedecor.com`). Migrated from a standalone Lovable site; wired into `builtInTenants()` (`lib/store.js`) + `seed:tenants`; config file now tracked in git. Default package `curated-paint-selection` ($200/colour) laddering to room styling, kitchen/bath, and full-home renovation design. |

## Tenant config model
- Each calls `normalizeTenantConfig(...)` to fill media/routing/checkout/defaults.
- Holds: hero/sections, packages (+ optional Stripe price), brand tokens (`--blue`/`--blue-dark`/`--accent`), domains, telephony, app icon.
- Lifecycle: draft (`saveTenantDraftConfig`) → publish (`publishTenantConfig`); `duplicateTenantConfig`; validated by `lib/tenantValidation.js`.
- Resolution: by host (`getTenantForHost`) or slug (`/t/[slug]`). Preview drafts via `/t/[slug]?preview=draft`.

Related: [[15-Multi-Tenancy]] · [[2A-Tenant-Builder]] · [[29-Funding-Program]] · [[16-Design-System]]

Up: [[60-Reference-MOC]]
