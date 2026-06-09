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

  for (const record of records) {
    await createLead(leadFromCsvRecord(record, tenantId));
  }

  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
