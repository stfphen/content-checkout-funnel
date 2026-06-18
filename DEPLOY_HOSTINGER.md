# Hostinger VPS Deployment

Target VPS:

```text
62.72.16.32
Ubuntu
Docker
Existing Traefik proxy on ports 80/443
Domain: dgtlmag.com
```

The app runs as a Next.js container plus a private Postgres container. Traefik
publishes the app through the existing `traefik-public` network.

## 1. DNS

In Hostinger DNS for `dgtlmag.com`, set:

```text
A     @      62.72.16.32
A     www    62.72.16.32
```

## 2. Prepare the Local Bundle

From your Mac:

```bash
cd /Users/emery/content-checkout-funnel
COPYFILE_DISABLE=1 tar \
  --exclude=".git" \
  --exclude=".DS_Store" \
  --exclude="._*" \
  --exclude="node_modules" \
  --exclude=".next" \
  --exclude="data" \
  -czf /tmp/content-funnel-clean.tgz .
```

## 3. Upload to the VPS

```bash
scp /tmp/content-funnel-clean.tgz root@62.72.16.32:/root/content-funnel-clean.tgz
```

## 4. Configure Environment

SSH into the VPS:

```bash
ssh root@62.72.16.32
mkdir -p /opt/content-checkout-funnel
cd /opt/content-checkout-funnel
```

Create or update `/opt/content-checkout-funnel/.env`; the deploy step below
preserves this file while replacing the app bundle:

```bash
umask 077
POSTGRES_PASSWORD="$(openssl rand -base64 32)"

cat > .env <<EOF
POSTGRES_DB=content_funnel
POSTGRES_USER=content_funnel
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
OWNER_EMAIL=owner@dgtlmag.com
OWNER_NAME=DGTL MAG Owner
TEAM_NAME=DGTL MAG
# TEAM_SLUG must be "default" so the owner joins the team that owns the built-in
# tenants and receives public-funnel + funding-scan leads. See "Team setup" below.
TEAM_SLUG=default
RESEND_API_KEY=
GOOGLE_PLACES_API_KEY=
HUNTER_API_KEY=
APOLLO_API_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=
EOF
```

Use unique generated values before public launch. Do not reuse local
placeholder passwords from `.env.example`. For Stripe, paste the live
`sk_live_` secret key, then register a webhook endpoint at
`https://dgtlmag.com/api/webhooks/stripe` in the Stripe Dashboard and paste its
signing secret (`whsec_`) into `STRIPE_WEBHOOK_SECRET`. Leave the Stripe vars
blank to keep checkout on Payment Links / lead capture. `docker-compose.yml` builds the
container `DATABASE_URL` from `POSTGRES_DB`, `POSTGRES_USER`, and
`POSTGRES_PASSWORD`, so the app always connects to the private Postgres service
in this deployment.

## 5. Install and Deploy

```bash
systemctl disable --now caddy || true
mkdir -p /opt/content-checkout-funnel
find /opt/content-checkout-funnel -mindepth 1 -maxdepth 1 -not -name ".env" -exec rm -rf {} +
tar -xzf /root/content-funnel-clean.tgz -C /opt/content-checkout-funnel
cd /opt/content-checkout-funnel
docker compose config
docker compose build content-funnel
docker compose up -d content-funnel-postgres
docker compose run --rm --no-deps content-funnel npm run migrate
read -s -p "Owner password: " OWNER_PASSWORD; echo
docker compose run --rm --no-deps \
  -e OWNER_PASSWORD="$OWNER_PASSWORD" \
  content-funnel npm run create-owner
# Seed the funded-growth demo leads (optional but recommended for the demo):
docker compose run --rm --no-deps content-funnel npm run seed:funding-demo
docker compose up -d --build
```

The owner password is passed as a one-time environment variable and is not
printed or written to `.env`. Re-running `npm run create-owner` is safe; it
leaves the existing user in place and ensures the membership has the `owner`
role.

> **Team setup (important).** The built-in tenants (default + funded-growth)
> register under the internal `team_default`, and public-funnel and funding-scan
> leads are scoped to that team. For the operating owner to see those tenants and
> leads in `/admin`, create the owner in that same team by setting
> `TEAM_SLUG=default` in `.env` (the team slug, not the brand name — the brand is
> controlled by tenant config). Verified live: with `TEAM_SLUG=default`, the
> admin Funding tab, funding-scan leads, review checklist, and closer handoff all
> render with the seeded demo data. Using a different `TEAM_SLUG` creates an empty
> team whose admin sees no built-in tenants or funnel leads.

## 6. Database Backups and Restore

The Postgres Docker volume persists database files, but take an explicit dump
before production redeploys, migrations, or VPS maintenance.

Create a timestamped backup on the VPS:

```bash
cd /opt/content-checkout-funnel
scripts/backup-db.sh
```

Backups are stored in:

```text
/opt/content-checkout-funnel/backups/
```

The backup file name includes the database name and UTC timestamp, for example:

```text
backups/content_funnel_20260615T180000Z.dump
```

Restore a backup into the Compose Postgres service:

```bash
cd /opt/content-checkout-funnel
RESTORE_CONFIRM="restore content_funnel" scripts/restore-db.sh backups/content_funnel_20260615T180000Z.dump
```

The restore script runs `pg_restore --clean --if-exists` for `.dump` backups
and `psql` for `.sql` backups. It refuses to run unless `RESTORE_CONFIRM`
matches the target database name.

Test the restore process on a non-production copy before major migrations. A
backup that has not been restored successfully should not be treated as proven.

## 7. Verify

```bash
curl -I http://127.0.0.1:8088/
docker inspect content-checkout-funnel --format '{{range $k,$v := .NetworkSettings.Networks}}{{println $k}}{{end}}'
curl -I https://dgtlmag.com/
docker logs content-checkout-funnel --tail=80
docker logs traefik --tail=80
```

Expected:

```text
http://127.0.0.1:8088/ -> 200 OK
container network -> traefik-public
https://dgtlmag.com/ -> 200 OK
```

## 8. Admin

Open:

```text
https://dgtlmag.com/admin
```

Use the owner email from `.env` and the owner password you entered during
deployment.
