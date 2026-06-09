import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/auth";
import { buildDraftEmail } from "../../../../lib/outreach";
import { createDraftEmail, getTenantBySlug, listLeads, listTenants, updateLeadStatus } from "../../../../lib/store";

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

  if (lead && lead.status !== "do_not_contact") {
    const draft = buildDraftEmail({ tenant, lead, packageId });
    await createDraftEmail({ ...draft, leadId, tenantId: tenant.id });
    await updateLeadStatus(leadId, "drafted");
  }

  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
