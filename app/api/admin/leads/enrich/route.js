import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import {
  buildLeadEnrichmentNotice,
  buildLeadEnrichmentUpdateWithOptionalLlm
} from "../../../../../lib/enrichment/lead.js";
import { enrichWebsite } from "../../../../../lib/enrichment/website.js";
import { getLeadById, updateLeadResearch } from "../../../../../lib/store";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const redirectUrl = new URL("/admin", request.url);
  const form = await request.formData();
  const leadId = String(form.get("leadId") || "");
  const lead = await getLeadById(leadId);

  if (!lead) {
    redirectUrl.searchParams.set("notice", "Lead not found.");
    return NextResponse.redirect(redirectUrl, 303);
  }

  if (!lead.websiteUrl) {
    redirectUrl.searchParams.set("notice", "Lead website is missing.");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const enrichmentResult = await enrichWebsite({
    url: lead.websiteUrl,
    business: lead.business
  });

  const update = await buildLeadEnrichmentUpdateWithOptionalLlm(lead, enrichmentResult);
  const updatedLead = await updateLeadResearch(lead.id, update);

  if (!updatedLead) {
    redirectUrl.searchParams.set("notice", "Lead not found.");
    return NextResponse.redirect(redirectUrl, 303);
  }

  redirectUrl.searchParams.set(
    "notice",
    buildLeadEnrichmentNotice(lead, enrichmentResult, update.enrichmentStatus)
  );
  return NextResponse.redirect(redirectUrl, 303);
}
