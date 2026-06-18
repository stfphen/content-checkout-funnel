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
- Outreach Sequence V1 with template library, queue preview, suppression controls, approved Resend sending, follow-ups, and lightweight metrics
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

Admin login is database-backed. Before signing in, run PostgreSQL migrations and
create the first owner user:

```bash
npm run migrate
read -s -p "Owner password: " OWNER_PASSWORD; echo
OWNER_EMAIL=owner@example.com \
OWNER_NAME="Local Owner" \
OWNER_PASSWORD="$OWNER_PASSWORD" \
TEAM_NAME="Local Team" \
TEAM_SLUG=local-team \
npm run create-owner
```

If `DATABASE_URL` is not set, the app uses a local JSON store under `data/`.
That fallback is for local development only. Docker/VPS deployments require
PostgreSQL settings in `.env` and must not use the example passwords.

For local Postgres testing, copy `.env.example` and replace the placeholder
database values. For production, generate unique secrets instead of reusing any
local placeholder:

```bash
openssl rand -base64 32 # POSTGRES_PASSWORD
openssl rand -base64 32 # OWNER_PASSWORD
```

`npm run create-owner` is safe to run more than once. It creates the team if
missing, creates the owner user if missing, and ensures that user has the
`owner` role. Passwords are hashed before storage and are not printed.

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

## Outreach Sequence V1

The `/admin` dashboard includes an approved outbound workflow layered on top of
Lead Pipeline V1:

- Template library with plain-text subject/body templates and merge fields
- Starter templates when no custom templates exist
- Campaign records with status, source/city/category filters, daily send caps, and per-domain daily caps
- Queue builder that selects currently filtered leads, previews personalized messages, and queues only eligible leads
- Approved queue view for explicit "Send Approved" Resend actions
- Suppression list for emails/domains with compliance reasons
- Outreach events and lead history for drafted, queued, approved, sent, failed, skipped, suppressed, replied, booked, and unsubscribed states
- Follow-up dates on leads plus a due follow-up view
- Lightweight performance metrics for queue status, replies, booked calls, and sent volume by source/city/category

Supported template merge fields:

```text
{{businessName}}
{{contactName}}
{{city}}
{{category}}
{{painPoints}}
{{recommendedOffer}}
{{tenantName}}
{{bookingLink}}
{{senderName}}
```

Approved sending rules:

- Nothing sends automatically on page load or after queue creation.
- Messages must be queued and then explicitly sent from the approved queue.
- Leads without recipient emails are skipped before queue creation.
- Suppressed emails/domains cannot be queued or sent.
- Already-contacted leads are skipped unless the admin explicitly includes them.
- Daily send caps and per-domain daily caps are enforced before Resend calls.
- Successful sends update the queue item, lead outreach status, pipeline status, `lastContactedAt`, suggested `nextFollowUpAt`, and outreach events.
- Failed sends store the provider failure reason on the queue item.

Follow-ups are manual in this sprint. Sending a message suggests a follow-up
date three business days out, and admins can edit the date or manually queue a
follow-up from the lead detail panel.

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
- Create or preview an outreach template with merge fields.
- Select filtered leads in the queue builder and confirm missing-email, suppressed, and already-contacted leads are skipped or warned.
- Add an email/domain to the suppression list and confirm it cannot be queued/sent.
- Queue approved outreach, then temporarily remove `RESEND_API_KEY` and confirm sending reports not-configured without crashing.
- With a configured Resend sender/domain, send one approved queue item and confirm lead status, `lastContactedAt`, follow-up date, and outreach history update.

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

For Outreach Sequence V1, `RESEND_API_KEY` is required before approved queue
items can be sent. The sender email entered in `/admin` must be an approved
sender/domain in Resend. Missing `RESEND_API_KEY` returns a standard
not-configured provider response and does not crash the dashboard.

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
and rebuild the container. Keep the existing production `POSTGRES_PASSWORD`
when updating API keys:

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
- Replies are manually marked unless inbound parsing is added later.
- Follow-ups are manually approved and sent; there is no autonomous sequence runner.
- The unsubscribe route is intentionally basic and records email/domain suppression only.
- Resend sender/domain verification is configured externally in Resend.
- Stripe payment links can be configured in tenant packages, but webhook/payment fulfillment is intentionally not part of this sprint.

## VPS Deployment

See `DEPLOY_HOSTINGER.md`.
