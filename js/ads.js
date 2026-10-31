/* =========================================================
   ROCKYX — PROMOTE & ADS MANAGER
   Version: 1.0.0
   Status: Front-end foundation with demo campaign data
   ========================================================= */

(function () {
  "use strict";

  const RockyXAds = {
    name: "ads",
    version: "1.0.0",

    activeTab: "Overview",

    tabs: [
      "Overview",
      "Campaigns",
      "Create campaign"
    ],

    // Demonstration data only. No real advertising is running.
    campaigns: [
      {
        id: "campaign-001",
        name: "Summer Collection",
        platform: "RockyX",
        objective: "Reach",
        budget: 500,
        spent: 320,
        impressions: 12500,
        clicks: 840,
        status: "Active",
        duration: "7 days"
      },
      {
        id: "campaign-002",
        name: "Creator Introduction",
        platform: "RockyX",
        objective: "Engagement",
        budget: 300,
        spent: 300,
        impressions: 8700,
        clicks: 620,
        status: "Completed",
        duration: "5 days"
      },
      {
        id: "campaign-003",
        name: "New Product Launch",
        platform: "RockyX",
        objective: "Traffic",
        budget: 750,
        spent: 0,
        impressions: 0,
        clicks: 0,
        status: "Paused",
        duration: "10 days"
      }
    ],

    initialize() {
      console.log("RockyX Ads Manager initialized.");
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

    formatMoney(amount) {
      return new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS"
      }).format(amount);
    },

    getActiveCampaigns() {
      return this.campaigns.filter(
        (campaign) => campaign.status === "Active"
      );
    },

    getTotalBudget() {
      return this.campaigns.reduce(
        (total, campaign) => total + campaign.budget,
        0
      );
    },

    getTotalSpent() {
      return this.campaigns.reduce(
        (total, campaign) => total + campaign.spent,
        0
      );
    },

    getTotalImpressions() {
      return this.campaigns.reduce(
        (total, campaign) => total + campaign.impressions,
        0
      );
    },

    getTotalClicks() {
      return this.campaigns.reduce(
        (total, campaign) => total + campaign.clicks,
        0
      );
    },

    render() {
      const screen = document.getElementById("app-screen");

      if (!screen) {
        console.error("RockyX Ads: app-screen not found.");
        return;
      }

      screen.innerHTML = `
        <section class="ads-page">

          <header class="ads-heading">
            <div>
              <span class="ads-eyebrow">
                GROW YOUR AUDIENCE
              </span>

              <h1>Promote & Ads Manager</h1>

              <p>
                Create and manage promotional campaigns.
              </p>
            </div>

            <span class="ads-demo-badge">DEMO</span>
          </header>

          <div class="ads-demo-notice">
            <strong>Demonstration advertising dashboard</strong>
            <p>
              All campaigns, budgets and performance figures are fictional.
              No advertisements are being delivered and no money is being spent.
            </p>
          </div>

          <nav class="ads-tabs">

            ${this.tabs.map((tab) => `
              <button
                type="button"
                class="ads-tab ${
                  this.activeTab === tab ? "active" : ""
                }"
                data-ads-tab="${this.escapeHTML(tab)}"
              >
                ${this.escapeHTML(tab)}
              </button>
            `).join("")}

          </nav>

          <div class="ads-content">
            ${this.renderActiveTab()}
          </div>

        </section>
      `;

      this.attachEvents(screen);
    },

    renderActiveTab() {
      switch (this.activeTab) {
        case "Campaigns":
          return this.renderCampaigns();

        case "Create campaign":
          return this.renderCreateCampaign();

        default:
          return this.renderOverview();
      }
    },

    renderOverview() {
      return `
        <section class="ads-overview">

          <div class="ads-section-heading">
            <h2>Campaign performance</h2>
            <span>Sample figures</span>
          </div>

          <div class="ads-stats-grid">

            <article class="ads-stat-card">
              <span>Total budget</span>
              <strong>
                ${this.formatMoney(this.getTotalBudget())}
              </strong>
            </article>

            <article class="ads-stat-card">
              <span>Total spent</span>
              <strong>
                ${this.formatMoney(this.getTotalSpent())}
              </strong>
            </article>

            <article class="ads-stat-card">
              <span>Impressions</span>
              <strong>
                ${this.getTotalImpressions().toLocaleString()}
              </strong>
            </article>

            <article class="ads-stat-card">
              <span>Clicks</span>
              <strong>
                ${this.getTotalClicks().toLocaleString()}
              </strong>
            </article>

          </div>

          <section class="ads-quick-create">

            <div>
              <h2>Ready to promote?</h2>
              <p>
                Set up a demonstration campaign.
              </p>
            </div>

            <button
              type="button"
              data-ads-tab="Create campaign"
            >
              Create campaign
            </button>

          </section>

          <section class="ads-recent-campaigns">

            <div class="ads-section-heading">
              <h2>Recent campaigns</h2>

              <button
                type="button"
                data-ads-tab="Campaigns"
              >
                View all
              </button>
            </div>

            ${this.campaigns.slice(0, 3).map((campaign) => `
              ${this.renderCampaignCard(campaign)}
            `).join("")}

          </section>

        </section>
      `;
    },

    renderCampaigns() {
      return `
        <section class="ads-campaigns">

          <div class="ads-section-heading">
            <div>
              <h2>Your campaigns</h2>
              <p>Manage your promotional activity.</p>
            </div>

            <button
              type="button"
              data-ads-tab="Create campaign"
            >
              + New campaign
            </button>
          </div>

          ${
            this.campaigns.length
              ? this.campaigns.map((campaign) => `
                  ${this.renderCampaignCard(campaign)}
                `).join("")
              : `
                <div class="ads-empty">
                  <h3>No campaigns yet</h3>
                  <p>Create your first campaign.</p>
                </div>
              `
          }

        </section>
      `;
    },

    renderCampaignCard(campaign) {
      const progress = campaign.budget > 0
        ? Math.min(
            100,
            (campaign.spent / campaign.budget) * 100
          )
        : 0;

      return `
        <article class="ads-campaign-card">

          <div class="ads-campaign-top">

            <div>
              <h3>${this.escapeHTML(campaign.name)}</h3>

              <span>
                ${this.escapeHTML(campaign.objective)}
                ·
                ${this.escapeHTML(campaign.duration)}
              </span>
            </div>

            <span class="ads-status ${
              campaign.status.toLowerCase()
            }">
              ${this.escapeHTML(campaign.status)}
            </span>

          </div>

          <div class="ads-budget-row">
            <span>Budget used</span>

            <strong>
              ${this.formatMoney(campaign.spent)}
              /
              ${this.formatMoney(campaign.budget)}
            </strong>
          </div>

          <div
            class="ads-progress-track"
            role="progressbar"
            aria-valuenow="${Math.round(progress)}"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Demonstration budget usage"
          >
            <div
              class="ads-progress-fill"
              style="width: ${progress}%"
            ></div>
          </div>

          <div class="ads-campaign-metrics">
            <span>
              ${campaign.impressions.toLocaleString()} impressions
            </span>

            <span>
              ${campaign.clicks.toLocaleString()} clicks
            </span>
          </div>

          <div class="ads-campaign-actions">

            ${
              campaign.status !== "Completed"
                ? `
                  <button
                    type="button"
                    data-ads-toggle="${this.escapeHTML(campaign.id)}"
                  >
                    ${
                      campaign.status === "Active"
                        ? "Pause campaign"
                        : "Activate campaign"
                    }
                  </button>
                `
                : '<span>Campaign completed</span>'
            }

          </div>

        </article>
      `;
    },

    renderCreateCampaign() {
      return `
        <section class="ads-create-campaign">

          <div class="ads-section-heading">
            <div>
              <h2>Create a campaign</h2>
              <p>Configure your demonstration advertisement.</p>
            </div>
          </div>

          <form id="ads-create-form">

            <div class="ads-form-group">
              <label for="ads-campaign-name">
                Campaign name
              </label>

              <input
                id="ads-campaign-name"
                name="campaignName"
                type="text"
                maxlength="80"
                placeholder="Enter campaign name"
                required
              >
            </div>

            <div class="ads-form-group">
              <label for="ads-objective">
                Campaign objective
              </label>

              <select
                id="ads-objective"
                name="objective"
                required
              >
                <option value="">Choose objective</option>
                <option value="Reach">Reach</option>
                <option value="Engagement">Engagement</option>
                <option value="Traffic">Traffic</option>
                <option value="Followers">Grow followers</option>
                <option value="Sales">Sales</option>
              </select>
            </div>

            <div class="ads-form-group">
              <label for="ads-audience">
                Target audience
              </label>

              <select
                id="ads-audience"
                name="audience"
                required
              >
                <option value="">Choose audience</option>
                <option value="Everyone">Everyone</option>
                <option value="Creators">Creators</option>
                <option value="Businesses">Businesses</option>
                <option value="Interested users">Interested users</option>
              </select>
            </div>

            <div class="ads-form-group">
              <label for="ads-budget">
                Campaign budget (GHS)
              </label>

              <input
                id="ads-budget"
                name="budget"
                type="number"
                min="1"
                max="100000"
                step="0.01"
                placeholder="Enter budget"
                required
              >
            </div>

            <div class="ads-form-group">
              <label for="ads-duration">
                Campaign duration
              </label>

              <select
                id="ads-duration"
                name="duration"
                required
              >
                <option value="">Choose duration</option>
                <option value="1 day">1 day</option>
                <option value="3 days">3 days</option>
                <option value="7 days">7 days</option>
                <option value="14 days">14 days</option>
                <option value="30 days">30 days</option>
              </select>
            </div>

            <div class="ads-form-warning">
              This creates a local demonstration campaign only.
              It will not publish an advertisement or charge money.
            </div>

            <button
              type="submit"
              class="ads-submit-button"
            >
              Create demo campaign
            </button>

          </form>

        </section>
      `;
    },

    attachEvents(screen) {
      if (screen.dataset.adsEvents === "true") {
        return;
      }

      screen.dataset.adsEvents = "true";

      screen.addEventListener("click", (event) => {

        const tabButton = event.target.closest(
          "[data-ads-tab]"
        );

        if (tabButton) {
          this.activeTab = tabButton.dataset.adsTab;
          this.render();
          return;
        }

        const toggleButton = event.target.closest(
          "[data-ads-toggle]"
        );

        if (toggleButton) {
          this.toggleCampaign(
            toggleButton.dataset.adsToggle
          );

          this.render();
        }

      });

      screen.addEventListener("submit", (event) => {
        if (event.target.id !== "ads-create-form") {
          return;
        }

        event.preventDefault();

        this.createCampaign(
          new FormData(event.target)
        );
      });
    },

    createCampaign(formData) {
      const name = String(
        formData.get("campaignName") || ""
      ).trim();

      const objective = String(
        formData.get("objective") || ""
      );

      const audience = String(
        formData.get("audience") || ""
      );

      const budget = Number(
        formData.get("budget")
      );

      const duration = String(
        formData.get("duration") || ""
      );

      const validObjectives = [
        "Reach",
        "Engagement",
        "Traffic",
        "Followers",
        "Sales"
      ];

      const validAudiences = [
        "Everyone",
        "Creators",
        "Businesses",
        "Interested users"
      ];

      const validDurations = [
        "1 day",
        "3 days",
        "7 days",
        "14 days",
        "30 days"
      ];

      if (
        !name ||
        !validObjectives.includes(objective) ||
        !validAudiences.includes(audience) ||
        !validDurations.includes(duration) ||
        !Number.isFinite(budget) ||
        budget <= 0 ||
        budget > 100000
      ) {
        alert("Please enter valid campaign details.");
        return;
      }

      const campaign = {
        id: `campaign-${Date.now()}`,
        name,
        platform: "RockyX",
        objective,
        audience,
        budget,
        spent: 0,
        impressions: 0,
        clicks: 0,
        status: "Paused",
        duration
      };

      this.campaigns.unshift(campaign);

      this.activeTab = "Campaigns";
      this.render();

      alert(
        "Your demonstration campaign has been created. It is paused and will not run."
      );
    },

    toggleCampaign(campaignId) {
      const campaign = this.campaigns.find(
        (item) => item.id === campaignId
      );

      if (!campaign || campaign.status === "Completed") {
        return;
      }

      campaign.status =
        campaign.status === "Active"
          ? "Paused"
          : "Active";
    }
  };

  window.RockyXAds = RockyXAds;

  if (
    window.RockyX &&
    typeof window.RockyX.registerModule === "function"
  ) {
    window.RockyX.registerModule("ads", RockyXAds);
  }

})();