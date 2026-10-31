/* =========================================================
   ROCKYX — SETTINGS & PRIVACY MODULE
   Version: 1.0.0
   Status: Front-end foundation with demonstration controls
   ========================================================= */

(function () {
  "use strict";

  const RockyXSettings = {
    name: "settings",
    version: "1.0.0",

    activeSection: "Account",

    sections: [
      "Account",
      "Privacy",
      "Security",
      "Notifications",
      "Appearance",
      "Language",
      "Blocked accounts",
      "Data & account"
    ],

    preferences: {
      privateAccount: false,
      showActivity: true,
      allowMessages: true,
      allowComments: true,
      allowTags: true,
      pushNotifications: true,
      emailNotifications: true,
      marketingNotifications: false,
      twoFactorEnabled: false,
      darkMode: true,
      reduceMotion: false,
      language: "English"
    },

    blockedAccounts: [
      {
        id: "blocked-001",
        username: "@demo_account"
      }
    ],

    initialize() {
      console.log("RockyX Settings initialized.");
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

    render() {
      const screen = document.getElementById("app-screen");

      if (!screen) {
        console.error("RockyX Settings: app-screen not found.");
        return;
      }

      screen.innerHTML = `
        <section class="settings-page">

          <header class="settings-heading">
            <span class="settings-eyebrow">
              PERSONALISE YOUR EXPERIENCE
            </span>

            <h1>Settings & Privacy</h1>

            <p>
              Manage your account, security and preferences.
            </p>
          </header>

          <div class="settings-demo-notice">
            <strong>Settings demonstration</strong>
            <p>
              Preferences currently work locally in this browser.
              Real account changes and security enforcement require
              a secure backend.
            </p>
          </div>

          <div class="settings-layout">

            <nav
              class="settings-sidebar"
              aria-label="Settings sections"
            >

              ${this.sections.map((section) => `
                <button
                  type="button"
                  class="settings-nav-item ${
                    this.activeSection === section ? "active" : ""
                  }"
                  data-settings-section="${this.escapeHTML(section)}"
                >
                  ${this.escapeHTML(section)}
                </button>
              `).join("")}

            </nav>

            <div class="settings-content">
              ${this.renderSection()}
            </div>

          </div>

        </section>
      `;

      this.attachEvents(screen);
    },

    renderSection() {
      switch (this.activeSection) {
        case "Privacy":
          return this.renderPrivacy();

        case "Security":
          return this.renderSecurity();

        case "Notifications":
          return this.renderNotifications();

        case "Appearance":
          return this.renderAppearance();

        case "Language":
          return this.renderLanguage();

        case "Blocked accounts":
          return this.renderBlockedAccounts();

        case "Data & account":
          return this.renderData();

        default:
          return this.renderAccount();
      }
    },

    renderAccount() {
      return `
        <section class="settings-section">

          <h2>Account settings</h2>
          <p>Manage your basic account information.</p>

          <form id="settings-account-form">

            <div class="settings-field">
              <label for="settings-display-name">
                Display name
              </label>

              <input
                type="text"
                id="settings-display-name"
                value="RockyX User"
                maxlength="60"
                required
              >
            </div>

            <div class="settings-field">
              <label for="settings-username">
                Username
              </label>

              <input
                type="text"
                id="settings-username"
                value="rockyx_user"
                maxlength="30"
                required
              >
            </div>

            <div class="settings-field">
              <label for="settings-email">
                Email address
              </label>

              <input
                type="email"
                id="settings-email"
                value="demo@example.com"
                disabled
              >

              <small>
                Email verification and changes will be connected later.
              </small>
            </div>

            <button type="submit" class="settings-primary-button">
              Save demonstration changes
            </button>

          </form>

        </section>
      `;
    },

    renderPrivacy() {
      return `
        <section class="settings-section">

          <h2>Privacy controls</h2>

          <p>
            Choose how other people interact with your account.
          </p>

          ${this.renderToggle(
            "privateAccount",
            "Private account",
            "Demonstration setting for account visibility."
          )}

          ${this.renderToggle(
            "showActivity",
            "Show activity status",
            "Control whether your activity status is displayed."
          )}

          ${this.renderToggle(
            "allowMessages",
            "Allow messages",
            "Demonstration setting for incoming messages."
          )}

          ${this.renderToggle(
            "allowComments",
            "Allow comments",
            "Demonstration setting for comments on your content."
          )}

          ${this.renderToggle(
            "allowTags",
            "Allow tags and mentions",
            "Demonstration setting for tags and mentions."
          )}

        </section>
      `;
    },

    renderSecurity() {
      return `
        <section class="settings-section">

          <h2>Account security</h2>

          <p>
            Manage your account security preferences.
          </p>

          <div class="settings-security-card">
            <div>
              <strong>Password</strong>
              <p>
                Password changes will use secure authentication.
              </p>
            </div>

            <button
              type="button"
              data-settings-action="password"
            >
              Change password
            </button>
          </div>

          ${this.renderToggle(
            "twoFactorEnabled",
            "Two-factor authentication",
            "Local demonstration toggle only. No authentication is activated."
          )}

          <div class="settings-security-card">
            <div>
              <strong>Active sessions</strong>
              <p>
                Review devices signed into your account.
              </p>
            </div>

            <button
              type="button"
              data-settings-action="sessions"
            >
              View sessions
            </button>
          </div>

          <div class="settings-security-card">
            <div>
              <strong>Login history</strong>
              <p>
                Review recent account access.
              </p>
            </div>

            <button
              type="button"
              data-settings-action="login-history"
            >
              View history
            </button>
          </div>

        </section>
      `;
    },

    renderNotifications() {
      return `
        <section class="settings-section">

          <h2>Notification preferences</h2>

          <p>
            Choose which demonstration notifications are enabled.
          </p>

          ${this.renderToggle(
            "pushNotifications",
            "Push notifications",
            "Control browser notification preferences."
          )}

          ${this.renderToggle(
            "emailNotifications",
            "Email notifications",
            "Control email notification preferences."
          )}

          ${this.renderToggle(
            "marketingNotifications",
            "Product updates and promotions",
            "Receive product news and promotional updates."
          )}

        </section>
      `;
    },

    renderAppearance() {
      return `
        <section class="settings-section">

          <h2>Appearance</h2>

          <p>Customise how RockyX looks and feels.</p>

          ${this.renderToggle(
            "darkMode",
            "Dark appearance",
            "RockyX uses a dark purple and black visual direction."
          )}

          ${this.renderToggle(
            "reduceMotion",
            "Reduce motion",
            "Preference for fewer interface animations."
          )}

        </section>
      `;
    },

    renderLanguage() {
      return `
        <section class="settings-section">

          <h2>Language and region</h2>

          <p>Choose your preferred display language.</p>

          <div class="settings-field">

            <label for="settings-language">
              Application language
            </label>

            <select id="settings-language">

              ${[
                "English",
                "French",
                "Spanish",
                "Portuguese",
                "Arabic",
                "Swahili",
                "German",
                "Chinese"
              ].map((language) => `
                <option
                  value="${language}"
                  ${this.preferences.language === language ? "selected" : ""}
                >
                  ${language}
                </option>
              `).join("")}

            </select>

          </div>

          <button
            type="button"
            class="settings-primary-button"
            data-settings-action="save-language"
          >
            Save language preference
          </button>

          <p class="settings-help-text">
            Full interface translation will be implemented later.
          </p>

        </section>
      `;
    },

    renderBlockedAccounts() {
      return `
        <section class="settings-section">

          <h2>Blocked accounts</h2>

          <p>
            Manage accounts you have blocked.
          </p>

          ${
            this.blockedAccounts.length
              ? this.blockedAccounts.map((account) => `
                <div class="settings-blocked-account">

                  <strong>
                    ${this.escapeHTML(account.username)}
                  </strong>

                  <button
                    type="button"
                    data-unblock-account="${this.escapeHTML(account.id)}"
                  >
                    Unblock
                  </button>

                </div>
              `).join("")
              : `
                <div class="settings-empty">
                  <h3>No blocked accounts</h3>
                  <p>Your blocked accounts will appear here.</p>
                </div>
              `
          }

        </section>
      `;
    },

    renderData() {
      return `
        <section class="settings-section">

          <h2>Data and account management</h2>

          <p>
            Manage your demonstration account data.
          </p>

          <div class="settings-security-card">
            <div>
              <strong>Download your information</strong>
              <p>
                Account data export will be connected later.
              </p>
            </div>

            <button
              type="button"
              data-settings-action="download-data"
            >
              Request export
            </button>
          </div>

          <div class="settings-security-card">
            <div>
              <strong>Deactivate account</strong>
              <p>
                Temporarily disable your account.
              </p>
            </div>

            <button
              type="button"
              data-settings-action="deactivate"
            >
              Deactivate
            </button>
          </div>

          <div class="settings-security-card danger">
            <div>
              <strong>Delete account</strong>
              <p>
                Permanently deleting an account requires secure
                backend verification.
              </p>
            </div>

            <button
              type="button"
              data-settings-action="delete"
            >
              Delete account
            </button>
          </div>

        </section>
      `;
    },

    renderToggle(key, title, description) {
      const checked = this.preferences[key] === true;

      return `
        <div class="settings-toggle-row">

          <div class="settings-toggle-info">
            <strong>${this.escapeHTML(title)}</strong>

            <p>${this.escapeHTML(description)}</p>
          </div>

          <label class="settings-switch">

            <input
              type="checkbox"
              data-settings-toggle="${this.escapeHTML(key)}"
              ${checked ? "checked" : ""}
            >

            <span class="settings-switch-slider"></span>

          </label>

        </div>
      `;
    },

    attachEvents(screen) {
      if (screen.dataset.settingsEvents === "true") {
        return;
      }

      screen.dataset.settingsEvents = "true";

      screen.addEventListener("click", (event) => {

        const sectionButton = event.target.closest(
          "[data-settings-section]"
        );

        if (sectionButton) {
          this.activeSection =
            sectionButton.dataset.settingsSection;

          this.render();
          return;
        }

        const actionButton = event.target.closest(
          "[data-settings-action]"
        );

        if (actionButton) {
          this.handleAction(
            actionButton.dataset.settingsAction
          );

          return;
        }

        const unblockButton = event.target.closest(
          "[data-unblock-account]"
        );

        if (unblockButton) {
          this.unblockAccount(
            unblockButton.dataset.unblockAccount
          );

          this.render();
        }

      });

      screen.addEventListener("change", (event) => {

        const toggle = event.target.closest(
          "[data-settings-toggle]"
        );

        if (toggle) {
          const key = toggle.dataset.settingsToggle;

          if (Object.prototype.hasOwnProperty.call(
            this.preferences,
            key
          )) {
            this.preferences[key] = toggle.checked;
          }
        }

        if (event.target.id === "settings-language") {
          this.preferences.language = event.target.value;
        }

      });

      screen.addEventListener("submit", (event) => {

        if (event.target.id === "settings-account-form") {
          event.preventDefault();

          alert(
            "Account details are demonstration fields. Real account changes will be connected later."
          );
        }

      });
    },

    handleAction(action) {
      const messages = {
        password:
          "Secure password changes will be connected to the authentication system.",

        sessions:
          "Device and session management will be connected to the backend.",

        "login-history":
          "Verified login history will appear after authentication is connected.",

        "download-data":
          "A secure account data export process will be implemented later.",

        deactivate:
          "Account deactivation requires backend verification.",

        delete:
          "Account deletion is not available in this demonstration."
      };

      if (action === "delete") {
        const confirmed = confirm(
          "This is only a demonstration. No account will be deleted. Continue?"
        );

        if (!confirmed) {
          return;
        }
      }

      if (action === "save-language") {
        const language = document.getElementById(
          "settings-language"
        );

        if (language) {
          this.preferences.language = language.value;
        }

        alert(
          "Your language preference has been saved locally for this demonstration."
        );

        return;
      }

      if (messages[action]) {
        alert(messages[action]);
      }
    },

    unblockAccount(accountId) {
      this.blockedAccounts = this.blockedAccounts.filter(
        (account) => account.id !== accountId
      );
    }
  };

  window.RockyXSettings = RockyXSettings;

  if (
    window.RockyX &&
    typeof window.RockyX.registerModule === "function"
  ) {
    window.RockyX.registerModule(
      "settings",
      RockyXSettings
    );
  }

})();