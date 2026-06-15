import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import { buildQueuePlan } from "../../../../../lib/outreachSequence";
import {
  createOutreachEvent,
  createOutreachQueueItems,
  listLeads,
  listOutreachSuppressions,
  listOutreachTemplates,
  listTenants,
  updateLead
} from "../../../../../lib/store";

function redirectAdmin(request, notice) {
  const url = new URL("/admin", request.url);
  if (notice) url.searchParams.set("notice", notice);
  return NextResponse.redirect(url, 303);
}

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  const leadIds = form.getAll("leadId").map(String).filter(Boolean);
  if (!leadIds.length) return redirectAdmin(request, "Select at least one lead to queue.");

  const tenantId = String(form.get("tenantId") || "");
  const templateId = String(form.get("templateId") || "");
  const campaignId = String(form.get("campaignId") || "");
  const scheduledFor = String(form.get("scheduledFor") || "");
  const queueStatus = String(form.get("queueStatus") || "queued");
  const senderEmail = String(form.get("senderEmail") || "");
  const senderName = String(form.get("senderName") || "");
  const includeContacted = form.get("includeContacted") === "on";

  const [leads, tenants, templates, suppressions] = await Promise.all([
    listLeads(),
    listTenants(),
    listOutreachTemplates(),
    listOutreachSuppressions()
  ]);
  const selectedLeads = leads.filter((lead) => leadIds.includes(lead.id));
  const tenant = tenants.find((item) => item.id === tenantId) || tenants[0] || {};
  const template = templates.find((item) => item.id === templateId && item.isActive !== false) || templates[0];

  if (!template) return redirectAdmin(request, "Create an outreach template before queueing.");

  const plan = buildQueuePlan({
    leads: selectedLeads,
    tenant,
    template,
    campaignId,
    suppressions,
    scheduledFor,
    status: queueStatus,
    senderEmail,
    senderName,
    includeContacted
  });

  const created = await createOutreachQueueItems(plan.items);
  for (const item of created) {
    await updateLead(item.leadId, {
      outreachStatus: item.status,
      pipelineStatus: item.status === "approved" ? "qualified" : undefined,
      campaignId: item.campaignId
    });
    await createOutreachEvent({
      leadId: item.leadId,
      queueId: item.id,
      campaignId: item.campaignId,
      type: item.status,
      metadata: {
        subject: item.subject,
        recipientEmail: item.recipientEmail,
        templateId: item.templateId
      }
    });
  }

  const skippedSummary = plan.skipped.length ? ` Skipped ${plan.skipped.length}.` : "";
  return redirectAdmin(request, `Queued ${created.length} outreach item${created.length === 1 ? "" : "s"}.${skippedSummary}`);
}
