/* =====================================================
   ROCKYX FEED TEMPLATES
   Displays free and Pro templates inside the For You feed.
   ===================================================== */

(function () {
  "use strict";

  if (window.RockyXFeedTemplates) return;

  const templates = [
    {
      id: "rx-template-001",
      title: "Cinematic Travel",
      creator: "RockyX Creators",
      category: "Travel",
      type: "Free",
      uses: 1240,
      icon: "✈️",
      description: "Give your travel videos a cinematic look."
    },
    {
      id: "rx-template-002",
      title: "Beat Sync Edit",
      creator: "RockyX Studio",
      category: "Music",
      type: "Pro",
      uses: 3870,
      icon: "🎵",
      description: "Match your clips to the rhythm of your music."
    },
    {
      id: "rx-template-003",
      title: "Daily Moments",
      creator: "RockyX Creators",
      category: "Lifestyle",
      type: "Free",
      uses: 895,
      icon: "✨",
      description: "Turn everyday moments into a memorable video."
    },
    {
      id: "rx-template-004",
      title: "Product Showcase",
      creator: "RockyX Studio",
      category: "Business",
      type: "Pro",
      uses: 2150,
      icon: "🛍️",
      description: "Create a polished product promotion."
    }
  ];

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function createCard(template) {
    const card = document.createElement("article");

    card.className = "rockyx-template-card";
    card.dataset.templateId = template.id;

    card.innerHTML = `
      <div class="rockyx-template-art" aria-hidden="true">
        <span>${escapeHTML(template.icon)}</span>
        <span class="rockyx-template-badge ${
          template.type === "Pro" ? "is-pro" : "is-free"
        }">${escapeHTML(template.type)}</span>
      </div>

      <div class="rockyx-template-info">
        <h3>${escapeHTML(template.title)}</h3>
        <p>${escapeHTML(template.description)}</p>
        <div class="rockyx-template-meta">
          <span>By ${escapeHTML(template.creator)}</span>
          <span>${template.uses.toLocaleString()} uses</span>
        </div>
        <button type="button"
          class="rockyx-use-template"
          data-use-template="${escapeHTML(template.id)}">
          Use Template
        </button>
      </div>
    `;

    return card;
  }

  function render(container, options = {}) {
    if (!container) return false;

    const heading = document.createElement("section");
    heading.className = "rockyx-feed-templates";
    heading.innerHTML = `
      <div class="rockyx-template-heading">
        <div>
          <h2>✨ Templates for you</h2>
          <p>Create something amazing with RockyX.</p>
        </div>
        <button type="button" class="rockyx-view-all-templates">
          View all
        </button>
      </div>
      <div class="rockyx-template-list"></div>
    `;

    const list = heading.querySelector(".rockyx-template-list");
    const items = options.templates || templates;

    items.forEach((template) => {
      list.appendChild(createCard(template));
    });

    container.appendChild(heading);

    return heading;
  }

  function openTemplate(templateId) {
    const template = templates.find((item) => item.id === templateId);

    if (!template) {
      document.dispatchEvent(
        new CustomEvent("rockyx:template-request", {
          detail: { templateId }
        })
      );
      return;
    }

    document.dispatchEvent(
      new CustomEvent("rockyx:template-request", {
        detail: {
          templateId: template.id,
          template: { ...template }
        }
      })
    );
  }

  function init(root = document) {
    if (root.dataset && root.dataset.rockyxFeedTemplates === "true") {
      return;
    }

    if (root.dataset) {
      root.dataset.rockyxFeedTemplates = "true";
    }

    root.addEventListener("click", function (event) {
      const useButton = event.target.closest("[data-use-template]");

      if (useButton && root.contains(useButton)) {
        openTemplate(useButton.dataset.useTemplate);
        return;
      }

      const viewAllButton = event.target.closest(
        ".rockyx-view-all-templates"
      );

      if (viewAllButton && root.contains(viewAllButton)) {
        document.dispatchEvent(
          new CustomEvent("rockyx:open-studio", {
            detail: { section: "templates" }
          })
        );
      }
    });
  }

  function addStyles() {
    if (document.getElementById("rockyx-feed-template-styles")) return;

    const style = document.createElement("style");
    style.id = "rockyx-feed-template-styles";

    style.textContent = `
      .rockyx-feed-templates {
        box-sizing: border-box;
        width: 100%;
        padding: 18px 14px;
        margin: 16px 0;
        color: #fff;
        background: #171717;
        border: 1px solid #303030;
        border-radius: 16px;
        overflow: hidden;
      }

      .rockyx-template-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }

      .rockyx-template-heading h2 {
        margin: 0 0 5px;
        font-size: 19px;
      }

      .rockyx-template-heading p {
        margin: 0;
        color: #aaa;
        font-size: 12px;
      }

      .rockyx-view-all-templates {
        border: 0;
        background: transparent;
        color: #c4a1ff;
        font-weight: 700;
        cursor: pointer;
      }

      .rockyx-template-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .rockyx-template-card {
        min-width: 0;
        overflow: hidden;
        border: 1px solid #333;
        border-radius: 12px;
        background: #202020;
      }

      .rockyx-template-art {
        position: relative;
        min-height: 105px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #35215a, #171717);
      }

      .rockyx-template-art > span:first-child {
        font-size: 42px;
      }

      .rockyx-template-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        padding: 4px 7px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 800;
      }

      .rockyx-template-badge.is-free {
        color: #b9ffd4;
        background: #174b35;
      }

      .rockyx-template-badge.is-pro {
        color: #ffe29b;
        background: #5b4211;
      }

      .rockyx-template-info {
        padding: 10px;
      }

      .rockyx-template-info h3 {
        margin: 0 0 6px;
        font-size: 14px;
      }

      .rockyx-template-info p {
        min-height: 32px;
        margin: 0 0 9px;
        color: #bdbdbd;
        font-size: 11px;
        line-height: 1.45;
      }

      .rockyx-template-meta {
        display: flex;
        flex-direction: column;
        gap: 4px;
        color: #999;
        font-size: 10px;
      }

      .rockyx-use-template {
        width: 100%;
        margin-top: 11px;
        padding: 9px 5px;
        border: 0;
        border-radius: 8px;
        color: #fff;
        background: #7544c8;
        font-weight: 700;
        cursor: pointer;
      }

      .rockyx-use-template:active {
        transform: scale(.98);
      }

      @media (min-width: 700px) {
        .rockyx-template-list {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }
    `;

    document.head.appendChild(style);
  }

  window.RockyXFeedTemplates = {
    init,
    render,
    openTemplate,
    getTemplates: () => templates.map((item) => ({ ...item })),
    addStyles
  };
})();