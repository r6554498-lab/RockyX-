/* ==========================================
   ROCKYX CREATE MODULE
   Version 2.0
   ========================================== */

(function (window, document) {
  "use strict";

  const state = {
    container: null,
    activeView: "home",
    templates: [],
    category: "All",
    search: "",
    initialized: false
  };

  const DEFAULT_TEMPLATES = [
    {
      id: "rx-template-001",
      title: "Daily Memories",
      category: "Lifestyle",
      access: "Free",
      clips: 3,
      description: "Create a short daily memories video.",
      usage: 0
    },
    {
      id: "rx-template-002",
      title: "Music Moments",
      category: "Music",
      access: "Free",
      clips: 4,
      description: "Build a video around your favourite music.",
      usage: 0
    },
    {
      id: "rx-template-003",
      title: "Travel Story",
      category: "Travel",
      access: "Pro",
      clips: 5,
      description: "Bring your travel memories together.",
      usage: 0
    },
    {
      id: "rx-template-004",
      title: "Food Showcase",
      category: "Food",
      access: "Free",
      clips: 3,
      description: "Showcase food, restaurants and recipes.",
      usage: 0
    },
    {
      id: "rx-template-005",
      title: "Fashion Edit",
      category: "Fashion",
      access: "Pro",
      clips: 4,
      description: "Create a fashion or outfit video.",
      usage: 0
    },
    {
      id: "rx-template-006",
      title: "Business Promo",
      category: "Business",
      access: "Free",
      clips: 4,
      description: "Prepare a short business promotion.",
      usage: 0
    }
  ];

  const CATEGORIES = [
    "All",
    "Trending",
    "Music",
    "Lifestyle",
    "Travel",
    "Food",
    "Fashion",
    "Business"
  ];

  const STYLES = `
    .rx-create {
      color: #fff;
      background: #100e18;
      padding: 16px;
      border-radius: 16px;
      font-family: Arial, sans-serif;
    }

    .rx-create * {
      box-sizing: border-box;
    }

    .rx-create button,
    .rx-create input {
      font: inherit;
    }

    .rx-create button {
      cursor: pointer;
    }

    .rx-create-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;
    }

    .rx-create-header h1 {
      margin: 0;
      font-size: 24px;
    }

    .rx-create-muted {
      color: #aaa4ba;
      font-size: 13px;
      line-height: 1.5;
    }

    .rx-create-icon-button {
      background: #211d2d;
      color: #fff;
      border: 1px solid #393147;
      border-radius: 11px;
      padding: 10px 13px;
    }

    .rx-create-tools {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 9px;
      margin-bottom: 22px;
    }

    .rx-create-tool {
      min-height: 85px;
      padding: 12px 5px;
      background: #201b2b;
      color: #fff;
      border: 1px solid #332b42;
      border-radius: 13px;
      font-size: 12px;
    }

    .rx-create-tool span {
      display: block;
      font-size: 23px;
      margin-bottom: 8px;
    }

    .rx-create-tool:active,
    .rx-create-card:active {
      transform: scale(.98);
    }

    .rx-create-section {
      margin-bottom: 25px;
    }

    .rx-create-section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }

    .rx-create-section-title h2 {
      font-size: 18px;
      margin: 0;
    }

    .rx-create-cards {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 11px;
    }

    .rx-create-card {
      background: #211b2d;
      color: #fff;
      border: 1px solid #392f4b;
      border-radius: 15px;
      padding: 17px 12px;
      text-align: left;
      min-height: 120px;
    }

    .rx-create-card-icon {
      font-size: 28px;
      margin-bottom: 12px;
    }

    .rx-create-card strong {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
    }

    .rx-create-categories {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 12px;
      margin-bottom: 8px;
    }

    .rx-create-category {
      flex-shrink: 0;
      background: #211d2d;
      color: #c8bfd8;
      border: 1px solid #393147;
      border-radius: 20px;
      padding: 9px 13px;
      font-size: 12px;
    }

    .rx-create-category.active {
      background: #6941b8;
      color: #fff;
      border-color: #a78bfa;
    }

    .rx-create-search {
      width: 100%;
      background: #211d2d;
      color: #fff;
      border: 1px solid #393147;
      border-radius: 11px;
      padding: 12px;
      margin-bottom: 14px;
    }

    .rx-create-template-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 11px;
    }

    .rx-create-template {
      min-width: 0;
      background: #201b2b;
      border: 1px solid #332b42;
      border-radius: 13px;
      overflow: hidden;
    }

    .rx-create-template-preview {
      aspect-ratio: 3 / 4;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 10px;
      background: linear-gradient(145deg, #49306d, #171321);
      overflow-wrap: anywhere;
    }

    .rx-create-template-preview span {
      font-size: 31px;
      margin-bottom: 12px;
    }

    .rx-create-template-preview strong {
      font-size: 14px;
    }

    .rx-create-template-info {
      padding: 11px;
    }

    .rx-create-template-info strong {
      display: block;
      font-size: 13px;
      margin-bottom: 6px;
    }

    .rx-create-template-info small {
      display: block;
      color: #aaa4ba;
      font-size: 11px;
      line-height: 1.5;
    }

    .rx-create-badge {
      display: inline-block;
      background: #352849;
      color: #e1d2ff;
      padding: 4px 7px;
      border-radius: 20px;
      font-size: 10px;
      margin-bottom: 8px;
    }

    .rx-create-bottom-modes {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      position: sticky;
      bottom: 72px;
      background: #171321;
      border: 1px solid #332b42;
      border-radius: 14px;
      padding: 8px;
      margin-top: 22px;
    }

    .rx-create-mode {
      background: transparent;
      color: #aaa4ba;
      border: 0;
      border-radius: 10px;
      padding: 10px 4px;
      font-size: 12px;
    }

    .rx-create-mode.active {
      background: #352849;
      color: #fff;
    }

    .rx-create-message {
      padding: 18px;
      margin: 12px 0;
      background: #211d2d;
      border: 1px solid #393147;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.5;
    }

    .rx-create-primary {
      background: #8b5cf6;
      color: white;
      border: 0;
      border-radius: 11px;
      padding: 12px 15px;
      font-weight: 700;
    }

    .rx-create-secondary {
      background: #292438;
      color: white;
      border: 1px solid #393147;
      border-radius: 11px;
      padding: 11px 14px;
    }

    .rx-create-empty {
      grid-column: 1 / -1;
      padding: 25px 10px;
      text-align: center;
      color: #aaa4ba;
      font-size: 13px;
    }

    @media (min-width: 650px) {
      .rx-create {
        padding: 22px;
      }

      .rx-create-tools {
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }

      .rx-create-template-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
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

  function addStyles() {
    if (document.getElementById("rockyx-create-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "rockyx-create-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function getTemplateDrafts() {
    try {
      const drafts = JSON.parse(
        localStorage.getItem("rockyx_template_drafts") || "[]"
      );

      return Array.isArray(drafts) ? drafts : [];
    } catch (error) {
      return [];
    }
  }

  function getVideoDraftCount() {
    try {
      const drafts = JSON.parse(
        localStorage.getItem("rockyx_editor_drafts") || "[]"
      );

      return Array.isArray(drafts) ? drafts.length : 0;
    } catch (error) {
      return 0;
    }
  }

  function getTemplates() {
    return state.templates.length
      ? state.templates
      : DEFAULT_TEMPLATES.slice();
  }

  function setTemplates(templates) {
    state.templates = Array.isArray(templates)
      ? templates.slice()
      : [];

    if (state.activeView === "home") {
      renderHome();
    }
  }

  function showMessage(message) {
    const box = state.container &&
      state.container.querySelector("#rx-create-message");

    if (!box) return;

    box.textContent = message;
    box.hidden = false;
  }

  function clearMessage() {
    const box = state.container &&
      state.container.querySelector("#rx-create-message");

    if (box) {
      box.textContent = "";
      box.hidden = true;
    }
  }

  function renderTemplateCards() {
    const search = state.search.toLowerCase();
    const templates = getTemplates().filter(function (template) {
      const categoryMatch =
        state.category === "All" ||
        state.category === "Trending" ||
        template.category === state.category;

      const searchMatch =
        String(template.title || template.name || "")
          .toLowerCase()
          .includes(search) ||
        String(template.category || "")
          .toLowerCase()
          .includes(search);

      return categoryMatch && searchMatch;
    });

    if (!templates.length) {
      return `
        <div class="rx-create-empty">
          No templates match your search.
        </div>
      `;
    }

    return templates.map(function (template) {
      const title = template.title || template.name || "Template";
      const access = template.access || "Free";
      const count = Array.isArray(template.clips)
        ? template.clips.length
        : Number(template.clips) || 0;

      return `
        <button
          type="button"
          class="rx-create-template"
          data-action="use-template"
          data-template-id="${escapeHTML(template.id)}"
        >
          <div class="rx-create-template-preview">
            <span>▶</span>
            <strong>${escapeHTML(title)}</strong>
          </div>

          <div class="rx-create-template-info">
            <span class="rx-create-badge">
              ${escapeHTML(access)}
            </span>

            <strong>${escapeHTML(title)}</strong>

            <small>
              ${escapeHTML(template.category || "Other")}
              · ${count} clip slot(s)
            </small>

            <small>
              ${Number(template.usage) || 0} uses recorded
            </small>
          </div>
        </button>
      `;
    }).join("");
  }

  function renderHome() {
    if (!state.container) return;

    state.activeView = "home";

    const drafts = getTemplateDrafts();
    const videoDraftCount = getVideoDraftCount();

    state.container.innerHTML = `
      <div class="rx-create">

        <header class="rx-create-header">
          <div>
            <h1>Create</h1>
            <div class="rx-create-muted">
              Make something worth sharing.
            </div>
          </div>

          <button
            class="rx-create-icon-button"
            type="button"
            data-action="close"
            aria-label="Close Create"
          >✕</button>
        </header>

        <div
          id="rx-create-message"
          class="rx-create-message"
          role="status"
          aria-live="polite"
          hidden
        ></div>

        <section class="rx-create-section">
          <div class="rx-create-section-title">
            <h2>Quick tools</h2>
          </div>

          <div class="rx-create-tools">
            <button class="rx-create-tool"
              type="button" data-action="photo-editor">
              <span>🖼️</span>
              Photo Editor
            </button>

            <button class="rx-create-tool"
              type="button" data-action="autocut">
              <span>✂️</span>
              AutoCut
            </button>

            <button class="rx-create-tool"
              type="button" data-action="captions">
              <span>💬</span>
              Captions
            </button>

            <button class="rx-create-tool"
              type="button" data-action="ai-self">
              <span>✨</span>
              AI Self
            </button>

            <button class="rx-create-tool"
              type="button" data-action="cutout">
              <span>🪄</span>
              Cutout
            </button>
          </div>
        </section>

        <section class="rx-create-section">
          <div class="rx-create-section-title">
            <h2>Start creating</h2>
          </div>

          <div class="rx-create-cards">
            <button
              class="rx-create-card"
              type="button"
              data-action="new-video"
            >
              <div class="rx-create-card-icon">🎬</div>
              <strong>New Video</strong>
              <div class="rx-create-muted">
                Upload clips and start editing.
              </div>
            </button>

            <button
              class="rx-create-card"
              type="button"
              data-action="video-drafts"
            >
              <div class="rx-create-card-icon">📁</div>
              <strong>Drafts (${videoDraftCount})</strong>
              <div class="rx-create-muted">
                Continue working on saved drafts.
              </div>
            </button>
          </div>
        </section>

        <section class="rx-create-section">
          <div class="rx-create-section-title">
            <h2>Templates</h2>

            <button
              class="rx-create-icon-button"
              type="button"
              data-action="search-focus"
              aria-label="Search templates"
            >⌕</button>
          </div>

          <input
            class="rx-create-search"
            id="rx-create-search"
            type="search"
            maxlength="100"
            placeholder="Search templates..."
            value="${escapeHTML(state.search)}"
          >

          <div class="rx-create-categories">
            ${CATEGORIES.map(function (category) {
              return `
                <button
                  type="button"
                  class="rx-create-category ${
                    state.category === category ? "active" : ""
                  }"
                  data-category="${escapeHTML(category)}"
                >
                  ${escapeHTML(category)}
                </button>
              `;
            }).join("")}
          </div>

          <div
            class="rx-create-template-grid"
            id="rx-create-template-grid"
          >
            ${renderTemplateCards()}
          </div>

          <div class="rx-create-actions" style="margin-top:14px">
            <button
              class="rx-create-secondary"
              type="button"
              data-action="my-template-drafts"
            >
              My Template Drafts (${drafts.length})
            </button>

            <button
              class="rx-create-secondary"
              type="button"
              data-action="creator-centre"
            >
              Template Creator Centre
            </button>
          </div>
        </section>

        <nav class="rx-create-bottom-modes"
          aria-label="Creation modes">

          <button
            class="rx-create-mode"
            type="button"
            data-action="live"
          >🔴 LIVE</button>

          <button
            class="rx-create-mode"
            type="button"
            data-action="camera"
          >📷 CAMERA</button>

          <button
            class="rx-create-mode active"
            type="button"
            data-action="create-mode"
          >＋ CREATE</button>
        </nav>

      </div>
    `;
  }

  function openModule(name, eventName) {
    const registry = window.RockyXModules;

    if (registry && typeof registry.load === "function") {
      registry.load(name).then(function (module) {
        if (!module || typeof module.init !== "function") {
          throw new Error("Module is not ready: " + name);
        }

        module.init({
          container: state.container
        });
      }).catch(function (error) {
        console.error("RockyX Create:", error);

        showMessage(
          "This tool is not connected yet. " +
          "The module must be integrated before it can open."
        );
      });

      return;
    }

    if (eventName) {
      state.container.dispatchEvent(
        new CustomEvent(eventName, {
          bubbles: true
        })
      );
    } else {
      showMessage("The module system is not available.");
    }
  }

  function selectTemplate(id) {
    const template = getTemplates().find(function (item) {
      return String(item.id) === String(id);
    });

    if (!template) {
      showMessage("This template could not be found.");
      return;
    }

    state.container.dispatchEvent(
      new CustomEvent("rockyx:template-selected", {
        bubbles: true,
        detail: {
          template: template
        }
      })
    );

    showMessage(
      "Selected " + (template.title || template.name) +
      ". Applying media slots and rendering are not connected yet."
    );
  }

  function handleClick(event) {
    if (!state.container) return;

    const category = event.target.closest("[data-category]");

    if (category && category.classList.contains("rx-create-category")) {
      state.category = category.dataset.category;
      renderHome();
      return;
    }

    const button = event.target.closest("[data-action]");

    if (!button) return;

    const action = button.dataset.action;

    if (action === "search-focus") {
      const search = state.container.querySelector("#rx-create-search");
      if (search) search.focus();
      return;
    }

    if (action === "use-template") {
      selectTemplate(button.dataset.templateId);
      return;
    }

    if (action === "new-video") {
      openModule("studioEditor");
      return;
    }

    if (action === "creator-centre") {
      openModule("templateCreatorCentre");
      return;
    }

    if (action === "my-template-drafts") {
      const drafts = getTemplateDrafts();

      showMessage(
        drafts.length
          ? "You have " + drafts.length +
            " locally saved template draft(s)."
          : "You don't have any saved template drafts yet."
      );

      return;
    }

    if (action === "video-drafts") {
      showMessage(
        "Draft count is stored locally. Reopening saved media " +
        "is not connected yet."
      );
      return;
    }

    if (action === "photo-editor") {
      showMessage("Photo Editor is not connected yet.");
      return;
    }

    if (action === "autocut") {
      showMessage("AutoCut is not connected yet.");
      return;
    }

    if (action === "captions") {
      showMessage("Automatic caption generation is not connected yet.");
      return;
    }

    if (action === "ai-self") {
      showMessage("AI Self is not connected yet.");
      return;
    }

    if (action === "cutout") {
      showMessage("Background Cutout is not connected yet.");
      return;
    }

    if (action === "live") {
      showMessage("Livestreaming will be connected separately.");
      return;
    }

    if (action === "camera") {
      showMessage(
        "Camera recording requires a camera-capture module."
      );
      return;
    }

    if (action === "create-mode") {
      renderHome();
      return;
    }

    if (action === "close") {
      state.container.dispatchEvent(
        new CustomEvent("rockyx:create-close", {
          bubbles: true
        })
      );

      showMessage(
        "Close navigation will be connected to the app shell."
      );
    }
  }

  function handleInput(event) {
    if (!event.target.matches("#rx-create-search")) {
      return;
    }

    state.search = event.target.value;

    const grid = state.container.querySelector(
      "#rx-create-template-grid"
    );

    if (grid) {
      grid.innerHTML = renderTemplateCards();
    }
  }

  function init(options) {
    options = options || {};

    const container = options.container ||
      document.getElementById("rockyx-create-root") ||
      document.getElementById("page-Studio");

    if (!container) {
      console.error(
        "RockyX Create: Could not find a container."
      );

      return false;
    }

    if (
      state.container &&
      state.container !== container
    ) {
      destroy();
    } else if (state.container === container) {
      destroy();
    }

    state.container = container;

    if (Array.isArray(options.templates)) {
      state.templates = options.templates.slice();
    }

    if (options.template) {
      state.activeView = "home";
    }

    addStyles();
    renderHome();

    container.addEventListener("click", handleClick);
    container.addEventListener("input", handleInput);

    state.initialized = true;

    return true;
  }

  function render() {
    renderHome();
  }

  function destroy() {
    if (state.container) {
      state.container.removeEventListener("click", handleClick);
      state.container.removeEventListener("input", handleInput);
    }

    state.container = null;
    state.initialized = false;
  }

  function getState() {
    return {
      activeView: state.activeView,
      category: state.category,
      search: state.search,
      templates: getTemplates().slice()
    };
  }

  window.RockyXCreate = {
    init: init,
    render: render,
    destroy: destroy,
    setTemplates: setTemplates,
    getState: getState
  };

})(window, document);