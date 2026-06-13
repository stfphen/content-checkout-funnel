# Content Checkout Funnel

White-label content creation funnel and internal lead generation dashboard.

The app now runs as a Next.js SaaS foundation:

- Public funnel pages rendered from tenant/domain configuration
- Internal admin login at `/admin`
- Tenant config import/export workflow
- Lead capture and pipeline tracking
- Lead Pipeline V1 control center with search, filters, sorting, detail editing, duplicate indicators, scoring, and filtered CSV export
- Prospecting Batch Builder for Google Places preview/import workflows
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

## Lead Pipeline V1

The `/admin` dashboard now includes a lead acquisition control center:

- Search across business, contact, website, city, category, and notes
- Filter by city, category, source, enrichment status, outreach status, and pipeline status
- Sort by created date, lead score, city, source, and status
- Open each lead detail panel to inspect contact data, source metadata, enrichment data, duplicate warnings, notes, and scoring reasons
- Edit contact name/title, notes, status fields, score, score reason, pain points, recommended offer, and assignee
- Generate draft outreach emails from a lead detail panel without sending
- Export the currently filtered lead list to CSV

Lead scoring is deterministic for now. It adds points for website, email, phone,
strong Google reviews/ratings, high-value categories, Hunter contact data, and
Apollo decision-maker profiles. It subtracts points for missing websites,
already-contacted leads, and disqualified leads.

Duplicate detection is non-destructive. Imports skip reliable duplicate matches
and the dashboard surfaces possible duplicates for review. The duplicate checks
use domain plus business name, Google Place ID, normalized phone, and normalized
website.

## Prospecting Batch Builder

Use the batch builder in `/admin` for daily prospecting work:

1. Create a batch with tenant, name, category/search query, city, max results, and optional Hunter/Apollo enrichment.
2. The app runs a Google Places preview and stores the preview results on the batch.
3. Select all or selected preview results.
4. Import selected prospects into the lead pipeline.
5. Imported leads receive `batchId`, source metadata, Google rating/review fields, city/category fields, and an initial lead score.
6. If selected and configured, Hunter/Apollo enrichment runs after import. Missing API keys do not crash the dashboard.

Apollo target role keywords for batch enrichment are:

```text
owner, founder, marketing, manager, general manager, director, operations, business development
```

## Lead Engine QA Checklist

Use this checklist before continuing into Outreach Sequence V1:

- Create a Google Places batch for `med spas + Toronto`.
- Confirm preview results load or show a clear provider/key error.
- Import selected preview results into the pipeline.
- Open an imported lead detail panel and inspect source metadata, score, status, and notes.
- Re-import the same selected result and confirm reliable duplicates are skipped or flagged.
- Apply a filter, then export the filtered CSV.
- Generate a draft email from the lead detail panel.
- Temporarily remove provider keys locally and confirm Google/Hunter/Apollo routes show not-configured notices instead of crashing.

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
```

Without keys, the admin UI still works, but provider routes return a clear
not-configured response.

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

## Known Limitations

- Apollo People API Search may not return direct emails or phone numbers. The app stores profile data and marks contact data as partial when appropriate.
- Hunter requires a valid API key and account permissions for Domain Search results.
- Google Places usage depends on API key, billing, quota, and enabled Places API permissions.
- Email sending is still draft-only unless a separate approved sending workflow is implemented.
- Stripe payment links can be configured in tenant packages, but webhook/payment fulfillment is intentionally not part of this sprint.

## VPS Deployment

See `DEPLOY_HOSTINGER.md`.
