/* ======================================================
   ROCKYX CREATE HOME
   Modular creation hub for videos, photos and templates
   ====================================================== */

(function () {
  "use strict";

  if (window.RockyXCreate) return;

  const state = {
    container: null,
    initialized: false,
    category: "For You",
    search: "",
    templates: [],
    drafts: []
  };

  const categories = [
    "Viral Song",
    "Trendy",
    "AI",
    "Monthly Recap",
    "Daily",
    "Transitions",
    "Photos",
    "Beat Sync"
  ];

  const styles = `
    .rx-create-home {
      min-height: 100%;
      padding: 20px 14px 35px;
      background: #08080b;
      color: #fff;
      font-family: Arial, sans-serif;
      box-sizing: border-box;
    }

    .rx-create-home * {
      box-sizing: border-box;
    }

    .rx-create-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 27px;
    }

    .rx-create-close {
      border: 0;
      background: transparent;
      color: white;
      font-size: 29px;
      cursor: pointer;
    }

    .rx-create-heading {
      margin: 0;
      text-align: center;
      font-size: 25px;
      font-weight: 900;
      letter-spacing: 1px;
    }

    .rx-create-header-spacer {
      width: 35px;
    }

    .rx-create-tools {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 5px;
      margin-bottom: 25px;
    }

    .rx-create-tool {
      padding: 8px 2px;
      border: 0;
      border-radius: 12px;
      background: transparent;
      color: white;
      text-align: center;
      cursor: pointer;
      min-width: 0;
    }

    .rx-create-tool-icon {
      display: grid;
      place-items: center;
      height: 37px;
      font-size: 25px;
      font-weight: 800;
      margin-bottom: 7px;
    }

    .rx-create-tool-name {
      display: block;
      font-size: 10px;
      font-weight: 700;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    .rx-create-main-cards {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 115px;
      gap: 12px;
      margin-bottom: 32px;
    }

    .rx-create-new-video,
    .rx-create-drafts {
      border: 0;
      border-radius: 17px;
      min-height: 140px;
      cursor: pointer;
      overflow: hidden;
    }

    .rx-create-new-video {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 9px;
      background: linear-gradient(115deg, #fff0e8, #e5fbff);
      color: #101015;
    }

    .rx-create-plus {
      font-size: 31px;
      font-weight: 800;
      line-height: 1;
    }

    .rx-create-card-title {
      font-size: 21px;
      font-weight: 900;
    }

    .rx-create-drafts {
      background: linear-gradient(150deg, #463366, #17131f);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 7px;
    }

    .rx-create-draft-count {
      font-size: 28px;
      font-weight: 900;
    }

    .rx-create-drafts-label {
      font-size: 17px;
      font-weight: 800;
    }

    .rx-create-template-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 15px;
    }

    .rx-create-template-heading h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 900;
    }

    .rx-create-search-button {
      border: 0;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      background: #242429;
      color: white;
      font-size: 23px;
      cursor: pointer;
    }

    .rx-create-search {
      display: none;
      width: 100%;
      margin-bottom: 14px;
      padding: 13px;
      border: 1px solid #393944;
      border-radius: 12px;
      background: #18181e;
      color: white;
      font-size: 15px;
    }

    .rx-create-search.rx-visible {
      display: block;
    }

    .rx-create-category-row {
      display: flex;
      gap: 22px;
      overflow-x: auto;
      padding: 2px 0 16px;
      scrollbar-width: none;
    }

    .rx-create-category-row::-webkit-scrollbar {
      display: none;
    }

    .rx-create-category {
      flex-shrink: 0;
      border: 0;
      padding: 3px 0;
      background: transparent;
      color: #9999a2;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
    }

    .rx-create-category.rx-active {
      color: white;
    }

    .rx-create-template-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
      gap: 18px 12px;
    }

    .rx-create-template {
      min-width: 0;
      cursor: pointer;
    }

    .rx-create-template-preview {
      width: 100%;
      aspect-ratio: 3 / 4;
      border-radius: 15px;
      overflow: hidden;
      position: relative;
      display: grid;
      place-items: center;
      padding: 12px;
      background: linear-gradient(145deg, #3a2b46, #131318);
      color: white;
      text-align: center;
    }

    .rx-create-template-preview img,
    .rx-create-template-preview video {
      width: 100%;
      height: 100%;
      position: absolute;
      inset: 0;
      object-fit: cover;
    }

    .rx-create-template-preview::after {
      content: "";
      position: absolute;
      inset: 40% 0 0;
      background: linear-gradient(transparent, rgba(0,0,0,.55));
      pointer-events: none;
    }

    .rx-create-template-art {
      position: relative;
      z-index: 1;
      font-size: 24px;
      font-weight: 900;
      overflow-wrap: anywhere;
    }

    .rx-create-template-name {
      margin: 9px 0 4px;
      font-size: 14px;
      font-weight: 800;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .rx-create-template-meta {
      color: #9999a5;
      font-size: 11px;
      line-height: 1.5;
    }

    .rx-create-template-badge {
      display: inline-block;
      margin-top: 5px;
      padding: 4px 7px;
      border-radius: 6px;
      background: #33213f;
      color: #dfb8ff;
      font-size: 10px;
      font-weight: 800;
    }

    .rx-create-empty {
      grid-column: 1 / -1;
      padding: 35px 15px;
      text-align: center;
      color: #9999a5;
      line-height: 1.6;
    }

    .rx-create-status {
      margin-top: 15px;
      color: #c4b5fd;
      font-size: 12px;
      line-height: 1.5;
    }

    @media (min-width: 600px) {
      .rx-create-home {
        max-width: 850px;
        margin: 0 auto;
      }

      .rx-create-template-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .rx-create-tool-name {
        font-size: 12px;
      }
    }
  `;

  function addStyles() {
    if (document.getElementById("rx-create-home-styles")) return;

    const style = document.createElement("style");
    style.id = "rx-create-home-styles";
    style.textContent = styles;
    document.head.appendChild(style);
  }

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

  function readDraftCount() {
    try {
      const drafts = JSON.parse(
        localStorage.getItem("rockyx_editor_drafts") || "[]"
      );

      return Array.isArray(drafts) ? drafts.length : 0;
    } catch (error) {
      return 0;
    }
  }

  function defaultTemplates() {
    return [
      {
        id: "template-1",
        title: "Beat Sync",
        category: "Viral Song",
        description: "A music-driven video concept",
        clips: 3,
        usage: null,
        access: "Free",
        previewLabel: "BEAT SYNC"
      },
      {
        id: "template-2",
        title: "Night Vibes",
        category: "Trendy",
        description: "A cinematic night-style concept",
        clips: 1,
        usage: null,
        access: "Free",
        previewLabel: "NIGHT VIBES"
      },
      {
        id: "template-3",
        title: "Monthly Memories",
        category: "Monthly Recap",
        description: "Collect moments into one video",
        clips: 6,
        usage: null,
        access: "Free",
        previewLabel: "MEMORIES"
      },
      {
        id: "template-4",
        title: "AI Portrait",
        category: "AI",
        description: "An AI-inspired creative concept",
        clips: 1,
        usage: null,
        access: "Pro",
        previewLabel: "AI PORTRAIT"
      },
      {
        id: "template-5",
        title: "Daily Moments",
        category: "Daily",
        description: "A short daily video concept",
        clips: 2,
        usage: null,
        access: "Free",
        previewLabel: "DAILY"
      },
      {
        id: "template-6",
        title: "Smooth Transitions",
        category: "Transitions",
        description: "A transition-focused concept",
        clips: 4,
        usage: null,
        access: "Pro",
        previewLabel: "TRANSITIONS"
      }
    ];
  }

  function renderTemplateCard(template) {
    return `
      <article class="rx-create-template"
               role="button"
               tabindex="0"
               data-rx-template-id="${escapeHTML(template.id)}">

        <div class="rx-create-template-preview">
          <div class="rx-create-template-art">
            ${escapeHTML(template.previewLabel || template.title)}
          </div>
        </div>

        <div class="rx-create-template-name">
          ${escapeHTML(template.title)}
        </div>

        <div class="rx-create-template-meta">
          ${template.usage == null
            ? "New template"
            : escapeHTML(template.usage) + " videos"}
          · ${Number(template.clips) || 1} clip(s)
        </div>

        <span class="rx-create-template-badge">
          ${escapeHTML(template.access || "Free")}
        </span>
      </article>
    `;
  }

  function renderTemplates() {
    const grid = state.container.querySelector(
      "[data-rx-create-template-grid]"
    );

    if (!grid) return;

    const query = state.search.toLowerCase().trim();

    const filtered = state.templates.filter(function (template) {
      const matchesCategory =
        state.category === "For You" ||
        template.category === state.category;

      const matchesSearch =
        !query ||
        template.title.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });

    grid.innerHTML = filtered.length
      ? filtered.map(renderTemplateCard).join("")
      : `
        <div class="rx-create-empty">
          No matching templates yet.<br>
          Try another category or search.
        </div>
      `;
  }

  function setStatus(message) {
    const status = state.container.querySelector(
      "[data-rx-create-status]"
    );

    if (status) status.textContent = message;
  }

  function openEditor() {
    const editor = window.RockyXStudioEditor;

    if (editor && typeof editor.init === "function") {
      editor.init({ container: state.container });
      setStatus("Studio editor opened.");
      return;
    }

    setStatus(
      "The editor module isn't connected yet. " +
      "We'll connect it after the Create screen is installed."
    );
  }

  function handleTool(tool) {
    const events = {
      photo: "rockyx:photo-editor",
      autocut: "rockyx:autocut",
      captions: "rockyx:captions",
      ai: "rockyx:ai-tools",
      cutout: "rockyx:cutout"
    };

    if (tool === "new-video") {
      openEditor();
      return;
    }

    if (tool === "drafts") {
      const drafts = readDraftCount();

      setStatus(
        drafts
          ? drafts + " draft record(s) saved on this device. " +
            "Draft reopening still needs to be connected."
          : "You don't have any saved editor drafts on this device yet."
      );

      return;
    }

    const eventName = events[tool];

    if (eventName) {
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: { source: "rockyx-create" }
        })
      );

      setStatus(
        "Requested " + tool + ". The feature must be connected " +
        "before this tool can operate."
      );
    }
  }

  function handleClick(event) {
    const toolButton = event.target.closest("[data-rx-create-tool]");

    if (toolButton) {
      handleTool(toolButton.dataset.rxCreateTool);
      return;
    }

    const categoryButton = event.target.closest(
      "[data-rx-create-category]"
    );

    if (categoryButton) {
      state.category = categoryButton.dataset.rxCreateCategory;

      state.container.querySelectorAll(
        "[data-rx-create-category]"
      ).forEach(function (button) {
        button.classList.toggle(
          "rx-active",
          button === categoryButton
        );
      });

      renderTemplates();
      return;
    }

    const searchButton = event.target.closest(
      "[data-rx-create-search-toggle]"
    );

    if (searchButton) {
      const input = state.container.querySelector(
        "[data-rx-create-search]"
      );

      input.classList.toggle("rx-visible");

      if (input.classList.contains("rx-visible")) {
        input.focus();
      } else {
        input.value = "";
        state.search = "";
        renderTemplates();
      }

      return;
    }

    const templateCard = event.target.closest(
      "[data-rx-template-id]"
    );

    if (templateCard) {
      const template = state.templates.find(function (item) {
        return item.id === templateCard.dataset.rxTemplateId;
      });

      if (!template) return;

      window.dispatchEvent(
        new CustomEvent("rockyx:template-selected", {
          detail: {
            template: template,
            source: "create"
          }
        })
      );

      setStatus(
        "Selected " + template.title +
        ". Template preview and media-slot processing need " +
        "to be connected to the template engine."
      );
    }
  }

  function handleKeydown(event) {
    const card = event.target.closest("[data-rx-template-id]");

    if (
      card &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      card.click();
    }
  }

  function render(container) {
    state.container = container;

    container.innerHTML = `
      <section class="rx-create-home">
        <header class="rx-create-header">
          <button class="rx-create-close"
                  type="button"
                  aria-label="Close Create"
                  data-rx-create-tool="close">×</button>

          <h1 class="rx-create-heading">CREATE</h1>

          <div class="rx-create-header-spacer"></div>
        </header>

        <div class="rx-create-tools">
          <button class="rx-create-tool"
                  type="button"
                  data-rx-create-tool="photo">
            <span class="rx-create-tool-icon">▧</span>
            <span class="rx-create-tool-name">Photo editor</span>
          </button>

          <button class="rx-create-tool"
                  type="button"
                  data-rx-create-tool="autocut">
            <span class="rx-create-tool-icon">✦</span>
            <span class="rx-create-tool-name">AutoCut</span>
          </button>

          <button class="rx-create-tool"
                  type="button"
                  data-rx-create-tool="captions">
            <span class="rx-create-tool-icon">▤</span>
            <span class="rx-create-tool-name">Captions</span>
          </button>

          <button class="rx-create-tool"
                  type="button"
                  data-rx-create-tool="ai">
            <span class="rx-create-tool-icon">AI</span>
            <span class="rx-create-tool-name">AI Self</span>
          </button>

          <button class="rx-create-tool"
                  type="button"
                  data-rx-create-tool="cutout">
            <span class="rx-create-tool-icon">◉</span>
            <span class="rx-create-tool-name">Cutout</span>
          </button>
        </div>

        <div class="rx-create-main-cards">
          <button class="rx-create-new-video"
                  type="button"
                  data-rx-create-tool="new-video">
            <span class="rx-create-plus">＋</span>
            <span class="rx-create-card-title">New video</span>
          </button>

          <button class="rx-create-drafts"
                  type="button"
                  data-rx-create-tool="drafts">
            <span class="rx-create-draft-count"
                  data-rx-create-draft-count>0</span>
            <span class="rx-create-drafts-label">Drafts</span>
          </button>
        </div>

        <section>
          <div class="rx-create-template-heading">
            <h2>Templates</h2>

            <button class="rx-create-search-button"
                    type="button"
                    aria-label="Search templates"
                    data-rx-create-search-toggle>⌕</button>
          </div>

          <input class="rx-create-search"
                 type="search"
                 placeholder="Search templates..."
                 aria-label="Search templates"
                 data-rx-create-search>

          <div class="rx-create-category-row">
            ${["For You", ...categories].map(function (category) {
              return `
                <button class="rx-create-category ${
                  category === "For You" ? "rx-active" : ""
                }"
                        type="button"
                        data-rx-create-category="${escapeHTML(category)}">
                  ${escapeHTML(category)}
                </button>
              `;
            }).join("")}
          </div>

          <div class="rx-create-template-grid"
               data-rx-create-template-grid></div>

          <div class="rx-create-status"
               role="status"
               aria-live="polite"
               data-rx-create-status></div>
        </section>
      </section>
    `;

    state.container.querySelector(
      "[data-rx-create-draft-count]"
    ).textContent = readDraftCount();

    renderTemplates();
  }

  function init(options) {
    const container = options && options.container
      ? options.container
      : document.getElementById("page-Studio");

    if (!container) {
      console.warn("RockyX Create: container not found.");
      return false;
    }

    addStyles();

    state.container = container;
    state.templates = defaultTemplates();
    state.category = "For You";
    state.search = "";

    render(container);

    if (!state.initialized) {
      container.addEventListener("click", handleClick);
      container.addEventListener("keydown", handleKeydown);

      container.addEventListener("input", function (event) {
        if (event.target.matches("[data-rx-create-search]")) {
          state.search = event.target.value;
          renderTemplates();
        }
      });

      state.initialized = true;
    }

    return true;
  }

  function setTemplates(templates) {
    if (!Array.isArray(templates)) return false;

    state.templates = templates.map(function (template, index) {
      return {
        id: String(template.id || "template-" + (index + 1)),
        title: String(template.title || "Untitled template"),
        category: String(template.category || "Trendy"),
        description: String(template.description || ""),
        clips: Number(template.clips) || 1,
        usage: template.usage == null ? null : template.usage,
        access: template.access || "Free",
        previewLabel: template.previewLabel || template.title
      };
    });

    if (state.container) renderTemplates();

    return true;
  }

  window.RockyXCreate = {
    init: init,
    render: render,
    setTemplates: setTemplates,

    getState: function () {
      return {
        category: state.category,
        search: state.search,
        templateCount: state.templates.length
      };
    }
  };
})();