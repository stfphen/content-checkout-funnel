# Deploy-Ready Snapshot — main @ 716e5b2 (2026-07-02, consolidated)

> Refreshed after merging `audit/2026-07-02` (718e472) and `feature/funnel-design-control`
> (716e5b2) into `main` and pushing. Full procedure: `brain/40-Operations/41-Deployment-Runbook.md`.
> This file records what THIS tip ships, the gate status, and the exact commands.

## What this tip ships (vs. the VPS's last known snapshot)
- **Security fixes (audit 2026-07-02):** SSRF guard on enrichment fetches (C2), team-scoped
  lead/user mutations closing the IDOR family (H2+), public lead/checkout input whitelisting
  (M1/M2), admin login rate-limit + timing equalizer (H1), JSON 401s for API callers, pipeline
  status validation, committee dedupe fix, admin error boundaries.
- **Admin "Dark Command-Center" reskin (Phases B–D):** admin is now **dark-first** (SSR emits
  `data-theme="dark"`; light toggle still works) with the command-center palette, KPI metric
  cards, elevated panels, glowing focus rings. Admin-only — the public funnel is untouched.
- **Funnel Design Control:** 5 selectable design directions (data-driven `--fp-*` token specs;
  existing tenants render pixel-identically on the default direction), tenant draft editor
  (`/api/admin/tenants/edit`: NL prompt edits + form/picker patches, diff summary), copy-length
  budgets with advisory warnings, and the media library (migration **007**, `/api/admin/media`,
  uploads to `public/uploads/`, `mediaId` slots resolved at render).
- Everything already on the prior line: UI overhaul + portfolio P0, enterprise prospecting MVP
  (migration 006), tenant seeds, telephony, funding program.

## Hard gate (runbook §0) — status
| Gate | Status |
|---|---|
| `npm test` green | ✅ **272/272 at `716e5b2`** (2026-07-02) |
| `npm run build` succeeds | ✅ same tip, clean `.next` |
| `main` pushed | ✅ `origin/main` = `716e5b2` |
| Local runtime smoke | ✅ default funnel unchanged (0 `--fp-*` vars), DB tenants render, direction preview renders, admin login 200; migration 007 applied to local pg |
| DNS `@`/`www` → `62.72.16.32` | ⬜ verify at deploy time |
| VPS `.env` has real secrets (never clobber) | ⬜ verify at deploy time |
| Fresh Postgres dump (`scripts/backup-db.sh`) | ⬜ run on VPS before deploy |
| Post-deploy `curl -I https://dgtlmag.com/` → 200 | ⬜ after deploy |

## ⚠️ New since the last deploy
1. **Run migrations 006 + 007** — the sequence's `npm run migrate` covers both; do not skip.
2. **`public/uploads` must be a persistent volume** — `output:"standalone"` snapshots `public/`
   at build time, so media-library uploads written at runtime need a mounted volume
   (e.g. `- ./uploads:/app/public/uploads` in docker-compose) or they vanish on rebuild.
3. **New optional env vars** (defaults are fine): `MEDIA_STORAGE_PROVIDER` (`local`),
   `MEDIA_MAX_UPLOAD_BYTES` (10 MB), `MEDIA_UPLOAD_DIR`; plus the earlier
   `SEC_EDGAR_USER_AGENT` (recommended), `OPENCORPORATES_API_TOKEN`.
4. **Still-open security/ops items** (see `brain/50-Audit-Log/53-Known-Issues.md`): C1 rotate the
   four exposed provider keys + set a strong `POSTGRES_PASSWORD` (H3) while in the VPS `.env`;
   H4/M3 unsubscribe endpoint; pg dedupe parity (HIGH); outreach double-send, Stripe webhook
   idempotency, batch-import idempotency. `npm audit`: 2 moderate (postcss via next — no
   non-breaking fix exists; build-time surface, accepted for now).
5. Admin renders **dark by default** — expected, not a regression.

## Exact sequence (from the runbook)
```bash
# On Mac
cd /Users/emery/content-checkout-funnel
git checkout main && git pull                      # tip must be 716e5b2
COPYFILE_DISABLE=1 tar --exclude=".git" --exclude=".DS_Store" --exclude="._*" \
  --exclude="node_modules" --exclude=".next" --exclude="data" --exclude="public/uploads" \
  -czf /tmp/content-funnel-clean.tgz .
scp /tmp/content-funnel-clean.tgz root@62.72.16.32:/root/content-funnel-clean.tgz

# On VPS
ssh root@62.72.16.32
cd /opt/content-checkout-funnel
bash scripts/backup-db.sh                          # fresh dump first
find /opt/content-checkout-funnel -mindepth 1 -maxdepth 1 -not -name ".env" -not -name "uploads" -exec rm -rf {} +
tar -xzf /root/content-funnel-clean.tgz -C /opt/content-checkout-funnel
# ensure docker-compose mounts ./uploads -> /app/public/uploads before building
docker compose config
docker compose build content-funnel
docker compose up -d content-funnel-postgres
docker compose run --rm --no-deps content-funnel npm run migrate      # includes 006 + 007
docker compose run --rm --no-deps content-funnel npm run seed:tenants # all 5 tenant funnels as DB rows
docker compose up -d --build
curl -I https://dgtlmag.com/                       # expect 200
```

## Post-deploy smoke checks
- `https://dgtlmag.com/` 200 + hero renders (next/image optimizer working) — funnel look unchanged.
- `/t/dmtv`, `/t/elixr`, `/t/on-home-decor` — accent + funnel sections correct (served from DB rows).
- `/admin` → login → **dark command-center shell**; tabs navigate; theme toggle; Accounts tab present.
- Tenants tab: Tenant Builder shows the direction picker; Tenant Editor lists tenants and loads a draft.
- Upload one image via the editor's media picker → appears under `/uploads/...` and survives a
  `docker compose up -d --build` (volume check).
- Funding survey renders on the funded-growth tenant.
