/* =========================================================
   ROCKYX STUDIO EDITOR
   Browser-based video editing foundation.
   ========================================================= */

(function () {
  "use strict";

  if (window.RockyXStudioEditor) return;

  const state = {
    clips: [],
    selectedClipId: null,
    nextClipId: 1,
    audioFile: null,
    textOverlays: [],
    filter: "none",
    speed: 1,
    playing: false,
    objectUrls: new Set()
  };

  let root = null;
  let preview = null;
  let timeline = null;
  let fileInput = null;
  let audioInput = null;
  let statusElement = null;

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function createEditor(container) {
    container.innerHTML = `
      <section class="rx-studio">
        <header class="rx-studio-header">
          <div>
            <h1>RockyX Studio</h1>
            <p>Create something amazing.</p>
          </div>
          <button type="button" data-rx-action="export">
            Export
          </button>
        </header>

        <div class="rx-studio-preview">
          <video class="rx-studio-video"
            playsinline controls></video>
          <div class="rx-studio-empty">
            <div style="font-size:42px">🎬</div>
            <p>Import a video to begin editing.</p>
          </div>
        </div>

        <div class="rx-studio-toolbar">
          <button type="button" data-rx-action="import-video">
            ＋ Video
          </button>
          <button type="button" data-rx-action="import-audio">
            🎵 Audio
          </button>
          <button type="button" data-rx-action="add-text">
            T Text
          </button>
        </div>

        <section class="rx-studio-panel">
          <h2>Timeline</h2>
          <p class="rx-studio-hint">
            Select a clip to edit its settings.
          </p>
          <div class="rx-studio-timeline"></div>
        </section>

        <section class="rx-studio-panel rx-studio-tools">
          <h2>Editing tools</h2>

          <div class="rx-studio-tool-grid">
            <button type="button" data-rx-action="trim">
              ✂️ Trim
            </button>
            <button type="button" data-rx-action="split">
              ⫽ Split
            </button>
            <button type="button" data-rx-action="speed">
              ⏩ Speed
            </button>
            <button type="button" data-rx-action="filter">
              🎨 Filters
            </button>
            <button type="button" data-rx-action="rotate">
              🔄 Rotate
            </button>
            <button type="button" data-rx-action="reverse">
              ⏪ Reverse
            </button>
            <button type="button" data-rx-action="remove">
              🗑️ Remove clip
            </button>
          </div>

          <div class="rx-studio-settings"></div>
        </section>

        <p class="rx-studio-status" role="status">
          Ready to create.
        </p>

        <input type="file"
          class="rx-studio-video-input"
          accept="video/*"
          multiple hidden>

        <input type="file"
          class="rx-studio-audio-input"
          accept="audio/*"
          hidden>
      </section>
    `;

    addStyles();

    root = container;
    preview = root.querySelector(".rx-studio-video");
    timeline = root.querySelector(".rx-studio-timeline");
    fileInput = root.querySelector(".rx-studio-video-input");
    audioInput = root.querySelector(".rx-studio-audio-input");
    statusElement = root.querySelector(".rx-studio-status");

    root.addEventListener("click", handleAction);

    fileInput.addEventListener("change", event => {
      importVideos(event.target.files);
      fileInput.value = "";
    });

    audioInput.addEventListener("change", event => {
      importAudio(event.target.files?.[0]);
      audioInput.value = "";
    });

    preview.addEventListener("loadedmetadata", () => {
      const clip = getSelectedClip();

      if (clip) {
        clip.duration = Number.isFinite(preview.duration)
          ? preview.duration
          : 0;

        renderTimeline();
      }
    });

    preview.addEventListener("play", () => {
      state.playing = true;
    });

    preview.addEventListener("pause", () => {
      state.playing = false;
    });

    renderTimeline();
  }

  function addStyles() {
    if (document.getElementById("rx-studio-styles")) return;

    const style = document.createElement("style");
    style.id = "rx-studio-styles";

    style.textContent = `
      .rx-studio {
        box-sizing: border-box;
        width: 100%;
        max-width: 900px;
        margin: 0 auto;
        padding: 16px 12px 100px;
        color: #fff;
        background: #111;
        font-family: system-ui, sans-serif;
      }

      .rx-studio * {
        box-sizing: border-box;
      }

      .rx-studio-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .rx-studio-header h1 {
        margin: 0;
        font-size: 23px;
      }

      .rx-studio-header p {
        margin: 5px 0 0;
        color: #aaa;
        font-size: 13px;
      }

      .rx-studio button {
        padding: 11px 13px;
        border: 1px solid #383838;
        border-radius: 10px;
        background: #242424;
        color: #fff;
        font-weight: 650;
        cursor: pointer;
      }

      .rx-studio button:active {
        transform: scale(.98);
      }

      .rx-studio-header button,
      .rx-studio .rx-studio-toolbar button:last-child {
        background: #7544c8;
        border-color: #7544c8;
      }

      .rx-studio-preview {
        position: relative;
        display: grid;
        place-items: center;
        width: 100%;
        min-height: 250px;
        max-height: 540px;
        overflow: hidden;
        border-radius: 14px;
        background: #050505;
      }

      .rx-studio-video {
        display: none;
        width: 100%;
        max-height: 540px;
        object-fit: contain;
      }

      .rx-studio-preview.has-video .rx-studio-video {
        display: block;
      }

      .rx-studio-preview.has-video .rx-studio-empty {
        display: none;
      }

      .rx-studio-empty {
        padding: 40px 12px;
        text-align: center;
        color: #aaa;
      }

      .rx-studio-toolbar {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin: 12px 0 20px;
      }

      .rx-studio-panel {
        margin-top: 18px;
        padding: 14px;
        border: 1px solid #303030;
        border-radius: 14px;
        background: #191919;
      }

      .rx-studio-panel h2 {
        margin: 0 0 12px;
        font-size: 17px;
      }

      .rx-studio-hint {
        color: #aaa;
        font-size: 12px;
      }

      .rx-studio-timeline {
        display: flex;
        gap: 8px;
        min-height: 65px;
        overflow-x: auto;
        padding: 4px 0;
      }

      .rx-studio-clip {
        flex: 0 0 130px;
        min-width: 130px;
        text-align: left;
        background: #292929 !important;
      }

      .rx-studio-clip.selected {
        border-color: #a777ff;
        box-shadow: 0 0 0 1px #a777ff;
      }

      .rx-studio-clip small {
        display: block;
        margin-top: 5px;
        color: #aaa;
        font-weight: 400;
      }

      .rx-studio-tool-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .rx-studio-settings {
        margin-top: 14px;
      }

      .rx-studio-settings label {
        display: block;
        margin: 12px 0;
        color: #ddd;
        font-size: 13px;
      }

      .rx-studio-settings input,
      .rx-studio-settings select {
        display: block;
        width: 100%;
        margin-top: 7px;
        padding: 11px;
        border: 1px solid #444;
        border-radius: 8px;
        color: #fff;
        background: #222;
      }

      .rx-studio-status {
        color: #c7a7ff;
        font-size: 13px;
        line-height: 1.5;
      }

      @media (min-width: 650px) {
        .rx-studio {
          padding: 24px;
        }

        .rx-studio-preview {
          min-height: 400px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function setStatus(message) {
    if (statusElement) statusElement.textContent = message;
  }

  function getSelectedClip() {
    return state.clips.find(
      clip => clip.id === state.selectedClipId
    ) || null;
  }

  function importVideos(files) {
    const list = Array.from(files || []).filter(file =>
      file.type.startsWith("video/")
    );

    if (!list.length) {
      setStatus("Choose a valid video file.");
      return;
    }

    list.forEach(file => {
      const url = URL.createObjectURL(file);
      state.objectUrls.add(url);

      const clip = {
        id: "clip-" + state.nextClipId++,
        name: file.name,
        file,
        url,
        duration: 0,
        start: 0,
        end: null,
        rotation: 0,
        speed: 1,
        filter: "none",
        reverseRequested: false
      };

      state.clips.push(clip);

      if (!state.selectedClipId) {
        state.selectedClipId = clip.id;
      }
    });

    loadSelectedClip();
    renderTimeline();

    setStatus(
      list.length + " video clip(s) imported. Select a clip to edit."
    );
  }

  function importAudio(file) {
    if (!file || !file.type.startsWith("audio/")) {
      setStatus("Choose a valid audio file.");
      return;
    }

    state.audioFile = file;

    setStatus(
      "Audio selected: " + file.name +
      ". Audio mixing and export need further implementation."
    );

    renderSettings();
  }

  function loadSelectedClip() {
    const clip = getSelectedClip();

    if (!clip) {
      preview.pause();
      preview.removeAttribute("src");
      preview.load();

      root.querySelector(".rx-studio-preview")
        .classList.remove("has-video");

      renderSettings();
      return;
    }

    root.querySelector(".rx-studio-preview")
      .classList.add("has-video");

    preview.src = clip.url;
    preview.playbackRate = clip.speed || 1;
    preview.style.filter = filterToCSS(clip.filter);
    preview.style.transform = "rotate(" + clip.rotation + "deg)";

    preview.load();

    renderSettings();
  }

  function renderTimeline() {
    if (!timeline) return;

    timeline.replaceChildren();

    if (!state.clips.length) {
      timeline.innerHTML =
        '<p style="color:#999;font-size:13px">Your clips will appear here.</p>';
      return;
    }

    state.clips.forEach(clip => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "rx-studio-clip";
      button.classList.toggle(
        "selected",
        clip.id === state.selectedClipId
      );

      const duration = clip.duration
        ? clip.duration.toFixed(1) + " sec"
        : "Loading duration…";

      button.innerHTML =
        escapeHTML(clip.name) +
        "<small>" + escapeHTML(duration) + "</small>";

      button.addEventListener("click", () => {
        state.selectedClipId = clip.id;
        loadSelectedClip();
        renderTimeline();
      });

      timeline.appendChild(button);
    });
  }

  function filterToCSS(filter) {
    const filters = {
      none: "none",
      vivid: "saturate(1.5) contrast(1.1)",
      mono: "grayscale(1)",
      warm: "sepia(.25) saturate(1.25)",
      cool: "hue-rotate(15deg) saturate(1.1)",
      faded: "contrast(.85) brightness(1.08) saturate(.8)"
    };

    return filters[filter] || "none";
  }

  function renderSettings() {
    const panel = root.querySelector(".rx-studio-settings");
    if (!panel) return;

    const clip = getSelectedClip();

    if (!clip) {
      panel.innerHTML =
        '<p style="color:#999;font-size:13px">Import and select a clip to see its settings.</p>';
      return;
    }

    panel.innerHTML = `
      <h3 style="font-size:14px">Selected clip</h3>

      <label>
        Clip name
        <input type="text" data-rx-setting="name"
          value="${escapeHTML(clip.name)}">
      </label>

      <label>
        Trim start (seconds)
        <input type="number" min="0" step="0.1"
          data-rx-setting="start"
          value="${clip.start}">
      </label>

      <label>
        Trim end (seconds)
        <input type="number" min="0" step="0.1"
          data-rx-setting="end"
          value="${clip.end ?? clip.duration ?? 0}">
      </label>

      <label>
        Playback speed
        <select data-rx-setting="speed">
          <option value="0.25" ${clip.speed === .25 ? "selected" : ""}>0.25×</option>
          <option value="0.5" ${clip.speed === .5 ? "selected" : ""}>0.5×</option>
          <option value="1" ${clip.speed === 1 ? "selected" : ""}>1×</option>
          <option value="1.5" ${clip.speed === 1.5 ? "selected" : ""}>1.5×</option>
          <option value="2" ${clip.speed === 2 ? "selected" : ""}>2×</option>
        </select>
      </label>

      <label>
        Visual filter
        <select data-rx-setting="filter">
          <option value="none">Original</option>
          <option value="vivid">Vivid</option>
          <option value="mono">Black and white</option>
          <option value="warm">Warm</option>
          <option value="cool">Cool</option>
          <option value="faded">Faded</option>
        </select>
      </label>

      <label>
        Rotation
        <select data-rx-setting="rotation">
          <option value="0">0°</option>
          <option value="90">90°</option>
          <option value="180">180°</option>
          <option value="270">270°</option>
        </select>
      </label>

      <button type="button" data-rx-action="apply-settings">
        Apply settings
      </button>
    `;

    panel.querySelector('[data-rx-setting="filter"]').value =
      clip.filter;

    panel.querySelector('[data-rx-setting="rotation"]').value =
      String(clip.rotation);
  }

  function handleAction(event) {
    const button = event.target.closest("[data-rx-action]");
    if (!button || !root.contains(button)) return;

    const action = button.dataset.rxAction;

    switch (action) {
      case "import-video":
        fileInput.click();
        break;

      case "import-audio":
        audioInput.click();
        break;

      case "add-text":
        addTextOverlay();
        break;

      case "trim":
        showTrimSettings();
        break;

      case "split":
        splitClip();
        break;

      case "speed":
        showSpeedSettings();
        break;

      case "filter":
        showFilterSettings();
        break;

      case "rotate":
        rotateClip();
        break;

      case "reverse":
        requestReverse();
        break;

      case "remove":
        removeClip();
        break;

      case "apply-settings":
        applySettings();
        break;

      case "export":
        exportProject();
        break;
    }
  }

  function showTrimSettings() {
    const clip = getSelectedClip();

    if (!clip) {
      setStatus("Import and select a clip first.");
      return;
    }

    renderSettings();
    setStatus(
      "Set the trim start and end values, then select Apply settings. " +
      "The preview will seek to the chosen start."
    );
  }

  function showSpeedSettings() {
    const clip = getSelectedClip();

    if (!clip) {
      setStatus("Import and select a clip first.");
      return;
    }

    renderSettings();

    setStatus(
      "Choose a playback speed and select Apply settings."
    );
  }

  function showFilterSettings() {
    const clip = getSelectedClip();

    if (!clip) {
      setStatus("Import and select a clip first.");
      return;
    }

    renderSettings();

    setStatus(
      "Choose a visual filter and select Apply settings. " +
      "This changes the preview only; it is not yet baked into an exported video."
    );
  }

  function applySettings() {
    const clip = getSelectedClip();
    if (!clip) return;

    const panel = root.querySelector(".rx-studio-settings");

    const name = panel.querySelector('[data-rx-setting="name"]');
    const start = panel.querySelector('[data-rx-setting="start"]');
    const end = panel.querySelector('[data-rx-setting="end"]');
    const speed = panel.querySelector('[data-rx-setting="speed"]');
    const filter = panel.querySelector('[data-rx-setting="filter"]');
    const rotation = panel.querySelector('[data-rx-setting="rotation"]');

    const startValue = Math.max(0, Number(start.value) || 0);
    const endValue = Number(end.value);

    if (
      clip.duration > 0 &&
      (startValue >= endValue || endValue > clip.duration)
    ) {
      setStatus("Check your trim values. End must be after start and within the clip.");
      return;
    }

    clip.name = name.value.trim() || clip.name;
    clip.start = startValue;
    clip.end = Number.isFinite(endValue) ? endValue : clip.duration;
    clip.speed = Number(speed.value) || 1;
    clip.filter = filter.value;
    clip.rotation = Number(rotation.value) || 0;

    preview.playbackRate = clip.speed;
    preview.style.filter = filterToCSS(clip.filter);
    preview.style.transform = "rotate(" + clip.rotation + "deg)";

    try {
      preview.currentTime = clip.start;
    } catch (_) {
      // The media may still be loading.
    }

    renderTimeline();
    renderSettings();

    setStatus(
      "Settings applied to the preview. Export rendering is not yet implemented."
    );
  }

  function splitClip() {
    const clip = getSelectedClip();

    if (!clip) {
      setStatus("Import and select a clip first.");
      return;
    }

    if (!Number.isFinite(preview.currentTime) ||
        preview.currentTime <= clip.start ||
        (clip.end && preview.currentTime >= clip.end)) {
      setStatus("Play or seek into the selected clip, then press Split.");
      return;
    }

    const splitAt = preview.currentTime;

    const secondClip = {
      ...clip,
      id: "clip-" + state.nextClipId++,
      name: clip.name.replace(/\.[^.]+$/, "") + " (part 2)",
      start: splitAt,
      end: clip.end || clip.duration
    };

    clip.end = splitAt;

    const index = state.clips.findIndex(item => item.id === clip.id);

    state.clips.splice(index + 1, 0, secondClip);

    state.selectedClipId = secondClip.id;

    renderTimeline();
    renderSettings();

    setStatus(
      "Timeline split created. Both parts still reference the original video; separate exported segments are not yet rendered."
    );
  }

  function rotateClip() {
    const clip = getSelectedClip();

    if (!clip) {
      setStatus("Import and select a clip first.");
      return;
    }

    clip.rotation = (clip.rotation + 90) % 360;

    preview.style.transform = "rotate(" + clip.rotation + "deg)";

    renderSettings();

    setStatus(
      "Preview rotated to " + clip.rotation +
      "°. Export rendering is not yet implemented."
    );
  }

  function requestReverse() {
    const clip = getSelectedClip();

    if (!clip) {
      setStatus("Import and select a clip first.");
      return;
    }

    clip.reverseRequested = !clip.reverseRequested;

    setStatus(
      clip.reverseRequested
        ? "Reverse requested. True reverse playback requires media processing, which is not implemented yet."
        : "Reverse request cleared."
    );
  }

  function removeClip() {
    const clip = getSelectedClip();

    if (!clip) {
      setStatus("Select a clip to remove.");
      return;
    }

    const index = state.clips.findIndex(item => item.id === clip.id);

    state.clips.splice(index, 1);

    state.selectedClipId =
      state.clips[Math.max(0, index - 1)]?.id || null;

    loadSelectedClip();
    renderTimeline();

    setStatus("Clip removed from the timeline.");
  }

  function addTextOverlay() {
    const text = window.prompt("Enter the text for your video:");

    if (!text || !text.trim()) return;

    const overlay = {
      id: "text-" + Date.now(),
      text: text.trim()
    };

    state.textOverlays.push(overlay);

    setStatus(
      'Text added to the project: "' + overlay.text +
      '". Text overlay rendering and export are not yet implemented.'
    );

    emit("text-overlay-added", overlay);
  }

  function exportProject() {
    if (!state.clips.length) {
      setStatus("Import at least one video before exporting.");
      return;
    }

    setStatus(
      "Your project has " + state.clips.length +
      " clip(s). Final video rendering and downloadable export " +
      "require a rendering engine and are not implemented yet."
    );

    emit("export-requested", {
      clips: state.clips.map(clip => ({
        id: clip.id,
        name: clip.name,
        start: clip.start,
        end: clip.end,
        speed: clip.speed,
        filter: clip.filter,
        rotation: clip.rotation
      })),
      audioSelected: Boolean(state.audioFile),
      textOverlays: state.textOverlays.map(item => ({ ...item }))
    });
  }

  function emit(name, detail) {
    document.dispatchEvent(
      new CustomEvent("rockyx:studio-" + name, { detail })
    );
  }

  function init(options = {}) {
    let container = options.container || "#page-Studio";

    if (typeof container === "string") {
      container = document.querySelector(container);
    }

    if (!container) {
      console.warn(
        "[RockyX Studio] Container not found. Create the Studio page first."
      );
      return false;
    }

    createEditor(container);

    return true;
  }

  function destroy() {
    if (preview) preview.pause();

    state.objectUrls.forEach(url => URL.revokeObjectURL(url));
    state.objectUrls.clear();

    if (root) root.replaceChildren();

    root = null;
    preview = null;
    timeline = null;
    fileInput = null;
    audioInput = null;
    statusElement = null;

    state.clips = [];
    state.selectedClipId = null;
    state.audioFile = null;
    state.textOverlays = [];
  }

  window.RockyXStudioEditor = {
    init,
    destroy,
    getProject: () => ({
      clips: state.clips.map(clip => ({
        id: clip.id,
        name: clip.name,
        duration: clip.duration,
        start: clip.start,
        end: clip.end,
        speed: clip.speed,
        filter: clip.filter,
        rotation: clip.rotation,
        reverseRequested: clip.reverseRequested
      })),
      audioSelected: Boolean(state.audioFile),
      textOverlays: state.textOverlays.map(item => ({ ...item }))
    })
  };
})();