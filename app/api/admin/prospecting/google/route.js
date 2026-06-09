import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import { searchGooglePlaces } from "../../../../../lib/integrations/googlePlaces";
import { createLead } from "../../../../../lib/store";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  const tenantId = String(form.get("tenantId") || "");
  const query = String(form.get("query") || "");
  const result = await searchGooglePlaces({ query });

  if (result.ok) {
    for (const prospect of result.prospects) {
      await createLead({
        ...prospect,
        tenantId,
        status: "researched"
      });
    }
  }

  const url = new URL("/admin", request.url);
  if (!result.ok) url.searchParams.set("notice", result.reason);
  if (result.ok) {
    url.searchParams.set("notice", `Imported ${result.prospects.length} Google Places prospects for "${query}".`);
  }
  return NextResponse.redirect(url, 303);
}
