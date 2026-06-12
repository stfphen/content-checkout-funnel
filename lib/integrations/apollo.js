export async function searchApolloPeople({ domain, titles }) {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      reason: "APOLLO_API_KEY is not configured.",
      contacts: []
    };
  }

  const normalizedDomain = normalizeDomain(domain);
  if (!normalizedDomain) {
    return {
      ok: false,
      reason: "Apollo search needs a valid company domain.",
      contacts: []
    };
  }

  const url = new URL("https://api.apollo.io/api/v1/mixed_people/api_search");
  url.searchParams.set("page", "1");
  url.searchParams.set("per_page", "10");
  url.searchParams.append("q_organization_domains_list[]", normalizedDomain);

  for (const title of titles || []) {
    if (title) url.searchParams.append("person_titles[]", title);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "x-api-key": apiKey
      }
    });

    if (!response.ok) {
      const message = await readApolloError(response);
      return {
        ok: false,
        reason: message || `Apollo returned ${response.status}.`,
        contacts: []
      };
    }

    const data = await response.json();
    return {
      ok: true,
      contacts: (data.people || []).map((person) => ({
        name: person.name || [person.first_name, person.last_name].filter(Boolean).join(" "),
        email: person.email || "",
        emailAvailable: Boolean(person.has_email || person.email),
        position: person.title || "",
        linkedin: person.linkedin_url || "",
        company: person.organization?.name || person.organization_name || normalizedDomain,
        metadata: person
      }))
    };
  } catch (error) {
    return {
      ok: false,
      reason: `Apollo request failed: ${error.message}`,
      contacts: []
    };
  }
}

function normalizeDomain(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

async function readApolloError(response) {
  try {
    const data = await response.json();
    const detail = data.error || data.message || data.error_message;
    if (detail) return `Apollo returned ${response.status}: ${detail}`;
  } catch {
    return "";
  }

  return "";
}
