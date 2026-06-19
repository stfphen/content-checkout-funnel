import { aiMode, generateJson } from "../ai/claudeBackend.js";
import { normalizeTenantConfig } from "../defaultTenant.js";
import { validateTenantConfig } from "../tenantValidation.js";

const MODEL = "claude-opus-4-8";
const MAX_DOCUMENTS = 6;
const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024; // keep the request comfortably under the 32MB API limit

// Sections we ask the model to author. Everything else (media, routing,
// contractorSettings, checkout, defaults) is filled in by normalizeTenantConfig.
const TENANT_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    brand: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        eyebrow: { type: "string" },
        logoText: { type: "string" },
        tagline: { type: "string" },
        primaryColor: { type: "string", description: "Hex color, e.g. #0071e3" },
        accentColor: { type: "string", description: "Hex color, e.g. #050505" }
      },
      required: ["name", "eyebrow", "logoText", "tagline", "primaryColor", "accentColor"]
    },
    hero: {
      type: "object",
      additionalProperties: false,
      properties: {
        headline: { type: "string" },
        subheadline: { type: "string" },
        primaryCta: { type: "string" },
        secondaryCta: { type: "string" },
        stats: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              value: { type: "string" },
              label: { type: "string" }
            },
            required: ["value", "label"]
          }
        }
      },
      required: ["headline", "subheadline", "primaryCta", "secondaryCta", "stats"]
    },
    problem: {
      type: "object",
      additionalProperties: false,
      properties: {
        eyebrow: { type: "string" },
        headline: { type: "string" },
        points: { type: "array", items: { type: "string" } }
      },
      required: ["eyebrow", "headline", "points"]
    },
    system: {
      type: "object",
      additionalProperties: false,
      properties: {
        eyebrow: { type: "string" },
        headline: { type: "string" },
        body: { type: "string" },
        features: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              body: { type: "string" }
            },
            required: ["title", "body"]
          }
        }
      },
      required: ["eyebrow", "headline", "body", "features"]
    },
    process: {
      type: "object",
      additionalProperties: false,
      properties: {
        eyebrow: { type: "string" },
        headline: { type: "string" },
        steps: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              body: { type: "string" }
            },
            required: ["title", "body"]
          }
        }
      },
      required: ["eyebrow", "headline", "steps"]
    },
    output: {
      type: "object",
      additionalProperties: false,
      properties: {
        eyebrow: { type: "string" },
        headline: { type: "string" },
        body: { type: "string" },
        tiles: { type: "array", items: { type: "string" } }
      },
      required: ["eyebrow", "headline", "body", "tiles"]
    },
    packageSection: {
      type: "object",
      additionalProperties: false,
      properties: {
        eyebrow: { type: "string" },
        headline: { type: "string" },
        body: { type: "string" }
      },
      required: ["eyebrow", "headline", "body"]
    },
    packages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", description: "lowercase-dashed unique id, e.g. starter-package" },
          name: { type: "string" },
          summary: { type: "string" },
          price: { type: "string", description: "Display price, e.g. $1,500" },
          priceQualifier: { type: "string", description: "e.g. / month, one time" },
          priceDisplay: { type: "string" },
          action: { type: "string", enum: ["checkout", "booking", "capture"] },
          cta: { type: "string" },
          featured: { type: "boolean" },
          description: { type: "string" },
          features: { type: "array", items: { type: "string" } }
        },
        required: [
          "id",
          "name",
          "summary",
          "price",
          "priceQualifier",
          "priceDisplay",
          "action",
          "cta",
          "featured",
          "description",
          "features"
        ]
      }
    },
    enterprise: {
      type: "object",
      additionalProperties: false,
      properties: {
        eyebrow: { type: "string" },
        headline: { type: "string" },
        body: { type: "string" },
        cta: { type: "string" }
      },
      required: ["eyebrow", "headline", "body", "cta"]
    },
    faq: {
      type: "object",
      additionalProperties: false,
      properties: {
        eyebrow: { type: "string" },
        headline: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              question: { type: "string" },
              answer: { type: "string" }
            },
            required: ["question", "answer"]
          }
        }
      },
      required: ["eyebrow", "headline", "items"]
    },
    finalCta: {
      type: "object",
      additionalProperties: false,
      properties: {
        eyebrow: { type: "string" },
        headline: { type: "string" },
        body: { type: "string" },
        cta: { type: "string" }
      },
      required: ["eyebrow", "headline", "body", "cta"]
    },
    mobileCta: {
      type: "object",
      additionalProperties: false,
      properties: {
        primary: { type: "string" },
        secondary: { type: "string" }
      },
      required: ["primary", "secondary"]
    }
  },
  required: [
    "brand",
    "hero",
    "problem",
    "system",
    "process",
    "output",
    "packageSection",
    "packages",
    "enterprise",
    "faq",
    "finalCta",
    "mobileCta"
  ]
};

const SYSTEM_PROMPT = [
  "You build white-label B2B marketing and content funnel landing pages for a multi-tenant SaaS.",
  "Given a brief and any reference documents, produce a complete tenant configuration that fills every section: brand, hero, problem, system, process, output, package section, packages (with realistic pricing), enterprise, FAQ, final CTA, and mobile CTA.",
  "Write specific, persuasive, conversion-focused marketing copy grounded in the brief and documents. Where the brief is silent, invent reasonable, on-brand copy rather than leaving fields generic or empty.",
  "Reference documents may include existing HTML landing pages or JSON configs from prior drafts — when present, adapt their copy, sections, and pricing into the schema rather than starting from scratch.",
  "Always include between 2 and 4 packages. Each package needs a unique lowercase-dashed id and an action of checkout, booking, or capture. Use brand colors as valid hex (e.g. #0071e3); pick tasteful colors if none are given.",
  "Do not fabricate live domains, payment links, or booking links — those are configured separately by the operator."
].join("\n");

