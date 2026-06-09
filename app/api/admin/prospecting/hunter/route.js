import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import { lookupHunterDomain } from "../../../../../lib/integrations/hunter";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  const domain = String(form.get("domain") || "");
  const result = await lookupHunterDomain(domain);
  return NextResponse.json(result);
}
