import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import { lookupHunterDomain } from "../../../../../lib/integrations/hunter";
import { createLead } from "../../../../../lib/store";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  const domain = String(form.get("domain") || "");
  const tenantId = String(form.get("tenantId") || "");
  const result = await lookupHunterDomain(domain);

  const url = new URL("/admin", request.url);
  if (!result.ok) {
    url.searchParams.set("notice", result.reason);
    return NextResponse.redirect(url, 303);
  }

  for (const contact of result.contacts) {
    await createLead({
      tenantId,
      business: domain,
      name: contact.name,
      email: contact.email,
      url: `https://${domain}`,
      notes: contact.position ? `Hunter contact: ${contact.position}` : "Hunter contact",
      status: "researched",
      sourceType: "hunter",
      metadata: contact
    });
  }

  url.searchParams.set("notice", `Imported ${result.contacts.length} Hunter contacts for ${domain}.`);
  return NextResponse.redirect(url, 303);
}
