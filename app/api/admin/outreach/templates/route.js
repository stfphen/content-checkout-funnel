import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import {
  createOutreachTemplate,
  updateOutreachTemplate
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
  const action = String(form.get("action") || "create");
  const templateId = String(form.get("templateId") || "");
  const payload = {
    tenantId: String(form.get("tenantId") || ""),
    name: String(form.get("name") || "").trim(),
    subject: String(form.get("subject") || "").trim(),
    body: String(form.get("body") || "").trim(),
    category: String(form.get("category") || "").trim(),
    offerType: String(form.get("offerType") || "").trim()
  };

  if (action === "deactivate" && templateId) {
    await updateOutreachTemplate(templateId, { isActive: false });
    return redirectAdmin(request, "Template deactivated.");
  }

  if (!payload.name || !payload.subject || !payload.body) {
    return redirectAdmin(request, "Template name, subject, and body are required.");
  }

  if (action === "update" && templateId) {
    await updateOutreachTemplate(templateId, { ...payload, isActive: form.get("isActive") === "on" });
    return redirectAdmin(request, "Template updated.");
  }

  await createOutreachTemplate({ ...payload, isActive: true });
  return redirectAdmin(request, "Template created.");
}
