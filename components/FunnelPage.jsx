"use client";

import { useMemo, useState } from "react";

export default function FunnelPage({ tenant }) {
  const [selectedPackageId, setSelectedPackageId] = useState(tenant.defaultPackageId);
  const [formNote, setFormNote] = useState(tenant.checkout.disclaimer);
  const [toast, setToast] = useState("");
  const isFundingTenant = tenant.slug === "funded-growth";

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
    const fundingScan = isFundingTenant
      ? {
          companyWebsite: form.get("companyWebsite"),
          industry: form.get("industry"),
          location: form.get("location"),
          employeeCount: form.get("employeeCount"),
          revenueRange: form.get("revenueRange"),
          yearsOperating: form.get("yearsOperating"),
          incorporated: form.get("incorporated"),
          currentlyExporting: form.get("currentlyExporting"),
          interestedInExporting: form.get("interestedInExporting"),
          digitalNeeds: form.get("digitalNeeds"),
          ecommerceNeeds: form.get("ecommerceNeeds"),
          crmAutomationNeeds: form.get("crmAutomationNeeds"),
          availableProjectBudget: form.get("availableProjectBudget"),
          mainGrowthGoal: form.get("mainGrowthGoal")
        }
      : null;
    const payload = {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      packageId: selectedPackage.id,
      package: selectedPackage,
      business: form.get("business"),
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      url: isFundingTenant ? fundingScan.companyWebsite : form.get("url"),
      notes: isFundingTenant ? fundingScan.mainGrowthGoal : form.get("notes"),
      source: isFundingTenant ? "funding_scan" : window.location.href,
      ...(isFundingTenant
        ? {
            sourceType: "funding_scan",
            sourceUrl: window.location.href,
            category: fundingScan.industry,
            city: fundingScan.location,
            metadata: { fundingScan }
          }
        : {})
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
              {isFundingTenant ? (
                <>
                  <label>
                    Company website
                    <input name="companyWebsite" autoComplete="url" placeholder="https://" />
                  </label>
                  <label>
                    Industry
                    <input name="industry" required />
                  </label>
                  <label>
                    Location
                    <input name="location" autoComplete="address-level2" placeholder="City, province" required />
                  </label>
                  <label>
                    Employee count
                    <input name="employeeCount" type="number" min="0" inputMode="numeric" required />
                  </label>
                  <label>
                    Revenue range
                    <select name="revenueRange" required>
                      <option value="">Select range</option>
                      <option value="pre_revenue">Pre-revenue</option>
                      <option value="under_100k">Under $100k</option>
                      <option value="100k_500k">$100k-$500k</option>
                      <option value="500k_1m">$500k-$1M</option>
                      <option value="1m_5m">$1M-$5M</option>
                      <option value="5m_plus">$5M+</option>
                    </select>
                  </label>
                  <label>
                    Years operating
                    <select name="yearsOperating" required>
                      <option value="">Select range</option>
                      <option value="under_1">Under 1 year</option>
                      <option value="1_2">1-2 years</option>
                      <option value="3_5">3-5 years</option>
                      <option value="6_10">6-10 years</option>
                      <option value="10_plus">10+ years</option>
                    </select>
                  </label>
                  <label>
                    Incorporated
                    <select name="incorporated" required>
                      <option value="">Select status</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="in_progress">In progress</option>
                      <option value="unsure">Unsure</option>
                    </select>
                  </label>
                  <label>
                    Currently exporting
                    <select name="currentlyExporting" required>
                      <option value="">Select status</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  <label>
                    Interested in exporting
                    <select name="interestedInExporting" required>
                      <option value="">Select status</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="unsure">Unsure</option>
                    </select>
                  </label>
                  <label>
                    Digital needs
                    <textarea name="digitalNeeds" rows="3" required />
                  </label>
                  <label>
                    E-commerce needs
                    <textarea name="ecommerceNeeds" rows="3" required />
                  </label>
                  <label>
                    CRM or automation needs
                    <textarea name="crmAutomationNeeds" rows="3" required />
                  </label>
                  <label>
                    Available project budget
                    <select name="availableProjectBudget" required>
                      <option value="">Select budget</option>
                      <option value="under_5k">Under $5k</option>
                      <option value="5k_15k">$5k-$15k</option>
                      <option value="15k_50k">$15k-$50k</option>
                      <option value="50k_100k">$50k-$100k</option>
                      <option value="100k_plus">$100k+</option>
                    </select>
                  </label>
                  <label>
                    Main growth goal
                    <textarea name="mainGrowthGoal" rows="4" required />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Website or Instagram
                    <input name="url" autoComplete="url" placeholder="https://" />
                  </label>
                  <label>
                    What do you need content for?
                    <textarea name="notes" rows="4" />
                  </label>
                </>
              )}
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
