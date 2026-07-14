"use client";

import Reveal from "../../motion/Reveal";
import { Stagger, StaggerItem } from "../../motion/Stagger";
import styles from "../Interiors.module.css";

// Four-step process, read straight from the tenant's canonical process copy.
export default function DesignProcess({ tenant }) {
  const process = tenant?.process || {};
  const intro = tenant?.interiors?.processIntro || {};
  const steps = process.steps || [];

  if (!steps.length) return null;

  return (
    <section className={styles.section} id="process">
      <div className={styles.container}>
        <Reveal className={styles.sectionHead}>
          <h2 className={styles.h2}>{intro.headline || process.headline || "How it works."}</h2>
          {intro.body && <p className={styles.sectionBody}>{intro.body}</p>}
        </Reveal>
        <Stagger className={styles.processGrid} amount={0.15}>
          {steps.map((step, index) => (
            <StaggerItem as="article" key={step.title} className={styles.processStep}>
              <span className={styles.processNum}>{String(index + 1).padStart(2, "0")}</span>
              <h3 className={styles.processTitle}>{step.title}</h3>
              <p className={styles.processBody}>{step.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
