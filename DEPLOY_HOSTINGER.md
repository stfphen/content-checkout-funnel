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
cd /opt/content-checkout-funnel
```

Create or update `/opt/content-checkout-funnel/.env` after extracting:

```bash
cat > .env <<'EOF'
ADMIN_EMAIL=admin@dgtlmag.com
ADMIN_PASSWORD=change-this-password
SESSION_SECRET=replace-with-a-long-random-string
RESEND_API_KEY=
GOOGLE_PLACES_API_KEY=
HUNTER_API_KEY=
APOLLO_API_KEY=
EOF
```

Use strong values before public launch.

## 5. Install and Deploy

```bash
systemctl disable --now caddy || true
mkdir -p /opt/content-checkout-funnel
find /opt/content-checkout-funnel -mindepth 1 -maxdepth 1 -not -name ".env" -exec rm -rf {} +
tar -xzf /root/content-funnel-clean.tgz -C /opt/content-checkout-funnel
cd /opt/content-checkout-funnel
docker compose config
docker compose up -d --build
```

## 6. Verify

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

## 7. Admin

Open:

```text
https://dgtlmag.com/admin
```

Use the credentials from `.env`.
