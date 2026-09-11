// Mobile navigation toggle
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");

if (navToggle && header) {
  navToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (header && header.classList.contains("is-open")) {
      header.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });
});

// Scroll reveal
const revealItems = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

// Google Sheets waitlist endpoint. Replace this with the deployed Apps Script
// Web App URL for the Rounds Pay lead sheet when it is ready.
const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbzF8Wfg987svrI5XcPbVfdxulDdHC8jpbIG084cQklbESLEFYsyR50dzo9vX7EeGEjm/exec";

function submitToSheet(data, noteEl, successMsg, form) {
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.textContent = "Submitting...";
  btn.disabled = true;

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value));

  fetch(SHEETS_URL, {
    method: "POST",
    mode: "no-cors",
    body: formData,
  })
    .then(() => {
      noteEl.textContent = successMsg;
      noteEl.classList.add("is-success");
      form.reset();
    })
    .catch((err) => {
      noteEl.textContent = "Something went wrong. Please try again.";
      noteEl.classList.remove("is-success");
      if (window.posthog && typeof posthog.captureException === "function") {
        posthog.captureException(err);
      }
    })
    .finally(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    });
}

// Hero waitlist form (side-gigs page)
const heroForm = document.getElementById("hero-form");
const heroNote = document.getElementById("hero-note");

heroForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const emailInput = heroForm.querySelector('input[name="email"]');
  if (!emailInput || !heroNote) return;

  const email = emailInput.value;

  if (window.posthog) {
    posthog.identify(email, { email });
    posthog.capture("waitlist_signup", {
      source: "side-gigs-hero",
      email,
    });
  }

  submitToSheet(
    { email, source: "side-gigs-hero" },
    heroNote,
    `You're on the list. We'll reach out to ${email} soon.`,
    heroForm
  );
});

