"use client";

import Reveal from "../../motion/Reveal";
import { Stagger, StaggerItem } from "../../motion/Stagger";
import { SECTION_VARIANTS } from "../../../lib/tenantBuilder/sectionVariants";

/* ---------------------------------------------------------------------------
 * Packages — variant contract (every variant must honor all three):
 * - each package card carries data-package-card={pkg.id}
 * - selecting calls ctx.selectPackage(pkg.id)
 * - the section keeps id="packages" (hero secondary CTA and the mobile bar
 *   scroll to it)
 * "cards" is the pre-variants FunnelPage rendering, verbatim.
 * ------------------------------------------------------------------------- */

function EnterpriseBand({ tenant, ctx }) {
  return (
    <Reveal className="enterprise-band">
      <div>
        <p className="eyebrow">{tenant.enterprise.eyebrow}</p>
        <h3>{tenant.enterprise.headline}</h3>
        <p>{tenant.enterprise.body}</p>
      </div>
      <button className="button button--secondary" onClick={() => ctx.selectPackage(tenant.enterprise.packageId)}>
        {tenant.enterprise.cta}
      </button>
    </Reveal>
  );
}

function CardsPackages({ tenant, ctx }) {
  return (
    <section id="packages" className="section packages">
      <div className="section__inner">
        <Reveal className="section__header">
          <p className="eyebrow">{tenant.packageSection.eyebrow}</p>
          <h2>{tenant.packageSection.headline}</h2>
          <p>{tenant.packageSection.body}</p>
        </Reveal>

        <Stagger className="package-grid" stagger={0.1}>
          {tenant.packages.map((pkg) => (
            <StaggerItem
              as="article"
              className={`package ${pkg.featured ? "package--featured" : ""} ${
                pkg.id === ctx.selectedPackageId ? "is-selected" : ""
              }`}
              data-package-card={pkg.id}
              key={pkg.id}
            >
              {pkg.featured ? <span className="package__badge">Most popular</span> : null}
              <div className="package__top">
                <h3>{pkg.name}</h3>
                <p>{pkg.summary}</p>
              </div>
              <div className="price">
                <span>{pkg.price}</span>
                <small>{pkg.priceQualifier}</small>
              </div>
              <p className="price__alt">{pkg.altPrice}</p>
              <ul>
                {pkg.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                className={`button ${pkg.featured ? "button--primary" : "button--dark"}`}
                onClick={() => ctx.selectPackage(pkg.id)}
              >
                {pkg.cta}
              </button>
            </StaggerItem>
          ))}
        </Stagger>

        <EnterpriseBand tenant={tenant} ctx={ctx} />
      </div>
    </section>
  );
}

const VARIANTS = {
  cards: CardsPackages
};

export default function PackagesSection({ tenant, ctx }) {
  const Variant =
    VARIANTS[ctx.design.sectionVariants?.packages] || VARIANTS[SECTION_VARIANTS.packages.defaultId];
  return <Variant tenant={tenant} ctx={ctx} />;
}
