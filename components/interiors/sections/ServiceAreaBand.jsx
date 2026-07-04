"use client";

import Reveal from "../../motion/Reveal";
import styles from "../Interiors.module.css";

// Where the studio works: the tenant's canonical service areas rendered as a
// blush-tinted band. Reads contractorSettings.serviceAreas so the list stays
// the single source of truth.
export default function ServiceAreaBand({ tenant }) {
  const areas = tenant?.contractorSettings?.serviceAreas || [];
  const copy = tenant?.interiors?.serviceArea || {};

  if (!areas.length) return null;

  return (
    <section className={styles.areaBand} id="areas">
      <div className={styles.container}>
        <div className={styles.areaInner}>
          <Reveal>
            <h2 className={styles.areaTitle}>{copy.headline || "Where we work."}</h2>
            {copy.note && <p className={styles.areaNote}>{copy.note}</p>}
          </Reveal>
          <Reveal as="ul" className={styles.areaList} delay={0.08}>
            {areas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
