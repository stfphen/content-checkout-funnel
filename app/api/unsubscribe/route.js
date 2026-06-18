import { NextResponse } from "next/server";
import { normalizeDomain, normalizeEmail } from "../../../lib/outreachSequence";
import { createOutreachSuppression } from "../../../lib/store";

export async function GET(request) {
  const url = new URL(request.url);
  const email = normalizeEmail(url.searchParams.get("email"));
  const domain = normalizeDomain(url.searchParams.get("domain") || email);

  if (email || domain) {
    await createOutreachSuppression({
      email,
      domain: email ? "" : domain,
      reason: "unsubscribed"
    });
  }

  return new NextResponse(
    `<main style="font-family: system-ui, sans-serif; max-width: 680px; margin: 64px auto; padding: 0 20px;">
      <h1>Unsubscribe recorded</h1>
      <p>This email or domain has been added to the do-not-contact list.</p>
    </main>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    }
  );
}
