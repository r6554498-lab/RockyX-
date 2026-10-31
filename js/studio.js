/* =========================================================
   ROCKYX — CREATOR STUDIO
   Version: 1.0.0
   Status: Front-end foundation with demonstration data
   ========================================================= */

(function () {
  "use strict";

  const RockyXStudio = {
    name: "studio",
    version: "1.0.0",

    activeTab: "Overview",

    tabs: [
      "Overview",
      "Content",
      "Drafts",
      "Audience"
    ],

    // All figures below are fictional demonstration data.
    stats: {
      views: 128450,
      followers: 8420,
      likes: 24680,
      engagement: 7.8,
      earnings: 2450.00
    },

    content: [
      {
        id: "content-001",
        title: "A day in my life",
        type: "Video",
        status: "Published",
        views: 24500,
        likes: 3200,
        comments: 184,
        date: "Today"
      },
      {
        id: "content-002",
        title: "My creative journey",
        type: "Video",
        status: "Published",
        views: 18200,
        likes: 2100,
        comments: 126,
        date: "Yesterday"
      },
      {
        id: "content-003",
        title: "Behind the scenes",
        type: "Post",
        status: "Published",
        views: 8900,
        likes: 940,
        comments: 65,
        date: "Monday"
      },
      {
        id: "content-004",
        title: "New video idea",
        type: "Video",
        status: "Draft",
        views: 0,
        likes: 0,
        comments: 0,
        date: "Not published"
      }
    ],

    initialize() {
      console.log("RockyX Creator Studio initialized.");
    },

    escapeHTML(value) {
      return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]);
    },

    formatNumber(value) {
      return new Intl.NumberFormat("en").format(value);
    },

    formatMoney(value) {
      return new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS"
      }).format(value);
    },

    render() {
      const screen = document.getElementById("app-screen");

      if (!screen) {
        console.error("RockyX Studio: app-screen not found.");
        return;
      }

      screen.innerHTML = `
        <section class="studio-page">

          <header class="studio-heading">

            <div>
              <span class="studio-eyebrow">
                ROCKYX FOR CREATORS
              </span>

              <h1>Creator Studio</h1>

              <p>
                Manage your content, audience and creator activity.
              </p>
            </div>

            <span class="studio-demo-badge">
              DEMO DATA
            </span>

          </header>

          <div class="studio-notice">
            <strong>Demonstration dashboard</strong>
            <p>
              These statistics and earnings are fictional.
              Real creator analytics will be connected later.
            </p>
          </div>

          <nav class="studio-tabs" aria-label="Studio sections">

            ${this.tabs.map((tab) => `
              <button
                type="button"
                class="studio-tab ${
                  this.activeTab === tab ? "active" : ""
                }"
                data-studio-tab="${this.escapeHTML(tab)}"
              >
                ${this.escapeHTML(tab)}
              </button>
            `).join("")}

          </nav>

          <div class="studio-content">

            ${this.renderActiveTab()}

          </div>

        </section>
      `;

      this.attachEvents(screen);
    },

    renderActiveTab() {
      switch (this.activeTab) {
        case "Content":
          return this.renderContent();

        case "Drafts":
          return this.renderDrafts();

        case "Audience":
          return this.renderAudience();

        default:
          return this.renderOverview();
      }
    },

    renderOverview() {
      return `
        <section class="studio-overview">

          <div class="studio-section-heading">
            <div>
              <h2>Your performance</h2>
              <p>Overview of your creator activity.</p>
            </div>
          </div>

          <div class="studio-stats-grid">

            <article class="studio-stat-card">
              <span>Total views</span>
              <strong>
                ${this.formatNumber(this.stats.views)}
              </strong>
              <small>Lifetime demo views</small>
            </article>

            <article class="studio-stat-card">
              <span>Followers</span>
              <strong>
                ${this.formatNumber(this.stats.followers)}
              </strong>
              <small>Demo audience size</small>
            </article>

            <article class="studio-stat-card">
              <span>Total likes</span>
              <strong>
                ${this.formatNumber(this.stats.likes)}
              </strong>
              <small>Demo interactions</small>
            </article>

            <article class="studio-stat-card">
              <span>Engagement</span>
              <strong>
                ${this.stats.engagement}%
              </strong>
              <small>Sample engagement rate</small>
            </article>

          </div>

          <section class="studio-earnings-card">

            <div>
              <span>Creator earnings</span>
              <h2>${this.formatMoney(this.stats.earnings)}</h2>
              <small>Fictional demonstration balance</small>
            </div>

            <span class="studio-earnings-icon">↗</span>

          </section>

          <section class="studio-quick-actions">

            <h2>Quick actions</h2>

            <div class="studio-action-grid">

              <button
                type="button"
                data-studio-action="create"
              >
                <span>＋</span>
                Create content
              </button>

              <button
                type="button"
                data-studio-action="editor"
              >
                <span>✎</span>
                Open editor
              </button>

              <button
                type="button"
                data-studio-action="templates"
              >
                <span>▦</span>
                Browse templates
              </button>

              <button
                type="button"
                data-studio-action="music"
              >
                <span>♫</span>
                Music library
              </button>

            </div>

          </section>

          <section class="studio-recent-content">

            <div class="studio-section-heading">
              <h2>Recent content</h2>

              <button
                type="button"
                data-studio-tab="Content"
              >
                View all
              </button>
            </div>

            ${this.content.slice(0, 3).map((item) => `
              <article class="studio-content-row">

                <div class="studio-content-icon">
                  ${item.type === "Video" ? "▶" : "▤"}
                </div>

                <div class="studio-content-info">
                  <strong>
                    ${this.escapeHTML(item.title)}
                  </strong>

                  <span>
                    ${this.escapeHTML(item.date)}
                  </span>
                </div>

                <span class="studio-content-status">
                  ${this.escapeHTML(item.status)}
                </span>

              </article>
            `).join("")}

          </section>

        </section>
      `;
    },

    renderContent() {
      const published = this.content.filter(
        (item) => item.status === "Published"
      );

      return `
        <section class="studio-content-library">

          <div class="studio-section-heading">
            <div>
              <h2>Your content</h2>
              <p>Manage your published creations.</p>
            </div>

            <span>${published.length} published</span>
          </div>

          ${
            published.length
              ? published.map((item) => `
                <article class="studio-content-row">

                  <div class="studio-content-icon">▶</div>

                  <div class="studio-content-info">
                    <strong>
                      ${this.escapeHTML(item.title)}
                    </strong>

                    <span>
                      ${this.escapeHTML(item.date)}
                      ·
                      ${this.escapeHTML(item.type)}
                    </span>

                    <span>
                      ${this.formatNumber(item.views)} views
                      ·
                      ${this.formatNumber(item.likes)} likes
                      ·
                      ${this.formatNumber(item.comments)} comments
                    </span>
                  </div>

                  <span class="studio-content-status">
                    Published
                  </span>

                </article>
              `).join("")
              : "<p>No published content yet.</p>"
          }

        </section>
      `;
    },

    renderDrafts() {
      const drafts = this.content.filter(
        (item) => item.status === "Draft"
      );

      return `
        <section class="studio-drafts">

          <div class="studio-section-heading">
            <div>
              <h2>Your drafts</h2>
              <p>Continue working on unfinished content.</p>
            </div>

            <span>${drafts.length} drafts</span>
          </div>

          ${
            drafts.length
              ? drafts.map((item) => `
                <article class="studio-content-row">

                  <div class="studio-content-icon">✎</div>

                  <div class="studio-content-info">
                    <strong>
                      ${this.escapeHTML(item.title)}
                    </strong>

                    <span>
                      ${this.escapeHTML(item.date)}
                    </span>
                  </div>

                  <button
                    type="button"
                    class="studio-edit-draft"
                    data-edit-draft="${this.escapeHTML(item.id)}"
                  >
                    Edit
                  </button>

                </article>
              `).join("")
              : `
                <div class="studio-empty">
                  <h3>No drafts yet</h3>
                  <p>Your unfinished content will appear here.</p>
                </div>
              `
          }

        </section>
      `;
    },

    renderAudience() {
      return `
        <section class="studio-audience">

          <div class="studio-section-heading">
            <div>
              <h2>Audience insights</h2>
              <p>Understand your creator audience.</p>
            </div>
          </div>

          <div class="studio-audience-card">

            <span>Total followers</span>

            <strong>
              ${this.formatNumber(this.stats.followers)}
            </strong>

            <p>Demonstration audience figure.</p>

          </div>

          <div class="studio-insight-card">

            <h3>Audience analytics</h3>

            <p>
              Audience demographics, active hours, locations,
              follower growth and retention will appear here
              after real analytics are connected.
            </p>

            <span class="studio-coming-soon">
              ANALYTICS IN DEVELOPMENT
            </span>

          </div>

        </section>
      `;
    },

    attachEvents(screen) {
      if (screen.dataset.studioEvents === "true") {
        return;
      }

      screen.dataset.studioEvents = "true";

      screen.addEventListener("click", (event) => {

        const tabButton = event.target.closest(
          "[data-studio-tab]"
        );

        if (tabButton) {
          this.activeTab = tabButton.dataset.studioTab;
          this.render();
          return;
        }

        const actionButton = event.target.closest(
          "[data-studio-action]"
        );

        if (actionButton) {
          this.handleAction(
            actionButton.dataset.studioAction
          );

          return;
        }

        const editButton = event.target.closest(
          "[data-edit-draft]"
        );

        if (editButton) {
          const draftId = editButton.dataset.editDraft;

          window.dispatchEvent(
            new CustomEvent("rockyx:draft-edit-request", {
              detail: {
                draftId
              }
            })
          );

          alert(
            "Draft editing will be connected to the editor module."
          );
        }

      });
    },

    handleAction(action) {
      const eventNames = {
        create: "rockyx:create-request",
        editor: "rockyx:editor-request",
        templates: "rockyx:templates-request",
        music: "rockyx:music-request"
      };

      if (!eventNames[action]) {
        return;
      }

      window.dispatchEvent(
        new CustomEvent(eventNames[action])
      );

      alert(
        "This destination will be connected when RockyX navigation is integrated."
      );
    }
  };

  window.RockyXStudio = RockyXStudio;

  if (
    window.RockyX &&
    typeof window.RockyX.registerModule === "function"
  ) {
    window.RockyX.registerModule(
      "studio",
      RockyXStudio
    );
  }

})();