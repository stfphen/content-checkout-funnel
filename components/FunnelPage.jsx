"use client";

import { useMemo, useState } from "react";
import { getTenantTheme } from "../lib/branding";
import FundingSurveyWidget from "./funding/FundingSurveyWidget";
import Reveal from "./motion/Reveal";
import { Stagger, StaggerItem } from "./motion/Stagger";

export default function FunnelPage({ tenant }) {
  const [selectedPackageId, setSelectedPackageId] = useState(tenant.defaultPackageId);
  const [formNote, setFormNote] = useState(tenant.checkout.disclaimer);
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isFundingTenant = tenant.slug === "funded-growth";
  const theme = useMemo(() => getTenantTheme(tenant.brand), [tenant.brand]);

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
    if (submitting) return;
    setSubmitting(true);
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

    try {
      // Stripe Checkout path: /api/checkout captures the lead AND creates the
      // session server-side (price resolved from the tenant config, not here).
      if (selectedPackage.action === "checkout" && !selectedPackage.paymentLink) {
        const checkoutResponse = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const checkout = await checkoutResponse.json().catch(() => ({}));

        if (checkoutResponse.ok && checkout.url) {
          window.location.href = checkout.url;
          return;
        }
        if (checkoutResponse.ok && checkout.redirect) {
          window.location.href = checkout.redirect;
          return;
        }
        if (checkoutResponse.ok) {
          setFormNote(
            `${selectedPackage.name} selected. We captured your request and will follow up with next steps.`
          );
          showToast("Request captured.");
          return;
        }
        setFormNote("Checkout could not start. We saved your details and will follow up.");
        showToast("Checkout failed.");
        return;
      }

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
    } catch {
      setFormNote("Something went wrong. Please try again.");
      showToast("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="tenant-root" style={theme.vars} data-tenant={tenant.slug}>
      <main>
        <section className="hero" aria-label={`${tenant.brand.name} sales offer`}>
          <img className="hero__image" src={tenant.media.heroImage} alt={tenant.media.heroAlt} />
          <div className="hero__shade" />
          <Stagger className="hero__content" stagger={0.1} amount={0.1}>
            <StaggerItem className="brandbar">
              {tenant.brand.logo ? (
                <img className="brandbar__logo" src={tenant.brand.logo} alt={`${tenant.brand.name} logo`} />
              ) : (
                <span className="brandbar__wordmark">{tenant.brand.logoText || tenant.brand.name}</span>
              )}
              {tenant.brand.tagline ? <span className="brandbar__tagline">{tenant.brand.tagline}</span> : null}
              <a className="button button--secondary brandbar__login" href="/admin">Log in</a>
            </StaggerItem>
            <StaggerItem as="p" className="eyebrow">{tenant.brand.eyebrow}</StaggerItem>
            <StaggerItem as="h1">{tenant.hero.headline}</StaggerItem>
            <StaggerItem as="p" className="hero__copy">{tenant.hero.subheadline}</StaggerItem>
            <StaggerItem className="hero__actions">
              <button className="button button--primary" onClick={() => selectPackage(tenant.defaultPackageId)}>
                {tenant.hero.primaryCta}
              </button>
              <button
                className="button button--secondary"
                onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}
              >
                {tenant.hero.secondaryCta}
              </button>
              {!isFundingTenant && tenant.fundingPromo?.enabled ? (
                <a className="button button--secondary" href={tenant.fundingPromo.link}>
                  {tenant.fundingPromo.cta}
                </a>
              ) : null}
            </StaggerItem>
            <StaggerItem as="dl" className="hero__stats" aria-label="Content day highlights">
              {tenant.hero.stats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.value}</dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </StaggerItem>
          </Stagger>
        </section>

        <section className="problem section">
          <Reveal className="section__inner split">
            <div>
              <p className="eyebrow">{tenant.problem.eyebrow}</p>
              <h2>{tenant.problem.headline}</h2>
            </div>
            <div className="problem__grid">
              {tenant.problem.points.map((point) => (
                <p key={point}>{point}</p>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="section section--soft">
          <div className="section__inner">
            <Reveal className="section__header">
              <p className="eyebrow">{tenant.system.eyebrow}</p>
              <h2>{tenant.system.headline}</h2>
              <p>{tenant.system.body}</p>
            </Reveal>
            <Stagger className="feature-row" aria-label="Included services">
              {tenant.system.features.map((feature) => (
                <StaggerItem as="article" key={feature.title}>
                  <span className="icon" aria-hidden="true" />
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <section className="section">
          <div className="section__inner">
            <Reveal className="section__header section__header--compact">
              <p className="eyebrow">{tenant.process.eyebrow}</p>
              <h2>{tenant.process.headline}</h2>
            </Reveal>
            <Stagger as="ol" className="timeline" stagger={0.06}>
              {tenant.process.steps.map((step, index) => (
                <StaggerItem as="li" key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <section className="section section--black" aria-label="Content examples">
          <Reveal className="section__inner split split--center">
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
          </Reveal>
        </section>

        {tenant.fundedOpportunity ? (
          <section className="section">
            <Reveal className="section__inner split">
              <div>
                <p className="eyebrow">{tenant.fundedOpportunity.eyebrow}</p>
                <h2>{tenant.fundedOpportunity.headline}</h2>
                <p>{tenant.fundedOpportunity.body}</p>
              </div>
              <div className="problem__grid">
                {tenant.fundedOpportunity.points.map((point) => (
                  <p key={point}>{point}</p>
                ))}
              </div>
            </Reveal>
          </section>
        ) : null}

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
                    pkg.id === selectedPackageId ? "is-selected" : ""
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
                    onClick={() => selectPackage(pkg.id)}
                  >
                    {pkg.cta}
                  </button>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal className="enterprise-band">
              <div>
                <p className="eyebrow">{tenant.enterprise.eyebrow}</p>
                <h3>{tenant.enterprise.headline}</h3>
                <p>{tenant.enterprise.body}</p>
              </div>
              <button className="button button--secondary" onClick={() => selectPackage(tenant.enterprise.packageId)}>
                {tenant.enterprise.cta}
              </button>
            </Reveal>
          </div>
        </section>

        {!isFundingTenant && tenant.fundingPromo?.enabled ? (
          <section className="section section--soft" id="funding-survey" aria-label="Funding eligibility survey">
            <Reveal className="section__inner" amount={0.1}>
              <div className="section__header">
                <p className="eyebrow">{tenant.fundingPromo.eyebrow}</p>
                <h2>{tenant.fundingPromo.headline}</h2>
                <p>{tenant.fundingPromo.body}</p>
              </div>
              <FundingSurveyWidget tenant={tenant} />
            </Reveal>
          </section>
        ) : null}

        {isFundingTenant ? (
        <section className="section section--soft checkout-section" id="funding-survey">
          <Reveal className="section__inner" amount={0.1}>
            <FundingSurveyWidget tenant={tenant} />
          </Reveal>
        </section>
        ) : (
        <section className="section section--soft checkout-section">
          <Reveal className="section__inner checkout-layout" amount={0.1}>
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
                <button
                  className="button button--primary"
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Working…
                    </>
                  ) : (
                    tenant.checkout.submitCta
                  )}
                </button>
              </div>
              <p className="form-note" id="formNote">{formNote}</p>
            </form>
          </Reveal>
        </section>
        )}

        <section className="section objections">
          <div className="section__inner">
            <Reveal className="section__header section__header--compact">
              <p className="eyebrow">{tenant.faq.eyebrow}</p>
              <h2>{tenant.faq.headline}</h2>
            </Reveal>
            <Stagger className="faq-grid" stagger={0.07}>
              {tenant.faq.items.map((item) => (
                <StaggerItem as="article" key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <section className="final-cta">
          <Reveal className="final-cta__inner">
            <p className="eyebrow">{tenant.finalCta.eyebrow}</p>
            <h2>{tenant.finalCta.headline}</h2>
            <p>{tenant.finalCta.body}</p>
            <button className="button button--primary" onClick={() => selectPackage(tenant.defaultPackageId)}>
              {tenant.finalCta.cta}
            </button>
          </Reveal>
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
    </div>
  );
}