function installRoundsPayLeadForm() {
  const payChatSection = document.getElementById("chat");
  const isRoundsPayPage = Boolean(document.querySelector(".pay-check"));
  if (!payChatSection || !isRoundsPayPage) return;

  document.querySelectorAll('a[href="#chat"]').forEach((cta) => {
    cta.setAttribute("href", "#lead");
    if (cta.textContent?.trim() === "Chat with us") {
      cta.textContent = "Get a practice review";
    }
  });

  payChatSection.id = "lead";
  payChatSection.classList.add("pay-lead-section");
  payChatSection.innerHTML = `
    <div class="pay-lead-grid is-visible" data-reveal>
      <div class="pay-lead-copy">
        <p class="eyebrow">Practice review</p>
        <h2>See if your membership is HSA-ready.</h2>
        <p>
          Send your current pricing and billing setup. We'll review the obvious
          HSA issues before we reach out, so the first call can be about your
          practice instead of a generic demo.
        </p>
        <div class="pay-lead-points" aria-label="What Rounds reviews before the call">
          <span>Fee cap fit</span>
          <span>DPC vs concierge model</span>
          <span>Billing system migration</span>
          <span>HSA/FSA patient demand</span>
        </div>

        <div class="pay-lead-calc" aria-label="Monthly membership HSA split estimate">
          <label>
            <span>Your monthly membership fee</span>
            <input id="pay-calc-fee" type="number" min="0" inputmode="decimal" value="249" />
          </label>
          <div class="pay-lead-calc-results">
            <div>
              <span>HSA eligible</span>
              <strong data-pay-calc="eligible">$150/mo</strong>
            </div>
            <div>
              <span>Backup tender</span>
              <strong data-pay-calc="backup">$99/mo</strong>
            </div>
            <div>
              <span>Patient tax savings</span>
              <strong data-pay-calc="savings">~$576/yr</strong>
            </div>
          </div>
          <p>
            Estimate assumes individual coverage and a 32% marginal tax rate.
            Family coverage doubles the membership cap.
          </p>
        </div>
      </div>

      <form class="waitlist-form pay-lead-form" id="waitlist-form" data-source="rounds-pay-practice-review">
        <div class="waitlist-fields pay-lead-fields">
          <label>
            <span>Your name</span>
            <input name="name" type="text" autocomplete="name" required placeholder="Dr. Alex Morgan" />
          </label>
          <label>
            <span>Work email</span>
            <input name="email" type="email" autocomplete="email" required placeholder="alex@practice.com" />
          </label>
          <label>
            <span>Practice name</span>
            <input name="practice_name" type="text" required placeholder="Founders Family Care" />
          </label>
          <label class="pay-lead-full">
            <span>What should we know before reaching out?</span>
            <textarea
              name="notes"
              placeholder="Example: We charge $249/mo and patients keep asking if their HSA can cover the membership."
            ></textarea>
          </label>
        </div>

        <button class="button button-primary button-arrow button-wide" type="submit">
          Send me a review
        </button>
        <p class="form-note" id="form-note">
          We'll email you after reviewing your membership structure. No tax or
          legal advice, just a practical read on fit and next steps.
        </p>
      </form>
    </div>
  `;

  if (!document.getElementById("pay-lead-styles")) {
    const style = document.createElement("style");
    style.id = "pay-lead-styles";
    style.textContent = `
      .pay-lead-section { text-align: left; }
      .pay-lead-grid { display: grid; grid-template-columns: 0.82fr 1.18fr; gap: 36px; align-items: start; padding: 40px; border: 1px solid var(--line); border-radius: var(--radius-lg); background: linear-gradient(135deg, rgba(67, 116, 249, 0.06), rgba(14, 186, 116, 0.05)), var(--white); box-shadow: var(--shadow-lg); }
      .pay-lead-copy h2 { margin-bottom: 14px; }
      .pay-lead-copy > p { margin: 0; color: var(--text-secondary); font-size: 1.02rem; line-height: 1.7; }
      .pay-lead-points { display: grid; gap: 10px; margin-top: 28px; }
      .pay-lead-points span { position: relative; padding: 12px 14px 12px 34px; border: 1px solid var(--line); border-radius: var(--radius); background: rgba(255, 255, 255, 0.72); color: var(--text-secondary); font-size: 0.92rem; font-weight: 600; }
      .pay-lead-points span::before { content: "\\2713"; position: absolute; left: 14px; top: 12px; color: var(--green); font-weight: 800; }
      .pay-lead-calc { margin-top: 22px; padding: 18px; border: 1px solid var(--line); border-radius: var(--radius-md); background: rgba(255, 255, 255, 0.78); box-shadow: var(--shadow-sm); }
      .pay-lead-calc label span, .pay-lead-calc-results span { display: block; color: var(--text-muted); font-size: 0.78rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
      .pay-lead-calc input { width: 100%; min-height: 48px; margin-top: 8px; padding: 0 16px; border: 1px solid var(--line-strong); border-radius: var(--radius-pill); background: var(--white); color: var(--text); font-size: 1.05rem; font-weight: 700; outline: none; }
      .pay-lead-calc input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
      .pay-lead-calc-results { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
      .pay-lead-calc-results div { min-width: 0; padding: 12px; border-radius: var(--radius); background: var(--surface); }
      .pay-lead-calc-results strong { display: block; margin-top: 4px; color: var(--text); font-family: "Aeonik", "Inter", -apple-system, sans-serif; font-size: 1rem; line-height: 1.2; }
      .pay-lead-calc p { margin: 12px 0 0; color: var(--text-muted); font-size: 0.82rem; line-height: 1.5; }
      .pay-lead-form { padding: 26px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--white); box-shadow: var(--shadow-md); }
      .pay-lead-fields { grid-template-columns: 1fr; }
      .pay-lead-full { grid-column: 1 / -1; }
      .pay-lead-form .form-note { text-align: left; }
      .pay-lead-form button:disabled { cursor: wait; opacity: 0.72; }
      @media (max-width: 900px) { .pay-lead-grid { grid-template-columns: 1fr; padding: 28px; } }
      @media (max-width: 640px) { .pay-lead-grid, .pay-lead-form { padding: 22px; } .pay-lead-fields, .pay-lead-calc-results { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }
}

installRoundsPayLeadForm();

// Bottom waitlist form (any page with #waitlist-form)
const waitlistForm = document.getElementById("waitlist-form");
const formNote = document.getElementById("form-note");

waitlistForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const emailInput = waitlistForm.querySelector('input[name="email"]');
  if (!emailInput || !formNote) return;
  const calcFeeInput = document.getElementById("pay-calc-fee");
  const membershipFeeInput = waitlistForm.querySelector('input[name="membership_fee"]');
  if (membershipFeeInput && !membershipFeeInput.value && calcFeeInput?.value) {
    membershipFeeInput.value = calcFeeInput.value;
  }

  // Collect all form fields dynamically
  const data = { email: emailInput.value };
  const source = waitlistForm.dataset.source || "waitlist";
  data.source = source;
  data.page_url = window.location.href;
  data.user_agent = navigator.userAgent;

  // Gather all select, textarea, and non-email input fields
  waitlistForm.querySelectorAll("select, textarea, input:not([type=email])").forEach((field) => {
    if (field.name && field.value) {
      data[field.name] = field.value;
    }
  });

  if (window.posthog) {
    posthog.identify(data.email, { email: data.email });
    posthog.capture("waitlist_signup", {
      source,
      email: data.email,
      ...(data.specialty && { specialty: data.specialty }),
      ...(data.stage && { career_stage: data.stage }),
      ...(data.loan_balance && { loan_balance: data.loan_balance }),
      ...(data.pslf && { pslf_pursuing: data.pslf }),
      ...(data.practice_type && { practice_type: data.practice_type }),
      ...(data.membership_fee && { membership_fee: data.membership_fee }),
      ...(data.billing_system && { billing_system: data.billing_system }),
    });
  }

  submitToSheet(
    data,
    formNote,
    source === "rounds-pay-practice-review"
      ? `Thanks. We'll review your membership setup and email ${data.email}.`
      : `You're in. We'll send early access details to ${data.email}.`,
    waitlistForm
  );
});

