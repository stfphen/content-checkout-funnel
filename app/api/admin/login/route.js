import { NextResponse } from "next/server";
import { adminCookie, createSessionToken, validateAdminCredentials } from "../../../../lib/auth";

export async function POST(request) {
  const form = await request.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");

  if (!validateAdminCredentials(email, password)) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303);
  }

  const token = createSessionToken(email);
  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  const cookie = adminCookie(token);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
