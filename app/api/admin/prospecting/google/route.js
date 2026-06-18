import { NextResponse } from "next/server";
import { logAudit } from "../../../../../lib/audit";
import { permissionDeniedResponse, requireRole } from "../../../../../lib/permissions";
import { searchGooglePlaces } from "../../../../../lib/integrations/googlePlaces";
import { createLead, getSessionTeamId, requireTenantAccess } from "../../../../../lib/store";

export async function POST(request) {
  let session;
  try {
    session = await requireRole(["owner", "admin", "sales"]);
  } catch (error) {
    return permissionDeniedResponse(error, request);
  }

  const form = await request.formData();
  const tenantId = String(form.get("tenantId") || "");
  const teamId = getSessionTeamId(session);
  try {
    await requireTenantAccess(teamId, tenantId);
  } catch (error) {
    return permissionDeniedResponse(error, request);
  }
  const query = String(form.get("query") || "");
  const result = await searchGooglePlaces({ query });

  if (result.ok) {
    for (const prospect of result.prospects) {
      const lead = await createLead({
        ...prospect,
        teamId,
        tenantId,
        status: "researched"
      });
      if (!lead.skippedDuplicate) {
        await logAudit({
          userId: session.user?.id,
          action: "lead.imported",
          targetType: "lead",
          targetId: lead.id,
          metadata: {
            teamId,
            tenantId,
            provider: "google_places",
            query,
            businessName: lead.businessName
          }
        });
      }
    }
  }

  const url = new URL("/admin", request.url);
  if (!result.ok) url.searchParams.set("notice", result.reason);
  if (result.ok) {
    url.searchParams.set("notice", `Imported ${result.prospects.length} Google Places prospects for "${query}".`);
  }
  return NextResponse.redirect(url, 303);
}
