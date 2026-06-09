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

  const response = await fetch(url);
  if (!response.ok) {
    return {
      ok: false,
      reason: `Hunter returned ${response.status}.`,
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
}
