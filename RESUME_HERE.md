# Resume Here — Go-Live Progress

_Last updated: 2026-06-21. Pick up from this file after the VPS reconnects._

## ✅ Done

1. **Live 502 fixed.** Root cause: Next.js 15 bound to the container-id hostname instead of `0.0.0.0`, so Traefik got a 502. Fixed with `HOSTNAME=0.0.0.0` in `docker-compose.yml`. Site returns 200.
2. **GitHub is the source of truth.** `origin/main` @ `5a8bf6f` now holds the 502 fix + the go-live plan + the previously-unpushed commit.
3. **Branch hygiene.** 9 local + 7 remote merged branches pruned. Full recoverable bundle at `../branch-backup-<date>.bundle`. Kept (unmerged, in the bundle): `backup/*`, `feature/funded-growth-engine`, `feature/funding-program-docs`, the `*-wip` branches, `feature/outreach-sequence-v1`, `funding-survey-feature`, `rescue/tenant-builder-wip`.
4. **Diagnosed the VPS.** It was running a months-old snapshot (`9e11b81`) — far behind `main`, with NO unique work to preserve. Ready to fast-forward to the full current app.

## ⏳ Next action when VPS is back — sync it to GitHub and deploy the latest code

SSH to `root@62.72.16.32`, then:

```bash
cd /opt/content-checkout-funnel
git restore docker-compose.yml          # drop redundant local edit; origin has the HOSTNAME fix
git merge --ff-only origin/main         # fast-forward to source of truth
git log --oneline -1
scripts/backup-db.sh                     # backup before migrating
docker compose build content-funnel
docker compose run --rm --no-deps content-funnel npm run migrate
docker compose up -d
sleep 10
docker logs content-checkout-funnel --tail=12
curl -sS -I http://127.0.0.1:8088/ | head -3     # want 200
curl -sS -I https://dgtlmag.com/ | head -3       # want 200
```

This upgrades the live site from the old snapshot to the full current app (Funding Survey, Stripe, telephony, reskin). DB is backed up first; migrations 002–005 apply only if missing.

## After that — one-command deploys forever

`deploy.sh` is in the repo. To activate it (from your Mac, once):

```bash
cd /Users/emery/content-checkout-funnel
chmod +x deploy.sh
git add deploy.sh && git commit -m "chore: add one-command VPS deploy script" && git push origin main
```

Then every future deploy is: **push from Mac → `./deploy.sh` on the VPS.**

## Small leftover (your Mac, optional)

```bash
git branch -D feature/outreach-sequence-v1-clean   # merged to main; remote copy already deleted
```

## Open items still ahead (see GO_LIVE_PLAN.md / the tracker)

- Phase 2/3/10: rotate the weak DB password (`content_funnel:content_funnel`), set strong creds, rotate provider keys.
- Phase 4: Claude SDK auth (`CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`).
- Phase 5–8: Stripe live verify, Resend domain, Twilio call-forwarding, prospecting QA.
- Phase 12: uptime monitor (would have caught this 502 automatically), CI/CD.
