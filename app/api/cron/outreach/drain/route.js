import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getTeamIdForTenant, listDueQueueItems } from "../../../../../lib/store";
import { sendApprovedItems } from "../../../../../lib/outreach/sendQueue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduled batch-send drain. NOT session-authed (called by cron, not a
 * browser): authenticated with a bearer OUTREACH_CRON_TOKEN, compared in
 * constant time. Selects approved queue items whose scheduledFor has passed and
 * sends them via the shared send engine, grouped per team so cap math and team
 * scoping stay correct. Safe to re-run — the claim CAS makes it idempotent.
 *
 * Trigger example (host crontab, every 5 min):
 *   [slash]5 * * * * curl -fsS -XPOST -H "Authorization: Bearer $OUTREACH_CRON_TOKEN" \
 *     https://dgtlmag.com/api/cron/outreach/drain
 */
function tokenOk(request) {
  const expected = process.env.OUTREACH_CRON_TOKEN || "";
  if (!expected) return false; // never allow when unconfigured
  const header = request.headers.get("authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : header;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request) {
  if (!tokenOk(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const limit = Number.isFinite(Number(body.limit)) && Number(body.limit) > 0 ? Number(body.limit) : 200;
  const dryRun = body.dryRun === true;

  // All due items across teams, then group by owning team (resolved via tenant).
  const due = await listDueQueueItems({ limit });
  const idsByTeam = new Map();
  const teamCache = new Map();
  for (const item of due) {
    let teamId = teamCache.get(item.tenantId);
    if (teamId === undefined) {
      teamId = await getTeamIdForTenant(item.tenantId);
      teamCache.set(item.tenantId, teamId);
    }
    if (!idsByTeam.has(teamId)) idsByTeam.set(teamId, []);
    idsByTeam.get(teamId).push(item.id);
  }

  const totals = { processed: due.length, sent: 0, failed: 0, skipped: 0, suppressed: 0, deferred: 0 };
  const byTeam = {};
  for (const [teamId, itemIds] of idsByTeam) {
    // Scheduled sends defer (not skip) on a cap hit so the next window retries.
    const summary = await sendApprovedItems({ teamId, itemIds, dryRun, deferOnCap: true });
    byTeam[teamId] = summary;
    for (const key of ["sent", "failed", "skipped", "suppressed", "deferred"]) {
      totals[key] += summary[key] || 0;
    }
  }

  return NextResponse.json({ ok: true, ...totals, byTeam });
}
