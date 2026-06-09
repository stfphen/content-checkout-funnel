export async function validateResendConfig() {
  if (!process.env.RESEND_API_KEY) {
    return {
      ok: false,
      reason: "RESEND_API_KEY is not configured."
    };
  }

  return { ok: true };
}

export async function sendResendEmail({ from, to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      reason: "RESEND_API_KEY is not configured."
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to, subject, html, text })
  });

  const data = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status,
    data
  };
}
