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
  "https://script.google.com/macros/s/AKfycbzH9ouOb1YKzRet3U7idf125FtEWZqWbssHtjKajNv2VwyIkCi_8BlnQPDacZvAum5qqA/exec";

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
    .catch(() => {
      noteEl.textContent = "Something went wrong. Please try again.";
      noteEl.classList.remove("is-success");
    })
    .finally(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    });
}

// Hero waitlist form
const heroForm = document.getElementById("hero-form");
const heroNote = document.getElementById("hero-note");

heroForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const emailInput = heroForm.querySelector('input[name="email"]');
  if (!emailInput || !heroNote) return;

  submitToSheet(
    { email: emailInput.value, source: "hero" },
    heroNote,
    `You're on the list. We'll reach out to ${emailInput.value} soon.`,
    heroForm
  );
});

// Bottom waitlist form
const waitlistForm = document.getElementById("waitlist-form");
const formNote = document.getElementById("form-note");

waitlistForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const emailInput = waitlistForm.querySelector('input[name="email"]');
  const specialtyInput = waitlistForm.querySelector('select[name="specialty"]');
  const stageInput = waitlistForm.querySelector('select[name="stage"]');

  if (!emailInput || !formNote) return;

  submitToSheet(
    {
      email: emailInput.value,
      specialty: specialtyInput?.value || "",
      stage: stageInput?.value || "",
      source: "waitlist",
    },
    formNote,
    `You're in. We'll send early access details to ${emailInput.value}.`,
    waitlistForm
  );
});

// Staggered reveal for grid items
const staggerContainers = document.querySelectorAll(
  ".steps-grid, .bento-grid, .stats-strip"
);

staggerContainers.forEach((container) => {
  const children = container.querySelectorAll("[data-reveal]");
  children.forEach((child, index) => {
    child.style.transitionDelay = `${index * 80}ms`;
  });
});