// Rounds Pay fee split calculator
const payCalcFee = document.getElementById("pay-calc-fee");
const payCalcEligible = document.querySelector('[data-pay-calc="eligible"]');
const payCalcBackup = document.querySelector('[data-pay-calc="backup"]');
const payCalcSavings = document.querySelector('[data-pay-calc="savings"]');
const payLeadFeeInput = document.querySelector('#waitlist-form input[name="membership_fee"]');

function formatDollars(value) {
  return `$${Math.round(value).toLocaleString()}`;
}

function updatePayCalc() {
  if (!payCalcFee || !payCalcEligible || !payCalcBackup || !payCalcSavings) return;
  const fee = Math.max(Number(payCalcFee.value) || 0, 0);
  const eligible = Math.min(fee, 150);
  const backup = Math.max(fee - 150, 0);
  const savings = eligible * 12 * 0.32;
  payCalcEligible.textContent = `${formatDollars(eligible)}/mo`;
  payCalcBackup.textContent = `${formatDollars(backup)}/mo`;
  payCalcSavings.textContent = `~${formatDollars(savings)}/yr`;
}

payCalcFee?.addEventListener("input", () => {
  updatePayCalc();
  if (payLeadFeeInput && !payLeadFeeInput.value) {
    payLeadFeeInput.placeholder = payCalcFee.value || "249";
  }
});
updatePayCalc();

// FAQ item tracking
document.querySelectorAll(".faq-list details").forEach((details) => {
  details.addEventListener("toggle", () => {
    if (details.open && window.posthog) {
      const question = details.querySelector("summary")?.textContent?.trim();
      posthog.capture("faq_item_opened", { question });
    }
  });
});

// Consultation CTA tracking (services page)
document.querySelectorAll('a[href="#book"]').forEach((cta) => {
  cta.addEventListener("click", () => {
    if (window.posthog) {
      posthog.capture("consultation_cta_clicked", {
        page: window.location.pathname,
      });
    }
  });
});

// Sign-up CTA tracking (any page)
document.querySelectorAll('[data-cta="signup"]').forEach((cta) => {
  cta.addEventListener("click", () => {
    if (window.posthog) {
      posthog.capture("signup_cta_clicked", {
        page: window.location.pathname,
        source: cta.dataset.ctaSource || "unknown",
      });
    }
  });
});

