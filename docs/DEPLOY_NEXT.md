# Deploy-Ready Snapshot — main @ a87a714 (2026-07-02)

> Prepared during repo consolidation; refreshed after merging `feature/portfolio-p0`.
> Full procedure: `brain/40-Operations/41-Deployment-Runbook.md`.
> This file records what THIS tip ships, the gate status, and the exact commands.

## What this tip ships (vs. the VPS's last known snapshot)
- **Full UI/UX overhaul (Direction C)** — token foundation + primitives, admin/funnel reskin,
  hero via `next/image` → funnel Lighthouse **100 desktop / 92 mobile** (was 86/75) — **plus the
  deferred-items pass**: dark-mode derived-token fix, sticky dismissible funding notice, CSS dead-rule
  prune (styles.css 94.8→86.1 kB), admin code-split (/admin first-load 169→151 kB). Narrow-breakpoint
  QA of populated Pipeline/Calls passed 07-02.
- **Portfolio/References P0** — per-tenant `portfolio` + `references` config sections (defaults +
  sanitization) rendered on the funnel; empty tenants unchanged. Config-only, no upload surface.
- **Enterprise prospecting MVP** — Accounts tab, `lib/enterpriseProspecting/`, EDGAR/OpenCorporates
  adapters, **migration 006**, seeds, 31 feature tests — plus AccountCard research/campaign-scope
  surfacing (`8b550fe`).
- Funding-program docs, mobile-first overhaul, telephony, funding program (already on the line).

## Hard gate (runbook §0) — status
| Gate | Status |
|---|---|
| `npm test` green | ✅ **208/208 at `a87a714`** (run on the merged tip, 2026-07-02) |
| `npm run build` succeeds | ✅ same run |
| DNS `@`/`www` → `62.72.16.32` | ⬜ verify at deploy time |
| VPS `.env` has real secrets (never clobber) | ⬜ verify at deploy time |
| Fresh Postgres dump (`scripts/backup-db.sh`) | ⬜ run on VPS before deploy |
| Post-deploy `curl -I https://dgtlmag.com/` → 200 | ⬜ after deploy |
| Funding survey in build (runbook warning) | ✅ `components/funding/*` is on main |

## ⚠️ New since the last deploy
1. **Run migration 006** (enterprise prospecting tables) — the deploy sequence's
   `npm run migrate` step covers it; do not skip.
2. **New optional env vars** (graceful degradation if unset):
   `SEC_EDGAR_USER_AGENT` (recommended; EDGAR requests want a UA), `OPENCORPORATES_API_TOKEN`.
3. Outstanding security items from `brain/50-Audit-Log/53-Known-Issues.md` (C1 key rotation,
   C2 SSRF guard, H1 rate limiting, H3 DB password) are **NOT fixed by this tip** — rotate keys +
   set a strong `POSTGRES_PASSWORD` while you're in the VPS `.env`.

## Exact sequence (from the runbook)
```bash
# On Mac
cd /Users/emery/content-checkout-funnel
git checkout main   # (once the working tree is free) or clone fresh at cd0597e
COPYFILE_DISABLE=1 tar --exclude=".git" --exclude=".DS_Store" --exclude="._*" \
  --exclude="node_modules" --exclude=".next" --exclude="data" \
  -czf /tmp/content-funnel-clean.tgz .
scp /tmp/content-funnel-clean.tgz root@62.72.16.32:/root/content-funnel-clean.tgz

# On VPS
ssh root@62.72.16.32
cd /opt/content-checkout-funnel
bash scripts/backup-db.sh                          # fresh dump first
find /opt/content-checkout-funnel -mindepth 1 -maxdepth 1 -not -name ".env" -exec rm -rf {} +
tar -xzf /root/content-funnel-clean.tgz -C /opt/content-checkout-funnel
docker compose config
docker compose build content-funnel
docker compose up -d content-funnel-postgres
docker compose run --rm --no-deps content-funnel npm run migrate     # includes 006
docker compose run --rm --no-deps content-funnel npm run seed:tenants # all 5 tenant funnels as DB rows
docker compose up -d --build
curl -I https://dgtlmag.com/                       # expect 200
```

## Post-deploy smoke checks
- `https://dgtlmag.com/` 200 + hero renders (next/image optimizer working).
- `/t/dmtv`, `/t/elixr`, `/t/on-home-decor` — accent + funnel sections correct (served from DB rows).
- `/admin` → login → tabs navigate; dark-mode toggle; Accounts tab present.
- Funding survey renders on the funded-growth tenant.
