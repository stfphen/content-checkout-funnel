import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import { updateLead } from "../../../../../lib/store";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  const leadId = String(form.get("leadId") || "");
  const redirectTo = String(form.get("redirectTo") || "/admin");

  await updateLead(leadId, {
    contactName: String(form.get("contactName") || ""),
    contactTitle: String(form.get("contactTitle") || ""),
    notes: String(form.get("notes") || ""),
    enrichmentStatus: String(form.get("enrichmentStatus") || ""),
    outreachStatus: String(form.get("outreachStatus") || ""),
    pipelineStatus: String(form.get("pipelineStatus") || ""),
    leadScore: Number(form.get("leadScore") || 0),
    leadScoreReason: String(form.get("leadScoreReason") || ""),
    painPoints: String(form.get("painPoints") || ""),
    recommendedOffer: String(form.get("recommendedOffer") || ""),
    assignedTo: String(form.get("assignedTo") || "")
  });

  const url = new URL(redirectTo, request.url);
  url.searchParams.set("notice", "Lead updated.");
  return NextResponse.redirect(url, 303);
}
