# Pre-Deploy Gate & Remediation Checklist

Companion to [DEPLOY_HOSTINGER.md](DEPLOY_HOSTINGER.md). The full deploy steps
live there; this file is the **go/no-go gate** plus the current production
status captured during the finalize pass.

## Current production status (observed 2026-06-18, read-only)

| Check | Expected | Observed | Status |
| --- | --- | --- | --- |
| DNS `dgtlmag.com` A | `62.72.16.32` | `62.72.16.32` | ✅ |
| DNS `www.dgtlmag.com` A | `62.72.16.32` | `62.72.16.32` | ✅ |
| `http://dgtlmag.com/` | 301/308 → https | `308 → https` | ✅ (Traefik up, TLS forced) |
| `https://dgtlmag.com/` | `200 OK` | **`502 Bad Gateway`** | ❌ app container not answering |

**Interpretation:** the reverse proxy, DNS, and TLS are healthy, but the
Next.js app container is down or not started. A 502 from Traefik means the
route exists but the backend (`content-checkout-funnel` on container port
3000) is unreachable. **The deploy gate below is NOT met until this is 200.**

## Local readiness (verified this pass)

- `npm test` → **85/85 passing** (was 76; +4 branding, +5 workflow).
- `npm run build` → **compiled successfully**, 30 routes generated.
- API keys live-validated: Google Places ✅, Hunter ✅ (Free plan, 50 searches/mo),
  Apollo ✅, Resend ✅ (send-restricted key — valid for sending only).

## Hard gate — do NOT deploy unless ALL are true

1. `npm test` is green (85/85). Never deploy on a red build.
2. `npm run build` succeeds locally.
3. DNS for `@` and `www` resolves to `62.72.16.32` (confirmed).
4. `/opt/content-checkout-funnel/.env` exists on the VPS with **real** secrets
   (POSTGRES_*, OWNER_*, SESSION_SECRET, the four API keys). Diff before
   overwriting; never clobber production secrets.
5. A fresh Postgres dump exists (`scripts/backup-db.sh`) before any redeploy.
6. Post-deploy: `curl -I https://dgtlmag.com/` → **`200 OK`**.

## Remediation for the current 502 (run on the VPS)

```bash
ssh root@62.72.16.32
cd /opt/content-checkout-funnel

# 1. Is the app container running / what does it say?
docker compose ps
docker logs content-checkout-funnel --tail=120

# 2. Back up the DB before touching anything.
scripts/backup-db.sh

# 3. Bring the stack up (preserves .env and the postgres volume).
docker compose up -d content-funnel-postgres
docker compose up -d --build content-funnel

# 4. Confirm the container is on the proxy network and answering locally.
docker inspect content-checkout-funnel \
  --format '{{range $k,$v := .NetworkSettings.Networks}}{{println $k}}{{end}}'
curl -I http://127.0.0.1:8088/      # -> 200 OK (host 8088 -> container 3000)

# 5. Confirm the public gate.
curl -I https://dgtlmag.com/        # -> 200 OK
docker logs traefik --tail=80       # if still 502, inspect Traefik routing
```

Common 502 causes to check in the logs: app crash on boot (missing/invalid
env var, e.g. `DATABASE_URL` or `SESSION_SECRET`); container not joined to
`traefik-public`; or the loadbalancer port label not matching container port
`3000`.

## Smoke tests (after the gate is green)

```bash
curl -I https://dgtlmag.com/                 # 200 OK (dgtlmag funnel)
curl -I https://dgtlmag.com/t/funded-growth  # 200 OK (second tenant, green theme)
# Admin: open https://dgtlmag.com/admin and log in with OWNER_EMAIL + password.
# Run one Google prospecting search and one outreach queue action end-to-end.
```
