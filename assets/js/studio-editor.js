/* ==========================================================
   ROCKYX CREATE STUDIO
   Modular browser-based video editor
   ========================================================== */

(function () {
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
    fileInput: null,
    destroyed: false
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
      background: #0b0b10;
      color: #fff;
      min-height: 100%;
      padding: 16px;
      box-sizing: border-box;
      font-family: Arial, sans-serif;
    }

    .rx-studio * {
      box-sizing: border-box;
    }

    .rx-studio-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;
    }

    .rx-studio-title {
      font-size: 22px;
      font-weight: 800;
      margin: 0;
    }

    .rx-studio-subtitle {
      color: #a5a5b5;
      font-size: 12px;
      margin-top: 5px;
    }

    .rx-studio-button {
      border: 0;
      border-radius: 11px;
      padding: 11px 14px;
      background: #25232e;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }

    .rx-studio-button.primary {
      background: #a855f7;
      color: white;
    }

    .rx-studio-button:disabled {
      opacity: .45;
      cursor: not-allowed;
    }

    .rx-studio-preview {
      width: 100%;
      aspect-ratio: 9 / 14;
      max-height: 58vh;
      background: #17171e;
      border-radius: 18px;
      overflow: hidden;
      position: relative;
      display: grid;
      place-items: center;
      margin-bottom: 16px;
    }

    .rx-studio-preview video,
    .rx-studio-preview img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
    }

    .rx-studio-empty {
      text-align: center;
      padding: 24px;
      color: #aaaabb;
      line-height: 1.6;
    }

    .rx-studio-overlay {
      position: absolute;
      left: 8%;
      right: 8%;
      top: 42%;
      text-align: center;
      font-size: 24px;
      font-weight: 800;
      color: white;
      text-shadow: 0 2px 5px #000;
      overflow-wrap: anywhere;
      pointer-events: none;
    }

    .rx-studio-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 14px 0;
    }

    .rx-studio-section {
      margin-top: 22px;
    }

    .rx-studio-section h3 {
      font-size: 15px;
      margin: 0 0 12px;
    }

    .rx-studio-timeline {
      display: flex;
      gap: 9px;
      overflow-x: auto;
      padding: 3px 0 12px;
    }

    .rx-studio-clip {
      position: relative;
      flex: 0 0 112px;
      min-height: 120px;
      background: #1a1922;
      border: 2px solid transparent;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
    }

    .rx-studio-clip.selected {
      border-color: #c084fc;
    }

    .rx-studio-clip img,
    .rx-studio-clip video {
      display: block;
      width: 100%;
      height: 88px;
      object-fit: cover;
    }

    .rx-studio-clip-name {
      display: block;
      padding: 7px;
      font-size: 11px;
      overflow-wrap: anywhere;
    }

    .rx-studio-clip-remove {
      position: absolute;
      right: 5px;
      top: 5px;
      border: 0;
      border-radius: 50%;
      background: #111;
      color: white;
      width: 27px;
      height: 27px;
      cursor: pointer;
    }

    .rx-studio-field {
      width: 100%;
      padding: 12px;
      border: 1px solid #383744;
      border-radius: 10px;
      background: #17161f;
      color: white;
      margin: 6px 0 12px;
      font: inherit;
    }

    .rx-studio-label {
      display: block;
      color: #c7c5d1;
      font-size: 12px;
      margin-top: 12px;
    }

    .rx-studio-status {
      color: #c4b5fd;
      font-size: 12px;
      line-height: 1.5;
      min-height: 18px;
      margin-top: 10px;
    }

    .rx-studio-note {
      color: #9c9baa;
      font-size: 11px;
      line-height: 1.6;
      margin-top: 10px;
    }

    .rx-studio-hidden {
      display: none !important;
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

  function ensureStyles() {
    if (document.getElementById("rx-studio-editor-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "rx-studio-editor-styles";
    style.textContent = styles;
    document.head.appendChild(style);
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "Duration unavailable";
    }

    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);

    return minutes + ":" + String(remaining).padStart(2, "0");
  }

  function releaseClip(clip) {
    if (!clip || !clip.url) return;

    URL.revokeObjectURL(clip.url);
    state.objectUrls.delete(clip.url);
  }

  function addFiles(fileList) {
    const files = Array.from(fileList || []);
    const supported = files.filter(function (file) {
      return file.type.startsWith("video/") ||
        file.type.startsWith("image/");
    });

    if (!supported.length) {
      setStatus("Choose a supported video or image file.");
      return;
    }

    supported.forEach(function (file) {
      const url = URL.createObjectURL(file);

      state.objectUrls.add(url);

      const clip = {
        id: state.nextClipId++,
        file: file,
        name: file.name,
        type: file.type,
        url: url,
        duration: file.type.startsWith("image/") ? 0 : null
      };

      state.clips.push(clip);

      if (state.selectedClipId === null) {
        state.selectedClipId = clip.id;
      }
    });

    renderTimeline();
    renderPreview();

    setStatus(
      supported.length + " media item(s) added. " +
      "Changes are currently held in this editing session."
    );
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
          <div style="font-size:40px">＋</div>
          <strong>Your creation starts here</strong>
          <div>Upload videos or photos to begin editing.</div>
        </div>
      `;

      state.preview = null;
      return;
    }

    let media;

    if (clip.type.startsWith("video/")) {
      media = document.createElement("video");
      media.controls = true;
      media.playsInline = true;
      media.preload = "metadata";
    } else {
      media = document.createElement("img");
      media.alt = clip.name;
    }

    media.src = clip.url;
    media.style.filter = filters[state.filter] || "none";

    if (clip.type.startsWith("video/")) {
      media.playbackRate = state.speed;

      media.addEventListener("loadedmetadata", function () {
        clip.duration = media.duration;
        renderTimeline();
      }, { once: true });
    }

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
      remove.setAttribute("aria-label", "Remove " + clip.name);
      remove.dataset.removeClip = String(clip.id);

      card.append(media, name, remove);
      timeline.appendChild(card);
    });

    const count = state.root.querySelector(
      "[data-rx-studio-clip-count]"
    );

    if (count) {
      count.textContent = state.clips.length + " media item(s)";
    }
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

    setStatus("Media item removed.");
  }

  function moveClip(id, direction) {
    const index = state.clips.findIndex(function (clip) {
      return clip.id === id;
    });

    if (index < 0) return;

    const target = index + direction;

    if (target < 0 || target >= state.clips.length) return;

    const current = state.clips[index];

    state.clips[index] = state.clips[target];
    state.clips[target] = current;

    renderTimeline();
    setStatus("Clip order updated in the editing session.");
  }

  function addText() {
    const input = state.root.querySelector(
      "[data-rx-studio-text]"
    );

    const value = input ? input.value.trim() : "";
    const clip = getSelectedClip();

    if (!clip) {
      setStatus("Add or select media before adding text.");
      return;
    }

    if (!value) {
      setStatus("Enter some text first.");
      return;
    }

    state.textOverlays.push({
      clipId: clip.id,
      text: value
    });

    input.value = "";

    renderPreview();
    setStatus("Text overlay added to the preview.");
  }

  function saveDraft() {
    const draft = {
      version: 1,
      savedAt: new Date().toISOString(),
      clips: state.clips.map(function (clip) {
        return {
          name: clip.name,
          type: clip.type
        };
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

      setStatus(
        "Draft information saved. Original media files are not " +
        "embedded, so reopen the files to continue editing."
      );
    } catch (error) {
      setStatus("Unable to save draft information on this device.");
    }
  }

  function buildInterface(container) {
    container.innerHTML = `
      <section class="rx-studio">
        <header class="rx-studio-header">
          <div>
            <h2 class="rx-studio-title">RockyX Create Studio</h2>
            <div class="rx-studio-subtitle">
              Edit videos and photos
            </div>
          </div>

          <button class="rx-studio-button"
                  type="button"
                  data-rx-studio-upload>
            ＋ Add media
          </button>
        </header>

        <input class="rx-studio-hidden"
               type="file"
               accept="video/*,image/*"
               multiple
               data-rx-studio-file-input>

        <div class="rx-studio-preview"
             data-rx-studio-preview></div>

        <div class="rx-studio-toolbar">
          <button class="rx-studio-button"
                  type="button"
                  data-rx-studio-add-text>
            ＋ Text
          </button>
          
          <button class="rx-studio-button"
        type="button"
        data-rx-studio-effects>
  ✨ Effects
</button>

          <button class="rx-studio-button"
                  type="button"
                  data-rx-studio-filter="none">
            Original
          </button>

          <button class="rx-studio-button"
                  type="button"
                  data-rx-studio-filter="warm">
            Warm
          </button>

          <button class="rx-studio-button"
                  type="button"
                  data-rx-studio-filter="cool">
            Cool
          </button>

          <button class="rx-studio-button"
                  type="button"
                  data-rx-studio-filter="mono">
            Mono
          </button>

          <button class="rx-studio-button"
                  type="button"
                  data-rx-studio-filter="vivid">
            Vivid
          </button>
        </div>

        <label class="rx-studio-label" for="rx-studio-text">
          Text overlay
        </label>

        <input id="rx-studio-text"
               class="rx-studio-field"
               type="text"
               maxlength="120"
               placeholder="Write something..."
               data-rx-studio-text>

        <div class="rx-studio-section">
          <h3>Playback speed</h3>

          <div class="rx-studio-toolbar">
            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-speed="0.5">0.5×</button>

            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-speed="1">1×</button>

            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-speed="1.5">1.5×</button>

            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-speed="2">2×</button>
          </div>
        </div>

        <div class="rx-studio-section">
          <h3>Timeline</h3>

          <div data-rx-studio-clip-count>0 media items</div>

          <div class="rx-studio-timeline"
               data-rx-studio-timeline></div>

          <div class="rx-studio-toolbar">
            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-move="-1">
              ← Move left
            </button>

            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-move="1">
              Move right →
            </button>

            <button class="rx-studio-button"
                    type="button"
                    data-rx-studio-remove-selected>
              Remove selected
            </button>
          </div>
        </div>

        <div class="rx-studio-section">
          <h3>Save your work</h3>

          <div class="rx-studio-toolbar">
            <button class="rx-studio-button primary"
                    type="button"
                    data-rx-studio-save>
              Save draft
            </button>
          </div>

          <div class="rx-studio-note">
            This editor currently supports media selection, preview,
            ordering, basic preview filters, text overlays, and
            playback-speed controls. It does not yet render a final
            edited video or mix audio.
          </div>

          <div class="rx-studio-status"
               role="status"
               aria-live="polite"
               data-rx-studio-status></div>
        </div>
      </section>
    `;

    state.root = container;
    state.fileInput = container.querySelector(
      "[data-rx-studio-file-input]"
    );

    renderTimeline();
    renderPreview();
  }

  function handleClick(event) {
    const target = event.target.closest("button");

    if (!target || !state.root.contains(target)) return;

    if (target.hasAttribute("data-rx-studio-upload")) {
      state.fileInput.click();
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
    
    if (target.hasAttribute("data-rx-studio-effects")) {
  if (typeof window.RockyXOpenEffects === "function") {
    window.RockyXOpenEffects(state.root);
  } else {
    setStatus("Effects module is not available.");
  }
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

    if (target.hasAttribute("data-remove-clip")) {
      event.stopPropagation();
      removeClip(Number(target.dataset.removeClip));
      return;
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
      : document.getElementById("page-Studio");

    if (!container) {
      console.warn("RockyX Studio: container not found.");
      return false;
    }

    ensureStyles();

    state.destroyed = false;

    buildInterface(container);

    container.addEventListener("click", handleClick);
    container.addEventListener("click", handleTimelineClick);

    state.fileInput.addEventListener("change", function () {
      addFiles(state.fileInput.files);
      state.fileInput.value = "";
    });

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
    state.destroyed = true;
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
})();
/* RockyX Effects integration */
window.RockyXOpenEffects = function (container) {
  if (!window.RockyXModules) {
    console.error("RockyX module registry is unavailable.");
    return;
  }

  window.RockyXModules.load("effects")
    .then(function (effectsModule) {
      effectsModule.init({
        container: container || document.querySelector("#rockyx-create-root"),
        onClose: function () {
          if (window.RockyXStudioEditor &&
              typeof window.RockyXStudioEditor.init === "function") {
            window.RockyXStudioEditor.init({
              container: document.querySelector("#rockyx-create-root")
            });
          }
        }
      });
    })
    .catch(function (error) {
      console.error("RockyX Effects could not open:", error);
      alert("RockyX Effects could not open. Please refresh and try again.");
    });
};