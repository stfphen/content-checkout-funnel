import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import { searchApolloPeople } from "../../../../../lib/integrations/apollo";
import { createLead } from "../../../../../lib/store";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  const domain = String(form.get("domain") || "");
  const tenantId = String(form.get("tenantId") || "");
  const result = await searchApolloPeople({ domain });

  const url = new URL("/admin", request.url);
  if (!result.ok) {
    url.searchParams.set("notice", result.reason);
    return NextResponse.redirect(url, 303);
  }

  for (const contact of result.contacts) {
    await createLead({
      tenantId,
      business: contact.company || domain,
      name: contact.name,
      email: contact.email,
      url: `https://${domain}`,
      notes: contact.position ? `Apollo contact: ${contact.position}` : "Apollo contact",
      status: "researched",
      sourceType: "apollo",
      metadata: contact
    });
  }

  url.searchParams.set("notice", `Imported ${result.contacts.length} Apollo contacts for ${domain}.`);
  return NextResponse.redirect(url, 303);
}