// ===== JOB BOARD =====
// Edit this array to add/remove/update roles. Each item becomes a card.
const JOBS = [
  {
    company: "Handshake AI",
    logo: "H",
    category: "AI Training",
    title: "Clinical AI Trainer \u2014 Licensed MDs/DOs",
    description:
      "Evaluate LLM responses to clinical vignettes. Score accuracy, safety, and reasoning. Async, specialty-matched.",
    tags: ["Remote", "Async", "1099"],
    rate: "$130\u2013$170/hr",
    rateLabel: "Reported range",
    url: "https://joinhandshake.com/move-program/referral?referralCode=5C862D&utm_source=referral",
  },
  {
    company: "Mercor",
    logo: "M",
    category: "AI Training",
    title: "Primary Care Physicians",
    description:
      "Review and annotate clinical text, EHR data, and patient case notes.",
    tags: ["Clinical", "Remote", "Project-based"],
    rate: "$100\u2013$130/hr",
    rateLabel: "Board-certified",
    url: "https://work.mercor.com/jobs/list_AAABnQeULhbeXU0vj71CBok5?referralCode=0dadede2-8f4b-4972-921c-ea79a51dbb67&utm_campaign=job&utm_content=list_AAABnQeULhbeXU0vj71CBok5&utm_medium=direct&utm_source=referral",
  },
  {
    company: "Mercor",
    logo: "M",
    category: "AI Training",
    title: "Physician Talent Network",
    description:
      "Provide preference rankings and written rubrics for medical reasoning tasks. Flexible hours, consistent volume.",
    tags: ["Internal Medicine", "Remote"],
    rate: "TBA",
    rateLabel: "Entry range",
    url: "https://work.mercor.com/jobs/list_AAABnJzK0z1CNefOyERAAb9m?referralCode=0dadede2-8f4b-4972-921c-ea79a51dbb67&utm_campaign=job&utm_content=list_AAABnJzK0z1CNefOyERAAb9m&utm_medium=direct&utm_source=referral",
  },
  {
    company: "Outlier",
    logo: "O",
    category: "AI Training",
    title: "Medical Domain Expert",
    description:
      "High-volume annotation work with performance bonuses. Best suited for efficient physicians who optimize throughput.",
    tags: ["Remote", "Bonus-eligible"],
    rate: "$50\u2013$120/hr",
    rateLabel: "Variable + bonus",
    url: "https://outlier.ai",
  },
  {
    company: "Guidepoint",
    logo: "Gp",
    category: "Expert Advisory",
    title: "Clinical Advisor \u2014 Health Tech",
    description:
      "Consult with startups and investors on product strategy, regulatory paths, and clinical workflow integration.",
    tags: ["Phone", "Health tech", "Strategy"],
    rate: "$250\u2013$600/hr",
    rateLabel: "Per consultation",
    url: "https://guidepoint.com",
  }
];

const jobList = document.getElementById("job-list");
const jobFilters = document.getElementById("job-filters");
const jobCount = document.getElementById("job-count");

