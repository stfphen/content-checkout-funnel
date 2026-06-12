export function buildDraftEmail({ tenant, lead, packageId }) {
  const selectedPackage =
    tenant.packages.find((pkg) => pkg.id === packageId) ||
    tenant.packages.find((pkg) => pkg.id === tenant.defaultPackageId) ||
    tenant.packages[0];

  const businessName = lead.businessName || lead.business || "your business";
  const contactName = lead.contactName || lead.name || "there";
  const category = lead.category ? ` in ${lead.category}` : "";
  const city = lead.city ? ` around ${lead.city}` : "";
  const painPoints = lead.painPoints
    ? `\n\nThe main angle I would solve for first: ${lead.painPoints}`
    : "";
  const offerName =
    lead.recommendedOffer ||
    selectedPackage.name;

  return {
    subject: `Content idea for ${businessName}`,
    body: `Hey ${contactName},

I came across ${businessName}${category}${city} and thought there may be a strong opportunity to turn one focused shoot day into a month of useful short-form content.

The package I would start with is ${offerName}: ${selectedPackage.description}${painPoints}

For ${businessName}, I would likely build content around:
1. A simple explanation of what makes the offer different
2. Trust-building proof and behind-the-scenes clips
3. Short service or product highlights that can run on Instagram, TikTok, YouTube, and ads

Would it be worth sending over a quick content day concept?`
  };
}
