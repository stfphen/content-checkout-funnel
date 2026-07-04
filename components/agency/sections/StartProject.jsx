"use client";

import Reveal from "../../motion/Reveal";
import AgencyLeadForm from "../AgencyLeadForm";
import styles from "../Agency.module.css";

// The main conversion form. The package select is preseeded from the offer
// ladder (selectedPackageId is lifted to AgencyPage); the key prop remounts
// the form so a new selection lands in the select's defaultValue.
export default function StartProject({ tenant, selectedPackageId }) {
  const start = tenant?.agency?.start || {};
  const checkout = tenant?.checkout || {};
  const packages = tenant?.packages || [];
  if (!packages.length) return null;

  return (
    <section className={styles.section} id="start">
      <div className={styles.container}>
        <div className={styles.startPanel}>
          <Reveal className={styles.sectionHead}>
            <h2 className={styles.h2}>{start.headline || checkout.headline || "Start a project."}</h2>
            {(start.body || checkout.body) && (
              <p className={styles.sectionBody}>{start.body || checkout.body}</p>
            )}
          </Reveal>
          <Reveal delay={0.06}>
            <AgencyLeadForm
              key={selectedPackageId}
              layout="grid"
              tenant={tenant}
              submitLabel={checkout.submitCta || "Start a project"}
              successMessage="Received. The team will come back with scope, timeline, and price."
              defaultValues={{ package: selectedPackageId }}
              fields={[
                {
                  name: "package",
                  label: "Offer",
                  type: "select",
                  required: true,
                  options: packages.map((pack) => ({ value: pack.id, label: pack.name }))
                },
                { name: "name", label: "Name", type: "text", required: true, placeholder: "Your name" },
                { name: "email", label: "Email", type: "email", required: true, placeholder: "you@business.com" },
                { name: "businessName", label: "Business", type: "text", placeholder: "Business or brand" },
                {
                  name: "website",
                  label: "Website or social",
                  type: "url",
                  span: true,
                  placeholder: "https://"
                },
                {
                  name: "notes",
                  label: "What are you building?",
                  type: "textarea",
                  span: true,
                  placeholder: "A few lines on the project, audience, and timeline."
                }
              ]}
              mapPayload={(values) => ({
                name: values.name,
                email: values.email,
                businessName: values.businessName,
                website: values.website,
                category: "project-inquiry",
                packageId: values.package,
                notes: values.notes
              })}
            />
            {checkout.disclaimer && <p className={styles.startFine}>{checkout.disclaimer}</p>}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
