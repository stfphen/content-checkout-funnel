import { domainFromUrl } from "./leadUtils.js";

export const outreachTemplateFields = [
  "businessName",
  "contactName",
  "city",
  "category",
  "painPoints",
  "recommendedOffer",
  "tenantName",
  "bookingLink",
  "senderName"
];

export const campaignStatuses = ["draft", "active", "paused", "completed"];

export const outreachQueueStatuses = [
  "queued",
  "approved",
  "sent",
  "failed",
  "skipped",
  "suppressed",
  "replied",
  "booked"
];

export const suppressionReasons = [
  "unsubscribed",
  "bounced",
  "manual",
  "complained",
  "invalid",
  "do_not_contact"
];

export const outreachEventTypes = [
  "drafted",
  "queued",
  "approved",
  "sent",
  "failed",
  "skipped",
  "suppressed",
  "replied",
  "booked",
  "unsubscribed"
];

export const defaultOutreachTemplates = [
  {
    id: "template_content_day_intro",
    tenantId: "",
    name: "Content Day Intro",
    subject: "Content idea for {{businessName}}",
    body: `Hey {{contactName}},

I came across {{businessName}} in {{city}} and thought there may be a strong opportunity to turn one focused shoot day into a month of useful short-form content.

The package I would start with is {{recommendedOffer}}.

For {{businessName}}, I would likely build content around:
1. A simple explanation of what makes the offer different
2. Trust-building proof and behind-the-scenes clips
3. Short service or product highlights that can run on Instagram, TikTok, YouTube, and ads

Would it be worth sending over a quick content day concept?

{{unsubscribeFooter}}`,
    category: "",
    offerType: "content_day",
    isActive: true,
    system: true
  },
  {
    id: "template_content_day_followup",
    tenantId: "",
    name: "Content Day Follow-up",
    subject: "Quick follow-up for {{businessName}}",
    body: `Hey {{contactName}},

Quick follow-up on the content day idea for {{businessName}}.

The simple version is: one planned shoot, then a batch of short-form assets your team can use across social, ads, and email.

If useful, I can send over a rough shot list for {{businessName}}.

{{unsubscribeFooter}}`,
    category: "",
    offerType: "follow_up",
    isActive: true,
    system: true
  }
];

export function renderOutreachTemplate(template, { lead = {}, tenant = {}, senderName = "" } = {}) {
  const fields = buildTemplateFields({ lead, tenant, senderName });
  return {
    subject: replaceMergeFields(template?.subject || "", fields),
    body: replaceMergeFields(template?.body || "", fields),
    fields
  };
}

export function buildTemplateFields({ lead = {}, tenant = {}, senderName = "" } = {}) {
  const tenantName = tenant.brand?.name || tenant.name || "our team";
  const selectedPackage =
    tenant.packages?.find((pkg) => pkg.id === tenant.defaultPackageId) ||
    tenant.packages?.[0] ||
    {};
  const bookingLink = selectedPackage.bookingLink || tenant.routing?.bookingLink || "";

  return {
    businessName: lead.businessName || lead.business || "your business",
    contactName: lead.contactName || lead.name || "there",
    city: lead.city || "",
    category: lead.category || "",
    painPoints: lead.painPoints || "",
    recommendedOffer: lead.recommendedOffer || selectedPackage.name || "a content day package",
    tenantName,
    bookingLink,
    senderName: senderName || tenant.brand?.senderName || tenantName,
    unsubscribeFooter: "If this is not relevant, reply and I will make sure you are not contacted again."
  };
}

export function replaceMergeFields(input, fields = {}) {
  return String(input || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => fields[key] ?? "");
}

export function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

export function normalizeDomain(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return domainFromUrl(raw.includes("@") ? raw.split("@").pop() : raw);
}

export function recipientDomain(email = "") {
  const normalized = normalizeEmail(email);
  return normalized.includes("@") ? normalized.split("@").pop() : "";
}

export function findSuppressionForLead(lead = {}, suppressions = []) {
  return findSuppression({
    email: lead.email,
    domain: lead.domain || lead.websiteUrl || lead.website
  }, suppressions);
}

export function findSuppression({ email = "", domain = "", tenantId = "" } = {}, suppressions = []) {
  const targetEmail = normalizeEmail(email);
  const targetDomain = normalizeDomain(domain || recipientDomain(targetEmail));

  return suppressions.find((item) => {
    const itemTenant = item.tenantId || "";
    if (itemTenant && tenantId && itemTenant !== tenantId) return false;
    if (item.email && normalizeEmail(item.email) === targetEmail) return true;
    if (item.domain && normalizeDomain(item.domain) === targetDomain) return true;
    return false;
  });
}

