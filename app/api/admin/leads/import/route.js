import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import { leadFromCsvRecord, parseCsv } from "../../../../../lib/csv";
import { createLead } from "../../../../../lib/store";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  const tenantId = String(form.get("tenantId") || "");
  const records = parseCsv(String(form.get("csv") || ""));
  let imported = 0;
  let skippedDuplicates = 0;

  for (const record of records) {
    const lead = await createLead(leadFromCsvRecord(record, tenantId));
    if (lead.skippedDuplicate) skippedDuplicates += 1;
    else imported += 1;
  }

  const url = new URL("/admin", request.url);
  url.searchParams.set("notice", `Imported ${imported} CSV leads. Skipped ${skippedDuplicates} duplicates.`);
  return NextResponse.redirect(url, 303);
}
