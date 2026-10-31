/* =====================================================
   ROCKYX — HELP & SUPPORT
   Front-end demonstration module
   ===================================================== */

(() => {
  "use strict";

  const supportData = {
    faqs: [
      {
        question: "How do I create a RockyX account?",
        answer: "Account registration will be available when the authentication system is connected."
      },
      {
        question: "How can I earn money on RockyX?",
        answer: "Creators and eligible sellers will be able to access earning features after payment services are implemented."
      },
      {
        question: "How do I report inappropriate content?",
        answer: "Use the report options when available. Reports in this demonstration are not sent to a moderation team."
      },
      {
        question: "Can I sell products on RockyX?",
        answer: "The Marketplace demonstration shows how product discovery and shopping could work."
      },
      {
        question: "How do I protect my account?",
        answer: "Use a strong, unique password. Account security features will require a secure authentication backend."
      }
    ],

    requests: []
  };

  const escapeHTML = (value) =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);

  function renderSupport() {
    const root = document.querySelector("#app-content");

    if (!root) {
      console.error("RockyX Support: #app-content was not found.");
      return;
    }

    root.innerHTML = `
      <section class="support-page">

        <header class="page-header">
          <span class="section-label">ROCKYX ASSISTANCE</span>
          <h1>Help & Support</h1>
          <p>We're here to help you get the most out of RockyX.</p>
        </header>

        <section class="support-search card">
          <h2>How can we help?</h2>
          <input
            type="search"
            id="support-search"
            placeholder="Search help articles..."
            aria-label="Search help articles"
          >
        </section>

        <section class="support-section">
          <h2>Help Centre</h2>

          <div class="support-options">

            <button class="support-option card" data-support="faq">
              <span class="support-icon">❓</span>
              <span>
                <strong>Frequently Asked Questions</strong>
                <small>Find answers to common questions.</small>
              </span>
              <span>›</span>
            </button>

            <button class="support-option card" data-support="problem">
              <span class="support-icon">🐛</span>
              <span>
                <strong>Report a Problem</strong>
                <small>Tell us about a technical issue.</small>
              </span>
              <span>›</span>
            </button>

            <button class="support-option card" data-support="account">
              <span class="support-icon">🚩</span>
              <span>
                <strong>Report an Account</strong>
                <small>Report suspicious or harmful activity.</small>
              </span>
              <span>›</span>
            </button>

            <button class="support-option card" data-support="safety">
              <span class="support-icon">🛡️</span>
              <span>
                <strong>Safety Guidelines</strong>
                <small>Learn about staying safe on RockyX.</small>
              </span>
              <span>›</span>
            </button>

            <button class="support-option card" data-support="community">
              <span class="support-icon">👥</span>
              <span>
                <strong>Community Guidelines</strong>
                <small>Understand our community standards.</small>
              </span>
              <span>›</span>
            </button>

          </div>
        </section>

        <section class="support-section card">
          <h2>Contact Support</h2>
          <p>Describe your issue below.</p>

          <form id="support-form">

            <label for="support-topic">Issue type</label>
            <select id="support-topic" required>
              <option value="">Choose an issue</option>
              <option>Account access</option>
              <option>Technical problem</option>
              <option>Marketplace</option>
              <option>Payments and earnings</option>
              <option>Safety and privacy</option>
              <option>Other</option>
            </select>

            <label for="support-message">Message</label>
            <textarea
              id="support-message"
              rows="5"
              maxlength="1500"
              placeholder="Explain what happened..."
              required
            ></textarea>

            <button type="submit" class="primary-button">
              Submit demo request
            </button>

          </form>

          <p class="demo-notice">
            Demonstration only: requests are stored temporarily in this browser.
            They are not sent to RockyX support.
          </p>
        </section>

        <section class="support-section card">
          <h2>My Support Requests</h2>
          <div id="support-request-list">
            <p>No support requests yet.</p>
          </div>
        </section>

      </section>
    `;

    attachEvents(root);
  }

  function attachEvents(root) {
    if (root.dataset.supportReady === "true") return;

    root.dataset.supportReady = "true";

    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-support]");

      if (!button) return;

      const type = button.dataset.support;

      if (type === "faq") showFAQs();
      if (type === "problem") focusForm("Technical problem");
      if (type === "account") focusForm("Safety and privacy");
      if (type === "safety") showInformation(
        "Safety Guidelines",
        "Protect your personal information. Avoid sharing passwords, payment details or private information with strangers. Report suspicious activity."
      );
      if (type === "community") showInformation(
        "Community Guidelines",
        "Treat people respectfully. Do not use RockyX to threaten, harass, impersonate, scam or share harmful content."
      );
    });

    root.addEventListener("submit", (event) => {
      if (event.target.id !== "support-form") return;

      event.preventDefault();

      const topic = root.querySelector("#support-topic").value;
      const message = root.querySelector("#support-message").value.trim();

      if (!topic || !message) {
        alert("Please complete both fields.");
        return;
      }

      supportData.requests.unshift({
        id: Date.now(),
        topic,
        message,
        date: new Date().toLocaleString(),
        status: "Demo — not submitted"
      });

      renderRequests(root);

      event.target.reset();

      alert("Demo request created. It has not been sent to support.");
    });

    root.addEventListener("input", (event) => {
      if (event.target.id !== "support-search") return;

      const query = event.target.value.toLowerCase();

      root.querySelectorAll("[data-support]").forEach((button) => {
        button.hidden = !button.textContent.toLowerCase().includes(query);
      });
    });
  }

  function showFAQs() {
    const content = supportData.faqs.map((faq) => `
      <details class="faq-item">
        <summary>${escapeHTML(faq.question)}</summary>
        <p>${escapeHTML(faq.answer)}</p>
      </details>
    `).join("");

    showInformation("Frequently Asked Questions", content, true);
  }

  function showInformation(title, content, isHTML = false) {
    const body = isHTML
      ? content
      : `<p>${escapeHTML(content)}</p>`;

    const existing = document.querySelector("#support-information");

    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "support-information";
    modal.className = "support-modal";

    modal.innerHTML = `
      <div class="support-modal-content card">
        <button class="support-modal-close" aria-label="Close">×</button>
        <h2>${escapeHTML(title)}</h2>
        <div>${body}</div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".support-modal-close").addEventListener("click", () => {
      modal.remove();
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.remove();
    });
  }

  function focusForm(topic) {
    const root = document.querySelector("#app-content");
    const select = root?.querySelector("#support-topic");

    if (!select) return;

    select.value = topic;
    root.querySelector("#support-message")?.focus();
  }

  function renderRequests(root) {
    const container = root.querySelector("#support-request-list");

    if (!supportData.requests.length) {
      container.innerHTML = "<p>No support requests yet.</p>";
      return;
    }

    container.innerHTML = supportData.requests.map((request) => `
      <article class="support-request">
        <strong>${escapeHTML(request.topic)}</strong>
        <p>${escapeHTML(request.message)}</p>
        <small>${escapeHTML(request.date)}</small>
        <p class="demo-notice">${escapeHTML(request.status)}</p>
      </article>
    `).join("");
  }

  const Support = {
    initialize() {
      console.log("RockyX Support module initialized.");
    },

    render: renderSupport
  };

  if (window.RockyX) {
    window.RockyX.registerModule("support", Support);
  } else {
    console.error("RockyX core must load before support.js.");
  }

})();