export function buildQueuePlan({
  leads = [],
  tenant = {},
  template,
  campaignId = "",
  suppressions = [],
  scheduledFor = "",
  status = "queued",
  senderEmail = "",
  senderName = "",
  includeContacted = false
} = {}) {
  const selectedTemplate = template || defaultOutreachTemplates[0];
  const items = [];
  const skipped = [];

  for (const lead of leads) {
    if (!lead.email) {
      skipped.push({ leadId: lead.id, businessName: lead.businessName || lead.business || "", reason: "missing_email" });
      continue;
    }

    const suppression = findSuppressionForLead(lead, suppressions);
    if (suppression) {
      skipped.push({
        leadId: lead.id,
        businessName: lead.businessName || lead.business || "",
        reason: "suppressed",
        suppressionReason: suppression.reason || ""
      });
      continue;
    }

    if (!includeContacted && isAlreadyContacted(lead)) {
      skipped.push({ leadId: lead.id, businessName: lead.businessName || lead.business || "", reason: "already_contacted" });
      continue;
    }

    const rendered = renderOutreachTemplate(selectedTemplate, { lead, tenant, senderName });
    items.push({
      leadId: lead.id,
      campaignId,
      templateId: selectedTemplate.id,
      tenantId: lead.tenantId || tenant.id || selectedTemplate.tenantId || "",
      status: status === "approved" ? "approved" : "queued",
      subject: rendered.subject,
      body: rendered.body,
      recipientEmail: normalizeEmail(lead.email),
      senderEmail: normalizeEmail(senderEmail),
      scheduledFor: scheduledFor || new Date().toISOString()
    });
  }

  return { items, skipped };
}

export function isAlreadyContacted(lead = {}) {
  return Boolean(lead.lastContactedAt) || ["contacted", "replied", "booked", "closed"].includes(lead.outreachStatus);
}

export function canSendQueueItem({ item, queue = [], campaign = {}, suppressions = [], now = new Date() } = {}) {
  if (!item?.recipientEmail) return { ok: false, reason: "missing_recipient_email" };
  if (!item?.senderEmail) return { ok: false, reason: "missing_sender_email" };
  if (!["approved", "queued"].includes(item.status)) return { ok: false, reason: `status_${item.status || "unknown"}` };

  const suppression = findSuppression(
    {
      email: item.recipientEmail,
      domain: recipientDomain(item.recipientEmail),
      tenantId: item.tenantId
    },
    suppressions
  );
  if (suppression) return { ok: false, reason: "suppressed", suppression };

  const dailyCap = Number(campaign.dailySendCap || 0);
  const perDomainCap = Number(campaign.perDomainDailyCap || 0);
  const dayKey = toDayKey(now);
  const sentToday = queue.filter((candidate) => {
    if (candidate.tenantId !== item.tenantId || candidate.status !== "sent" || !candidate.sentAt) return false;
    if (item.campaignId && candidate.campaignId !== item.campaignId) return false;
    return toDayKey(candidate.sentAt) === dayKey;
  });

  if (dailyCap > 0 && sentToday.length >= dailyCap) {
    return { ok: false, reason: "daily_cap_reached", dailyCap };
  }

  const targetDomain = recipientDomain(item.recipientEmail);
  const sentToDomainToday = sentToday.filter((candidate) => recipientDomain(candidate.recipientEmail) === targetDomain);
  if (perDomainCap > 0 && sentToDomainToday.length >= perDomainCap) {
    return { ok: false, reason: "per_domain_daily_cap_reached", perDomainDailyCap: perDomainCap };
  }

  return { ok: true, reason: "" };
}

export function suggestFollowUpDate(from = new Date(), businessDays = 3) {
  const date = new Date(from);
  let added = 0;
  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date.toISOString().slice(0, 10);
}

export function buildOutreachMetrics({ queue = [], events = [], leads = [] } = {}) {
  const byStatus = Object.fromEntries(outreachQueueStatuses.map((status) => [status, 0]));
  for (const item of queue) {
    byStatus[item.status] = (byStatus[item.status] || 0) + 1;
  }

  const sent = byStatus.sent || 0;
  const replied = byStatus.replied || events.filter((event) => event.type === "replied").length;
  const booked = byStatus.booked || events.filter((event) => event.type === "booked").length;

  return {
    totalQueued: byStatus.queued || 0,
    totalApproved: byStatus.approved || 0,
    totalSent: sent,
    totalFailed: byStatus.failed || 0,
    totalSuppressedSkipped: (byStatus.suppressed || 0) + (byStatus.skipped || 0),
    totalReplied: replied,
    totalBooked: booked,
    replyRate: sent ? Math.round((replied / sent) * 1000) / 10 : 0,
    bookedRate: sent ? Math.round((booked / sent) * 1000) / 10 : 0,
    sentBySource: countSentBy(queue, leads, "sourceType"),
    sentByCity: countSentBy(queue, leads, "city"),
    sentByCategory: countSentBy(queue, leads, "category"),
    byStatus
  };
}

function countSentBy(queue, leads, key) {
  const leadsById = new Map(leads.map((lead) => [lead.id, lead]));
  return queue
    .filter((item) => item.status === "sent")
    .reduce((counts, item) => {
      const lead = leadsById.get(item.leadId) || {};
      const value = lead[key] || "unknown";
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    }, {});
}

function toDayKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
