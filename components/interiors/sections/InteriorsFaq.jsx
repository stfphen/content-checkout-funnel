"use client";

import Reveal from "../../motion/Reveal";
import styles from "../Interiors.module.css";

// FAQ accordion over the tenant's canonical faq items. Native details/summary:
// keyboard accessible with zero JS state.
export default function InteriorsFaq({ tenant }) {
  const faq = tenant?.faq || {};
  const items = faq.items || [];

  if (!items.length) return null;

  return (
    <section className={styles.section} id="faq">
      <div className={styles.container}>
        <Reveal className={styles.sectionHead}>
          <h2 className={styles.h2}>{faq.headline || "Questions, answered."}</h2>
        </Reveal>
        <Reveal className={styles.faqList} amount={0.1}>
          {items.map((item) => (
            <details className={styles.faqItem} key={item.question}>
              <summary className={styles.faqQuestion}>{item.question}</summary>
              <p className={styles.faqAnswer}>{item.answer}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
