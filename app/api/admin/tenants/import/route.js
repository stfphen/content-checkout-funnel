import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../../lib/auth";
import { upsertTenantConfig } from "../../../../../lib/store";

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url), 303);

  const form = await request.formData();
  const config = JSON.parse(String(form.get("configJson") || "{}"));
  await upsertTenantConfig(config);
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
