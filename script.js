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
  "https://script.google.com/macros/s/AKfycbxSxodJjI9Bxq8fYFjrU6LSaKC66I7C8CsRXmCfuGiRFdsF1R0cUajldbs8gz5dmTAAMg/exec";

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
