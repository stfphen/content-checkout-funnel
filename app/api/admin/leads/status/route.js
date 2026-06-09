import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import { updateLeadStatus } from "../../../../../lib/store";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  await updateLeadStatus(String(form.get("leadId")), String(form.get("status")));
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
