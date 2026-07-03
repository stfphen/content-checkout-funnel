"use client";

import Reveal from "../../motion/Reveal";
import { Stagger, StaggerItem } from "../../motion/Stagger";
import { SECTION_VARIANTS } from "../../../lib/tenantBuilder/sectionVariants";
import { MediaImage } from "./shared";

/* ---------------------------------------------------------------------------
 * References — social proof, one section with N compositions.
 * "testimonial-grid" is the pre-variants FunnelPage rendering (testimonial
 * grid plus logo wall), verbatim. Every variant returns null when the tenant
 * has neither testimonials nor logos.
 * ------------------------------------------------------------------------- */

function LogoWall({ references }) {
  return (
    <Reveal as="ul" className="logo-wall" aria-label="Client logos">
      {references.logos.map((logo, index) => {
        const image = (
          <MediaImage src={logo.src} alt={logo.alt || logo.name || "Client logo"} sizes="160px" />
        );
        return (
          <li key={logo.src || index}>
            {logo.link ? (
              <a href={logo.link} target="_blank" rel="noopener noreferrer">
                {image}
              </a>
            ) : (
              image
            )}
          </li>
        );
      })}
    </Reveal>
  );
}

function TestimonialGridReferences({ tenant }) {
  const references = tenant.references;
  const hasTestimonials = Boolean(references?.testimonials?.length);
  const hasLogos = Boolean(references?.logos?.length);
  if (!hasTestimonials && !hasLogos) return null;

  return (
    <section className="section section--soft references" aria-labelledby="references-heading">
      <div className="section__inner">
        <Reveal className="section__header section__header--compact">
          <p className="eyebrow">{references.eyebrow}</p>
          <h2 id="references-heading">{references.headline}</h2>
        </Reveal>
        {hasTestimonials ? (
          <Stagger className="testimonial-grid" stagger={0.07}>
            {references.testimonials.map((entry, index) => (
              <StaggerItem as="blockquote" className="testimonial" key={`${entry.name}-${index}`}>
                <p>{entry.quote}</p>
                <footer>
                  {entry.name ? <strong>{entry.name}</strong> : null}
                  {entry.role || entry.company ? (
                    <span>{[entry.role, entry.company].filter(Boolean).join(", ")}</span>
                  ) : null}
                </footer>
              </StaggerItem>
            ))}
          </Stagger>
        ) : null}
        {hasLogos ? <LogoWall references={references} /> : null}
      </div>
    </section>
  );
}

const VARIANTS = {
  "testimonial-grid": TestimonialGridReferences
};

export default function ReferencesSection({ tenant, ctx }) {
  const Variant =
    VARIANTS[ctx.design.sectionVariants?.references] ||
    VARIANTS[SECTION_VARIANTS.references.defaultId];
  return <Variant tenant={tenant} ctx={ctx} />;
}
