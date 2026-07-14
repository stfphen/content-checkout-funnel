"use client";

import Reveal from "../../motion/Reveal";
import styles from "../Interiors.module.css";

// Full-bleed photographic hero when a real photo is configured; a warm
// typographic composition otherwise (no stock or generated imagery, ever).
// Primary CTA routes into the single booking form with the paid entry offer
// pre-selected; the secondary CTA jumps to the project gallery.
export default function InteriorsHero({ tenant, onSelect, hasGallery }) {
  const hero = tenant?.interiors?.hero || {};
  const hasImage = Boolean(hero.image);
  const primaryLabel = hero.primaryCta?.label || "Book Your Paint Consultation";
  const primaryPackage =
    hero.primaryCta?.packageId || tenant?.defaultPackageId || "";
  // Suppress the gallery CTA while the gallery has no media (dead anchor).
  const secondary =
    hero.secondaryCta?.target === "#gallery" && !hasGallery ? null : hero.secondaryCta;

  return (
    <header className={hasImage ? styles.hero : styles.heroPlain} id="home">
      {hasImage && (
        <div className={styles.heroMedia} aria-hidden="true">
          <img src={hero.image} alt="" fetchPriority="high" />
          <div className={styles.heroScrim} />
        </div>
      )}
      <div className={styles.heroContent}>
        <Reveal as="h1" className={styles.heroTitle} y={18}>
          {hero.headline || tenant?.brand?.tagline || ""}
        </Reveal>
        {hero.subheadline && (
          <Reveal as="p" className={styles.heroSub} delay={0.08} y={18}>
            {hero.subheadline}
          </Reveal>
        )}
        <Reveal className={styles.heroActions} delay={0.16} y={18}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => onSelect?.(primaryPackage, "consultation")}
          >
            {primaryLabel}
          </button>
          {secondary?.label && (
            <a className={styles.btnGhost} href={secondary.target || "#gallery"}>
              {secondary.label}
            </a>
          )}
        </Reveal>
      </div>
    </header>
  );
}
