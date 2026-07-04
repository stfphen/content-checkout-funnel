"use client";

import Reveal from "../../motion/Reveal";
import { Stagger, StaggerItem } from "../../motion/Stagger";
import styles from "../Interiors.module.css";

// The $200-to-$50K ladder. The paid entry offer gets the large featured card
// (its CTA keeps the real checkout intent); the five higher rungs render as
// compact rows that route into the booking form as project inquiries. Cards
// never carry their own form: one CTA label per intent, page-wide.
export default function OfferLadder({ tenant, onSelect }) {
  const packages = tenant?.packages || [];
  const ladder = tenant?.interiors?.ladder || {};
  const booking = tenant?.interiors?.booking || {};
  const entry =
    packages.find((pack) => pack.id === tenant?.defaultPackageId) ||
    packages.find((pack) => pack.featured) ||
    packages[0];
  const rungs = packages.filter((pack) => pack.id !== entry?.id);
  const consultationCta = booking.consultationCta || "Book Your Paint Consultation";
  const inquiryCta = booking.inquiryCta || "Start a Project Inquiry";

  if (!packages.length) return null;

  return (
    <section className={styles.section} id="packages">
      <div className={styles.container}>
        <Reveal className={styles.sectionHead}>
          {ladder.eyebrow && <p className={styles.eyebrow}>{ladder.eyebrow}</p>}
          <h2 className={styles.h2}>{ladder.headline || "Start with one colour."}</h2>
          {ladder.body && <p className={styles.sectionBody}>{ladder.body}</p>}
        </Reveal>

        <div className={styles.ladderGrid}>
          {entry && (
            <Reveal as="article" className={styles.entryCard} amount={0.15}>
              <div>
                <div className={styles.entryPrice}>{entry.price}</div>
                {entry.priceQualifier && (
                  <div className={styles.entryQualifier}>{entry.priceQualifier}</div>
                )}
              </div>
              <h3 className={styles.entryName}>{entry.name}</h3>
              {entry.summary && <p className={styles.entrySummary}>{entry.summary}</p>}
              <ul className={styles.entryFeatures}>
                {(entry.features || []).slice(0, 4).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => onSelect?.(entry.id, "consultation")}
              >
                {consultationCta}
              </button>
            </Reveal>
          )}

          <Stagger className={styles.rungList} amount={0.1}>
            {rungs.map((pack) => (
              <StaggerItem as="article" key={pack.id} className={styles.rungCard}>
                <h3 className={styles.rungName}>{pack.name}</h3>
                <span className={styles.rungPrice}>{pack.priceDisplay || pack.price}</span>
                {pack.summary && <p className={styles.rungSummary}>{pack.summary}</p>}
                <button
                  type="button"
                  className={styles.rungAction}
                  onClick={() => onSelect?.(pack.id, "inquiry")}
                >
                  {inquiryCta}
                </button>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        {ladder.footnote && <p className={styles.ladderFootnote}>{ladder.footnote}</p>}
      </div>
    </section>
  );
}