if (jobList && jobFilters) {
  const categories = ["All", ...Array.from(new Set(JOBS.map((j) => j.category)))];
  let activeCategory = "All";

  const countFor = (cat) =>
    cat === "All" ? JOBS.length : JOBS.filter((j) => j.category === cat).length;

  function renderFilters() {
    jobFilters.innerHTML = categories
      .map(
        (cat) => `
        <button
          type="button"
          class="job-chip${cat === activeCategory ? " is-active" : ""}"
          data-category="${cat}"
          role="tab"
          aria-selected="${cat === activeCategory}"
        >
          ${cat}
          <span class="job-chip-count">${countFor(cat)}</span>
        </button>
      `
      )
      .join("");
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function renderJobs() {
    const filtered =
      activeCategory === "All"
        ? JOBS
        : JOBS.filter((j) => j.category === activeCategory);

    if (jobCount) jobCount.textContent = filtered.length;

    if (!filtered.length) {
      jobList.innerHTML = `<div class="job-empty">No roles match this filter yet. Check back soon.</div>`;
      return;
    }

    jobList.innerHTML = filtered
      .map(
        (job) => `
        <article class="job-card" data-company="${escapeHtml(job.company)}" data-category="${escapeHtml(job.category)}">
          <div class="job-card-top">
            <div class="job-logo" aria-hidden="true">${escapeHtml(job.logo)}</div>
            <div class="job-company">
              <p class="job-company-name">${escapeHtml(job.company)}</p>
              <span class="job-category">${escapeHtml(job.category)}</span>
            </div>
          </div>
          <h3>${escapeHtml(job.title)}</h3>
          <p class="job-description">${escapeHtml(job.description)}</p>
          <div class="job-meta">
            ${job.tags.map((t) => `<span class="job-tag">${escapeHtml(t)}</span>`).join("")}
          </div>
          <div class="job-card-bottom">
            <div class="job-rate">
              <span class="job-rate-value">${escapeHtml(job.rate)}</span>
              <span class="job-rate-label">${escapeHtml(job.rateLabel)}</span>
            </div>
            <a
              class="job-apply"
              href="${escapeHtml(job.url)}"
              target="_blank"
              rel="noopener sponsored"
              data-job-company="${escapeHtml(job.company)}"
              data-job-title="${escapeHtml(job.title)}"
            >View role</a>
          </div>
        </article>
      `
      )
      .join("");
  }

  jobFilters.addEventListener("click", (event) => {
    const btn = event.target.closest(".job-chip");
    if (!btn) return;
    const cat = btn.dataset.category;
    if (!cat || cat === activeCategory) return;
    activeCategory = cat;
    renderFilters();
    renderJobs();
    if (window.posthog) {
      posthog.capture("job_board_filter", { category: cat });
    }
  });

  jobList.addEventListener("click", (event) => {
    const link = event.target.closest(".job-apply");
    if (!link) return;
    if (window.posthog) {
      posthog.capture("job_board_click", {
        company: link.dataset.jobCompany,
        title: link.dataset.jobTitle,
        category: activeCategory,
      });
    }
  });

  renderFilters();
  renderJobs();
}

// ===== RESOURCES INDEX (tag filter) =====
const resourceFilters = document.getElementById("resource-filters");
const resourceGrid = document.getElementById("resource-grid");

if (resourceFilters && resourceGrid) {
  const cards = Array.from(resourceGrid.querySelectorAll("[data-tags]"));
  const tagSet = new Set();
  cards.forEach((card) => {
    (card.dataset.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((t) => tagSet.add(t));
  });
  const tags = ["All", ...Array.from(tagSet).sort()];
  let activeTag = "All";

  const tagCount = (tag) =>
    tag === "All"
      ? cards.length
      : cards.filter((c) => (c.dataset.tags || "").split(",").map((t) => t.trim()).includes(tag)).length;

  function renderResourceFilters() {
    resourceFilters.innerHTML = tags
      .map(
        (tag) => `
        <button
          type="button"
          class="job-chip${tag === activeTag ? " is-active" : ""}"
          data-tag="${tag}"
        >
          ${tag}
          <span class="job-chip-count">${tagCount(tag)}</span>
        </button>
      `
      )
      .join("");
  }

  function applyResourceFilter() {
    cards.forEach((card) => {
      const tagsOnCard = (card.dataset.tags || "").split(",").map((t) => t.trim());
      const matches = activeTag === "All" || tagsOnCard.includes(activeTag);
      card.style.display = matches ? "" : "none";
    });
  }

  resourceFilters.addEventListener("click", (event) => {
    const btn = event.target.closest(".job-chip");
    if (!btn) return;
    const tag = btn.dataset.tag;
    if (!tag || tag === activeTag) return;
    activeTag = tag;
    renderResourceFilters();
    applyResourceFilter();
    if (window.posthog) {
      posthog.capture("resources_filter", { tag });
    }
  });

  renderResourceFilters();
  applyResourceFilter();
}

// Staggered reveal for grid items
const staggerContainers = document.querySelectorAll(
  ".steps-grid, .bento-grid, .stats-strip, .products-grid"
);

staggerContainers.forEach((container) => {
  const children = container.querySelectorAll("[data-reveal]");
  children.forEach((child, index) => {
    child.style.transitionDelay = `${index * 80}ms`;
  });
});
