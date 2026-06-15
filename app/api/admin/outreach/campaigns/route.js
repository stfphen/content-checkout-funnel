import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import {
  createOutreachCampaign,
  updateOutreachCampaign
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
  const campaignId = String(form.get("campaignId") || "");
  const payload = {
    tenantId: String(form.get("tenantId") || ""),
    name: String(form.get("name") || "").trim(),
    description: String(form.get("description") || "").trim(),
    status: String(form.get("status") || "draft"),
    sourceFilter: String(form.get("sourceFilter") || "").trim(),
    cityFilter: String(form.get("cityFilter") || "").trim(),
    categoryFilter: String(form.get("categoryFilter") || "").trim(),
    dailySendCap: Number(form.get("dailySendCap") || 25),
    perDomainDailyCap: Number(form.get("perDomainDailyCap") || 1)
  };

  if (!payload.name) return redirectAdmin(request, "Campaign name is required.");

  if (action === "update" && campaignId) {
    await updateOutreachCampaign(campaignId, payload);
    return redirectAdmin(request, "Campaign updated.");
  }

  await createOutreachCampaign(payload);
  return redirectAdmin(request, "Campaign created.");
}
