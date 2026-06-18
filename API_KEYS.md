# API Keys & Services Checklist

How secrets are handled, what is already configured, what you must provide, and
how to rotate. **No secret values appear in this file or in any tracked file.**
All secrets live only in the git-ignored `.env` (local) and the VPS `.env`
(production). `.env`, `.env.local`, and `.env.*` are in `.gitignore`; only
`.env.example` (placeholders) is committed.

## Status summary

| Key | Powers | Local `.env` | You must provide |
|-----|--------|--------------|------------------|
| `DATABASE_URL` | Postgres (live admin data) | set (local) | Yes, on VPS (from compose `POSTGRES_*`) |
| `RESEND_API_KEY` | Approved outreach email sends | **present** | Re-add on VPS; verify sender/domain in Resend |
| `GOOGLE_PLACES_API_KEY` | Prospecting batch builder | **present** | Re-add on VPS |
| `HUNTER_API_KEY` | Lead enrichment (domain search) | **present** | Re-add on VPS |
| `APOLLO_API_KEY` | People/decision-maker search | **present** | Re-add on VPS |
| `OPENAI_API_KEY` (+ `OPENAI_MODEL`) | Optional LLM sales brief | empty | Optional — graceful fallback without it |
| `STRIPE_SECRET_KEY` | Real Stripe Checkout sessions | empty | **Yes, for live checkout** |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verify | empty | **Yes, for live checkout** |
| `STRIPE_PUBLISHABLE_KEY` | (optional, client-side Stripe.js) | empty | Optional |

The four provider keys (Resend, Google Places, Hunter, Apollo) were already in
the local `.env` — nothing to "fill from worktrees." No worktree contained
additional real secrets (only `.env.example` placeholders).

## What I cannot do for you
I cannot log into third-party dashboards to issue keys (no credentials/browser
session), and live secrets must never be committed. The Stripe and OpenAI keys
below require your hands.

### Stripe (required for live checkout)
1. Create keys at <https://dashboard.stripe.com> → Developers → API keys.
   - Local testing: use **test mode** keys (`sk_test_…`, `pk_test_…`).
   - Production: use **live mode** keys (`sk_live_…`, `pk_live_…`).
2. Webhook signing secret (`STRIPE_WEBHOOK_SECRET`):
   - **Local:** `stripe login` then
     `stripe listen --forward-to localhost:8088/api/webhooks/stripe`; copy the
     printed `whsec_…` into `.env` and restart the dev server.
   - **Production:** Dashboard → Developers → Webhooks → Add endpoint
     `https://dgtlmag.com/api/webhooks/stripe`, select `checkout.session.completed`,
     then copy that endpoint's `whsec_…`. (The dashboard secret differs from the
     CLI one.)
3. Put the values in `.env` (local) and the VPS `.env` (prod). Leaving them blank
   keeps checkout on Payment Links / lead capture — the app degrades gracefully.

### OpenAI (optional)
Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) only if you want
LLM-written sales briefs. Create at <https://platform.openai.com/api-keys>.
Without it, the deterministic brief is used.

## Rotation (recommended before go-live)
The four existing provider keys appeared in this session's tool logs. They were
**never committed to git**, but rotating them is the safe move:

- **Resend:** <https://resend.com> → API Keys → create new, delete old, update `RESEND_API_KEY`.
- **Google Places:** <https://console.cloud.google.com> → APIs & Services → Credentials → create/rotate key; restrict it to the Places API and your server IP/referrers; update `GOOGLE_PLACES_API_KEY`.
- **Hunter:** <https://hunter.io> → API → reset key; update `HUNTER_API_KEY`.
- **Apollo:** <https://app.apollo.io> → Settings → Integrations → API → regenerate; update `APOLLO_API_KEY`.

After rotating, update both the local `.env` and the VPS `.env`, then restart
the app (`docker compose up -d` on the VPS).

## Where keys are read in code
- `lib/integrations/googlePlaces.js`, `hunter.js`, `apollo.js`, `resend.js`
- `lib/enrichment/llmBrief.js` (`OPENAI_API_KEY`, graceful fallback)
- `lib/payments/stripe.js` (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- `lib/store.js` (`DATABASE_URL`)
- Wired into the container in `docker-compose.yml`; documented in `.env.example`.
