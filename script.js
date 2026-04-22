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

// Google Sheets waitlist endpoint
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

// Bottom waitlist form (any page with #waitlist-form)
const waitlistForm = document.getElementById("waitlist-form");
const formNote = document.getElementById("form-note");

waitlistForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const emailInput = waitlistForm.querySelector('input[name="email"]');
  if (!emailInput || !formNote) return;

  // Collect all form fields dynamically
  const data = { email: emailInput.value };
  const source = waitlistForm.dataset.source || "waitlist";
  data.source = source;

  // Gather all select and input fields
  waitlistForm.querySelectorAll("select, input:not([type=email])").forEach((field) => {
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
    });
  }

  submitToSheet(
    data,
    formNote,
    `You're in. We'll send early access details to ${data.email}.`,
    waitlistForm
  );
});

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
  },
  {
    company: "Sermo",
    logo: "S",
    category: "Med Surveys",
    title: "Remote Medical Surveys",
    description:
      "Surveys, medical imaging and more.",
    tags: ["Board-certified", "Remote", "Weekly"],
    rate: "$25-75/survey",
    rateLabel: "Per survey",
    url: "https://sermo.pxf.io/c/6029017/1834540/17702?utm_source=the-md.beehiiv.com&utm_medium=newsletter&utm_campaign=your-year-end-personal-finance-checklist&_bhlid=3c7c1d596829cbee7ce4616d02976d6a15b26498",
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
