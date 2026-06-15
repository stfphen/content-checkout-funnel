import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import { normalizeDomain, normalizeEmail } from "../../../../../lib/outreachSequence";
import { createOutreachSuppression } from "../../../../../lib/store";

function redirectAdmin(request, notice) {
  const url = new URL("/admin", request.url);
  if (notice) url.searchParams.set("notice", notice);
  return NextResponse.redirect(url, 303);
}

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  const email = normalizeEmail(form.get("email"));
  const domain = normalizeDomain(form.get("domain"));
  const reason = String(form.get("reason") || "manual");

  if (!email && !domain) return redirectAdmin(request, "Add an email or domain to suppress.");

  await createOutreachSuppression({
    tenantId: String(form.get("tenantId") || ""),
    email,
    domain,
    reason
  });

  return redirectAdmin(request, "Suppression added.");
}
