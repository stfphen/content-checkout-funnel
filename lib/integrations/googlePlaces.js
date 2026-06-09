export async function searchGooglePlaces({ query }) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      reason: "GOOGLE_PLACES_API_KEY is not configured.",
      prospects: []
    };
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.googleMapsUri,places.types"
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 20 })
  });

  if (!response.ok) {
    return {
      ok: false,
      reason: `Google Places returned ${response.status}.`,
      prospects: []
    };
  }

  const data = await response.json();
  return {
    ok: true,
    prospects: (data.places || []).map((place) => ({
      business: place.displayName?.text || "",
      phone: place.nationalPhoneNumber || "",
      url: place.websiteUri || place.googleMapsUri || "",
      notes: place.formattedAddress || "",
      sourceType: "google_places",
      metadata: place
    }))
  };
}
