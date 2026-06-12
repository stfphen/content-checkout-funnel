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
  const titles = String(form.get("titles") || "")
    .split(",")
    .map((title) => title.trim())
    .filter(Boolean);
  const result = await searchApolloPeople({ domain, titles });

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
      notes: buildApolloNotes(contact),
      status: "researched",
      sourceType: "apollo",
      metadata: contact
    });
  }

  url.searchParams.set("notice", `Imported ${result.contacts.length} Apollo contacts for ${domain}.`);
  return NextResponse.redirect(url, 303);
}

function buildApolloNotes(contact) {
  const role = contact.position ? `Apollo person search: ${contact.position}` : "Apollo person search";
  if (contact.email) return role;
  if (contact.emailAvailable) return `${role}. Apollo shows an email is available; use enrichment before outreach.`;
  return `${role}. No email returned by Apollo search.`;
}
