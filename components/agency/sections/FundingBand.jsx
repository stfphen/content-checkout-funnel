"use client";

import { ArrowUpRight } from "lucide-react";
import Reveal from "../../motion/Reveal";
import AgencyLeadForm from "../AgencyLeadForm";
import styles from "../Agency.module.css";

// Full-width funding cross-sell band. Compliance framing mirrors the Funded
// Growth Studio config verbatim: the disclaimer always renders when present,
// and the copy never promises eligibility or approval.
export default function FundingBand({ tenant }) {
  const funding = tenant?.agency?.funding;
  if (!funding) return null;

  return (
    <section className={styles.fundingBand} id="funding">
      <div className={styles.container}>
        <Reveal className={styles.fundingInner}>
          <div className={styles.fundingCopy}>
            {funding.eyebrow && <span className={styles.eyebrow}>{funding.eyebrow}</span>}
            <h2 className={styles.h2}>
              {funding.headline || "Could funding help pay for your next growth project?"}
            </h2>
            {funding.body && <p className={styles.sectionBody}>{funding.body}</p>}
            {funding.link && (
              <a className={styles.fundingLink} href={funding.link}>
                {funding.linkLabel || "Visit the Funded Growth Studio"}
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            )}
          </div>
          <div className={styles.fundingForm}>
            <AgencyLeadForm
              layout="stack"
              tenant={tenant}
              submitLabel={funding.form?.submitCta || funding.cta || "Check funding fit"}
              successMessage="Received. The team will follow up with the free Funding Fit Scan."
              fields={[
                { name: "name", label: "Name", type: "text", required: true, placeholder: "Your name" },
                { name: "email", label: "Email", type: "email", required: true, placeholder: "you@business.com" }
              ]}
              mapPayload={(values) => ({
                name: values.name,
                email: values.email,
                category: "funding-interest",
                packageId: "funding-fit-scan"
              })}
            />
            {funding.disclaimer && <p className={styles.fundingFine}>{funding.disclaimer}</p>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