function slugify(value) {
  return (
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tenant"
  );
}

/**
 * Turn raw model output into a full, normalized tenant draft config plus any
 * validation warnings. Pure (no network) so it can be unit-tested directly.
 *
 * @param {object} args
 * @param {object} args.modelOutput  The sections the model authored.
 * @param {string} [args.brandName]
 * @param {string} [args.slug]
 * @returns {{config: object, warnings: string[]}}
 */
export function buildTenantConfigFromModelOutput({ modelOutput, brandName, slug } = {}) {
  const resolvedSlug = slugify(slug || brandName || modelOutput?.brand?.name);

  // Point defaultPackageId at a generated package (prefer a featured one);
  // otherwise normalizeTenantConfig keeps the built-in default that won't match.
  const packages = Array.isArray(modelOutput?.packages) ? modelOutput.packages : [];
  const featured = packages.find((pkg) => pkg?.featured && pkg?.id);
  const defaultPackageId = featured?.id || packages.find((pkg) => pkg?.id)?.id || "";

  const config = normalizeTenantConfig({
    ...modelOutput,
    id: `tenant_${resolvedSlug}`,
    slug: resolvedSlug,
    status: "draft",
    defaultPackageId,
    // Validation requires at least one non-empty domain. Seed a placeholder the
    // operator replaces with the real domain before publishing.
    domains: [`${resolvedSlug}.example.com`]
  });

  const warnings = [];
  const { ok, errors } = validateTenantConfig(config);
  if (!ok) {
    warnings.push(...errors.map((item) => `${item.path}: ${item.message}`));
  }
  warnings.push("Replace the placeholder domain with the real domain before publishing.");

  return { config, warnings, valid: ok };
}

// Build the text prompt: the brief plus any inlined text/HTML/JSON references.
// PDFs are NOT inlined here — they're passed to the backend as attachments
// (document blocks in API-key mode, temp-file Read in subscription mode).
function buildPromptText({ prompt, brandName, slug, documents }) {
  const lines = [
    "Build a tenant configuration from this brief.",
    brandName ? `Brand name: ${brandName}` : "",
    slug ? `Preferred slug: ${slug}` : "",
    "",
    "Brief:",
    String(prompt || "").trim() || "(no additional prompt provided)"
  ];
  for (const doc of documents) {
    if (doc.mediaType === "application/pdf") continue;
    const decoded = Buffer.from(doc.base64, "base64").toString("utf8");
    const label =
      doc.mediaType === "text/html"
        ? `Reference landing page (HTML) "${doc.name}" — adapt its copy, sections, and structure`
        : doc.mediaType === "application/json"
          ? `Reference config (JSON) "${doc.name}" — use as a starting point to build on`
          : `Reference document "${doc.name}"`;
    lines.push("", `${label}:`, decoded);
  }
  return lines.filter((line) => line !== null && line !== undefined).join("\n");
}

/**
 * Generate a tenant config draft from a prompt and optional reference documents.
 *
 * @param {object} input
 * @param {string} input.prompt        Free-text brief describing the funnel.
 * @param {string} [input.brandName]   Brand name hint.
 * @param {string} [input.slug]        Preferred slug (defaults to slugified brand name).
 * @param {Array<{name:string, mediaType:string, base64:string}>} [input.documents]
 * @returns {Promise<{config: object, warnings: string[]}>}
 */
export async function generateTenantConfig({ prompt, brandName, slug, documents = [] } = {}) {
  if (aiMode() === "off") {
    const error = new Error(
      "AI Tenant Builder is not configured. Set CLAUDE_CODE_OAUTH_TOKEN (Claude subscription) or ANTHROPIC_API_KEY."
    );
    error.name = "TenantBuilderNotConfigured";
    throw error;
  }

  if (!String(prompt || "").trim() && !documents.length) {
    const error = new Error("Provide a prompt or at least one reference document.");
    error.name = "TenantBuilderBadInput";
    throw error;
  }

  const safeDocuments = documents.slice(0, MAX_DOCUMENTS).filter((doc) => {
    const size = Buffer.byteLength(doc.base64 || "", "base64");
    return size > 0 && size <= MAX_DOCUMENT_BYTES;
  });
  const promptText = buildPromptText({ prompt, brandName, slug, documents: safeDocuments });
  const pdfDocuments = safeDocuments.filter((doc) => doc.mediaType === "application/pdf");

  const ask = async () => {
    let modelOutput;
    try {
      modelOutput = await generateJson({
        system: SYSTEM_PROMPT,
        prompt: promptText,
        schema: TENANT_OUTPUT_SCHEMA,
        documents: pdfDocuments,
        model: MODEL
      });
    } catch (error) {
      if (error?.name === "AiRefused") {
        const refusal = new Error("The model declined to generate this tenant configuration.");
        refusal.name = "TenantBuilderRefused";
        throw refusal;
      }
      throw error;
    }
    return buildTenantConfigFromModelOutput({ modelOutput, brandName, slug });
  };

  // Subscription mode has no hard schema guarantee; one corrective retry if the
  // first result fails tenant validation.
  let result = await ask();
  if (!result.valid) {
    const retry = await ask();
    if (retry.valid) result = retry;
  }
  return result;
}
