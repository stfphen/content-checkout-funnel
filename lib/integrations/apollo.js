export async function searchApolloPeople({ domain, titles }) {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      reason: "APOLLO_API_KEY is not configured.",
      contacts: []
    };
  }

  // Use the api_search endpoint for domain-based prospecting
  const url = "https://api.apollo.io/v1/mixed_people/api_search";
  const body = {
    api_key: apiKey,
    q_organization_domains_list: [domain],
    page: 1,
    per_page: 10
  };

  if (titles && titles.length > 0) {
    body.person_titles = titles;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: `Apollo returned ${response.status}.`,
        contacts: []
      };
    }

    const data = await response.json();
    return {
      ok: true,
      contacts: (data.people || []).map((person) => ({
        name: person.name || [person.first_name, person.last_name].filter(Boolean).join(" "),
        email: person.email || "",
        position: person.title || "",
        linkedin: person.linkedin_url || "",
        company: person.organization_name || "",
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
