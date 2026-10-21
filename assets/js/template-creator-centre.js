/* ==========================================
   ROCKYX TEMPLATE CREATOR CENTRE
   Version 1.0 — Prototype
   ========================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_template_creator_centre";

  const state = {
    container: null,
    activeTab: "overview"
  };

  const styles = `
    .rx-tcc {
      background: #100e18;
      color: #fff;
      padding: 18px;
      border-radius: 18px;
      font-family: Arial, sans-serif;
    }

    .rx-tcc * {
      box-sizing: border-box;
    }

    .rx-tcc h2 {
      font-size: 23px;
      margin: 0;
    }

    .rx-tcc h3 {
      font-size: 16px;
      margin: 0 0 12px;
    }

    .rx-tcc p {
      line-height: 1.5;
    }

    .rx-tcc-muted {
      color: #aaa4ba;
      font-size: 13px;
      line-height: 1.5;
    }

    .rx-tcc-button {
      background: #8b5cf6;
      color: #fff;
      border: 0;
      border-radius: 10px;
      padding: 11px 14px;
      cursor: pointer;
      font-weight: 600;
    }

    .rx-tcc-button.secondary {
      background: #292438;
    }

    .rx-tcc-button:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    .rx-tcc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 18px;
    }

    .rx-tcc-hero {
      background: linear-gradient(135deg, #43236d, #211631);
      padding: 20px;
      border-radius: 16px;
      margin-bottom: 18px;
    }

    .rx-tcc-hero h3 {
      font-size: 20px;
      margin-top: 10px;
    }

    .rx-tcc-badge {
      display: inline-block;
      background: #352849;
      color: #e1d2ff;
      padding: 5px 9px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }

    .rx-tcc-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin: 14px 0 20px;
    }

    .rx-tcc-stat {
      background: #201b2b;
      border: 1px solid #332b42;
      padding: 14px;
      border-radius: 13px;
    }

    .rx-tcc-stat strong {
      display: block;
      font-size: 23px;
      margin-bottom: 5px;
    }

    .rx-tcc-stat span {
      color: #aaa4ba;
      font-size: 12px;
    }

    .rx-tcc-tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }

    .rx-tcc-tab {
      flex-shrink: 0;
      background: #211d2d;
      color: #c8bfd8;
      border: 1px solid #393147;
      border-radius: 20px;
      padding: 9px 13px;
      cursor: pointer;
    }

    .rx-tcc-tab.active {
      background: #6941b8;
      color: #fff;
      border-color: #9b7be7;
    }

    .rx-tcc-card {
      background: #1d1928;
      border: 1px solid #332b42;
      padding: 15px;
      border-radius: 13px;
      margin-bottom: 12px;
    }

    .rx-tcc-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
    }

    .rx-tcc-card h4 {
      margin: 0 0 7px;
      font-size: 15px;
    }

    .rx-tcc-status {
      display: inline-block;
      border-radius: 20px;
      background: #30263f;
      color: #d8c5ff;
      padding: 5px 8px;
      font-size: 11px;
      white-space: nowrap;
    }

    .rx-tcc-status.approved {
      background: #173c30;
      color: #a8f0cf;
    }

    .rx-tcc-status.rejected {
      background: #4b222b;
      color: #ffbdc6;
    }

    .rx-tcc-status.pending {
      background: #48371d;
      color: #ffdda0;
    }

    .rx-tcc-field {
      margin-bottom: 15px;
    }

    .rx-tcc-field label {
      display: block;
      font-size: 13px;
      margin-bottom: 7px;
      font-weight: 600;
    }

    .rx-tcc-field input,
    .rx-tcc-field textarea,
    .rx-tcc-field select {
      width: 100%;
      background: #211d2d;
      color: #fff;
      border: 1px solid #3b344d;
      padding: 12px;
      border-radius: 10px;
      font: inherit;
    }

    .rx-tcc-field textarea {
      min-height: 90px;
      resize: vertical;
    }

    .rx-tcc-notice {
      background: #211d2d;
      border: 1px solid #423652;
      padding: 13px;
      border-radius: 11px;
      margin: 12px 0;
      color: #d5c9e8;
      font-size: 13px;
      line-height: 1.5;
    }

    .rx-tcc-empty {
      text-align: center;
      padding: 28px 12px;
      background: #1d1928;
      border-radius: 13px;
      color: #aaa4ba;
      font-size: 13px;
    }

    .rx-tcc-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 13px;
    }

    @media (max-width: 360px) {
      .rx-tcc-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(
      /[&<>"']/g,
      function (character) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[character];
      }
    );
  }

  function getData() {
    const defaults = {
      application: null,
      templates: [],
      tasks: []
    };

    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "null"
      );

      if (!saved || typeof saved !== "object") {
        return defaults;
      }

      return {
        application: saved.application || null,
        templates: Array.isArray(saved.templates)
          ? saved.templates
          : [],
        tasks: Array.isArray(saved.tasks)
          ? saved.tasks
          : []
      };
    } catch (error) {
      return defaults;
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );

      return true;
    } catch (error) {
      alert(
        "Could not save. Browser storage may be full."
      );

      return false;
    }
  }

  function statusClass(status) {
    if (status === "approved") return "approved";
    if (status === "rejected") return "rejected";
    if (
      status === "pending" ||
      status === "pending-review"
    ) {
      return "pending";
    }

    return "";
  }

  function statusLabel(status) {
    const labels = {
      draft: "Draft",
      pending: "Pending review",
      "pending-review": "Pending review",
      approved: "Approved",
      rejected: "Rejected"
    };

    return labels[status] || "Draft";
  }

  function renderOverview() {
    const data = getData();
    const application = data.application;

    const approved = data.templates.filter(function (item) {
      return item.status === "approved";
    }).length;

    const pending = data.templates.filter(function (item) {
      return item.status === "pending-review" ||
        item.status === "pending";
    }).length;

    const applicationStatus = application
      ? statusLabel(application.status)
      : "Not applied";

    return `
      <div class="rx-tcc-hero">
        <span class="rx-tcc-badge">ROCKYX CREATORS</span>
        <h3>Template Creator Centre</h3>
        <p class="rx-tcc-muted">
          Manage template drafts, prepare applications,
          and follow your template submissions.
        </p>

        <div class="rx-tcc-actions">
          <button
            class="rx-tcc-button"
            type="button"
            data-action="apply"
          >
            ${application ? "View Application" : "Apply to Join"}
          </button>

          <button
            class="rx-tcc-button secondary"
            type="button"
            data-action="open-editor"
          >
            Create Template
          </button>
        </div>
      </div>

      <div class="rx-tcc-grid">
        <div class="rx-tcc-stat">
          <strong>${data.templates.length}</strong>
          <span>My Templates</span>
        </div>

        <div class="rx-tcc-stat">
          <strong>${approved}</strong>
          <span>Approved Templates</span>
        </div>

        <div class="rx-tcc-stat">
          <strong>${pending}</strong>
          <span>Pending Review</span>
        </div>

        <div class="rx-tcc-stat">
          <strong>${escapeHTML(applicationStatus)}</strong>
          <span>Application Status</span>
        </div>
      </div>

      <div class="rx-tcc-notice">
        <strong>Prototype notice</strong><br>
        These records are saved only in this browser.
        Real creator verification, template approval,
        usage analytics, rewards and payouts require a
        secure RockyX backend.
      </div>

      <div class="rx-tcc-card">
        <h3>Creator eligibility</h3>
        <p class="rx-tcc-muted">
          RockyX will use an eligibility and review process
          before enabling template publishing. An application
          saved here does not grant creator permissions.
        </p>
        <button
          class="rx-tcc-button secondary"
          type="button"
          data-action="eligibility"
        >
          View Requirements
        </button>
      </div>
    `;
  }

  function renderApplication() {
    const data = getData();
    const application = data.application;

    if (application) {
      return `
        <div class="rx-tcc-card">
          <h3>Your local application</h3>
          <p class="rx-tcc-muted">
            Status:
            <span class="rx-tcc-status ${statusClass(application.status)}">
              ${escapeHTML(statusLabel(application.status))}
            </span>
          </p>
          <p><strong>Name:</strong>
            ${escapeHTML(application.displayName)}</p>
          <p><strong>Experience:</strong>
            ${escapeHTML(application.experience)}</p>
          <p><strong>Portfolio:</strong>
            ${escapeHTML(application.portfolio || "Not provided")}</p>
          <p class="rx-tcc-muted">
            Saved ${escapeHTML(application.updatedAt || "")}
          </p>

          <div class="rx-tcc-notice">
            This is a local record, not an official RockyX
            application. No administrator has reviewed it.
          </div>

          <button
            class="rx-tcc-button"
            type="button"
            data-action="edit-application"
          >
            Edit Application
          </button>
        </div>
      `;
    }

    return `
      <div class="rx-tcc-card">
        <h3>Apply to become a template creator</h3>
        <p class="rx-tcc-muted">
          Tell RockyX about your experience and the templates
          you want to create.
        </p>

        <form id="rx-tcc-application-form">
          <div class="rx-tcc-field">
            <label for="rx-tcc-display-name">
              Creator display name
            </label>
            <input
              id="rx-tcc-display-name"
              maxlength="60"
              required
              placeholder="Your creator name"
            >
          </div>

          <div class="rx-tcc-field">
            <label for="rx-tcc-experience">
              Experience
            </label>
            <select id="rx-tcc-experience" required>
              <option value="">Select experience</option>
              <option>Beginner</option>
              <option>Some experience</option>
              <option>Experienced creator</option>
              <option>Professional editor</option>
            </select>
          </div>

          <div class="rx-tcc-field">
            <label for="rx-tcc-portfolio">
              Portfolio link (optional)
            </label>
            <input
              id="rx-tcc-portfolio"
              type="url"
              placeholder="https://..."
            >
          </div>

          <div class="rx-tcc-field">
            <label for="rx-tcc-reason">
              Why do you want to create templates?
            </label>
            <textarea
              id="rx-tcc-reason"
              maxlength="1000"
              required
              placeholder="Describe your ideas and plans..."
            ></textarea>
          </div>

          <button class="rx-tcc-button" type="submit">
            Save Application
          </button>
        </form>

        <div class="rx-tcc-notice">
          This saves a local application draft only. Real
          submission and approval will be connected later.
        </div>
      </div>
    `;
  }

  function renderTemplates() {
    const data = getData();

    if (!data.templates.length) {
      return `
        <div class="rx-tcc-empty">
          <h3>No templates yet</h3>
          Your template drafts and submissions will appear here
          after the editor is connected.
          <div class="rx-tcc-actions" style="justify-content:center">
            <button
              class="rx-tcc-button"
              type="button"
              data-action="open-editor"
            >
              Create a Template
            </button>
          </div>
        </div>
      `;
    }

    return data.templates.map(function (item) {
      return `
        <div class="rx-tcc-card">
          <div class="rx-tcc-card-top">
            <div>
              <h4>${escapeHTML(item.name || "Untitled template")}</h4>
              <p class="rx-tcc-muted">
                ${escapeHTML(item.category || "Other")}
                · ${escapeHTML(item.access || "Free")}
              </p>
            </div>

            <span class="rx-tcc-status ${statusClass(item.status)}">
              ${escapeHTML(statusLabel(item.status))}
            </span>
          </div>

          <p class="rx-tcc-muted">
            ${escapeHTML(item.description || "No description")}
          </p>

          <div class="rx-tcc-actions">
            <button
              class="rx-tcc-button secondary"
              type="button"
              data-action="view-template"
              data-id="${escapeHTML(item.id)}"
            >
              View Details
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderTasks() {
    const data = getData();

    return `
      <div class="rx-tcc-notice">
        Creator tasks and rewards are not connected to a
        backend yet. No rewards or earnings are generated
        by this prototype.
      </div>

      <div class="rx-tcc-card">
        <h3>Template creator tasks</h3>
        <p class="rx-tcc-muted">
          The future system can list official challenges,
          deadlines, eligibility rules and verified rewards.
        </p>
        <span class="rx-tcc-badge">Coming later</span>
      </div>

      <div class="rx-tcc-card">
        <h3>Analytics and earnings</h3>
        <p class="rx-tcc-muted">
          Verified template uses, views, eligible rewards,
          earnings and payout history will require real
          server-side records.
        </p>
        <span class="rx-tcc-badge">Backend required</span>
      </div>

      <div class="rx-tcc-card">
        <h3>Saved local records</h3>
        <p class="rx-tcc-muted">
          ${data.templates.length} template record(s) currently
          saved on this device.
        </p>
      </div>
    `;
  }

  function renderEligibility() {
    return `
      <div class="rx-tcc-card">
        <h3>Template creator requirements</h3>

        <p class="rx-tcc-muted">
          These are proposed RockyX requirements for planning,
          not active eligibility rules.
        </p>

        <ul class="rx-tcc-muted">
          <li>A valid RockyX account.</li>
          <li>Agreement to creator and content rules.</li>
          <li>Original or properly licensed media.</li>
          <li>Templates that work as described.</li>
          <li>Compliance with music and intellectual property rules.</li>
          <li>Successful review by authorized RockyX staff.</li>
        </ul>

        <div class="rx-tcc-notice">
          Only a secure backend and authorized administrator
          can grant creator approval. Changing browser data
          must never grant publishing permission.
        </div>

        <button
          class="rx-tcc-button"
          type="button"
          data-action="apply"
        >
          Open Application
        </button>
      </div>
    `;
  }

  function renderDetail(id) {
    const data = getData();

    const item = data.templates.find(function (template) {
      return template.id === id;
    });

    if (!item) {
      return `
        <div class="rx-tcc-empty">
          Template not found.
        </div>
      `;
    }

    return `
      <div class="rx-tcc-card">
        <h3>${escapeHTML(item.name || "Untitled template")}</h3>

        <p class="rx-tcc-muted">
          Status:
          ${escapeHTML(statusLabel(item.status))}
        </p>

        <p>${escapeHTML(item.description || "No description")}</p>

        <p class="rx-tcc-muted">
          Category: ${escapeHTML(item.category || "Other")}<br>
          Access: ${escapeHTML(item.access || "Free")}<br>
          Media slots: ${
            Array.isArray(item.clips) ? item.clips.length : 0
          }<br>
          Effects: ${
            Array.isArray(item.effects)
              ? escapeHTML(item.effects.join(", ") || "None")
              : "None"
          }
        </p>

        <div class="rx-tcc-notice">
          Usage analytics and publication status cannot be
          verified in this local prototype.
        </div>

        <button
          class="rx-tcc-button secondary"
          type="button"
          data-action="templates"
        >
          Back to My Templates
        </button>
      </div>
    `;
  }

  function render() {
    if (!state.container) return;

    const views = {
      overview: renderOverview,
      application: renderApplication,
      templates: renderTemplates,
      tasks: renderTasks,
      eligibility: renderEligibility
    };

    const renderView = views[state.activeTab] || renderOverview;

    state.container.innerHTML = `
      <div class="rx-tcc">
        <div class="rx-tcc-header">
          <h2>Creator Centre</h2>
          <span class="rx-tcc-badge">ROCKYX</span>
        </div>

        <p class="rx-tcc-muted">
          Your workspace for RockyX template creation.
        </p>

        <div class="rx-tcc-tabs">
          <button
            class="rx-tcc-tab ${state.activeTab === "overview" ? "active" : ""}"
            type="button"
            data-tab="overview"
          >Overview</button>

          <button
            class="rx-tcc-tab ${state.activeTab === "application" ? "active" : ""}"
            type="button"
            data-tab="application"
          >Application</button>

          <button
            class="rx-tcc-tab ${state.activeTab === "templates" ? "active" : ""}"
            type="button"
            data-tab="templates"
          >My Templates</button>

          <button
            class="rx-tcc-tab ${state.activeTab === "tasks" ? "active" : ""}"
            type="button"
            data-tab="tasks"
          >Tasks & Analytics</button>
        </div>

        <div id="rx-tcc-content">
          ${renderView()}
        </div>
      </div>
    `;
  }

  function handleSubmit(event) {
    if (event.target.id !== "rx-tcc-application-form") {
      return;
    }

    event.preventDefault();

    const displayName = state.container.querySelector(
      "#rx-tcc-display-name"
    ).value.trim();

    const experience = state.container.querySelector(
      "#rx-tcc-experience"
    ).value;

    const portfolio = state.container.querySelector(
      "#rx-tcc-portfolio"
    ).value.trim();

    const reason = state.container.querySelector(
      "#rx-tcc-reason"
    ).value.trim();

    if (!displayName || !experience || !reason) {
      alert("Please complete all required fields.");
      return;
    }

    const data = getData();

    data.application = {
      displayName: displayName,
      experience: experience,
      portfolio: portfolio,
      reason: reason,
      status: "pending",
      updatedAt: new Date().toISOString()
    };

    if (!saveData(data)) return;

    alert(
      "Application saved on this device. " +
      "It has not been sent to RockyX for review."
    );

    state.activeTab = "application";
    render();
  }

  function handleClick(event) {
    const tabButton = event.target.closest("[data-tab]");

    if (tabButton) {
      state.activeTab = tabButton.dataset.tab;
      render();
      return;
    }

    const actionButton = event.target.closest("[data-action]");

    if (!actionButton) return;

    const action = actionButton.dataset.action;

    if (action === "apply" || action === "edit-application") {
      const data = getData();

      if (action === "edit-application") {
        data.application = null;

        if (!saveData(data)) return;
      }

      state.activeTab = "application";
      render();

      if (action === "edit-application") {
        const previous = getData().application;

        // The existing application is intentionally retained
        // unless the user chooses to replace it.
        if (previous) {
          state.container.querySelector(
            "#rx-tcc-display-name"
          ).value = previous.displayName || "";
        }
      }

      return;
    }

    if (action === "templates") {
      state.activeTab = "templates";
      render();
      return;
    }

    if (action === "eligibility") {
      state.activeTab = "eligibility";
      render();
      return;
    }

    if (action === "view-template") {
      const id = actionButton.dataset.id;
      const content = state.container.querySelector(
        "#rx-tcc-content"
      );

      content.innerHTML = renderDetail(id);
      return;
    }

    if (action === "open-editor") {
      state.container.dispatchEvent(
        new CustomEvent("rockyx:open-template-editor", {
          bubbles: true
        })
      );

      alert(
        "The Template Editor module is separate. " +
        "Connecting the two screens is the next integration step."
      );
    }
  }

  function init(options) {
    options = options || {};

    const container =
      options.container ||
      document.querySelector("#page-Studio");

    if (!container) {
      console.error(
        "RockyX Template Creator Centre: container not found."
      );

      return false;
    }

    destroy();

    state.container = container;
    state.activeTab = "overview";

    if (!document.getElementById("rockyx-tcc-styles")) {
      const style = document.createElement("style");
      style.id = "rockyx-tcc-styles";
      style.textContent = styles;
      document.head.appendChild(style);
    }

    container.addEventListener("click", handleClick);
    container.addEventListener("submit", handleSubmit);

    render();

    return true;
  }

  function destroy() {
    if (!state.container) return;

    state.container.removeEventListener("click", handleClick);
    state.container.removeEventListener("submit", handleSubmit);

    state.container = null;
  }

  window.RockyXTemplateCreatorCentre = {
    init: init,
    destroy: destroy,
    render: render,
    getData: getData
  };
})();