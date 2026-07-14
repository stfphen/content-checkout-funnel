"use client";

import { useState } from "react";
import styles from "./Interiors.module.css";

/**
 * Shared lead form for the interiors template. Two submission paths, keyed by
 * the `intent` prop:
 *
 *  - intent "consultation" posts to /api/checkout: the server resolves the
 *    package price from the tenant config (never from the client), captures
 *    the lead first, then either redirects to Stripe (`url`/`redirect`) or
 *    falls back to plain capture (`captured` + reason) when Stripe is not
 *    configured. Mirrors FunnelPage's checkout branch.
 *  - intent "inquiry" posts to /api/leads like the other bespoke templates.
 *
 * Either way, tagging rides only on fields that survive
 * sanitizePublicLeadInput (category, packageId, notes, city, contact fields).
 * teamId and price are never sent; the server derives both.
 */
export default function InteriorsLeadForm({
  fields,
  submitLabel,
  successMessage,
  capturedMessage,
  tenant,
  intent = "inquiry",
  mapPayload,
  defaultValues = {}
}) {
  const [status, setStatus] = useState("idle");
  const [note, setNote] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === "sending") return;
    const formEl = event.currentTarget;
    const values = Object.fromEntries(new FormData(formEl).entries());

    setStatus("sending");
    setNote("");
    try {
      const payload = {
        tenantId: tenant?.id,
        tenantSlug: tenant?.slug,
        source: window.location.href,
        ...mapPayload(values)
      };
      const endpoint = intent === "consultation" ? "/api/checkout" : "/api/leads";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("lead-failed");
      const json = await response.json().catch(() => ({}));

      // Stripe (or a direct Payment Link) takes over when configured.
      const nextUrl = json.url || json.redirect;
      if (intent === "consultation" && nextUrl) {
        window.location.assign(nextUrl);
        return;
      }

      setStatus("ok");
      setNote(
        intent === "consultation" && json.captured
          ? capturedMessage || successMessage
          : successMessage
      );
      formEl.reset();
    } catch {
      setStatus("error");
      const email = tenant?.contact?.email;
      setNote(
        email
          ? `That didn't go through. Try again, or email us at ${email}.`
          : "That didn't go through. Please try again."
      );
    }
  }

  function renderField(field) {
    const { name, label, type = "text", required, placeholder, options, span } = field;
    const id = `in-${name}-${label.replace(/\s+/g, "-").toLowerCase()}`;
    const common = { id, name, required, placeholder, className: styles.input };
    return (
      <div key={name} className={`${styles.field} ${span ? styles.fieldSpan : ""}`}>
        <label className={styles.label} htmlFor={id}>
          {label}
          {!required && " (optional)"}
        </label>
        {type === "select" ? (
          <select {...common} defaultValue={defaultValues[name] ?? options?.[0]?.value}>
            {(options || []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea {...common} rows={3} defaultValue={defaultValues[name] ?? ""} />
        ) : (
          <input {...common} type={type} defaultValue={defaultValues[name] ?? ""} />
        )}
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {fields.map(renderField)}
      <button type="submit" className={styles.formSubmit} disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : submitLabel}
      </button>
      {note && (
        <p
          className={`${styles.formNote} ${status === "error" ? styles.formNoteError : ""}`}
          role="status"
        >
          {note}
        </p>
      )}
    </form>
  );
}
