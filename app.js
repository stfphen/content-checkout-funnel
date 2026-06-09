(function () {
  const config = window.CONTENT_FUNNEL_CONFIG;
  const state = {
    selectedPackageId: "pro-content-day",
    lastLead: null
  };

  const selectedPackage = document.getElementById("selectedPackage");
  const leadForm = document.getElementById("leadForm");
  const formNote = document.getElementById("formNote");
  const toast = document.getElementById("toast");
  const copyLead = document.getElementById("copyLead");

  function getPackage(id) {
    return config.packages[id] || config.packages["pro-content-day"];
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
  }

  function renderSelectedPackage() {
    const selected = getPackage(state.selectedPackageId);
    selectedPackage.innerHTML = `
      <strong>${selected.name} - ${selected.price}</strong>
      <span>${selected.description}</span>
    `;

    document.querySelectorAll("[data-package-card]").forEach((card) => {
      card.classList.toggle(
        "is-selected",
        card.dataset.packageCard === state.selectedPackageId
      );
    });
  }

  function selectPackage(id) {
    state.selectedPackageId = id;
    renderSelectedPackage();
    document.querySelector(".checkout-section").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function buildLeadPayload(formData) {
    return {
      packageId: state.selectedPackageId,
      package: getPackage(state.selectedPackageId),
      business: formData.get("business"),
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      url: formData.get("url"),
      notes: formData.get("notes"),
      source: window.location.href,
      createdAt: new Date().toISOString()
    };
  }

  async function submitLead(payload) {
    if (!config.leadWebhookUrl) {
      return { ok: true, skipped: true };
    }

    const response = await fetch(config.leadWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return { ok: response.ok, skipped: false };
  }

  function routeAfterLead(payload) {
    const packageId = payload.packageId;
    const selected = getPackage(packageId);
    const paymentLink = config.stripePaymentLinks[packageId];
    const bookingLink = config.bookingLinks[packageId];

    if (selected.action === "checkout" && paymentLink) {
      window.location.href = paymentLink;
      return;
    }

    if (bookingLink) {
      window.location.href = bookingLink;
      return;
    }

    const nextStep =
      selected.action === "checkout"
        ? "Add a Stripe Payment Link in config.js to turn this into live checkout."
        : "Add a Calendly or booking link in config.js to route qualified leads.";

    formNote.textContent = `${selected.name} selected. ${nextStep}`;
    showToast("Lead captured locally. Checkout routing is ready for live links.");
  }

  document.querySelectorAll("[data-select-package]").forEach((button) => {
    button.addEventListener("click", () => selectPackage(button.dataset.selectPackage));
  });

  document.querySelectorAll("[data-scroll-to]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById(button.dataset.scrollTo).scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = buildLeadPayload(new FormData(leadForm));
    state.lastLead = payload;
    formNote.textContent = "Preparing checkout...";

    try {
      const result = await submitLead(payload);
      if (!result.ok) {
        throw new Error("Lead webhook failed");
      }
      routeAfterLead(payload);
    } catch (error) {
      formNote.textContent =
        "The lead was prepared, but the webhook failed. Check the webhook URL in config.js.";
      showToast("Webhook failed. Lead data can still be copied.");
    }
  });

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  }

  copyLead.addEventListener("click", async () => {
    const payload = state.lastLead || buildLeadPayload(new FormData(leadForm));
    const serialized = JSON.stringify(payload, null, 2);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(serialized);
      } else if (!fallbackCopy(serialized)) {
        throw new Error("Fallback copy failed");
      }
      showToast("Lead JSON copied.");
    } catch (error) {
      showToast("Clipboard access failed in this browser.");
    }
  });

  renderSelectedPackage();
})();
