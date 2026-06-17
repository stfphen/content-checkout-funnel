# Content Checkout Funnel

White-label content creation funnel and internal lead generation dashboard.

The app now runs as a Next.js SaaS foundation:

- Public funnel pages rendered from tenant/domain configuration
- Internal admin login at `/admin`
- Tenant config import/export workflow
- Lead capture and pipeline tracking
- CSV lead import
- Google Places, Hunter, and Apollo integration points
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
APOLLO_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Without keys, the admin UI still works, but provider routes return a clear
not-configured response.

Website enrichment always produces a deterministic sales brief first. If
`OPENAI_API_KEY` is configured, the app attempts an optional LLM rewrite using
only public business and website data, validates the JSON shape before saving,
and falls back to the deterministic brief on any model or validation failure.

For local testing, add keys to `.env.local` without pasting secrets into chat:

```bash
cd /Users/emery/content-checkout-funnel
touch .env.local
read -s -p "Google Places API key: " GOOGLE_KEY; echo
read -s -p "Hunter API key: " HUNTER_KEY; echo
read -s -p "Apollo API key: " APOLLO_KEY; echo
grep -v '^GOOGLE_PLACES_API_KEY=' .env.local | grep -v '^HUNTER_API_KEY=' | grep -v '^APOLLO_API_KEY=' > .env.local.tmp
mv .env.local.tmp .env.local
printf 'GOOGLE_PLACES_API_KEY=%s\nHUNTER_API_KEY=%s\nAPOLLO_API_KEY=%s\n' "$GOOGLE_KEY" "$HUNTER_KEY" "$APOLLO_KEY" >> .env.local
```

Then restart the dev server:

```bash
npm run dev:clean
```

For the VPS deployment, set the same keys in `/opt/content-checkout-funnel/.env`
and rebuild the container:

```bash
cd /opt/content-checkout-funnel
touch .env
read -s -p "Google Places API key: " GOOGLE_KEY; echo
read -s -p "Hunter API key: " HUNTER_KEY; echo
read -s -p "Apollo API key: " APOLLO_KEY; echo
grep -v '^GOOGLE_PLACES_API_KEY=' .env | grep -v '^HUNTER_API_KEY=' | grep -v '^APOLLO_API_KEY=' > .env.tmp
mv .env.tmp .env
printf 'GOOGLE_PLACES_API_KEY=%s\nHUNTER_API_KEY=%s\nAPOLLO_API_KEY=%s\n' "$GOOGLE_KEY" "$HUNTER_KEY" "$APOLLO_KEY" >> .env
docker compose up -d --build
```

Hunter Domain Search can return email addresses for a known company domain.
Apollo People API Search is for finding net-new people by company domain and
title filters; Apollo's search endpoint does not return email addresses or
phone numbers directly, so those leads may still need a later enrichment step.

## VPS Deployment

See `DEPLOY_HOSTINGER.md`.
