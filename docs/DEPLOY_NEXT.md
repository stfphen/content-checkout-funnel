# Deploy-Ready Snapshot — main @ abd333e (2026-07-03, YouTube hero)

> Production currently runs `14a746b` (deployed 2026-07-03, smoke green). This tip adds the
> YouTube hero feature + polish on top of it. Full procedure:
> `brain/40-Operations/41-Deployment-Runbook.md`.

## What this tip ships (vs. production `14a746b`)
- **YouTube hero media:** tenant heroes can loop a single video, an ordered playlist, or a
  channel's uploads shuffled — configured in the Tenant Editor ("Hero video" slot: paste link →
  Detect → save). Muted background playback; the hero image remains the poster/LCP/fallback.
- **Hero polish:** a playing video fully replaces the poster (no image ghosting); aspect-aware
  cover scaling crops YouTube's in-player bars for non-16:9 content (mobile-safe via
  ResizeObserver); background tabs no longer falsely fall back to the image.
- New admin route `/api/admin/media/youtube-resolve`; optional `YOUTUBE_API_KEY` env
  (channel-handle resolution via Data API; page-scrape fallback works without it).
- **No new migrations, no seed steps** — prod already has 006+007 and the 5 tenant rows.

## Hard gate (runbook §0) — status
| Gate | Status |
|---|---|
| `npm test` green | ✅ **289/289 at `abd333e`** (2026-07-03) |
| `npm run build` succeeds | ✅ same tip, clean `.next` |
| `main` pushed | ✅ `origin/main` = `abd333e` |
| Local runtime smoke | ✅ preview tenants render all 3 video kinds; operator eyeballed playback + cover fix on `/t/verify-yt-video?preview=draft` |
| Fresh Postgres dump (`scripts/backup-db.sh`) | ⬜ run on VPS before deploy |
| Post-deploy `curl -I https://dgtlmag.com/` → 200 | ⬜ after deploy |

## ⚠️ Notes for THIS deploy
1. **Do NOT run `seed:tenants` this time** — prod already has the 5 tenant rows; re-seeding would
   overwrite any config edits made through the new Tenant Editor. Only re-run seeds when the
   built-in code configs change intentionally.
2. `npm run migrate` is a fast no-op (006+007 already applied) — safe to keep in the sequence.
3. **Tar bundle now explicitly excludes `.env` / `.env.local`** — the previous command bundled the
   local `.env`, which the extract step would use to overwrite the VPS `.env` that the wipe had
   carefully preserved. Fixed below; double-check the VPS `.env` still has all keys post-deploy.
4. Optional while in the VPS `.env`: add `YOUTUBE_API_KEY=<real key>` (paste the actual key —
   first occurrence of a var wins, so never leave a placeholder line above it).
5. Still-open security/ops items unchanged (C1/H3 rotations, H4 unsubscribe, pg dedupe parity…) —
   see `brain/50-Audit-Log/53-Known-Issues.md`.

## Exact sequence
```bash
# On Mac (bundle is built for you at /tmp/content-funnel-clean.tgz if this doc is fresh)
cd /Users/emery/content-checkout-funnel
git checkout main && git pull                      # tip must be abd333e
COPYFILE_DISABLE=1 tar --exclude="./.git" --exclude=".DS_Store" --exclude="._*" \
  --exclude="./node_modules" --exclude="./.next" --exclude="./data" \
  --exclude="./public/uploads" --exclude="./.env" --exclude="./.env.local" \
  --exclude="./.claude" --exclude="./.agents" --exclude="./.obsidian" \
  -czf /tmp/content-funnel-clean.tgz .
scp /tmp/content-funnel-clean.tgz root@62.72.16.32:/root/content-funnel-clean.tgz

# On VPS
ssh root@62.72.16.32
cd /opt/content-checkout-funnel
bash scripts/backup-db.sh                          # fresh dump first
find /opt/content-checkout-funnel -mindepth 1 -maxdepth 1 -not -name ".env" -not -name "uploads" -not -name "backups" -exec rm -rf {} +
tar -xzf /root/content-funnel-clean.tgz -C /opt/content-checkout-funnel
# optional: echo 'YOUTUBE_API_KEY=<real key>' >> .env
docker compose config
docker compose build content-funnel
docker compose up -d content-funnel-postgres
docker compose run --rm --no-deps content-funnel npm run migrate   # fast no-op (006+007 applied)
docker compose up -d --build
curl -I https://dgtlmag.com/                       # expect 200
```

## Post-deploy smoke checks
- `https://dgtlmag.com/` 200 — funnel look unchanged (no tenant has a hero video configured yet).
- `/admin` → Tenants tab → Tenant Editor → open a tenant → "Hero video (YouTube)" slot present;
  paste a link → Detect resolves (with the key set, @handles resolve via the Data API).
- Configure a hero video on a draft, preview it, publish when happy — video fills the hero with
  no cover-image ghosting and no black bars.
- Existing checks still green: `/t/dmtv` etc. 200, dark admin shell, media upload survives rebuild.
