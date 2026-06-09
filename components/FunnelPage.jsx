"use client";

import { useMemo, useState } from "react";

export default function FunnelPage({ tenant }) {
  const [selectedPackageId, setSelectedPackageId] = useState(tenant.defaultPackageId);
  const [formNote, setFormNote] = useState(tenant.checkout.disclaimer);
  const [toast, setToast] = useState("");

  const selectedPackage = useMemo(
    () => tenant.packages.find((pkg) => pkg.id === selectedPackageId) || tenant.packages[0],
    [selectedPackageId, tenant.packages]
  );

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3600);
  }

  function selectPackage(packageId) {
    setSelectedPackageId(packageId);
    document.querySelector(".checkout-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  async function submitLead(event) {
    event.preventDefault();
    setFormNote("Preparing checkout...");

    const form = new FormData(event.currentTarget);
    const payload = {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      packageId: selectedPackage.id,
      package: selectedPackage,
      business: form.get("business"),
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      url: form.get("url"),
      notes: form.get("notes"),
      source: window.location.href
    };

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setFormNote("Lead capture failed. Please try again or contact us directly.");
      showToast("Lead capture failed.");
      return;
    }

    if (selectedPackage.action === "checkout" && selectedPackage.paymentLink) {
      window.location.href = selectedPackage.paymentLink;
      return;
    }

    if (selectedPackage.bookingLink) {
      window.location.href = selectedPackage.bookingLink;
      return;
    }

    setFormNote(
      `${selectedPackage.name} selected. We captured your request and will follow up with next steps.`
    );
    showToast("Request captured.");
  }

  return (
    <>
      <main>
        <section className="hero" aria-label={`${tenant.brand.name} sales offer`}>
          <img className="hero__image" src={tenant.media.heroImage} alt={tenant.media.heroAlt} />
          <div className="hero__shade" />
          <div className="hero__content">
            <p className="eyebrow">{tenant.brand.eyebrow}</p>
            <h1>{tenant.hero.headline}</h1>
            <p className="hero__copy">{tenant.hero.subheadline}</p>
            <div className="hero__actions">
              <button className="button button--primary" onClick={() => selectPackage(tenant.defaultPackageId)}>
                {tenant.hero.primaryCta}
              </button>
              <button
                className="button button--secondary"
                onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}
              >
                {tenant.hero.secondaryCta}
              </button>
            </div>
            <dl className="hero__stats" aria-label="Content day highlights">
              {tenant.hero.stats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.value}</dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="problem section">
          <div className="section__inner split">
            <div>
              <p className="eyebrow">{tenant.problem.eyebrow}</p>
              <h2>{tenant.problem.headline}</h2>
            </div>
            <div className="problem__grid">
              {tenant.problem.points.map((point) => (
                <p key={point}>{point}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--soft">
          <div className="section__inner">
            <div className="section__header">
              <p className="eyebrow">{tenant.system.eyebrow}</p>
              <h2>{tenant.system.headline}</h2>
              <p>{tenant.system.body}</p>
            </div>
            <div className="feature-row" aria-label="Included services">
              {tenant.system.features.map((feature, index) => (
                <article key={feature.title}>
                  <span className="icon" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section__inner">
            <div className="section__header section__header--compact">
              <p className="eyebrow">{tenant.process.eyebrow}</p>
              <h2>{tenant.process.headline}</h2>
            </div>
            <ol className="timeline">
              {tenant.process.steps.map((step, index) => (
                <li key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section section--black" aria-label="Content examples">
          <div className="section__inner split split--center">
            <div>
              <p className="eyebrow">{tenant.output.eyebrow}</p>
              <h2>{tenant.output.headline}</h2>
              <p>{tenant.output.body}</p>
            </div>
            <div className="content-grid" aria-hidden="true">
              {tenant.output.tiles.map((tile) => (
                <div key={tile}>{tile}</div>
              ))}
            </div>
          </div>
        </section>

        <section id="packages" className="section packages">
          <div className="section__inner">
            <div className="section__header">
              <p className="eyebrow">{tenant.packageSection.eyebrow}</p>
              <h2>{tenant.packageSection.headline}</h2>
              <p>{tenant.packageSection.body}</p>
            </div>

            <div className="package-grid">
              {tenant.packages.map((pkg) => (
                <article
                  className={`package ${pkg.featured ? "package--featured" : ""} ${
                    pkg.id === selectedPackageId ? "is-selected" : ""
                  }`}
                  data-package-card={pkg.id}
                  key={pkg.id}
                >
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
                    onClick={() => selectPackage(pkg.id)}
                  >
                    {pkg.cta}
                  </button>
                </article>
              ))}
            </div>

            <div className="enterprise-band">
              <div>
                <p className="eyebrow">{tenant.enterprise.eyebrow}</p>
                <h3>{tenant.enterprise.headline}</h3>
                <p>{tenant.enterprise.body}</p>
              </div>
              <button className="button button--secondary" onClick={() => selectPackage(tenant.enterprise.packageId)}>
                {tenant.enterprise.cta}
              </button>
            </div>
          </div>
        </section>

        <section className="section section--soft checkout-section">
          <div className="section__inner checkout-layout">
            <div>
              <p className="eyebrow">{tenant.checkout.eyebrow}</p>
              <h2>{tenant.checkout.headline}</h2>
              <p>{tenant.checkout.body}</p>
              <div className="selected-package" id="selectedPackage" aria-live="polite">
                <strong>
                  {selectedPackage.name} - {selectedPackage.priceDisplay}
                </strong>
                <span>{selectedPackage.description}</span>
              </div>
            </div>

            <form className="checkout-form" id="leadForm" onSubmit={submitLead}>
              <label>
                Business name
                <input name="business" autoComplete="organization" required />
              </label>
              <label>
                Name
                <input name="name" autoComplete="name" required />
              </label>
              <label>
                Email
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <label>
                Phone <span>optional</span>
                <input name="phone" type="tel" autoComplete="tel" />
              </label>
              <label>
                Website or Instagram
                <input name="url" autoComplete="url" placeholder="https://" />
              </label>
              <label>
                What do you need content for?
                <textarea name="notes" rows="4" />
              </label>
              <div className="form-actions">
                <button className="button button--primary" type="submit">
                  {tenant.checkout.submitCta}
                </button>
              </div>
              <p className="form-note" id="formNote">{formNote}</p>
            </form>
          </div>
        </section>

        <section className="section objections">
          <div className="section__inner">
            <div className="section__header section__header--compact">
              <p className="eyebrow">{tenant.faq.eyebrow}</p>
              <h2>{tenant.faq.headline}</h2>
            </div>
            <div className="faq-grid">
              {tenant.faq.items.map((item) => (
                <article key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="final-cta__inner">
            <p className="eyebrow">{tenant.finalCta.eyebrow}</p>
            <h2>{tenant.finalCta.headline}</h2>
            <p>{tenant.finalCta.body}</p>
            <button className="button button--primary" onClick={() => selectPackage(tenant.defaultPackageId)}>
              {tenant.finalCta.cta}
            </button>
          </div>
        </section>
      </main>

      <div className="mobile-action" aria-label="Mobile checkout shortcut">
        <button className="button button--primary" onClick={() => selectPackage(tenant.defaultPackageId)}>
          {tenant.mobileCta.primary}
        </button>
        <button
          className="button button--secondary"
          onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}
        >
          {tenant.mobileCta.secondary}
        </button>
      </div>

      <div className={`toast ${toast ? "is-visible" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}
