const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

class ClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }

  toggle(value, enabled) {
    if (enabled) {
      this.add(value);
    } else {
      this.remove(value);
    }
  }

  contains(value) {
    return this.values.has(value);
  }
}

class Element {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.classList = new ClassList();
    this.events = {};
    this.innerHTML = "";
    this.textContent = "";
    this.fields = {};
    this.style = {};
    this.scrolled = false;
  }

  addEventListener(event, handler) {
    this.events[event] = handler;
  }

  click() {
    this.events.click();
  }

  scrollIntoView() {
    this.scrolled = true;
  }

  appendChild(child) {
    this.child = child;
  }

  removeChild(child) {
    if (this.child === child) {
      this.child = null;
    }
  }

  setAttribute(name, value) {
    this[name] = value;
  }

  select() {
    this.selected = true;
  }
}

function loadApp() {
  const ids = {
    selectedPackage: new Element(),
    leadForm: new Element(),
    formNote: new Element(),
    toast: new Element(),
    copyLead: new Element()
  };

  ids.leadForm.fields = {
    business: "Example Clinic",
    name: "Example Owner",
    email: "owner@example.com",
    phone: "4165550100",
    url: "https://example.com",
    notes: "Need monthly social content."
  };

  const packageCards = [
    new Element({ packageCard: "ugc-content" }),
    new Element({ packageCard: "pro-content-day" }),
    new Element({ packageCard: "growth-retainer" }),
    new Element({ packageCard: "campaign-scope" })
  ];

  const packageButtons = [
    new Element({ selectPackage: "ugc-content" }),
    new Element({ selectPackage: "pro-content-day" }),
    new Element({ selectPackage: "growth-retainer" }),
    new Element({ selectPackage: "campaign-scope" })
  ];

  const scrollButton = new Element({ scrollTo: "packages" });
  const packages = new Element();
  const checkoutSection = new Element();
  const body = new Element();

  const context = {
    console,
    navigator: {},
    window: {
      location: { href: "http://localhost:8088/" },
      isSecureContext: false,
      setTimeout: (fn) => fn()
    },
    document: {
      body,
      execCommand: () => true,
      createElement: () => new Element(),
      getElementById: (id) => ids[id] || packages,
      querySelector: (selector) => {
        if (selector === ".checkout-section") return checkoutSection;
        throw new Error(`Unexpected selector ${selector}`);
      },
      querySelectorAll: (selector) => {
        if (selector === "[data-package-card]") return packageCards;
        if (selector === "[data-select-package]") return packageButtons;
        if (selector === "[data-scroll-to]") return [scrollButton];
        throw new Error(`Unexpected selector ${selector}`);
      }
    },
    FormData: class {
      constructor(form) {
        this.form = form;
      }

      get(name) {
        return this.form.fields[name] || "";
      }
    },
    fetch: async () => ({ ok: true })
  };

  context.window.document = context.document;
  context.window.navigator = context.navigator;

  const root = path.resolve(__dirname, "..");
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, "config.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(root, "app.js"), "utf8"), context);

  return {
    ids,
    packageCards,
    packageButtons,
    scrollButton,
    packages,
    checkoutSection
  };
}

test("initializes with Pro Content Day selected", () => {
  const app = loadApp();
  assert.match(app.ids.selectedPackage.innerHTML, /Pro Content Day - \$2,500/);
  assert.equal(app.packageCards[1].classList.contains("is-selected"), true);
});

test("package buttons select a package and scroll to checkout", () => {
  const app = loadApp();
  app.packageButtons[0].click();
  assert.match(app.ids.selectedPackage.innerHTML, /UGC Content - \$1,500\/month/);
  assert.equal(app.packageCards[0].classList.contains("is-selected"), true);
  assert.equal(app.checkoutSection.scrolled, true);
});

test("scroll button targets the packages section", () => {
  const app = loadApp();
  app.scrollButton.click();
  assert.equal(app.packages.scrolled, true);
});

test("submit prepares checkout routing when live Stripe links are absent", async () => {
  const app = loadApp();
  await app.ids.leadForm.events.submit({ preventDefault() {} });
  assert.match(app.ids.formNote.textContent, /Add a Stripe Payment Link/);
});

test("copy lead uses the local fallback when clipboard api is unavailable", async () => {
  const app = loadApp();
  await app.ids.copyLead.events.click();
  assert.match(app.ids.toast.textContent, /Lead JSON copied/);
});
