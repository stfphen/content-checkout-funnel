"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./InfluenceJournal.module.css";

// The "influence-journal" tenant template (components/templates/registry.js).
// Dark DGTL-brand look scoped entirely to the module stylesheet, driven by
// the tenant's `influenceJournal` content block (lib/tenants/dgtlInfluence.js)
// so publishing/growing the creator roster is a data change, not a markup
// change — same contract as AgencyPage's `agency` block.
export default function InfluenceJournalPage({ tenant }) {
  const brand = tenant?.brand || {};
  const ij = tenant?.influenceJournal || {};
  const hero = ij.hero || {};
  const statement = ij.statement || {};
  const creators = ij.creators || {};
  const process = ij.process || {};
  const tiein = ij.tiein || {};
  const footer = ij.footer || {};

  const sentinelRef = useRef(null);
  const [navSolid, setNavSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setNavSolid(!entry.isIntersecting);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll(`.${styles.reveal}`);
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach((el) => el.classList.add(styles.revealIn));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealIn);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const themeVars = {
    "--ij-accent": brand.primaryColor || "#F0CF50",
    "--ij-ink": brand.accentColor || "#000000"
  };

  return (
    <div className={styles.page} style={themeVars} data-tenant={tenant?.slug}>
      <div ref={sentinelRef} style={{ position: "absolute", top: 0, height: 1, width: 1 }} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />

      <nav className={`${styles.nav} ${navSolid ? styles.navSolid : ""}`}>
        <div className={styles.navInner}>
          <a className={styles.navBrand} href="#top" aria-label={brand.name || "DGTL Influence Journal"}>
            {brand.logo ? <img className={styles.navLogo} src={brand.logo} alt="DGTL" /> : null}
            <span>
              Influence <span className={styles.gold}>Journal</span>
            </span>
          </a>
          <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ""}`}>
            <a href="#creators" onClick={() => setMenuOpen(false)}>
              Creators
            </a>
            <a href="#how" onClick={() => setMenuOpen(false)}>
              How It Works
            </a>
            <a href="https://creators.dgtlinfluence.com" onClick={() => setMenuOpen(false)}>
              Directory
            </a>
            <a href="https://dgtlgroup.io" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>
              DGTL Group ↗
            </a>
            <a className={styles.navCta} href="#pitch" onClick={() => setMenuOpen(false)}>
              Get Featured →
            </a>
          </div>
          <button
            className={styles.navToggle}
            aria-label="Menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰
          </button>
        </div>
      </nav>

      <header id="top" className={styles.hero}>
        <div className={styles.wrap}>
          <span className={styles.eyebrow}>{hero.eyebrow || "A DGTL Group Publication"}</span>
          <h1>
            {hero.headline || "The stories behind the"}{" "}
            <span className={styles.gold}>{hero.headlineAccent || "creators"}</span>{" "}
            {hero.headlineSuffix || "people follow."}
          </h1>
          <p className={styles.heroSub}>{hero.subhead}</p>
          <div className={styles.heroCtas}>
            {hero.primaryCta ? (
              <a className={styles.btnPrimary} href={hero.primaryCta.href}>
                {hero.primaryCta.label} →
              </a>
            ) : null}
            {hero.secondaryCta ? (
              <a className={styles.btnSecondary} href={hero.secondaryCta.href}>
                {hero.secondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>
      </header>

      {statement.text ? (
        <section className={`${styles.statement} ${styles.reveal}`}>
          <div className={styles.wrap}>
            <p>
              {statement.text} <span className={styles.gold}>{statement.accent}</span>
            </p>
          </div>
        </section>
      ) : null}

      <section className={styles.section} id="creators">
        <div className={styles.wrap}>
          <div className={`${styles.sectionHead} ${styles.reveal}`}>
            <span className={styles.eyebrow}>{creators.eyebrow || "Featured"}</span>
            <h2>{creators.headline || "Creators in the Journal"}</h2>
            <p>{creators.body}</p>
          </div>
          <div className={styles.grid}>
            {(creators.items || []).map((creator) => (
              <div className={`${styles.card} ${styles.reveal}`} key={creator.slug}>
                <div
                  className={styles.cardMedia}
                  style={
                    creator.media
                      ? { backgroundImage: `url(${creator.media})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : undefined
                  }
                >
                  {creator.media ? null : "Feature in production"}
                </div>
                <div className={styles.cardKicker}>Creator Feature</div>
                <h3>{creator.name}</h3>
                <p>{creator.blurb}</p>
                {creator.status === "live" && creator.href ? (
                  <a className={styles.cardLink} href={creator.href}>
                    Read the feature →
                  </a>
                ) : (
                  <span className={`${styles.pill} ${styles.pillDim}`}>In Production</span>
                )}
              </div>
            ))}
            <div className={`${styles.card} ${styles.reveal}`}>
              <div className={styles.cardMedia}>Nominate a creator</div>
              <div className={styles.cardKicker}>Open Slot</div>
              <h3>Your Creator Here</h3>
              <p>Know a creator whose story deserves a feature? Send them our way.</p>
              <a className={styles.cardLink} href="#pitch">
                Suggest a creator →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="how">
        <div className={styles.wrap}>
          <div className={`${styles.sectionHead} ${styles.reveal}`}>
            <span className={styles.eyebrow}>{process.eyebrow || "Process"}</span>
            <h2>{process.headline || "How a feature gets made"}</h2>
            <p>{process.body}</p>
          </div>
          <div className={styles.steps}>
            {(process.steps || []).map((step, index) => (
              <div className={`${styles.step} ${styles.reveal}`} key={step.title}>
                <div className={styles.stepNum}>{String(index + 1).padStart(2, "0")}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.tiein} id="pitch">
        <div className={styles.wrap}>
          <div className={`${styles.tieinCopy} ${styles.reveal}`}>
            <h2>{tiein.headline || "Built and run by DGTL Group"}</h2>
            <p>{tiein.body}</p>
          </div>
          {tiein.cta ? (
            <a className={styles.btnSecondary} href={tiein.cta.href} target="_blank" rel="noopener noreferrer">
              {brand.logo ? <img className={styles.tieinLogo} src={brand.logo} alt="DGTL" /> : null}
              {tiein.cta.label} →
            </a>
          ) : null}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footerGrid}>
            <div>
              <div className={styles.footerBrand}>
                {brand.logo ? <img src={brand.logo} alt="DGTL" /> : null}
                <span>
                  Influence <span className={styles.gold}>Journal</span>
                </span>
              </div>
              <p className={styles.footerBlurb}>
                A DGTL Group publication profiling the creators, athletes, and talent shaping culture.
              </p>
            </div>
            <div>
              <h4>Quick Links</h4>
              <ul>
                {(footer.quickLinks || []).map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4>DGTL Group</h4>
              <ul>
                {(footer.dgtlLinks || []).map((link) => (
                  <li key={link.label}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 DGTL. All Rights Reserved.</span>
            <span>dgtlinfluence.com · a DGTL Group publication</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
