import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import {
  buildGoogleImportNotice,
  isAutoEnrichEnabled,
  maybeAutoEnrichGoogleLead
} from "../../../../../lib/enrichment/googleAutoEnrich.js";
import { searchGooglePlaces } from "../../../../../lib/integrations/googlePlaces";
import { createLead, updateLeadResearch } from "../../../../../lib/store";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  const tenantId = String(form.get("tenantId") || "");
  const query = String(form.get("query") || "");
  const autoEnrich = isAutoEnrichEnabled(form.get("autoEnrich"));
  const result = await searchGooglePlaces({ query });

  let enrichedCount = 0;
  let attemptedCount = 0;
  if (result.ok) {
    for (const prospect of result.prospects) {
      const lead = await createLead({
        ...prospect,
        tenantId,
        status: "researched"
      });

      const autoEnrichResult = await maybeAutoEnrichGoogleLead({
        autoEnrich,
        lead,
        attemptedCount,
        updateLeadResearchImpl: updateLeadResearch
      });

      if (autoEnrichResult.attempted) attemptedCount += 1;
      if (autoEnrichResult.enriched) enrichedCount += 1;
    }
  }

  const url = new URL("/admin", request.url);
  if (!result.ok) url.searchParams.set("notice", result.reason);
  if (result.ok) {
    url.searchParams.set(
      "notice",
      buildGoogleImportNotice({
        importedCount: result.prospects.length,
        enrichedCount
      })
    );
  }
  return NextResponse.redirect(url, 303);
}
