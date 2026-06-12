import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import { searchGooglePlaces } from "../../../../../lib/integrations/googlePlaces";
import { buildProspectingQuery, defaultApolloRoles, mergeBatchCounts } from "../../../../../lib/prospecting";
import { createProspectingBatch, updateProspectingBatch } from "../../../../../lib/store";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  const tenantId = String(form.get("tenantId") || "");
  const category = String(form.get("category") || "");
  const city = String(form.get("city") || "");
  const query = buildProspectingQuery({
    query: String(form.get("query") || ""),
    category,
    city
  });
  const maxResults = Number(form.get("maxResults") || 20);
  const batch = await createProspectingBatch({
    tenantId,
    name: String(form.get("name") || `${category || query} - ${city || "Prospecting"}`),
    query,
    category,
    city,
    provider: "google_places",
    status: "running",
    maxResults,
    enrichHunter: form.get("enrichHunter") === "on",
    enrichApollo: form.get("enrichApollo") === "on",
    targetRoles: defaultApolloRoles
  });

  const url = new URL("/admin", request.url);
  url.searchParams.set("batchId", batch.id);

  const result = await searchGooglePlaces({ query, maxResults });
  if (!result.ok) {
    await updateProspectingBatch(batch.id, {
      status: "failed",
      counts: mergeBatchCounts(batch.counts, { failed: 1 }),
      error: result.error || result.reason
    });
    url.searchParams.set("notice", result.error || result.reason);
    return NextResponse.redirect(url, 303);
  }

  await updateProspectingBatch(batch.id, {
    status: "completed",
    previewResults: result.prospects,
    counts: mergeBatchCounts(batch.counts, { found: result.prospects.length }),
    error: ""
  });

  url.searchParams.set("notice", `Previewed ${result.prospects.length} prospects for "${query}".`);
  return NextResponse.redirect(url, 303);
}
