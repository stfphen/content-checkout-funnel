"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import InteriorsHero from "./sections/InteriorsHero";
import OfferLadder from "./sections/OfferLadder";
import ProjectGallery from "./sections/ProjectGallery";
import DesignProcess from "./sections/DesignProcess";
import InteriorsFaq from "./sections/InteriorsFaq";
import ServiceAreaBand from "./sections/ServiceAreaBand";
import BookingSection from "./sections/BookingSection";
import styles from "./Interiors.module.css";

// The "interiors" tenant template (components/templates/registry.js). Warm
// gallery look for interior-design tenants, scoped entirely to the module
// stylesheet; the only theme inputs are the two brand colors, set as --in-*
// vars inline. The funnel's --blue/--accent/--fp-* tokens are never touched.
//
// Two lead intents share the single booking form (state lifted here):
//  - "consultation": the paid entry offer; submits through /api/checkout so
//    the $200 package keeps its real Stripe path.
//  - "inquiry": the higher ladder rungs; submits through /api/leads.
// One CTA label per intent, page-wide.
export default function InteriorsPage({ tenant }) {
  const brand = tenant?.brand || {};
  const interiors = tenant?.interiors || {};
  const reduceMotion = useReducedMotion();
  const sentinelRef = useRef(null);
  const [navSolid, setNavSolid] = useState(false);
  const [selection, setSelection] = useState({
    packageId: tenant?.defaultPackageId || tenant?.packages?.[0]?.id || "",
    intent: "consultation"
  });

  // Solidify the nav once the top-of-hero sentinel scrolls away. Observer
  // instead of a scroll listener: fires only on the boundary crossing.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setNavSolid(!entry.isIntersecting);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  function selectPackage(packageId, intent) {
    setSelection({ packageId, intent });
    document
      .getElementById("book")
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  const themeVars = {
    "--in-accent": brand.primaryColor || "#8B7A5E",
    "--in-accent-2": brand.accentColor || "#C9A9A6"
  };

  const nav = interiors.nav || {};
  const navLinks = nav.links || [];
  const consultationCta =
    interiors.booking?.consultationCta || "Book Your Paint Consultation";
  const footer = interiors.footer || {};
  const contact = tenant?.contact || {};

  return (
    <div className={styles.page} style={themeVars} data-tenant={tenant?.slug}>
      <div
        ref={sentinelRef}
        style={{ position: "absolute", top: 0, height: 1, width: 1 }}
        aria-hidden="true"
      />

      <nav className={`${styles.nav} ${navSolid ? styles.navSolid : ""}`}>
        <div className={styles.navInner}>
          <a className={styles.navBrand} href="#top" aria-label={brand.name || "Home"}>
            {brand.logo ? (
              <img className={styles.navLogo} src={brand.logo} alt={brand.name || ""} />
            ) : (
              brand.logoText || brand.name || "Home"
            )}
          </a>
          <div className={styles.navLinks}>
            {navLinks.map((link) => (
              <a key={link.href} className={styles.navLink} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
          <button
            type="button"
            className={styles.navCta}
            onClick={() => selectPackage(tenant?.defaultPackageId, "consultation")}
          >
            {consultationCta}
          </button>
        </div>
      </nav>

      <main id="top">
        <InteriorsHero tenant={tenant} onSelect={selectPackage} />
        <OfferLadder tenant={tenant} onSelect={selectPackage} />
        <ProjectGallery tenant={tenant} />
        <DesignProcess tenant={tenant} />
        <ServiceAreaBand tenant={tenant} />
        <InteriorsFaq tenant={tenant} />
        <BookingSection tenant={tenant} selection={selection} />
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              {brand.logo ? (
                <img className={styles.navLogo} src={brand.logo} alt={brand.name || ""} />
              ) : (
                <p className={styles.footerBrand}>{brand.logoText || brand.name}</p>
              )}
              {footer.blurb && <p className={styles.footerBlurb}>{footer.blurb}</p>}
            </div>
            <div className={styles.footerContact}>
              {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
              {contact.phone && <a href={`tel:${contact.phone}`}>{contact.phone}</a>}
              {contact.location && <span>{contact.location}</span>}
            </div>
          </div>
          <div className={styles.footerFine}>
            <span>
              &copy; {new Date().getFullYear()} {brand.name || ""}. All rights reserved.
            </span>
            {brand.tagline && <span>{brand.tagline}</span>}
          </div>
        </div>
      </footer>
    </div>
  );
}
