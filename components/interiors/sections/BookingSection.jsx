"use client";

import { useEffect, useState } from "react";
import Reveal from "../../motion/Reveal";
import InteriorsLeadForm from "../InteriorsLeadForm";
import styles from "../Interiors.module.css";

// The single form on the page. Every CTA (nav, hero, entry card, ladder rungs)
// lands here with a package and an intent pre-selected:
//  - consultation: the paid entry offer, category "consultation-booking",
//    submitted through /api/checkout so real Stripe checkout keeps working.
//  - inquiry: the higher rungs, category "project-inquiry", through /api/leads.
export default function BookingSection({ tenant, selection }) {
  const booking = tenant?.interiors?.booking || {};
  const contact = tenant?.contact || {};
  const packages = tenant?.packages || [];
  const entryId = tenant?.defaultPackageId || packages[0]?.id || "";
  const [intent, setIntent] = useState(selection?.intent || "consultation");
  const [packageId, setPackageId] = useState(selection?.packageId || entryId);

  // CTA clicks elsewhere on the page re-target the form.
  useEffect(() => {
    if (!selection) return;
    setIntent(selection.intent || "consultation");
    setPackageId(selection.packageId || entryId);
  }, [selection, entryId]);

  const entry = packages.find((pack) => pack.id === entryId);
  const inquiryPackages = packages.filter((pack) => pack.id !== entryId);
  const consultationCta = booking.consultationCta || "Book Your Paint Consultation";
  const inquiryCta = booking.inquiryCta || "Start a Project Inquiry";
  const isConsultation = intent === "consultation";

  const packageOptions = [
    ...inquiryPackages.map((pack) => ({ value: pack.id, label: pack.name })),
    { value: "not-sure", label: "Not sure yet" }
  ];

  const sharedFields = [
    { name: "name", label: "Name", type: "text", required: true, placeholder: "Your name" },
    { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
    { name: "phone", label: "Phone", type: "tel", placeholder: "+1" },
    { name: "city", label: "City or neighbourhood", type: "text", placeholder: "Toronto" }
  ];

  return (
    <section className={styles.section} id="book">
      <div className={styles.container}>
        <div className={styles.bookGrid}>
          <Reveal className={styles.bookAside}>
            {booking.eyebrow && <p className={styles.eyebrow}>{booking.eyebrow}</p>}
            <h2 className={styles.h2}>{booking.headline || "Tell us about your space."}</h2>
            {booking.body && <p className={styles.sectionBody}>{booking.body}</p>}
            <div className={styles.bookContact}>
              {contact.leadName && (
                <span className={styles.bookContactName}>{contact.leadName}</span>
              )}
              {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
              {contact.phone && <a href={`tel:${contact.phone}`}>{contact.phone}</a>}
            </div>
          </Reveal>

          <Reveal className={styles.bookPanel} amount={0.15}>
            <div className={styles.intentSwitch} role="tablist" aria-label="What do you need?">
              <button
                type="button"
                role="tab"
                aria-selected={isConsultation}
                className={`${styles.intentBtn} ${isConsultation ? styles.intentBtnActive : ""}`}
                onClick={() => setIntent("consultation")}
              >
                {entry?.name || "Paint consultation"}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isConsultation}
                className={`${styles.intentBtn} ${!isConsultation ? styles.intentBtnActive : ""}`}
                onClick={() => setIntent("inquiry")}
              >
                Larger project
              </button>
            </div>

            {isConsultation ? (
              <>
                {booking.consultationNote && (
                  <p className={styles.intentNote}>{booking.consultationNote}</p>
                )}
                <InteriorsLeadForm
                  key={`consultation-${packageId}`}
                  tenant={tenant}
                  intent="consultation"
                  submitLabel={consultationCta}
                  successMessage={booking.successMessage || "Received. We will be in touch shortly."}
                  capturedMessage={booking.checkoutCapturedMessage}
                  fields={[
                    ...sharedFields,
                    {
                      name: "notes",
                      label: "The room and the feeling you want",
                      type: "textarea",
                      span: true,
                      placeholder:
                        "Which room or feature, how many colours you need, and your timeline."
                    }
                  ]}
                  mapPayload={(values) => ({
                    name: values.name,
                    email: values.email,
                    phone: values.phone,
                    city: values.city,
                    notes: values.notes,
                    category: "consultation-booking",
                    packageId: entryId
                  })}
                />
              </>
            ) : (
              <>
                {booking.inquiryNote && (
                  <p className={styles.intentNote}>{booking.inquiryNote}</p>
                )}
                <InteriorsLeadForm
                  key={`inquiry-${packageId}`}
                  tenant={tenant}
                  intent="inquiry"
                  submitLabel={inquiryCta}
                  successMessage={booking.successMessage || "Received. We will be in touch shortly."}
                  defaultValues={{
                    package: inquiryPackages.some((pack) => pack.id === packageId)
                      ? packageId
                      : "not-sure"
                  }}
                  fields={[
                    {
                      name: "package",
                      label: "Where do you want to start?",
                      type: "select",
                      required: true,
                      span: true,
                      options: packageOptions
                    },
                    ...sharedFields,
                    {
                      name: "notes",
                      label: "About your project",
                      type: "textarea",
                      span: true,
                      placeholder: "The spaces involved, your timeline, and your budget comfort zone."
                    }
                  ]}
                  mapPayload={(values) => ({
                    name: values.name,
                    email: values.email,
                    phone: values.phone,
                    city: values.city,
                    notes: values.notes,
                    category: "project-inquiry",
                    ...(values.package && values.package !== "not-sure"
                      ? { packageId: values.package }
                      : {})
                  })}
                />
              </>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
