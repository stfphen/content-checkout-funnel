import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import { buildBatchEnrichmentNotice, selectLeadsForBatchEnrichment } from "../../../../../lib/enrichment/batch.js";
import { buildLeadEnrichmentUpdate } from "../../../../../lib/enrichment/lead.js";
import { enrichWebsite } from "../../../../../lib/enrichment/website.js";
import { listLeads, updateLeadResearch } from "../../../../../lib/store";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", process.env.PUBLIC_APP_URL || request.url), 303);

  const redirectUrl = new URL("/admin", process.env.PUBLIC_APP_URL || request.url);
  const form = await request.formData();
  const tenantId = String(form.get("tenantId") || "");
  const limit = String(form.get("limit") || "");
  const status = String(form.get("status") || "");

  const leads = await listLeads({ tenantId: tenantId || undefined });
  const selection = selectLeadsForBatchEnrichment(leads, { limit, status });

  let enriched = 0;
  let failed = 0;

  for (const lead of selection.selected) {
    try {
      const enrichmentResult = await enrichWebsite({
        url: lead.websiteUrl,
        business: lead.business
      });

      const update = buildLeadEnrichmentUpdate(lead, enrichmentResult);
      const updatedLead = await updateLeadResearch(lead.id, update);
      if (!updatedLead) {
        failed += 1;
        continue;
      }

      if (update.enrichmentStatus === "failed") {
        failed += 1;
        continue;
      }

      enriched += 1;
    } catch {
      failed += 1;
    }
  }

  redirectUrl.searchParams.set(
    "notice",
    buildBatchEnrichmentNotice({
      enriched,
      skipped: selection.skipped,
      failed
    })
  );
  return NextResponse.redirect(redirectUrl, 303);
}
