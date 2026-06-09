# Content Checkout Funnel

White-label content creation funnel and internal lead generation dashboard.

The app now runs as a Next.js SaaS foundation:

- Public funnel pages rendered from tenant/domain configuration
- Internal admin login at `/admin`
- Tenant config import/export workflow
- Lead capture and pipeline tracking
- CSV lead import
- Google Places and Hunter integration points
- Resend integration point for future approved sending
- Contractor capacity notes
- Docker deployment behind the existing Traefik proxy

## Local Development

```bash
cd /Users/emery/content-checkout-funnel
npm install
cp .env.example .env
npm run dev
```

Open:

```text
http://localhost:8088
http://localhost:8088/admin
```

Default local admin credentials come from `.env.example`:

```text
admin@dgtlmag.com
change-this-password
```

If `DATABASE_URL` is not set, the app uses a local JSON store under `data/`.

## Tests and Build

```bash
npm test
npm run build
```

## Tenant Configuration

The default tenant config lives in `lib/defaultTenant.js`. In the admin
dashboard, export/edit/import JSON configs to create white-label versions for
new domains and partners.

Each tenant can configure:

- domains
- brand name and CTA copy
- hero media
- package catalogue
- Stripe Payment Links
- booking links
- reply-to/sender/phone routing notes
- contractor capacity notes

## API Keys

Optional provider keys:

```text
RESEND_API_KEY=
GOOGLE_PLACES_API_KEY=
HUNTER_API_KEY=
```

Without keys, the admin UI still works, but provider routes return a clear
not-configured response.

## VPS Deployment

See `DEPLOY_HOSTINGER.md`.
