"use client";

import { ArrowUpRight } from "lucide-react";
import Reveal from "../../motion/Reveal";
import { Stagger, StaggerItem } from "../../motion/Stagger";
import AgencyLeadForm from "../AgencyLeadForm";
import styles from "../Agency.module.css";

// The white-label roster: live brands DGTL operates end to end, each linking
// to its live tenant page, with a compact whitelabel-inquiry form under the
// grid. The weightiest proof section on the page.
export default function BrandFunnels({ tenant }) {
  const funnels = tenant?.agency?.funnels;
  const items = funnels?.items || [];
  if (!items.length) return null;

  const cta = funnels.cta || {};

  return (
    <section className={styles.section} id="funnels">
      <div className={styles.container}>
        <Reveal className={styles.sectionHead}>
          {funnels.eyebrow && <span className={styles.eyebrow}>{funnels.eyebrow}</span>}
          <h2 className={styles.h2}>{funnels.headline || "Brand funnels we run."}</h2>
          {funnels.body && <p className={styles.sectionBody}>{funnels.body}</p>}
        </Reveal>

        <Stagger className={styles.funnelGrid} stagger={0.09}>
          {items.map((item, index) => (
            <StaggerItem
              key={item.name}
              as="article"
              className={`${styles.funnelCard} ${index === 0 ? styles.funnelCardLead : ""}`}
            >
              <div className={styles.funnelTag}>{item.tag}</div>
              <h3 className={styles.funnelName}>{item.name}</h3>
              {item.blurb && <p className={styles.funnelBlurb}>{item.blurb}</p>}
              <div className={styles.funnelFoot}>
                {item.ladder && <span className={styles.funnelLadder}>{item.ladder}</span>}
                {item.href && (
                  <a className={styles.funnelLink} href={item.href}>
                    See it live
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                )}
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className={styles.funnelInquiry} id="whitelabel">
          <div className={styles.funnelInquiryCopy}>
            <h3 className={styles.h3}>{cta.headline || "Want this for your brand?"}</h3>
            {cta.body && <p className={styles.sectionBody}>{cta.body}</p>}
          </div>
          <AgencyLeadForm
            layout="inline"
            tenant={tenant}
            submitLabel={funnels.form?.submitCta || cta.label || "Run your brand on our stack"}
            successMessage="Received. The team will follow up on scope and fit."
            fields={[
              { name: "name", label: "Name", type: "text", required: true, placeholder: "Your name" },
              { name: "email", label: "Email", type: "email", required: true, placeholder: "you@brand.com" },
              { name: "businessName", label: "Brand", type: "text", placeholder: "Brand or company" },
              { name: "notes", label: "Notes", type: "text", placeholder: "What are you selling?" }
            ]}
            mapPayload={(values) => ({
              name: values.name,
              email: values.email,
              businessName: values.businessName,
              category: "whitelabel-inquiry",
              notes: values.notes
            })}
          />
        </Reveal>
      </div>
    </section>
  );
}
