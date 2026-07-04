"use client";

import { motion, useReducedMotion } from "framer-motion";
import styles from "../Agency.module.css";

// Full-bleed cinematic hero: dimmed production still underneath, the DGTL
// wordmark (brand SVG) anchored bottom-left, headline + CTAs beside it, and
// the verified track-record stats as a bordered band along the bottom edge.
export default function AgencyHero({ tenant }) {
  const reduceMotion = useReducedMotion();
  const brand = tenant?.brand || {};
  const hero = tenant?.hero || {};
  const stats = hero.stats || [];

  const entrance = (delay) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }
        };

  return (
    <header className={styles.hero}>
      {tenant?.media?.heroImage && (
        <img
          className={styles.heroPoster}
          src={tenant.media.heroImage}
          alt={tenant?.media?.heroAlt || ""}
        />
      )}
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroContent}>
        {brand.logo ? (
          <motion.img
            className={styles.heroWordmark}
            src={brand.logo}
            alt={brand.name || "DGTL Group"}
            {...entrance(0)}
          />
        ) : (
          <motion.h1 className={styles.heroWordmarkText} {...entrance(0)}>
            {brand.logoText || brand.name || "DGTL"}
          </motion.h1>
        )}
        {hero.headline && (
          <motion.p className={styles.heroTagline} {...entrance(0.12)}>
            {hero.headline}
          </motion.p>
        )}
        {hero.subheadline && (
          <motion.p className={styles.heroSub} {...entrance(0.18)}>
            {hero.subheadline}
          </motion.p>
        )}
        <motion.div className={styles.heroActions} {...entrance(0.26)}>
          <a className={styles.btnPrimary} href="#start">
            {hero.primaryCta || "Start a project"}
          </a>
          <a className={styles.btnGhost} href="#offers">
            {hero.secondaryCta || "See the offers"}
          </a>
        </motion.div>
      </div>
      {stats.length > 0 && (
        <motion.div className={styles.heroStats} {...entrance(0.36)}>
          <div className={styles.heroStatsInner}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </header>
  );
}
