"use client";

import Reveal from "../../motion/Reveal";
import { Stagger, StaggerItem } from "../../motion/Stagger";
import styles from "../Agency.module.css";

// The operating system behind every engagement: a numbered vertical rail from
// lead pipeline to funding engine. Numbers are the design here (mono
// numerals, command-center precedent), so this section deliberately reads
// differently from the card grids around it.
export default function GrowthPlatform({ tenant }) {
  const platform = tenant?.agency?.platform;
  const steps = platform?.steps || [];
  if (!steps.length) return null;

  return (
    <section className={styles.sectionAlt} id="platform">
      <div className={styles.container}>
        <Reveal className={styles.sectionHead}>
          <h2 className={styles.h2}>{platform.headline || "The Growth Platform."}</h2>
          {platform.body && <p className={styles.sectionBody}>{platform.body}</p>}
        </Reveal>

        <Stagger className={styles.railList} stagger={0.06} amount={0.1}>
          {steps.map((step, index) => (
            <StaggerItem key={step.title} as="div" className={styles.railRow}>
              <span className={styles.railIndex}>{String(index + 1).padStart(2, "0")}</span>
              <div className={styles.railBody}>
                <h3 className={styles.railTitle}>{step.title}</h3>
                {step.body && <p className={styles.railText}>{step.body}</p>}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
