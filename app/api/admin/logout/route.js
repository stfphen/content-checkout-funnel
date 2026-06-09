import { NextResponse } from "next/server";
import { clearAdminCookie } from "../../../../lib/auth";

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  const cookie = clearAdminCookie();
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
