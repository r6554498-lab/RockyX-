/* =====================================================
   ROCKYX ADMIN DASHBOARD
   Central administration dashboard foundation.
   Local prototype — backend integration required.
   ===================================================== */

(function () {
  "use strict";

  const MODULES = [
    {
      id: "overview",
      name: "Dashboard Overview",
      icon: "🏠",
      description: "View your available Admin sections."
    },
    {
      id: "users",
      name: "User Management",
      icon: "👥",
      description: "Manage user administration records.",
      globalName: "RockyXAdminUsers"
    },
    {
      id: "staff",
      name: "Staff & Permissions",
      icon: "🧑‍💼",
      description: "Organize staff, teams and assigned permissions.",
      globalName: "RockyXAdminStaff"
    },
    {
      id: "security",
      name: "Security Center",
      icon: "🔐",
      description: "Review security incidents and investigations.",
      globalName: "RockyXAdminSecurity"
    },
    {
      id: "audit",
      name: "Audit Logs",
      icon: "📋",
      description: "Review recorded administrative activity.",
      globalName: "RockyXAdminAudit"
    },
    {
      id: "finance",
      name: "Finance",
      icon: "💰",
      description: "Review finance records and commission estimates.",
      globalName: "RockyXAdminFinance"
    },
    {
      id: "reports",
      name: "Reports & Analytics",
      icon: "📊",
      description: "View available prototype management reports.",
      globalName: "RockyXAdminReports"
    },
    {
      id: "creators",
      name: "Creator Management",
      icon: "🎬",
      description: "Review creator administration records.",
      globalName: "RockyXAdminCreators"
    },
    {
      id: "templates",
      name: "Template Management",
      icon: "🎨",
      description: "Review template administration records.",
      globalName: "RockyXAdminTemplates"
    },
    {
      id: "marketplace",
      name: "Marketplace",
      icon: "🛍️",
      description: "Review marketplace administration records.",
      globalName: "RockyXAdminMarketplace"
    },
    {
      id: "advertising",
      name: "Advertising & Boosts",
      icon: "📢",
      description: "Review advertising and boost records.",
      globalName: "RockyXAdminAdvertising"
    },
    {
      id: "explore",
      name: "Explore Management",
      icon: "🗺️",
      description: "Review Explore listings and reports.",
      globalName: "RockyXAdminExplore"
    },
    {
      id: "notifications",
      name: "Notifications",
      icon: "🔔",
      description: "Manage local Admin announcement records.",
      globalName: "RockyXAdminNotifications"
    },
    {
      id: "settings",
      name: "Platform Settings",
      icon: "⚙️",
      description: "Manage available local Admin settings.",
      globalName: "RockyXAdminSettings"
    }
  ];

  const STYLE_ID = "rockyx-admin-dashboard-styles";
  const ROOT_ID = "rockyx-admin-dashboard-root";

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getModuleStatus(module) {
    if (!module.globalName) {
      return "Dashboard section";
    }

    return window[module.globalName]
      ? "Module detected"
      : "Module not loaded";
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      .rx-admin {
        font-family: Arial, sans-serif;
        color: #f5f5f5;
        background: #111318;
        min-height: 100vh;
        padding: 18px;
        box-sizing: border-box;
      }

      .rx-admin * {
        box-sizing: border-box;
      }

      .rx-admin-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 14px;
        margin-bottom: 22px;
      }

      .rx-admin-brand {
        font-size: 26px;
        font-weight: 800;
        margin: 0;
      }

      .rx-admin-subtitle {
        color: #aeb5c2;
        font-size: 13px;
        margin-top: 6px;
      }

      .rx-admin-badge {
        display: inline-block;
        border: 1px solid #7864ff;
        color: #c7bdff;
        border-radius: 20px;
        padding: 7px 12px;
        font-size: 12px;
      }

      .rx-admin-notice {
        background: #272315;
        border: 1px solid #71602a;
        color: #ffe7a0;
        border-radius: 12px;
        padding: 13px;
        margin-bottom: 20px;
        font-size: 13px;
        line-height: 1.5;
      }

      .rx-admin-heading {
        font-size: 19px;
        margin: 22px 0 13px;
      }

      .rx-admin-grid {
        display: grid;
        grid-template-columns:
          repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
      }

      .rx-admin-card {
        background: #1b1e25;
        border: 1px solid #303541;
        border-radius: 14px;
        padding: 17px;
        min-width: 0;
      }

      .rx-admin-card-icon {
        font-size: 26px;
        margin-bottom: 10px;
      }

      .rx-admin-card h3 {
        margin: 0 0 8px;
        font-size: 16px;
      }

      .rx-admin-card p {
        color: #b3bac7;
        font-size: 13px;
        line-height: 1.5;
        min-height: 39px;
      }

      .rx-admin-status {
        font-size: 11px;
        color: #c7bdff;
        margin: 12px 0;
      }

      .rx-admin-button {
        display: inline-block;
        border: 0;
        border-radius: 8px;
        padding: 10px 13px;
        background: #7864ff;
        color: #fff;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
      }

      .rx-admin-button-secondary {
        background: #303541;
      }

      .rx-admin-button:focus-visible {
        outline: 2px solid white;
        outline-offset: 3px;
      }

      .rx-admin-panel {
        background: #1b1e25;
        border: 1px solid #303541;
        border-radius: 14px;
        padding: 18px;
        margin-top: 18px;
      }

      .rx-admin-panel pre {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        color: #d9deea;
        font-size: 12px;
        line-height: 1.5;
      }

      .rx-admin-footer {
        color: #8f97a7;
        font-size: 12px;
        line-height: 1.6;
        margin-top: 28px;
      }

      @media (max-width: 480px) {
        .rx-admin {
          padding: 12px;
        }

        .rx-admin-brand {
          font-size: 22px;
        }

        .rx-admin-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function renderDashboard() {
    const root = document.getElementById(ROOT_ID);

    if (!root) {
      console.error(
        "RockyX Admin: Dashboard root element was not found."
      );
      return;
    }

    root.innerHTML = `
      <div class="rx-admin">
        <header class="rx-admin-header">
          <div>
            <h1 class="rx-admin-brand">ROCKYX ADMIN</h1>
            <div class="rx-admin-subtitle">
              One World. One Platform.
            </div>
          </div>

          <span class="rx-admin-badge">
            Administration Prototype
          </span>
        </header>

        <div class="rx-admin-notice">
          <strong>Prototype notice:</strong>
          This dashboard organizes available JavaScript modules.
          It is not yet a secure production Admin system.
          Do not use it to authorize staff or manage real payments.
        </div>

        <h2 class="rx-admin-heading">Administration Center</h2>

        <div class="rx-admin-grid">
          ${MODULES.map(function (module) {
            return `
              <section class="rx-admin-card">
                <div class="rx-admin-card-icon">
                  ${module.icon}
                </div>

                <h3>${escapeHTML(module.name)}</h3>

                <p>${escapeHTML(module.description)}</p>

                <div class="rx-admin-status">
                  ${escapeHTML(getModuleStatus(module))}
                </div>

                <button
                  class="rx-admin-button"
                  type="button"
                  data-rx-admin-module="${escapeHTML(module.id)}"
                >
                  View section
                </button>
              </section>
            `;
          }).join("")}
        </div>

        <section
          class="rx-admin-panel"
          id="rx-admin-detail"
          aria-live="polite"
        >
          <h2>Welcome to RockyX Admin</h2>

          <p>
            Select a section to inspect its current module status.
          </p>

          <p>
            The dashboard does not automatically connect,
            authorize, or activate every section.
          </p>
        </section>

        <footer class="rx-admin-footer">
          RockyX Administration · Local prototype<br>
          Production access control, backend integration,
          and server-side audit logging are still required.
        </footer>
      </div>
    `;

    root.querySelectorAll("[data-rx-admin-module]")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          openSection(button.dataset.rxAdminModule);
        });
      });
  }

  function openSection(moduleId) {
    const moduleInfo = MODULES.find(function (module) {
      return module.id === moduleId;
    });

    const panel = document.getElementById("rx-admin-detail");

    if (!moduleInfo || !panel) {
      return;
    }

    let moduleObject = null;
    let moduleSummary = null;

    if (moduleInfo.globalName) {
      moduleObject = window[moduleInfo.globalName] || null;
    }

    if (moduleObject) {
      try {
        if (typeof moduleObject.getSummary === "function") {
          moduleSummary = moduleObject.getSummary();
        } else if (
          typeof moduleObject.getSettings === "function"
        ) {
          moduleSummary = moduleObject.getSettings();
        } else if (
          typeof moduleObject.listRecords === "function"
        ) {
          moduleSummary = {
            availableFunctions: Object.keys(moduleObject)
          };
        } else {
          moduleSummary = {
            message: "Module loaded. No standard summary method found."
          };
        }
      } catch (error) {
        moduleSummary = {
          error: "Could not read this module's summary."
        };

        console.error("RockyX Admin module error:", error);
      }
    }

    panel.innerHTML = `
      <h2>
        ${moduleInfo.icon} ${escapeHTML(moduleInfo.name)}
      </h2>

      <p>${escapeHTML(moduleInfo.description)}</p>

      <p>
        <strong>Module status:</strong>
        ${escapeHTML(getModuleStatus(moduleInfo))}
      </p>

      <p>
        <strong>Integration status:</strong>
        ${moduleObject
          ? "JavaScript module detected"
          : "Not connected or not loaded"}
      </p>

      <pre>${escapeHTML(
        JSON.stringify(
          moduleSummary || {
            message:
              "No module summary is available. The relevant module must be connected."
          },
          null,
          2
        )
      )}</pre>

      <button
        class="rx-admin-button rx-admin-button-secondary"
        id="rx-admin-back"
        type="button"
      >
        Back to dashboard
      </button>
    `;

    document.getElementById("rx-admin-back")
      .addEventListener("click", renderDashboard);

    panel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function init() {
    addStyles();

    let root = document.getElementById(ROOT_ID);

    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }

    renderDashboard();
  }

  window.RockyXAdminDashboard = {
    version: "2.0.0",
    demoOnly: true,
    modules: MODULES.map(function (module) {
      return Object.assign({}, module);
    }),
    init: init,
    render: renderDashboard,
    openSection: openSection
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  console.log(
    "RockyX Admin Dashboard loaded. Prototype only."
  );
})();