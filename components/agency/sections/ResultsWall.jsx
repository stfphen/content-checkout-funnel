"use client";

import Reveal from "../../motion/Reveal";
import { Stagger, StaggerItem } from "../../motion/Stagger";
import styles from "../Agency.module.css";

// Selected work as typography: artist and brand names render as text rows
// (no logo images, nothing invented), with the quantified case studies as
// metric tiles. Every name and number is verified on dgtlgroup.io or in
// sibling tenant configs.
export default function ResultsWall({ tenant }) {
  const results = tenant?.agency?.results;
  if (!results) return null;

  const artists = results.artists || [];
  const brands = results.brands || [];
  const caseStudies = results.caseStudies || [];

  return (
    <section className={styles.sectionAlt} id="work">
      <div className={styles.container}>
        <Reveal className={styles.sectionHead}>
          <h2 className={styles.h2}>{results.headline || "Selected work and results."}</h2>
          {results.body && <p className={styles.sectionBody}>{results.body}</p>}
        </Reveal>

        {(artists.length > 0 || brands.length > 0) && (
          <Reveal className={styles.rosterRows} delay={0.05}>
            {artists.length > 0 && (
              <div className={styles.rosterRow}>
                <span className={styles.rosterKicker}>Artists</span>
                <div className={styles.rosterNames}>
                  {artists.map((name) => (
                    <span key={name} className={styles.rosterName}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {brands.length > 0 && (
              <div className={styles.rosterRow}>
                <span className={styles.rosterKicker}>Brands</span>
                <div className={styles.rosterNames}>
                  {brands.map((name) => (
                    <span key={name} className={styles.rosterName}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Reveal>
        )}

        {caseStudies.length > 0 && (
          <Stagger className={styles.caseGrid} stagger={0.08}>
            {caseStudies.map((cs) => (
              <StaggerItem key={cs.name} as="article" className={styles.caseCard}>
                <h3 className={styles.caseName}>{cs.name}</h3>
                {cs.blurb && <p className={styles.caseBlurb}>{cs.blurb}</p>}
                <div className={styles.caseMetrics}>
                  {(cs.metrics || []).map((metric) => (
                    <div key={metric.label} className={styles.stat}>
                      <div className={styles.statValue}>{metric.value}</div>
                      <div className={styles.statLabel}>{metric.label}</div>
                    </div>
                  ))}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}
