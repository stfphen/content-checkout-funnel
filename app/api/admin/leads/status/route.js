import { NextResponse } from "next/server";
import { logAudit } from "../../../../../lib/audit";
import { permissionDeniedResponse, requireRole } from "../../../../../lib/permissions";
import { getSessionTeamId, updateLeadStatus } from "../../../../../lib/store";

export async function POST(request) {
  let session;
  try {
    session = await requireRole(["owner", "admin", "sales"]);
  } catch (error) {
    return permissionDeniedResponse(error, request);
  }

  const form = await request.formData();
  const teamId = getSessionTeamId(session);
  const leadId = String(form.get("leadId"));
  const status = String(form.get("status"));
  await updateLeadStatus(leadId, status, { teamId });
  await logAudit({
    userId: session.user?.id,
    action: "lead.status_changed",
    targetType: "lead",
    targetId: leadId,
    metadata: { teamId, status }
  });
  return NextResponse.redirect(new URL("/admin", process.env.PUBLIC_APP_URL || request.url), 303);
}
