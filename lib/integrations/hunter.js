export async function lookupHunterDomain(domain) {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      reason: "HUNTER_API_KEY is not configured.",
      contacts: []
    };
  }

  const url = new URL("https://api.hunter.io/v2/domain-search");
  url.searchParams.set("domain", domain);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("limit", "10");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const message = await readHunterError(response);
      return {
        ok: false,
        reason: message || `Hunter returned ${response.status}.`,
        contacts: []
      };
    }

    const data = await response.json();
    return {
      ok: true,
      contacts: (data.data?.emails || []).map((email) => ({
        name: [email.first_name, email.last_name].filter(Boolean).join(" "),
        email: email.value,
        position: email.position || "",
        confidence: email.confidence,
        metadata: email
      }))
    };
  } catch (error) {
    return {
      ok: false,
      reason: `Hunter request failed: ${error.message}`,
      contacts: []
    };
  }
}

async function readHunterError(response) {
  try {
    const data = await response.json();
    const detail = data.errors?.[0]?.details || data.errors?.[0]?.id;
    if (detail) return `Hunter returned ${response.status}: ${detail}`;
  } catch {
    return "";
  }

  return "";
}
