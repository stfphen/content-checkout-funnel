import { NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "../../../lib/unsubscribe";
import { createOutreachSuppression } from "../../../lib/store";

/**
 * Unsubscribe endpoint (H4 fix). Requires an HMAC-signed token minted at send
 * time, so only real recipients can suppress — scoped to the tenant that
 * emailed them. GET only renders a confirmation form (link scanners must not
 * mutate); POST performs the suppression. Supports RFC 8058 one-click
 * (List-Unsubscribe-Post) since providers POST to the same tokenized URL.
 */

function page(body, status = 200) {
  return new NextResponse(
    `<main style="font-family: system-ui, sans-serif; max-width: 680px; margin: 64px auto; padding: 0 20px;">
      ${body}
    </main>`,
    {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    }
  );
}

function invalidTokenPage() {
  return page(
    `<h1>Link invalid or expired</h1>
      <p>This unsubscribe link is invalid or has expired. Reply to the original email and we will remove you manually.</p>`,
    400
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const payload = verifyUnsubscribeToken(token);
  if (!payload) return invalidTokenPage();

  return page(
    `<h1>Unsubscribe</h1>
      <p>Stop receiving emails at <strong>${escapeHtml(payload.email)}</strong>?</p>
      <form method="post">
        <input type="hidden" name="token" value="${escapeHtml(token)}" />
        <button type="submit" style="font: inherit; padding: 10px 18px; cursor: pointer;">Unsubscribe</button>
      </form>`
  );
}

export async function POST(request) {
  const url = new URL(request.url);
  // Query token first: RFC 8058 one-click POSTs (List-Unsubscribe=One-Click
  // body) hit the tokenized URL directly; our own confirm form posts the token
  // as a form field.
  let token = url.searchParams.get("token") || "";
  if (!token) {
    const form = await request.formData().catch(() => null);
    token = String(form?.get("token") || "");
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload) return invalidTokenPage();

  await createOutreachSuppression({
    tenantId: payload.tenantId,
    email: payload.email,
    reason: "unsubscribed"
  });

  return page(
    `<h1>Unsubscribe recorded</h1>
      <p>This email address has been added to the do-not-contact list.</p>`
  );
}
