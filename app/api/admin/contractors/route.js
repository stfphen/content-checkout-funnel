import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/auth";
import { createContractor } from "../../../../lib/store";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  await createContractor({
    name: String(form.get("name") || ""),
    email: String(form.get("email") || ""),
    phone: String(form.get("phone") || ""),
    serviceArea: String(form.get("serviceArea") || ""),
    weeklyCapacity: String(form.get("weeklyCapacity") || "0"),
    availabilityNotes: String(form.get("availabilityNotes") || ""),
    rateNotes: String(form.get("rateNotes") || "")
  });

  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
