(function (window, document) {
  "use strict";

  const categories = {
    "Video effects": [
      ["VHS", "Retro video look"],
      ["Film Grain", "Add film texture"],
      ["Glitch", "Digital distortion"],
      ["Neon", "Neon glow"],
      ["Blur", "Blur the scene"],
      ["Shake", "Camera shake"],
      ["Chromatic", "RGB colour split"],
      ["Light Leak", "Light overlays"],
      ["Flash", "Bright flashes"],
      ["Ripple", "Wave distortion"],
      ["Snow", "Falling snow"],
      ["Glow", "Soft light glow"]
    ],
    "Body effects": [
      ["Neon Outline", "Outline the subject"],
      ["Electric", "Electric glow"],
      ["Rainbow", "Colourful outline"],
      ["Flame", "Flame styling"],
      ["Angel", "Soft angelic look"],
      ["Wings", "Fantasy styling"],
      ["Motion Trail", "Motion trail look"],
      ["Clone", "Duplicate subject style"],
      ["Hologram", "Holographic look"],
      ["Particles", "Floating particles"],
      ["Disco", "Colourful light look"],
      ["Funny", "Playful styling"]
    ],
    "Photo effects": [
      ["Cartoon", "Cartoon-style look"],
      ["Anime", "Anime-inspired look"],
      ["Sketch", "Pencil drawing look"],
      ["Vintage", "Vintage photo look"],
      ["Black & White", "Monochrome look"],
      ["Polaroid", "Instant-film look"],
      ["Bokeh", "Soft background lights"],
      ["Warm", "Warm colour tone"],
      ["Film", "Cinematic film look"],
      ["Glow", "Soft photo glow"]
    ],
    "AI effects": [
      ["AI Cartoon", "AI cartoon transformation"],
      ["AI Anime", "AI anime transformation"],
      ["AI Painting", "Painting-style transformation"],
      ["AI Enhance", "AI image enhancement"],
      ["AI Background", "AI background changes"],
      ["AI Relight", "AI lighting changes"],
      ["AI Scene", "AI scene transformation"],
      ["AI Motion", "AI-assisted motion effects"],
      ["AI Outfit", "AI outfit transformation"],
      ["AI Sky", "AI sky replacement"]
    ]
  };

  const icons = {
    "Video effects": "✦",
    "Body effects": "☺",
    "Photo effects": "◇",
    "AI effects": "✧"
  };

  function createElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function init(options) {
    options = options || {};

    const container = typeof options.container === "string"
      ? document.querySelector(options.container)
      : options.container;

    if (!container) {
      console.error("RockyX Effects needs a container.");
      return;
    }

    if (container.__rockyxEffectsCleanup) {
      container.__rockyxEffectsCleanup();
    }

    const state = {
      category: "Video effects",
      selected: null,
      intensity: 70,
      speed: 50,
      range: 100,
      search: "",
      active: true
    };

    const previousContent = container.innerHTML;
    container.classList.add("rockyx-effects-host");

    const style = document.createElement("style");
    style.dataset.rockyxEffectsStyle = "true";
    style.textContent = `
      .rockyx-effects-host {
        color: #f7f4ff;
        background: #101014;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .rx-effects { padding: 16px; background:#101014; min-height:500px; }
      .rx-effects * { box-sizing:border-box; }
      .rx-effects button,.rx-effects input { font:inherit; }
      .rx-effects button {
        cursor:pointer; color:inherit; border:0;
      }
      .rx-effects .rx-top {
        display:flex; align-items:center; gap:10px;
        margin-bottom:16px;
      }
      .rx-effects .rx-back {
        background:#29292f; border-radius:10px;
        padding:10px 14px; font-size:20px;
      }
      .rx-effects .rx-heading { font-size:21px; font-weight:750; }
      .rx-effects .rx-tabs {
        display:flex; gap:8px; overflow-x:auto;
        padding-bottom:12px; scrollbar-width:none;
      }
      .rx-effects .rx-tab {
        flex:0 0 auto; padding:11px 13px;
        background:#25252c; border-radius:12px;
        color:#d2cfdb; font-size:12px;
      }
      .rx-effects .rx-tab.active {
        background:#722dff; color:white;
      }
      .rx-effects .rx-search {
        width:100%; padding:13px 15px; margin:5px 0 14px;
        border:1px solid #30303a; border-radius:12px;
        background:#202027; color:white; outline:none;
      }
      .rx-effects .rx-grid {
        display:grid; grid-template-columns:repeat(3,minmax(0,1fr));
        gap:12px;
      }
      .rx-effects .rx-card {
        min-width:0; background:transparent; text-align:left;
        padding:0; border-radius:12px;
      }
      .rx-effects .rx-thumb {
        display:flex; aspect-ratio:1/1; align-items:center;
        justify-content:center; border:2px solid #34343d;
        border-radius:12px; font-size:32px;
        background:linear-gradient(145deg,#34244e,#171d32 55%,#40305e);
        overflow:hidden; position:relative;
      }
      .rx-effects .rx-card.selected .rx-thumb {
        border-color:#a66aff; box-shadow:0 0 0 2px #712cff55;
      }
      .rx-effects .rx-thumb::after {
        content:""; position:absolute; inset:0;
        background:linear-gradient(130deg,transparent,#ffffff12,transparent);
        pointer-events:none;
      }
      .rx-effects .rx-name {
        display:block; padding:7px 2px 2px;
        font-size:12px; font-weight:650;
        overflow-wrap:anywhere;
      }
      .rx-effects .rx-description {
        display:block; color:#aaa6b7; font-size:10px;
        line-height:1.4; padding:0 2px 6px;
      }
      .rx-effects .rx-section-title {
        font-weight:700; margin:18px 0 12px;
      }
      .rx-effects .rx-panel {
        margin-top:18px; padding:15px;
        border:1px solid #30303a; border-radius:16px;
        background:#1d1d24;
      }
      .rx-effects .rx-selected-title { font-size:17px; font-weight:750; }
      .rx-effects .rx-hint { color:#aaa6b7; font-size:12px; margin-top:6px; }
      .rx-effects .rx-control {
        display:grid; grid-template-columns:78px 1fr 32px;
        gap:8px; align-items:center; margin:16px 0;
        font-size:12px;
      }
      .rx-effects input[type=range] { width:100%; accent-color:#9858ff; }
      .rx-effects .rx-actions { display:flex; gap:8px; margin-top:15px; }
      .rx-effects .rx-action {
        flex:1; padding:12px 6px; border-radius:10px;
        background:#30303a; font-size:12px;
      }
      .rx-effects .rx-action.primary { background:#772eff; }
      .rx-effects .rx-timeline {
        margin-top:18px; padding:14px; border-radius:14px;
        background:#1d1d24;
      }
      .rx-effects .rx-track {
        margin-top:10px; padding:13px 10px; border-radius:8px;
        background:linear-gradient(90deg,#6530c8,#b14edc);
        overflow-wrap:anywhere; font-size:12px;
      }
      .rx-effects .rx-empty { color:#aaa6b7; font-size:13px; padding:20px 0; }
      @media(min-width:600px) {
        .rx-effects .rx-grid { grid-template-columns:repeat(4,minmax(0,1fr)); }
        .rx-effects { padding:22px; }
      }
    `;

    document.head.appendChild(style);

    const root = createElement("section", "rx-effects");
    const top = createElement("div", "rx-top");
    const back = createElement("button", "rx-back", "‹");
    back.type = "button";
    back.setAttribute("aria-label", "Close effects");
    const heading = createElement("div", "rx-heading", "Effects");
    top.append(back, heading);

    const tabs = createElement("div", "rx-tabs");
    tabs.setAttribute("role", "tablist");

    Object.keys(categories).forEach(function (category) {
      const tab = createElement(
        "button",
        "rx-tab" + (category === state.category ? " active" : ""),
        icons[category] + "  " + category
      );
      tab.type = "button";
      tab.dataset.category = category;
      tabs.appendChild(tab);
    });

    const search = createElement("input", "rx-search");
    search.type = "search";
    search.placeholder = "Search effects...";
    search.setAttribute("aria-label", "Search effects");

    const sectionTitle = createElement("div", "rx-section-title");
    const grid = createElement("div", "rx-grid");
    const panel = createElement("div", "rx-panel");
    const timeline = createElement("div", "rx-timeline");

    root.append(top, tabs, search, sectionTitle, grid, panel, timeline);
    container.replaceChildren(root);

    function renderGrid() {
      grid.replaceChildren();

      const items = categories[state.category].filter(function (item) {
        return item.join(" ").toLowerCase().includes(state.search.toLowerCase());
      });

      sectionTitle.textContent = state.category + " · " + items.length;

      if (!items.length) {
        grid.appendChild(createElement("div", "rx-empty", "No matching effects."));
        return;
      }

      items.forEach(function (item, index) {
        const name = item[0];
        const description = item[1];
        const card = createElement(
          "button",
          "rx-card" + (state.selected && state.selected.name === name &&
            state.selected.category === state.category ? " selected" : "")
        );

        card.type = "button";
        card.dataset.effect = name;

        const thumb = createElement("span", "rx-thumb", icons[state.category]);
        thumb.setAttribute("aria-hidden", "true");
        thumb.style.filter = "hue-rotate(" + ((index * 37) % 300) + "deg)";

        const title = createElement("span", "rx-name", name);
        const desc = createElement("span", "rx-description", description);

        card.append(thumb, title, desc);
        grid.appendChild(card);
      });
    }

    function renderPanel() {
      panel.replaceChildren();

      if (!state.selected) {
        panel.append(
          createElement("div", "rx-selected-title", "Choose an effect"),
          createElement("div", "rx-hint",
            "Select an effect to view its settings. Visual rendering will be connected to the editor engine.")
        );
        return;
      }

      panel.append(
        createElement("div", "rx-selected-title", state.selected.name),
        createElement("div", "rx-hint",
          state.selected.category + " · Preview and effect settings")
      );

      [
        ["Intensity", "intensity"],
        ["Speed", "speed"],
        ["Range", "range"]
      ].forEach(function (control) {
        const row = createElement("label", "rx-control");
        const label = createElement("span", "", control[0]);
        const input = createElement("input");
        input.type = "range";
        input.min = "0";
        input.max = "100";
        input.value = String(state[control[1]]);
        input.dataset.setting = control[1];

        const value = createElement("output", "", String(state[control[1]]));
        row.append(label, input, value);
        panel.appendChild(row);
      });

      const actions = createElement("div", "rx-actions");
      const remove = createElement("button", "rx-action", "Remove");
      remove.dataset.action = "remove";
      const apply = createElement("button", "rx-action primary", "Add to timeline");
      apply.dataset.action = "apply";
      actions.append(remove, apply);
      panel.appendChild(actions);
    }

    function renderTimeline() {
      timeline.replaceChildren();
      timeline.appendChild(createElement("div", "rx-selected-title", "Effect timeline"));

      if (!state.selected || !state.selected.applied) {
        timeline.appendChild(createElement("div", "rx-empty",
          "Choose an effect, then tap Add to timeline."));
        return;
      }

      const track = createElement("div", "rx-track",
        state.selected.name + " · Intensity " + state.intensity + "%");
      timeline.appendChild(track);
    }

    function onClick(event) {
      const tab = event.target.closest("[data-category]");
      if (tab) {
        state.category = tab.dataset.category;
        tabs.querySelectorAll(".rx-tab").forEach(function (button) {
          button.classList.toggle("active", button === tab);
        });
        renderGrid();
        renderPanel();
        return;
      }

      const card = event.target.closest("[data-effect]");
      if (card) {
        state.selected = {
          name: card.dataset.effect,
          category: state.category,
          applied: false
        };
        renderGrid();
        renderPanel();
        renderTimeline();
        return;
      }

      const action = event.target.closest("[data-action]");
      if (!action) return;

      if (action.dataset.action === "remove") {
        state.selected = null;
      }

      if (action.dataset.action === "apply" && state.selected) {
        state.selected.applied = true;
      }

      renderGrid();
      renderPanel();
      renderTimeline();
    }

    function onInput(event) {
      if (event.target === search) {
        state.search = search.value;
        renderGrid();
        return;
      }

      const key = event.target.dataset.setting;
      if (key && Object.prototype.hasOwnProperty.call(state, key)) {
        state[key] = Number(event.target.value);
        const output = event.target.parentElement.querySelector("output");
        if (output) output.value = String(state[key]);

        if (state.selected && state.selected.applied) {
          renderTimeline();
        }
      }
    }

    function onBack() {
      if (typeof options.onClose === "function") {
        options.onClose();
        return;
      }

      container.dispatchEvent(new CustomEvent("rockyx:effects-close", {
        bubbles: true
      }));
    }

    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    back.addEventListener("click", onBack);

    renderGrid();
    renderPanel();
    renderTimeline();

    function cleanup() {
      state.active = false;
      root.removeEventListener("click", onClick);
      root.removeEventListener("input", onInput);
      back.removeEventListener("click", onBack);
      container.classList.remove("rockyx-effects-host");
      if (style.parentNode) style.parentNode.removeChild(style);
      container.innerHTML = previousContent;
      delete container.__rockyxEffectsCleanup;
    }

    container.__rockyxEffectsCleanup = cleanup;

    return {
      destroy: cleanup,
      getState: function () {
        return JSON.parse(JSON.stringify(state));
      },
      getCategories: function () {
        return Object.keys(categories);
      }
    };
  }

  window.RockyXEffects = {
    init: init,
    getCategories: function () {
      return Object.keys(categories);
    }
  };
})(window, document);