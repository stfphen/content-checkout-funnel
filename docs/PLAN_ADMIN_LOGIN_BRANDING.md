# Plan: Branded Admin Login (DGTL) with Tenant-Branding Seam

**Status:** planned · **Date:** 2026-07-02
**Decision:** dark login panel, DGTL-only branding now, clean seam for per-tenant login branding later. Logo file supplied by FAYELLA (official SVG/PNG).

## Goal

Replace the generic "Content Funnel Control" login with a minimal, dark, DGTL-branded window (white wordmark + yellow bolt on black). Structure it so the brand shown is data-driven, letting us later swap in the tenant's brand when login is launched from a tenant page — without rewriting the page.

## Current state

- `app/admin/login/page.jsx` — server component, hardcoded eyebrow/h1/copy, light panel.
- `styles.css` — `.admin-login` / `.admin-login__panel` (light theme, brand-wash gradient at ~line 3155).
- `lib/branding.js` — `getTenantTheme(brand)` already maps tenant brand colors → CSS vars.
- `lib/tenants/*` — each tenant has `brand: { name, eyebrow, logoText, logo, primaryColor, accentColor }`.
- Funnel "Log in" link (`components/FunnelPage.jsx` ~line 325) points at `/admin` with no tenant context.

## Steps

### 1. Add the logo asset
- Drop the supplied file at `public/assets/brand/dgtl-logo.svg` (or `.png`).
- SVG preferred; if PNG, include a 2x-size export for retina.

### 2. Create a login-brand resolver — the "seam"
New file `lib/branding/loginBrand.js`:

```js
// Resolves the brand shown on the admin login screen.
// Today: always the platform (DGTL) brand.
// Later: accept a tenant hint (host header / ?from= slug) and return
// that tenant's brand via getTenantTheme, falling back to DGTL.
export function getLoginBrand(/* { host, fromSlug } */) {
  return {
    name: "DGTL",
    logoSrc: "/assets/brand/dgtl-logo.svg",
    logoAlt: "DGTL",
    theme: { "--login-bg": "#050505", "--login-panel": "#0d0d0d",
             "--login-ink": "#ffffff", "--login-accent": "#f2cf4e" }
  };
}
```

- Data-only, no secrets, mirrors the `lib/branding.js` pattern (validated colors, safe fallback).
- Future work changes only this function's body + one call site.

### 3. Rewrite `app/admin/login/page.jsx`
- Call `getLoginBrand()`; spread `brand.theme` as inline style on `<main className="admin-login">`.
- Simplify content: logo image (centered, ~140–160px wide), email + password fields, sign-in button, error line. Remove eyebrow, h1, and marketing copy.
- Keep the existing `<form action="/api/admin/login" method="post">` untouched — no auth changes.
- `alt`/`aria-label` on the logo so the page still announces "DGTL — sign in".

### 4. Style the dark panel (`styles.css`)
- Consolidate the two `.admin-login` blocks (lines ~1542 and ~3155) into one dark variant driven by the new `--login-*` vars:
  - page: `background: var(--login-bg)` with a subtle radial accent wash using `--login-accent` (reuse the existing color-mix gradient technique, dialed down).
  - panel: `background: var(--login-panel)`, 1px border `rgba(255,255,255,.08)`, existing `--radius-lg`/`--shadow-lg`.
  - inputs/labels/button restyled for dark ink: yellow (`--login-accent`) primary button with dark text (matches `readableForeground` logic — yellow needs dark foreground).
  - error text: keep readable on dark (soft red, not the current light-theme red).
- Scope everything under `.admin-login` so the light admin shell is unaffected.

### 5. Verification
- `npm test` (auth tests must stay green — no API changes expected).
- `npm run build`.
- Manual: `/admin/login` renders dark DGTL window; wrong password shows readable error; mobile width (≤480px) panel fits; logo not blurry.

### 6. Brain updates
- `51-Timeline.md`: dated bullet.
- `52-Decision-Log.md`: "Login brand resolved via `getLoginBrand()` seam; DGTL default, tenant-aware later."
- `16-Design-System.md`: note the dark login variant + `--login-*` vars.

## Future phase (not in this change)

Tenant-branded login when multi-user lands:
1. Funnel "Log in" link becomes `/admin/login?from=<tenant-slug>` (or resolve from `Host` header on tenant domains).
2. `getLoginBrand({ host, fromSlug })` looks up the tenant, builds theme from `tenant.brand` via `getTenantTheme`, uses `brand.logo`/`logoText`, falls back to DGTL for unknown/missing tenants.
3. Validate the slug against known tenants (no reflected input → no brand spoofing on arbitrary query values).

## Risks / notes

- Two duplicate `.admin-login` CSS blocks exist — consolidating avoids a specificity fight; touch nothing else in `styles.css`.
- Auth flow, session cookie, and `/api/admin/login` are untouched — pure presentation change.
- Small branch, e.g. `feature/admin-login-branding`, per git workflow rules.

## Files changed

| File | Change |
|---|---|
| `public/assets/brand/dgtl-logo.svg` | new (user-supplied) |
| `lib/branding/loginBrand.js` | new |
| `app/admin/login/page.jsx` | rewrite content |
| `styles.css` | dark `.admin-login` variant, consolidate duplicates |
| `brain/…` (timeline, decisions, design system) | doc updates |
