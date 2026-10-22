/* ==========================================================
   ROCKYX CREATE STUDIO
   CapCut-inspired modular editor interface
   ========================================================== */

(function (window, document) {
  "use strict";

  if (window.RockyXStudioEditor) return;

  const state = {
    clips: [],
    selectedClipId: null,
    nextClipId: 1,
    textOverlays: [],
    filter: "none",
    speed: 1,
    objectUrls: new Set(),
    root: null,
    preview: null,
    fileInput: null
  };

  const filters = {
    none: "none",
    warm: "sepia(18%) saturate(115%)",
    cool: "saturate(90%) hue-rotate(10deg)",
    mono: "grayscale(100%)",
    vivid: "saturate(145%) contrast(108%)",
    soft: "brightness(105%) saturate(90%)"
  };

  const styles = `
    .rx-studio {
      --rx-bg: #101014;
      --rx-panel: #1b1a22;
      --rx-purple: #a855f7;
      background: var(--rx-bg);
      color: #fff;
      min-height: 100%;
      padding: 12px;
      font-family: Arial, sans-serif;
      box-sizing: border-box;
    }

    .rx-studio * {
      box-sizing: border-box;
    }

    .rx-studio-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 14px;
    }

    .rx-studio-title {
      font-size: 20px;
      font-weight: 800;
      margin: 0;
    }

    .rx-studio-subtitle {
      color: #aaa6b7;
      font-size: 12px;
      margin-top: 5px;
    }

    .rx-studio-button {
      border: 1px solid #393541;
      border-radius: 10px;
      padding: 10px 12px;
      background: #25232e;
      color: white;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }

    .rx-studio-button.primary {
      background: var(--rx-purple);
      border-color: var(--rx-purple);
    }

    .rx-studio-button:active {
      transform: scale(.97);
    }

    .rx-studio-button:disabled {
      opacity: .45;
    }

    .rx-studio-preview {
      position: relative;
      width: min(100%, 390px);
      aspect-ratio: 9 / 14;
      max-height: 48vh;
      margin: 0 auto 12px;
      background: #050506;
      border: 1px solid #302d39;
      border-radius: 14px;
      overflow: hidden;
      display: grid;
      place-items: center;
    }

    .rx-studio-preview video,
    .rx-studio-preview img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
    }

    .rx-studio-empty {
      color: #aaa6b7;
      text-align: center;
      padding: 22px;
      line-height: 1.7;
      font-size: 13px;
    }

    .rx-studio-empty-icon {
      font-size: 38px;
      margin-bottom: 8px;
    }

    .rx-studio-overlay {
      position: absolute;
      top: 42%;
      left: 7%;
      right: 7%;
      text-align: center;
      color: white;
      font-size: 23px;
      font-weight: 800;
      text-shadow: 0 2px 5px #000;
      overflow-wrap: anywhere;
      pointer-events: none;
    }

    .rx-studio-preview-tools {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin: 8px 0 16px;
    }

    .rx-studio-toolbar {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 5px 1px 10px;
      scrollbar-width: thin;
    }

    .rx-studio-tool {
      flex: 0 0 70px;
      min-height: 66px;
      border: 1px solid #302d39;
      border-radius: 12px;
      background: #1b1a22;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 7px;
      font-size: 11px;
      cursor: pointer;
    }

    .rx-studio-tool-icon {
      font-size: 21px;
    }

    .rx-studio-tool.active {
      border-color: var(--rx-purple);
      background: #30203f;
    }

    .rx-studio-section {
      margin-top: 17px;
      padding: 12px;
      border: 1px solid #302d39;
      border-radius: 13px;
      background: #15141b;
    }

    .rx-studio-section h3 {
      font-size: 14px;
      margin: 0 0 10px;
    }

    .rx-studio-label {
      display: block;
      color: #c7c5d1;
      font-size: 12px;
      margin-top: 12px;
    }

    .rx-studio-field {
      width: 100%;
      padding: 11px;
      border: 1px solid #393541;
      border-radius: 9px;
      background: #1b1a22;
      color: white;
      margin: 7px 0;
      font: inherit;
    }

    .rx-studio-timeline {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 5px 1px 10px;
    }

    .rx-studio-clip {
      flex: 0 0 100px;
      position: relative;
      border: 2px solid transparent;
      border-radius: 9px;
      overflow: hidden;
      background: #22202a;
      cursor: pointer;
    }

    .rx-studio-clip.selected {
      border-color: var(--rx-purple);
    }

    .rx-studio-clip img,
    .rx-studio-clip video {
      display: block;
      width: 100%;
      height: 75px;
      object-fit: cover;
    }

    .rx-studio-clip-name {
      display: block;
      padding: 6px;
      font-size: 10px;
      overflow-wrap: anywhere;
    }

    .rx-studio-clip-remove {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 25px;
      height: 25px;
      border: 0;
      border-radius: 50%;
      background: #100f14;
      color: white;
      font-size: 18px;
      cursor: pointer;
    }

    .rx-studio-track {
      padding: 9px;
      margin-top: 7px;
      background: #201e29;
      border-radius: 8px;
      color: #d5c8e9;
      font-size: 11px;
    }

    .rx-studio-status {
      color: #d8b4fe;
      font-size: 12px;
      line-height: 1.5;
      min-height: 18px;
      margin-top: 10px;
    }

    .rx-studio-note {
      color: #9995a7;
      font-size: 11px;
      line-height: 1.5;
      margin-top: 10px;
    }

    .rx-studio-hidden {
      display: none !important;
    }

    .rx-studio-categories {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
    }

    .rx-studio-category {
      padding: 14px 8px;
      text-align: left;
      background: #24212d;
      color: white;
      border: 1px solid #393541;
      border-radius: 10px;
      cursor: pointer;
    }

    .rx-studio-category strong {
      display: block;
      margin-bottom: 5px;
      font-size: 12px;
    }

    .rx-studio-category span {
      color: #aaa6b7;
      font-size: 10px;
    }

    .rx-studio-effect-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin-top: 12px;
    }

    .rx-studio-effect {
      min-height: 65px;
      border: 1px solid #393541;
      border-radius: 9px;
      background: #24212d;
      color: white;
      padding: 9px 4px;
      font-size: 11px;
      cursor: pointer;
    }

    .rx-studio-effect.active {
      border-color: var(--rx-purple);
      background: #39234d;
    }

    .rx-studio-range {
      width: 100%;
      accent-color: var(--rx-purple);
    }

    .rx-studio-export {
      width: 100%;
      margin-top: 12px;
    }
  `;

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function ensureStyles() {
    if (document.getElementById("rx-studio-editor-styles")) return;

    const style = document.createElement("style");
    style.id = "rx-studio-editor-styles";
    style.textContent = styles;
    document.head.appendChild(style);
  }

  function getClip(id) {
    return state.clips.find(function (clip) {
      return clip.id === id;
    }) || null;
  }

  function getSelectedClip() {
    return getClip(state.selectedClipId);
  }

  function setStatus(message) {
    if (!state.root) return;

    const element = state.root.querySelector(
      "[data-rx-studio-status]"
    );

    if (element) element.textContent = message;
  }

  function releaseClip(clip) {
    if (!clip || !clip.url) return;

    URL.revokeObjectURL(clip.url);
    state.objectUrls.delete(clip.url);
  }

  function addFiles(fileList) {
    const files = Array.from(fileList || []).filter(function (file) {
      return file.type.startsWith("video/") ||
        file.type.startsWith("image/");
    });

    if (!files.length) {
      setStatus("Choose a video or image to start editing.");
      return;
    }

    files.forEach(function (file) {
      const url = URL.createObjectURL(file);
      state.objectUrls.add(url);

      const clip = {
        id: state.nextClipId++,
        file: file,
        name: file.name,
        type: file.type,
        url: url,
        duration: 0
      };

      state.clips.push(clip);

      if (state.selectedClipId === null) {
        state.selectedClipId = clip.id;
      }
    });

    renderTimeline();
    renderPreview();

    setStatus(files.length + " media item(s) added.");
  }

  function renderPreview() {
    if (!state.root) return;

    const preview = state.root.querySelector(
      "[data-rx-studio-preview]"
    );

    if (!preview) return;

    preview.innerHTML = "";

    const clip = getSelectedClip();

    if (!clip) {
      preview.innerHTML = `
        <div class="rx-studio-empty">
          <div class="rx-studio-empty-icon">＋</div>
          <strong>Your creation starts here</strong>
          <div>Add a video or photo to begin editing.</div>
        </div>
      `;

      state.preview = null;
      return;
    }

    const media = document.createElement(
      clip.type.startsWith("video/") ? "video" : "img"
    );

    media.src = clip.url;

    if (media.tagName === "VIDEO") {
      media.controls = true;
      media.playsInline = true;
      media.preload = "metadata";
      media.playbackRate = state.speed;
    } else {
      media.alt = clip.name;
    }

    media.style.filter = filters[state.filter] || "none";
    preview.appendChild(media);
    state.preview = media;

    const overlay = state.textOverlays
      .filter(function (item) {
        return item.clipId === clip.id;
      })
      .map(function (item) {
        return item.text;
      })
      .join("\n");

    if (overlay) {
      const text = document.createElement("div");
      text.className = "rx-studio-overlay";
      text.textContent = overlay;
      preview.appendChild(text);
    }
  }

  function renderTimeline() {
    if (!state.root) return;

    const timeline = state.root.querySelector(
      "[data-rx-studio-timeline]"
    );

    if (!timeline) return;

    timeline.innerHTML = "";

    state.clips.forEach(function (clip) {
      const card = document.createElement("div");
      card.className = "rx-studio-clip" +
        (clip.id === state.selectedClipId ? " selected" : "");

      card.dataset.clipId = String(clip.id);

      const media = document.createElement(
        clip.type.startsWith("image/") ? "img" : "video"
      );

      media.src = clip.url;

      if (media.tagName === "VIDEO") {
        media.muted = true;
        media.preload = "metadata";
        media.playsInline = true;
      } else {
        media.alt = "";
      }

      const name = document.createElement("span");
      name.className = "rx-studio-clip-name";
      name.textContent = clip.name;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "rx-studio-clip-remove";
      remove.textContent = "×";
      remove.dataset.removeClip = String(clip.id);
      remove.setAttribute("aria-label", "Remove media");

      card.append(media, name, remove);
      timeline.appendChild(card);
    });

    const count = state.root.querySelector(
      "[data-rx-studio-clip-count]"
    );

    if (count) count.textContent = state.clips.length + " media item(s)";
  }

  function removeClip(id) {
    const clip = getClip(id);
    if (!clip) return;

    releaseClip(clip);

    state.clips = state.clips.filter(function (item) {
      return item.id !== id;
    });

    state.textOverlays = state.textOverlays.filter(function (item) {
      return item.clipId !== id;
    });

    if (state.selectedClipId === id) {
      state.selectedClipId = state.clips.length
        ? state.clips[0].id
        : null;
    }

    renderTimeline();
    renderPreview();
    setStatus("Media removed.");
  }

  function moveClip(id, direction) {
    const index = state.clips.findIndex(function (clip) {
      return clip.id === id;
    });

    const target = index + direction;

    if (index < 0 || target < 0 || target >= state.clips.length) return;

    const current = state.clips[index];
    state.clips[index] = state.clips[target];
    state.clips[target] = current;

    renderTimeline();
    setStatus("Clip order updated.");
  }

  function addText() {
    const input = state.root.querySelector("[data-rx-studio-text]");
    const clip = getSelectedClip();
    const value = input ? input.value.trim() : "";

    if (!clip) {
      setStatus("Add or select media before adding text.");
      return;
    }

    if (!value) {
      setStatus("Enter text first.");
      return;
    }

    state.textOverlays.push({
      clipId: clip.id,
      text: value
    });

    input.value = "";
    renderPreview();
    setStatus("Text overlay added to preview.");
  }

  function saveDraft() {
    const draft = {
      version: 1,
      savedAt: new Date().toISOString(),
      clips: state.clips.map(function (clip) {
        return { name: clip.name, type: clip.type };
      }),
      filter: state.filter,
      speed: state.speed,
      textOverlays: state.textOverlays
    };

    try {
      const drafts = JSON.parse(
        localStorage.getItem("rockyx_editor_drafts") || "[]"
      );

      drafts.unshift(draft);

      localStorage.setItem(
        "rockyx_editor_drafts",
        JSON.stringify(drafts.slice(0, 30))
      );

      setStatus("Draft information saved on this device.");
    } catch (error) {
      setStatus("Unable to save draft information.");
    }
  }

  function openEffects() {
    if (typeof window.RockyXOpenEffects === "function") {
      window.RockyXOpenEffects(state.root);
      return;
    }

    const registry = window.RockyXModules;

    if (!registry || typeof registry.load !== "function") {
      setStatus("Effects module registry is unavailable.");
      return;
    }

    registry.load("effects")
      .then(function (module) {
        if (!module || typeof module.init !== "function") {
          throw new Error("Effects module has no init function.");
        }

        module.init({
          container: state.root,
          onClose: function () {
            init({ container: state.root });
          }
        });
      })
      .catch(function (error) {
        console.error("RockyX Effects error:", error);
        setStatus("Effects could not open. Check the module connection.");
      });
  }

  function showEffectsLibrary() {
    const panel = state.root.querySelector("[data-rx-effects-library]");
    if (!panel) return;

    panel.classList.toggle("rx-studio-hidden");
  }

  function buildInterface(container) {
    container.innerHTML = `
      <section class="rx-studio">
        <header class="rx-studio-header">
          <div>
            <h2 class="rx-studio-title">RockyX Studio</h2>
            <div class="rx-studio-subtitle">Create something amazing</div>
          </div>
          <button class="rx-studio-button primary"
                  type="button"
                  data-rx-studio-save>Save draft</button>
        </header>

        <input class="rx-studio-hidden"
               type="file"
               accept="video/*,image/*"
               multiple
               data-rx-studio-file-input>

        <button class="rx-studio-button"
                type="button"
                data-rx-studio-upload
                style="width:100%;margin-bottom:12px">
          ＋ Add video or photo
        </button>

        <div class="rx-studio-preview" data-rx-studio-preview></div>

        <div class="rx-studio-preview-tools">
          <button class="rx-studio-button"
                  type="button"
                  data-rx-studio-upload>＋ Media</button>
          <button class="rx-studio-button"
                  type="button"
                  data-rx-studio-add-text>＋ Text</button>
          <button class="rx-studio-button"
                  type="button"
                  data-rx-studio-effects>✨ Effects</button>
        </div>

        <div class="rx-studio-section">
          <h3>Editing tools</h3>
          <div class="rx-studio-toolbar">
            <button class="rx-studio-tool" type="button"
                    data-rx-studio-upload>
              <span class="rx-studio-tool-icon">✂️</span>Edit
            </button>
            <button class="rx-studio-tool" type="button"
                    data-rx-studio-audio>
              <span class="rx-studio-tool-icon">🎵</span>Audio
            </button>
            <button class="rx-studio-tool" type="button"
                    data-rx-studio-add-text>
              <span class="rx-studio-tool-icon">🔤</span>Text
            </button>
            <button class="rx-studio-tool" type="button"
                    data-rx-studio-stickers>
              <span class="rx-studio-tool-icon">⭐</span>Stickers
            </button>
            <button class="rx-studio-tool active" type="button"
                    data-rx-studio-effects>
              <span class="rx-studio-tool-icon">✨</span>Effects
            </button>
            <button class="rx-studio-tool" type="button"
                    data-rx-studio-overlay>
              <span class="rx-studio-tool-icon">▣</span>Overlay
            </button>
            <button class="rx-studio-tool" type="button"
                    data-rx-studio-show-filters>
              <span class="rx-studio-tool-icon">🎨</span>Filters
            </button>
          </div>
        </div>

        <div class="rx-studio-section rx-studio-hidden"
             data-rx-effects-library>
          <h3>✨ Effects library</h3>
          <input class="rx-studio-field"
                 type="search"
                 placeholder="Search effects..."
                 data-rx-effect-search>

          <div class="rx-studio-categories">
            <button class="rx-studio-category" type="button"
                    data-rx-effect-category="Video Effects">
              <strong>🎬 Video Effects</strong>
              <span>Glitch, glow, blur and more</span>
            </button>
            <button class="rx-studio-category" type="button"
                    data-rx-effect-category="Body Effects">
              <strong>🕺 Body Effects</strong>
              <span>Neon, trails and more</span>
            </button>
            <button class="rx-studio-category" type="button"
                    data-rx-effect-category="Photo Effects">
              <strong>🖼️ Photo Effects</strong>
              <span>Vintage, anime and more</span>
            </button>
            <button class="rx-studio-category" type="button"
                    data-rx-effect-category="AI Effects">
              <strong>🤖 AI Effects</strong>
              <span>AI styles and enhancement</span>
            </button>
          </div>

          <div class="rx-studio-effect-grid" data-rx-effect-grid></div>
          <label class="rx-studio-label">Effect intensity</label>
          <input class="rx-studio-range" type="range"
                 min="0" max="100" value="50"
                 data-rx-effect-intensity>
          <div class="rx-studio-note">
            The library is an interface foundation. Advanced visual
            effects and AI processing require their processing engines.
          </div>
        </div>

        <div class="rx-studio-section"
             data-rx-studio-filters>
          <h3>Filters</h3>
          <div class="rx-studio-toolbar">
            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-filter="none">Original</button>
            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-filter="warm">Warm</button>
            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-filter="cool">Cool</button>
            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-filter="mono">Mono</button>
            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-filter="vivid">Vivid</button>
            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-filter="soft">Soft</button>
          </div>
        </div>

        <div class="rx-studio-section">
          <h3>Text overlay</h3>
          <input class="rx-studio-field"
                 type="text"
                 maxlength="120"
                 placeholder="Write something..."
                 data-rx-studio-text>
          <button class="rx-studio-button"
                  type="button"
                  data-rx-studio-add-text>Add text to preview</button>
        </div>

        <div class="rx-studio-section">
          <h3>Playback speed</h3>
          <div class="rx-studio-toolbar">
            <button class="rx-studio-button"
                    type="button" data-rx-studio-speed="0.5">0.5×</button>
            <button class="rx-studio-button"
                    type="button" data-rx-studio-speed="1">1×</button>
            <button class="rx-studio-button"
                    type="button" data-rx-studio-speed="1.5">1.5×</button>
            <button class="rx-studio-button"
                    type="button" data-rx-studio-speed="2">2×</button>
          </div>
        </div>

        <div class="rx-studio-section">
          <h3>Timeline</h3>
          <div data-rx-studio-clip-count>0 media items</div>
          <div class="rx-studio-timeline"
               data-rx-studio-timeline></div>
          <div class="rx-studio-track">🎬 Video track</div>
          <div class="rx-studio-track">🎵 Audio track — not connected yet</div>
          <div class="rx-studio-track">🔤 Text track</div>
          <div class="rx-studio-track">✨ Effects track</div>
          <div class="rx-studio-toolbar">
            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-move="-1">← Move left</button>
            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-move="1">Move right →</button>
            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-remove-selected>Remove selected</button>
          </div>
        </div>

        <button class="rx-studio-button primary rx-studio-export"
                type="button" data-rx-studio-export>
          Export video
        </button>

        <div class="rx-studio-note">
          Export is a placeholder until the video-rendering engine is
          implemented. Save draft stores editing information, not
          the original media files.
        </div>

        <div class="rx-studio-status"
             role="status"
             aria-live="polite"
             data-rx-studio-status></div>
      </section>
    `;

    state.root = container;
    state.fileInput = container.querySelector("[data-rx-studio-file-input]");

    renderTimeline();
    renderPreview();
  }

  function renderEffectNames(category, search) {
    const names = {
      "Video Effects": [
        "VHS", "Film Grain", "Glitch", "Neon", "Blur", "Shake",
        "Chromatic", "Light Leak", "Flash", "Ripple", "Snow", "Glow"
      ],
      "Body Effects": [
        "Neon Outline", "Electric", "Rainbow", "Flame", "Angel",
        "Wings", "Motion Trail", "Clone", "Hologram", "Particles"
      ],
      "Photo Effects": [
        "Cartoon", "Anime", "Sketch", "Vintage", "Black & White",
        "Polaroid", "Bokeh", "Warm", "Film", "Glow"
      ],
      "AI Effects": [
        "AI Cartoon", "AI Anime", "AI Painting", "AI Enhance",
        "AI Background", "AI Relight", "AI Scene", "AI Motion"
      ]
    };

    const grid = state.root.querySelector("[data-rx-effect-grid]");
    if (!grid) return;

    const filtered = (names[category] || []).filter(function (name) {
      return name.toLowerCase().includes((search || "").toLowerCase());
    });

    grid.innerHTML = "";

    filtered.forEach(function (name) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rx-studio-effect";
      button.textContent = name;
      button.dataset.effectName = name;
      grid.appendChild(button);
    });
  }

  function handleClick(event) {
    const target = event.target.closest("button");
    if (!target || !state.root.contains(target)) return;

    if (target.hasAttribute("data-rx-studio-upload")) {
      state.fileInput.click();
      return;
    }

    if (target.hasAttribute("data-rx-studio-effects")) {
      showEffectsLibrary();
      return;
    }

    if (target.hasAttribute("data-rx-effect-category")) {
      const category = target.dataset.rxEffectCategory;
      const search = state.root.querySelector("[data-rx-effect-search]");
      renderEffectNames(category, search ? search.value : "");
      setStatus(category + " selected. Choose an effect to preview.");
      return;
    }

    if (target.hasAttribute("data-effect-name")) {
      state.root.querySelectorAll("[data-effect-name]").forEach(function (button) {
        button.classList.toggle("active", button === target);
      });

      setStatus(
        target.dataset.effectName +
        " selected. Actual effect rendering is not implemented yet."
      );
      return;
    }

    if (target.hasAttribute("data-rx-studio-add-text")) {
      addText();
      return;
    }

    if (target.hasAttribute("data-rx-studio-save")) {
      saveDraft();
      return;
    }

    if (target.hasAttribute("data-rx-studio-remove-selected")) {
      if (state.selectedClipId !== null) {
        removeClip(state.selectedClipId);
      }
      return;
    }

    if (target.hasAttribute("data-rx-studio-move")) {
      if (state.selectedClipId !== null) {
        moveClip(
          state.selectedClipId,
          Number(target.dataset.rxStudioMove)
        );
      }
      return;
    }

    if (target.hasAttribute("data-rx-studio-filter")) {
      state.filter = target.dataset.rxStudioFilter;
      renderPreview();
      setStatus("Preview filter changed.");
      return;
    }

    if (target.hasAttribute("data-rx-studio-speed")) {
      state.speed = Number(target.dataset.rxStudioSpeed);

      if (state.preview && state.preview.tagName === "VIDEO") {
        state.preview.playbackRate = state.speed;
      }

      setStatus("Playback speed set to " + state.speed + "×.");
      return;
    }

    if (target.hasAttribute("data-rx-studio-show-filters")) {
      const filtersPanel = state.root.querySelector("[data-rx-studio-filters]");
      if (filtersPanel) filtersPanel.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (target.hasAttribute("data-rx-studio-audio") ||
        target.hasAttribute("data-rx-studio-stickers") ||
        target.hasAttribute("data-rx-studio-overlay")) {
      setStatus("This tool's editing functionality is not implemented yet.");
      return;
    }

    if (target.hasAttribute("data-rx-studio-export")) {
      setStatus("Video export is not implemented yet.");
      return;
    }

    if (target.hasAttribute("data-remove-clip")) {
      event.stopPropagation();
      removeClip(Number(target.dataset.removeClip));
    }
  }

  function handleTimelineClick(event) {
    const card = event.target.closest("[data-clip-id]");
    if (!card || !state.root.contains(card)) return;

    if (event.target.closest("[data-remove-clip]")) return;

    state.selectedClipId = Number(card.dataset.clipId);
    renderTimeline();
    renderPreview();
  }

  function init(options) {
    const container = options && options.container
      ? options.container
      : document.getElementById("rockyx-create-root") ||
        document.getElementById("page-Studio");

    if (!container) {
      console.warn("RockyX Studio: container not found.");
      return false;
    }

    ensureStyles();
    buildInterface(container);

    container.addEventListener("click", handleClick);
    container.addEventListener("click", handleTimelineClick);

    state.fileInput.addEventListener("change", function () {
      addFiles(state.fileInput.files);
      state.fileInput.value = "";
    });

    const search = container.querySelector("[data-rx-effect-search]");
    if (search) {
      search.addEventListener("input", function () {
        const activeCategory = container.querySelector(
          "[data-rx-effect-category].active"
        );

        if (activeCategory) {
          renderEffectNames(activeCategory.dataset.rxEffectCategory, search.value);
        }
      });
    }

    const firstCategory = container.querySelector(
      '[data-rx-effect-category="Video Effects"]'
    );

    if (firstCategory) {
      firstCategory.classList.add("active");
      renderEffectNames("Video Effects", "");
    }

    return true;
  }

  function destroy() {
    state.objectUrls.forEach(function (url) {
      URL.revokeObjectURL(url);
    });

    state.objectUrls.clear();
    state.clips = [];
    state.textOverlays = [];
    state.selectedClipId = null;
    state.root = null;
    state.preview = null;
    state.fileInput = null;
  }

  window.RockyXStudioEditor = {
    init: init,
    destroy: destroy,
    getState: function () {
      return {
        clipCount: state.clips.length,
        selectedClipId: state.selectedClipId,
        filter: state.filter,
        speed: state.speed
      };
    },
    addFiles: addFiles,
    saveDraft: saveDraft
  };

  window.RockyXOpenEffects = function () {
    if (window.RockyXModules &&
        typeof window.RockyXModules.load === "function") {
      window.RockyXModules.load("effects")
        .then(function (module) {
          if (module && typeof module.init === "function") {
            module.init({ container: state.root });
          } else {
            showEffectsLibrary();
          }
        })
        .catch(function (error) {
          console.error("RockyX Effects failed to load:", error);
          showEffectsLibrary();
        });
    } else {
      showEffectsLibrary();
    }
  };

})(window, document);