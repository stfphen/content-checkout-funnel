# Content Checkout Funnel

Static sales/product funnel for the no-name content creation offer.

## Files

- `index.html` - funnel page and product catalogue
- `styles.css` - Apple-inspired responsive UI
- `config.js` - Stripe Payment Link, booking link, and webhook configuration
- `app.js` - package selection, lead payload, checkout routing
- `assets/content-day-hero.png` - generated hero asset

## Run

Open `index.html` directly in a browser, or run a local server:

```bash
cd /Users/emery/content-checkout-funnel
python3 -m http.server 8088
```

Then open `http://localhost:8088`.

## Docker Staging

Build and run the same static funnel behind Nginx:

```bash
cd /Users/emery/content-checkout-funnel
docker compose up -d --build
```

Then open `http://localhost:8088`.

## Stripe Setup

The page is ready for Stripe Payment Links. Create products in Stripe, generate
Payment Links, then paste them into `config.js`:

```js
stripePaymentLinks: {
  "ugc-content": "https://buy.stripe.com/...",
  "pro-content-day": "https://buy.stripe.com/...",
  "growth-retainer": "",
  "campaign-scope": ""
}
```

For retainers or custom campaigns, use `bookingLinks` instead of direct checkout.

## Lead Capture

For a no-backend setup, leave `leadWebhookUrl` blank and use the `Copy Lead`
button while testing.

For automation, set `leadWebhookUrl` to a Zapier, Make, n8n, Airtable, or custom
API endpoint. The form posts JSON with the package, business details, source URL,
and timestamp.

## VPS Deployment

This project can run on an Ubuntu VPS with Docker. Copy the project to the VPS,
then run:

```bash
cd content-checkout-funnel
docker compose up -d --build
```

The included compose file exposes the site on port `8088`. If the server allows
that port, staging will be available at `http://62.72.16.32:8088`.

For production, put Caddy, Traefik, or Nginx Proxy Manager in front of it and
terminate HTTPS on a real domain.

See `DEPLOY_HOSTINGER.md` for the full Hostinger VPS command sequence.
