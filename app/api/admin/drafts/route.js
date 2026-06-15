import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/auth";
import { buildDraftEmail } from "../../../../lib/outreach";
import {
  createDraftEmail,
  createOutreachEvent,
  getTenantBySlug,
  listLeads,
  listTenants,
  updateLead
} from "../../../../lib/store";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  const leadId = String(form.get("leadId") || "");
  const tenantId = String(form.get("tenantId") || "");
  const packageId = String(form.get("packageId") || "");
  const [leads, tenants] = await Promise.all([listLeads(), listTenants()]);
  const lead = leads.find((item) => item.id === leadId);
  const tenant = tenants.find((item) => item.id === tenantId) || (await getTenantBySlug("dgtlmag"));

  if (lead && lead.pipelineStatus !== "disqualified") {
    const draft = buildDraftEmail({ tenant, lead, packageId });
    await createDraftEmail({ ...draft, leadId, tenantId: tenant.id });
    await updateLead(leadId, {
      outreachStatus: "drafted",
      pipelineStatus: ["new", "researched"].includes(lead.pipelineStatus) ? "qualified" : lead.pipelineStatus
    });
    await createOutreachEvent({
      leadId,
      campaignId: lead.campaignId || "",
      type: "drafted",
      metadata: {
        subject: draft.subject,
        packageId
      }
    });
  }

  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
