#!/usr/bin/env bash
# One-command production deploy for the Content Checkout Funnel.
#
# GitHub (origin/main) is the single source of truth. This script overwrites
# any manual edits in /opt with what's on origin/main — so the workflow is:
#   1. edit code on your Mac, commit, `git push origin main`
#   2. SSH to the VPS and run `./deploy.sh`
#
# .env is git-ignored and is preserved across deploys.
set -euo pipefail

cd "$(dirname "$0")"

echo "[deploy] 1/5 backing up database..."
if [ -x scripts/backup-db.sh ]; then
  scripts/backup-db.sh || echo "[deploy] WARN: backup failed; continuing"
else
  echo "[deploy] WARN: scripts/backup-db.sh not found; skipping backup"
fi

echo "[deploy] 2/5 syncing to origin/main (source of truth)..."
git fetch origin
git checkout main
git reset --hard origin/main
echo "[deploy] now at: $(git log --oneline -1)"

echo "[deploy] 3/5 building image..."
docker compose build content-funnel

echo "[deploy] 4/5 applying database migrations..."
docker compose run --rm --no-deps content-funnel npm run migrate

echo "[deploy] 5/5 restarting app..."
docker compose up -d
sleep 8

code=$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:8088/ 2>/dev/null || echo "000")
echo "[deploy] local health check: HTTP $code"
if [ "$code" = "200" ]; then
  echo "[deploy] ✅ deploy OK — verify https://dgtlmag.com/"
else
  echo "[deploy] ❌ not healthy. Inspect: docker logs content-checkout-funnel --tail=60"
  exit 1
fi
