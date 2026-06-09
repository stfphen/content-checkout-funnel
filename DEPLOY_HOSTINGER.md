# Hostinger VPS Deployment

Target VPS:

```text
62.72.16.32
Ubuntu
Docker
Existing Traefik proxy on ports 80/443
Domain: dgtlmag.com
```

This funnel is a static Nginx site in Docker. The VPS already uses Traefik, so
the funnel container joins the existing `traefik-public` network and exposes the
domain through Traefik labels.

## 1. DNS

In Hostinger DNS for `dgtlmag.com`, set:

```text
A     @      62.72.16.32
A     www    62.72.16.32
```

Verify from your Mac:

```bash
dig +short dgtlmag.com
dig +short www.dgtlmag.com
```

## 2. Prepare the Local Bundle

From your Mac:

```bash
cd /Users/emery/content-checkout-funnel
tar --exclude=".git" --exclude=".DS_Store" -czf /tmp/content-checkout-funnel.tgz .
```

## 3. Upload to the VPS

Use the SSH user you normally use for Hostinger. If you use `root`:

```bash
scp /tmp/content-checkout-funnel.tgz root@62.72.16.32:/tmp/
```

## 4. Install on the VPS

```bash
ssh root@62.72.16.32
systemctl disable --now caddy || true
mkdir -p /opt/content-checkout-funnel
rm -rf /opt/content-checkout-funnel/*
tar -xzf /tmp/content-checkout-funnel.tgz -C /opt/content-checkout-funnel
cd /opt/content-checkout-funnel
docker compose config
docker compose up -d --build
```

## 5. Verify

```bash
curl -I http://127.0.0.1:8088/
docker inspect content-checkout-funnel --format '{{range $k,$v := .NetworkSettings.Networks}}{{println $k}}{{end}}'
docker inspect content-checkout-funnel --format '{{json .Config.Labels}}'
docker logs traefik --tail=80
curl -k -I https://dgtlmag.com/
curl -I https://dgtlmag.com/
```

Expected:

```text
http://127.0.0.1:8088/ -> 200 OK
container network -> traefik-public
https://dgtlmag.com/ -> 200 OK once Let’s Encrypt has issued the cert
```

If `curl -k` works but normal `curl` shows a self-signed certificate, Traefik is
reachable but has not issued the Let's Encrypt certificate yet. Check DNS and
Traefik logs.

## 6. Live Checkout Configuration

Edit `config.js` before deploying live checkout:

```js
stripePaymentLinks: {
  "ugc-content": "https://buy.stripe.com/...",
  "pro-content-day": "https://buy.stripe.com/...",
  "growth-retainer": "",
  "campaign-scope": ""
}
```

Use `bookingLinks` for retainer or custom campaign qualification calls.

Use `leadWebhookUrl` for Zapier, Make, n8n, Airtable, or a custom CRM endpoint.
