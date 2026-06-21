import { NextResponse } from "next/server";
import { adminCookie, createAdminSession } from "../../../../lib/auth";

export async function POST(request) {
  const form = await request.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");

  const session = await createAdminSession(email, password);
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login?error=1", process.env.PUBLIC_APP_URL || request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/admin", process.env.PUBLIC_APP_URL || request.url), 303);
  const cookie = adminCookie(session.token);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
