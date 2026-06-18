import { NextResponse } from "next/server";
import { permissionDeniedResponse, requireRole } from "../../../../../../lib/permissions";
import { sendResendEmail } from "../../../../../../lib/integrations/resend";
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
  const url = new URL("/admin", request.url);
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

    const result = await sendResendEmail({
      from: item.senderEmail,
      to: item.recipientEmail,
      subject: item.subject,
      text: item.body,
      html: bodyToHtml(item.body)
    });

    if (result.ok) {
      const sentAt = new Date().toISOString();
      const resendMessageId = result.data?.id || result.data?.message_id || "";
      const next = await updateOutreachQueueItem(item.id, {
        status: "sent",
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
