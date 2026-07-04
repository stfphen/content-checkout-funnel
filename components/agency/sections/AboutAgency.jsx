"use client";

import Reveal from "../../motion/Reveal";
import styles from "../Agency.module.css";

// Studio story: split layout with the narrative on the left and the
// locations + since-2022 facts on the right. No founder name renders here by
// policy (public and internal sources disagree; pending team confirmation).
export default function AboutAgency({ tenant }) {
  const about = tenant?.agency?.about;
  if (!about) return null;

  const paragraphs = about.paragraphs || [];
  const locations = about.locations || [];
  const stats = about.stats || [];

  return (
    <section className={styles.section} id="about">
      <div className={styles.container}>
        <div className={styles.aboutGrid}>
          <Reveal className={styles.aboutCopy}>
            <h2 className={styles.h2}>{about.headline || "About DGTL."}</h2>
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className={styles.aboutParagraph}>
                {paragraph}
              </p>
            ))}
          </Reveal>
          <Reveal className={styles.aboutFacts} delay={0.08}>
            {locations.length > 0 && (
              <div className={styles.aboutLocations}>
                {locations.map((location) => (
                  <span key={location} className={styles.aboutLocation}>
                    {location}
                  </span>
                ))}
              </div>
            )}
            {stats.length > 0 && (
              <div className={styles.aboutStats}>
                {stats.map((stat) => (
                  <div key={stat.label} className={styles.stat}>
                    <div className={styles.statValue}>{stat.value}</div>
                    <div className={styles.statLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
