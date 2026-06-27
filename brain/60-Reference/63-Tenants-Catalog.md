---
title: 63 · Tenants Catalog
type: reference
tags: [reference, tenancy]
status: stable
updated: 2026-06-27
---

# Tenants Catalog

The built-in (seeded) tenants. All register under `team_default` ([[15-Multi-Tenancy]]). Seeded via
`npm run seed:tenants`. New tenants can be generated via the AI [[2A-Tenant-Builder]].

| Tenant | Slug | Config file | Notes |
|---|---|---|---|
| **Default** | (host root) | `lib/defaultTenant.js` | The base `dgtlmag.com` funnel; `normalizeTenantConfig` defaults. |
| **DGTL Funded Growth Studio** | `funded-growth` | `lib/funding/tenant.js` (`fundedGrowthTenant`) | The Funding Program funnel. Served on `funding.dgtlmag.com` + `grants.dgtlmag.com`. [[29-Funding-Program]] |
| **DMTV** | `dmtv` | `lib/tenants/dmtv.js` | Built-in brand config. |
| **ELiXR** | `elixr` | `lib/tenants/elixr.js` | Built-in brand config. |
| **ON Home Decor** | `onhomedecor` | `lib/tenants/onHomeDecor.js` | Interior design / paint; migrated from a Lovable site. (Currently untracked in git — see [[47-Git-Workflow]].) |

## Tenant config model
- Each calls `normalizeTenantConfig(...)` to fill media/routing/checkout/defaults.
- Holds: hero/sections, packages (+ optional Stripe price), brand tokens (`--blue`/`--blue-dark`/`--accent`), domains, telephony, app icon.
- Lifecycle: draft (`saveTenantDraftConfig`) → publish (`publishTenantConfig`); `duplicateTenantConfig`; validated by `lib/tenantValidation.js`.
- Resolution: by host (`getTenantForHost`) or slug (`/t/[slug]`). Preview drafts via `/t/[slug]?preview=draft`.

Related: [[15-Multi-Tenancy]] · [[2A-Tenant-Builder]] · [[29-Funding-Program]] · [[16-Design-System]]

Up: [[60-Reference-MOC]]
