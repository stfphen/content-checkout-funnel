# Secrets & Rotation Runbook (Phases 2/3/10)

_How to rotate every credential and stand up strong production secrets. Execute when the VPS is back. No secret values appear in this file._

> **Why now:** the four provider keys (Resend, Google Places, Hunter, Apollo) are live in your `.env` and were exposed during go-live work. The VPS Postgres password is the weak literal `content_funnel`. Both must be fixed before public launch. See SECURITY_REVIEW.md (C1, H3).

## A. Strong values to generate first (on your Mac or VPS)

```bash
openssl rand -base64 32   # new POSTGRES_PASSWORD
openssl rand -base64 32   # (optional) SESSION_SECRET placeholder — NOTE: not read by code yet (see L2)
# Owner/admin password: use a password manager, 20+ chars.
```

## B. Rotate the four provider keys (third-party dashboards — your hands)

| Key | Where | Action |
|---|---|---|
| `RESEND_API_KEY` | resend.com → API Keys | Create new, delete old, paste into `.env`. While there, verify the sending **domain** (Phase 6). |
| `GOOGLE_PLACES_API_KEY` | console.cloud.google.com → Credentials | Create new key, **restrict to Places API + the VPS IP `62.72.16.32`**, delete old. |
| `HUNTER_API_KEY` | hunter.io → API | Reset key (note: Free plan = 50 searches/mo). |
| `APOLLO_API_KEY` | app.apollo.io → Settings → Integrations → API | Regenerate. |

Code reads these in `lib/integrations/{resend,googlePlaces,hunter,apollo}.js` — no code change needed, only the `.env` value.

## C. Rotate the database password (VPS) — careful, ordered

The DB password lives in the VPS `.env` as `POSTGRES_PASSWORD`; compose builds `DATABASE_URL` from it. Changing it must update **both** the Postgres role and the app, so do it in one controlled pass:

```bash
ssh root@62.72.16.32 && cd /opt/content-checkout-funnel
scripts/backup-db.sh                                   # 1. backup first
NEWPW="$(openssl rand -base64 32)"
# 2. change the role password inside the running Postgres
docker compose exec content-funnel-postgres \
  psql -U content_funnel -d content_funnel \
  -c "ALTER USER content_funnel WITH PASSWORD '$NEWPW';"
# 3. update .env (POSTGRES_PASSWORD) — edit by hand or:
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$NEWPW|" .env
# 4. recreate the app so it picks up the new DATABASE_URL
docker compose up -d --force-recreate content-funnel
sleep 8 && curl -sS -I http://127.0.0.1:8088/ | head -1   # want 200
unset NEWPW
```

Confirm Postgres has **no host-published port** (compose only attaches it to the internal Docker network — verify `docker ps` shows no `0.0.0.0:5432`).

## D. Production `.env` template (VPS `/opt/content-checkout-funnel/.env`)

```ini
# --- Database (compose builds DATABASE_URL from these) ---
POSTGRES_DB=content_funnel
POSTGRES_USER=content_funnel
POSTGRES_PASSWORD=<openssl rand -base64 32>

# --- Owner / team (TEAM_SLUG MUST be "default") ---
OWNER_EMAIL=owner@dgtlmag.com
OWNER_NAME=DGTL MAG Owner
TEAM_NAME=DGTL MAG
TEAM_SLUG=default

# --- App origin ---
PUBLIC_APP_URL=https://dgtlmag.com
NEXT_PUBLIC_APP_URL=https://dgtlmag.com

# --- Providers (rotated values) ---
RESEND_API_KEY=
GOOGLE_PLACES_API_KEY=
HUNTER_API_KEY=
APOLLO_API_KEY=

# --- AI (set ONE; see CLAUDE_AI_SETUP.md) ---
CLAUDE_CODE_OAUTH_TOKEN=
ANTHROPIC_API_KEY=
LEAD_RESEARCH_MAX_WEB_SEARCHES=8

# --- Payments (live; see Phase 5) ---
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# --- Telephony (see TELEPHONY_CALL_FORWARDING.md) ---
TELEPHONY_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TELEPHONY_WEBHOOK_BASE_URL=https://dgtlmag.com
DEFAULT_COUNTRY_CODE=CA
DEFAULT_TIMEZONE=America/Toronto

# --- Optional ---
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

## E. Admin/owner credentials (Phase 3)

The owner is created via the one-time `OWNER_PASSWORD` env passed to `npm run create-owner` (never written to `.env`). Use a 20+ char password from a manager. Roles available: `owner`, `admin`, `sales`, `contractor`, `viewer` (enforced by `requireRole`). Create each real team member with the least role they need; only `owner`/`admin` can change tenant/telephony settings.

## F. After any rotation

Update both local `.env` and the VPS `.env`, then `docker compose up -d --force-recreate content-funnel`. Note `.env` is **not** in git (by design) — the VPS `.env` is the only production copy, so keep a sealed offline backup of it.
