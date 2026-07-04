import { NextResponse } from "next/server";
import { permissionDeniedResponse, requireRole } from "../../../../../../lib/permissions";
import { sendResendEmail } from "../../../../../../lib/integrations/resend";
import { buildUnsubscribeUrl, signUnsubscribeToken } from "../../../../../../lib/unsubscribe";
import { canSendQueueItem, suggestFollowUpDate } from "../../../../../../lib/outreachSequence";
import {
  createOutreachEvent,
  getSessionTeamId,
  listOutreachCampaigns,
  listOutreachQueue,
  listOutreachSuppressions,
  updateLead,
  updateOutreachQueueItem
} from "../../../../../../lib/store";

function redirectAdmin(request, notice) {
  const url = new URL("/admin", process.env.PUBLIC_APP_URL || request.url);
  if (notice) url.searchParams.set("notice", notice);
  return NextResponse.redirect(url, 303);
}

function bodyToHtml(body = "") {
  return String(body)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function POST(request) {
  let session;
  try {
    session = await requireRole(["owner", "admin", "sales"]);
  } catch (error) {
    return permissionDeniedResponse(error, request);
  }

  const form = await request.formData();
  const teamId = getSessionTeamId(session);
  const queueIds = form.getAll("queueItemId").map(String).filter(Boolean);
  if (!queueIds.length) return redirectAdmin(request, "Select at least one approved queue item to send.");

  const [queue, campaigns, suppressions] = await Promise.all([
    listOutreachQueue({ teamId }),
    listOutreachCampaigns({ teamId }),
    listOutreachSuppressions({ teamId })
  ]);
  const queueSnapshot = [...queue];
  const campaignFallback = { dailySendCap: 100, perDomainDailyCap: 1 };
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const queueId of queueIds) {
    const item = queueSnapshot.find((candidate) => candidate.id === queueId);
    if (!item) {
      skipped += 1;
      continue;
    }

    if (item.status !== "approved") {
      skipped += 1;
      continue;
    }

    const campaign = campaigns.find((candidate) => candidate.id === item.campaignId) || campaignFallback;
    const sendCheck = canSendQueueItem({ item, queue: queueSnapshot, campaign, suppressions });
    if (!sendCheck.ok) {
      skipped += 1;
      const next = await updateOutreachQueueItem(item.id, {
        status: sendCheck.reason === "suppressed" ? "suppressed" : "skipped",
        failureReason: sendCheck.reason
      }, { teamId });
      Object.assign(item, next || {});
      await createOutreachEvent({
        teamId,
        leadId: item.leadId,
        queueId: item.id,
        campaignId: item.campaignId,
        type: sendCheck.reason === "suppressed" ? "suppressed" : "skipped",
        metadata: { reason: sendCheck.reason }
      });
      continue;
    }

    // Atomic claim BEFORE the send: only one concurrent request can flip
    // approved→sent, so a double-submit can't email twice. Crash-after-claim
    // loses one email; crash-after-send-before-flip would double-send —
    // claiming first is the safe side.
    const sentAt = new Date().toISOString();
    const claimed = await updateOutreachQueueItem(item.id, {
      status: "sent",
      sentAt
    }, { teamId, expectedStatus: "approved" });
    if (!claimed) {
      skipped += 1;
      continue;
    }
    Object.assign(item, claimed);

    // Per-recipient signed unsubscribe link (H4). Only embedded when
    // UNSUBSCRIBE_SIGNING_SECRET + a public base URL are configured.
    const unsubscribeUrl = buildUnsubscribeUrl(signUnsubscribeToken({
      email: item.recipientEmail,
      tenantId: item.tenantId,
      leadId: item.leadId,
      campaignId: item.campaignId
    }));
    const text = unsubscribeUrl ? `${item.body}\n\nUnsubscribe: ${unsubscribeUrl}` : item.body;
    const html = unsubscribeUrl
      ? `${bodyToHtml(item.body)}<p><a href="${unsubscribeUrl}">Unsubscribe</a></p>`
      : bodyToHtml(item.body);

    const result = await sendResendEmail({
      from: item.senderEmail,
      to: item.recipientEmail,
      subject: item.subject,
      text,
      html,
      headers: unsubscribeUrl
        ? {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
          }
        : undefined
    });

    if (result.ok) {
      const resendMessageId = result.data?.id || result.data?.message_id || "";
      const next = await updateOutreachQueueItem(item.id, {
        sentAt,
        failureReason: "",
        resendMessageId
      }, { teamId });
      Object.assign(item, next || {}, { sentAt, status: "sent" });
      await updateLead(item.leadId, {
        outreachStatus: "contacted",
        pipelineStatus: "contacted",
        lastContactedAt: sentAt,
        nextFollowUpAt: suggestFollowUpDate(new Date(sentAt)),
        campaignId: item.campaignId
      }, { teamId });
      await createOutreachEvent({
        teamId,
        leadId: item.leadId,
        queueId: item.id,
        campaignId: item.campaignId,
        type: "sent",
        metadata: {
          subject: item.subject,
          recipientEmail: item.recipientEmail,
          resendMessageId
        }
      });
      sent += 1;
    } else {
      const failureReason = result.error || result.reason || "Resend send failed.";
      const next = await updateOutreachQueueItem(item.id, {
        status: "failed",
        failureReason
      }, { teamId });
      Object.assign(item, next || {}, { status: "failed", failureReason });
      await createOutreachEvent({
        teamId,
        leadId: item.leadId,
        queueId: item.id,
        campaignId: item.campaignId,
        type: "failed",
        metadata: {
          reason: failureReason,
          configured: result.configured
        }
      });
      failed += 1;
    }
  }

  return redirectAdmin(request, `Send complete: ${sent} sent, ${failed} failed, ${skipped} skipped.`);
}
