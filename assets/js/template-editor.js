/* ==========================================
   ROCKYX TEMPLATE EDITOR
   Version 1.0 — Editor Prototype
   ========================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_template_drafts";

  const state = {
    container: null,
    clips: [],
    effects: [],
    currentTemplate: null
  };

  const styles = `
    .rx-template-editor {
      background: #100e18;
      color: #ffffff;
      padding: 18px;
      border-radius: 18px;
      font-family: Arial, sans-serif;
    }

    .rx-template-editor * {
      box-sizing: border-box;
    }

    .rx-template-editor button,
    .rx-template-editor input,
    .rx-template-editor select,
    .rx-template-editor textarea {
      font: inherit;
    }

    .rx-te-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 22px;
    }

    .rx-te-header h2 {
      font-size: 21px;
      margin: 0;
    }

    .rx-te-muted {
      color: #aaa4ba;
      font-size: 13px;
      line-height: 1.5;
    }

    .rx-te-button {
      background: #8b5cf6;
      color: white;
      border: 0;
      padding: 12px 15px;
      border-radius: 11px;
      cursor: pointer;
      font-weight: 600;
    }

    .rx-te-button.secondary {
      background: #292438;
    }

    .rx-te-button.danger {
      background: #54232e;
    }

    .rx-te-field {
      margin-bottom: 17px;
    }

    .rx-te-field label {
      display: block;
      margin-bottom: 7px;
      font-size: 13px;
      font-weight: 600;
    }

    .rx-te-field input,
    .rx-te-field select,
    .rx-te-field textarea {
      width: 100%;
      background: #211d2d;
      color: #fff;
      border: 1px solid #3b344d;
      padding: 12px;
      border-radius: 10px;
      outline: none;
    }

    .rx-te-field textarea {
      resize: vertical;
      min-height: 75px;
    }

    .rx-te-field input:focus,
    .rx-te-field select:focus,
    .rx-te-field textarea:focus {
      border-color: #a78bfa;
    }

    .rx-te-section {
      background: #191522;
      border: 1px solid #30293d;
      padding: 15px;
      border-radius: 14px;
      margin-bottom: 18px;
    }

    .rx-te-section h3 {
      font-size: 16px;
      margin: 0 0 12px;
    }

    .rx-te-clip {
      background: #241f31;
      padding: 12px;
      border-radius: 12px;
      margin-top: 10px;
    }

    .rx-te-clip-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .rx-te-clip-title {
      font-weight: 600;
      font-size: 14px;
    }

    .rx-te-clip small {
      display: block;
      color: #b7afc8;
      margin-top: 5px;
    }

    .rx-te-preview {
      background: linear-gradient(145deg, #34204f, #171322);
      border: 1px solid #51406e;
      min-height: 150px;
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px;
      margin-bottom: 18px;
      overflow-wrap: anywhere;
    }

    .rx-te-preview strong {
      display: block;
      font-size: 19px;
      margin-bottom: 8px;
    }

    .rx-te-badge {
      display: inline-block;
      padding: 5px 9px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      background: #30263f;
      color: #d8c5ff;
    }

    .rx-te-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
      margin-top: 14px;
    }

    .rx-te-status {
      padding: 12px;
      background: #211d2d;
      border-radius: 10px;
      margin: 12px 0;
      font-size: 13px;
      line-height: 1.5;
      display: none;
    }

    .rx-te-status.show {
      display: block;
    }

    .rx-te-empty {
      text-align: center;
      padding: 20px 10px;
      color: #aaa4ba;
      font-size: 13px;
    }

    .rx-te-checkbox {
      display: flex;
      align-items: center;
      gap: 9px;
      margin: 12px 0;
      font-size: 13px;
    }

    .rx-te-checkbox input {
      width: 17px;
      height: 17px;
      accent-color: #8b5cf6;
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

  function getDrafts() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function writeDrafts(drafts) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(drafts)
      );

      return true;
    } catch (error) {
      showStatus(
        "Could not save. Your browser storage may be full.",
        true
      );

      return false;
    }
  }

  function showStatus(message, error) {
    const box = state.container &&
      state.container.querySelector(".rx-te-status");

    if (!box) return;

    box.textContent = message;
    box.style.border = error
      ? "1px solid #a94455"
      : "1px solid #59447e";

    box.classList.add("show");
  }

  function readForm() {
    const root = state.container;

    return {
      id: state.currentTemplate
        ? state.currentTemplate.id
        : "rx-template-" + Date.now(),

      name: root.querySelector("#rx-te-name").value.trim(),

      description: root.querySelector(
        "#rx-te-description"
      ).value.trim(),

      category: root.querySelector("#rx-te-category").value,

      access: root.querySelector("#rx-te-access").value,

      aspectRatio: root.querySelector(
        "#rx-te-ratio"
      ).value,

      coverText: root.querySelector(
        "#rx-te-cover"
      ).value.trim(),

      allowCommercialUse: root.querySelector(
        "#rx-te-commercial"
      ).checked,

      clips: state.clips.map(function (clip) {
        return {
          id: clip.id,
          type: clip.type,
          duration: clip.duration,
          label: clip.label
        };
      }),

      effects: state.effects.slice(),

      status: "draft",

      updatedAt: new Date().toISOString()
    };
  }

  function renderClips() {
    const list = state.container.querySelector(
      "#rx-te-clips"
    );

    if (!state.clips.length) {
      list.innerHTML =
        '<div class="rx-te-empty">' +
        "No media placeholders yet. Add one below." +
        "</div>";

      return;
    }

    list.innerHTML = state.clips.map(function (clip, index) {
      return `
        <div class="rx-te-clip" data-clip-id="${escapeHTML(clip.id)}">
          <div class="rx-te-clip-top">
            <div>
              <div class="rx-te-clip-title">
                ${index + 1}. ${escapeHTML(clip.label)}
              </div>
              <small>
                ${escapeHTML(clip.type)} ·
                ${escapeHTML(clip.duration)} seconds
              </small>
            </div>

            <button
              class="rx-te-button danger"
              type="button"
              data-remove-clip="${escapeHTML(clip.id)}"
            >
              Remove
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderEffects() {
    state.container.querySelectorAll(
      "[data-effect]"
    ).forEach(function (button) {
      const active = state.effects.includes(
        button.dataset.effect
      );

      button.style.border = active
        ? "1px solid #a78bfa"
        : "1px solid transparent";

      button.style.background = active
        ? "#4c3473"
        : "#292438";

      button.setAttribute(
        "aria-pressed",
        active ? "true" : "false"
      );
    });
  }

  function updatePreview() {
    const root = state.container;
    if (!root) return;

    const name = root.querySelector("#rx-te-name").value.trim();
    const cover = root.querySelector("#rx-te-cover").value.trim();
    const access = root.querySelector("#rx-te-access").value;
    const ratio = root.querySelector("#rx-te-ratio").value;

    root.querySelector("#rx-te-preview").innerHTML = `
      <div>
        <span class="rx-te-badge">
          ${escapeHTML(access)}
        </span>

        <strong>
          ${escapeHTML(cover || name || "Your template")}
        </strong>

        <div class="rx-te-muted">
          ${state.clips.length} media placeholder(s)
          · ${escapeHTML(ratio)}
        </div>

        <div class="rx-te-muted" style="margin-top:8px">
          ${state.effects.length
            ? escapeHTML(state.effects.join(", "))
            : "No effects selected"}
        </div>
      </div>
    `;
  }

  function addClip(type) {
    const clip = {
      id: "clip-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 7),

      type: type,

      duration: 5,

      label: type === "photo"
        ? "Photo placeholder"
        : "Video placeholder"
    };

    state.clips.push(clip);

    renderClips();
    updatePreview();
  }

  function saveDraft() {
    const draft = readForm();

    if (!draft.name) {
      showStatus("Enter a template name before saving.", true);
      state.container.querySelector("#rx-te-name").focus();
      return;
    }

    const drafts = getDrafts();

    const existingIndex = drafts.findIndex(function (item) {
      return item.id === draft.id;
    });

    if (existingIndex >= 0) {
      drafts[existingIndex] = draft;
    } else {
      drafts.unshift(draft);
    }

    if (!writeDrafts(drafts)) return;

    state.currentTemplate = draft;

    showStatus(
      "Template draft saved on this device. " +
      "Media files and rendered effects are not included."
    );
  }

  function submitForReview() {
    const draft = readForm();

    if (!draft.name) {
      showStatus("Enter a template name first.", true);
      state.container.querySelector("#rx-te-name").focus();
      return;
    }

    if (!draft.clips.length) {
      showStatus(
        "Add at least one photo or video placeholder first.",
        true
      );
      return;
    }

    const confirmed = window.confirm(
      "Save this template as a local review submission? " +
      "This prototype does not send it to RockyX servers."
    );

    if (!confirmed) return;

    draft.status = "pending-review";

    const drafts = getDrafts();

    const existingIndex = drafts.findIndex(function (item) {
      return item.id === draft.id;
    });

    if (existingIndex >= 0) {
      drafts[existingIndex] = draft;
    } else {
      drafts.unshift(draft);
    }

    if (!writeDrafts(drafts)) return;

    state.currentTemplate = draft;

    showStatus(
      "Saved locally as Pending Review. " +
      "No real submission or creator approval has occurred."
    );
  }

  function loadTemplate(template) {
    if (!template || typeof template !== "object") return;

    state.currentTemplate = template;

    state.clips = Array.isArray(template.clips)
      ? template.clips.map(function (clip) {
          return {
            id: clip.id || "clip-" + Date.now(),
            type: clip.type || "video",
            duration: Number(clip.duration) || 5,
            label: clip.label || "Media placeholder"
          };
        })
      : [];

    state.effects = Array.isArray(template.effects)
      ? template.effects.slice()
      : [];

    const root = state.container;

    root.querySelector("#rx-te-name").value =
      template.name || "";

    root.querySelector("#rx-te-description").value =
      template.description || "";

    root.querySelector("#rx-te-category").value =
      template.category || "Lifestyle";

    root.querySelector("#rx-te-access").value =
      template.access || "Free";

    root.querySelector("#rx-te-ratio").value =
      template.aspectRatio || "9:16";

    root.querySelector("#rx-te-cover").value =
      template.coverText || "";

    root.querySelector("#rx-te-commercial").checked =
      Boolean(template.allowCommercialUse);

    renderClips();
    renderEffects();
    updatePreview();
  }

  function handleClick(event) {
    const root = state.container;

    const addButton = event.target.closest(
      "[data-add-clip]"
    );

    if (addButton) {
      addClip(addButton.dataset.addClip);
      return;
    }

    const removeButton = event.target.closest(
      "[data-remove-clip]"
    );

    if (removeButton) {
      state.clips = state.clips.filter(function (clip) {
        return clip.id !== removeButton.dataset.removeClip;
      });

      renderClips();
      updatePreview();
      return;
    }

    const effectButton = event.target.closest(
      "[data-effect]"
    );

    if (effectButton) {
      const effect = effectButton.dataset.effect;
      const index = state.effects.indexOf(effect);

      if (index >= 0) {
        state.effects.splice(index, 1);
      } else {
        state.effects.push(effect);
      }

      renderEffects();
      updatePreview();
      return;
    }

    if (event.target.closest("#rx-te-save")) {
      saveDraft();
      return;
    }

    if (event.target.closest("#rx-te-submit")) {
      submitForReview();
      return;
    }

    if (event.target.closest("#rx-te-back")) {
      root.dispatchEvent(
        new CustomEvent("rockyx:template-editor-close", {
          bubbles: true
        })
      );

      showStatus(
        "Ask the Create screen to close this editor. " +
        "Navigation will be connected in a later step."
      );
    }
  }

  function handleInput(event) {
    if (
      event.target.matches("#rx-te-name") ||
      event.target.matches("#rx-te-cover") ||
      event.target.matches("#rx-te-access") ||
      event.target.matches("#rx-te-ratio")
    ) {
      updatePreview();
    }
  }

  function init(options) {
    options = options || {};

    const container =
      options.container ||
      document.querySelector("#page-Studio");

    if (!container) {
      console.error(
        "RockyX Template Editor: container not found."
      );

      return false;
    }

    state.container = container;

    const oldStyle = document.getElementById(
      "rockyx-template-editor-styles"
    );

    if (!oldStyle) {
      const style = document.createElement("style");
      style.id = "rockyx-template-editor-styles";
      style.textContent = styles;
      document.head.appendChild(style);
    }

    state.clips = [];
    state.effects = [];
    state.currentTemplate = null;

    container.innerHTML = `
      <div class="rx-template-editor">
        <div class="rx-te-header">
          <button
            id="rx-te-back"
            class="rx-te-button secondary"
            type="button"
          >
            ← Back
          </button>

          <h2>Template Editor</h2>

          <span class="rx-te-badge">RockyX</span>
        </div>

        <p class="rx-te-muted">
          Design a reusable template for other people to use
          in their videos. This version saves drafts locally.
        </p>

        <div id="rx-te-status" class="rx-te-status"></div>

        <div id="rx-te-preview" class="rx-te-preview">
          <div>
            <strong>Your template</strong>
            <div class="rx-te-muted">
              Your template preview will appear here.
            </div>
          </div>
        </div>

        <div class="rx-te-section">
          <h3>Template details</h3>

          <div class="rx-te-field">
            <label for="rx-te-name">Template name</label>
            <input
              id="rx-te-name"
              maxlength="60"
              placeholder="e.g. My Daily Memories"
            >
          </div>

          <div class="rx-te-field">
            <label for="rx-te-description">Description</label>
            <textarea
              id="rx-te-description"
              maxlength="300"
              placeholder="Describe what this template does..."
            ></textarea>
          </div>

          <div class="rx-te-field">
            <label for="rx-te-category">Category</label>
            <select id="rx-te-category">
              <option>Lifestyle</option>
              <option>Music</option>
              <option>Travel</option>
              <option>Business</option>
              <option>Food</option>
              <option>Fashion</option>
              <option>Education</option>
              <option>Gaming</option>
              <option>Comedy</option>
              <option>Other</option>
            </select>
          </div>

          <div class="rx-te-field">
            <label for="rx-te-access">Template access</label>
            <select id="rx-te-access">
              <option value="Free">Free</option>
              <option value="Pro">Pro</option>
            </select>
            <div class="rx-te-muted">
              Pro is a label in this prototype. Paid access
              is not enabled.
            </div>
          </div>

          <div class="rx-te-field">
            <label for="rx-te-ratio">Video aspect ratio</label>
            <select id="rx-te-ratio">
              <option value="9:16">9:16 · Vertical</option>
              <option value="1:1">1:1 · Square</option>
              <option value="16:9">16:9 · Landscape</option>
            </select>
          </div>

          <div class="rx-te-field">
            <label for="rx-te-cover">Preview title</label>
            <input
              id="rx-te-cover"
              maxlength="80"
              placeholder="Text displayed on the preview"
            >
          </div>

          <label class="rx-te-checkbox">
            <input id="rx-te-commercial" type="checkbox">
            Allow commercial-use requests
          </label>

          <p class="rx-te-muted">
            This checkbox records your preference only. It does
            not grant music, footage, or other content licenses.
          </p>
        </div>

        <div class="rx-te-section">
          <h3>Media placeholders</h3>

          <p class="rx-te-muted">
            Choose where users will insert their own photos or
            videos. These are placeholders, not uploaded media.
          </p>

          <div id="rx-te-clips"></div>

          <div class="rx-te-actions">
            <button
              class="rx-te-button"
              type="button"
              data-add-clip="video"
            >
              + Add video slot
            </button>

            <button
              class="rx-te-button secondary"
              type="button"
              data-add-clip="photo"
            >
              + Add photo slot
            </button>
          </div>
        </div>

        <div class="rx-te-section">
          <h3>Effects and style</h3>

          <p class="rx-te-muted">
            Select the effects that your future template should
            use. Actual rendering is not connected yet.
          </p>

          <div class="rx-te-actions">
            <button
              class="rx-te-button secondary"
              type="button"
              data-effect="Warm"
              aria-pressed="false"
            >Warm</button>

            <button
              class="rx-te-button secondary"
              type="button"
              data-effect="Cool"
              aria-pressed="false"
            >Cool</button>

            <button
              class="rx-te-button secondary"
              type="button"
              data-effect="Black & White"
              aria-pressed="false"
            >Black &amp; White</button>

            <button
              class="rx-te-button secondary"
              type="button"
              data-effect="Vivid"
              aria-pressed="false"
            >Vivid</button>

            <button
              class="rx-te-button secondary"
              type="button"
              data-effect="Slow Motion"
              aria-pressed="false"
            >Slow Motion</button>

            <button
              class="rx-te-button secondary"
              type="button"
              data-effect="Text Overlay"
              aria-pressed="false"
            >Text Overlay</button>
          </div>
        </div>

        <div class="rx-te-section">
          <h3>Save and submit</h3>

          <p class="rx-te-muted">
            Save your work as a draft or mark it as pending
            review on this device. Neither action publishes a
            real template to other users.
          </p>

          <div class="rx-te-actions">
            <button
              id="rx-te-save"
              class="rx-te-button secondary"
              type="button"
            >
              Save Draft
            </button>

            <button
              id="rx-te-submit"
              class="rx-te-button"
              type="button"
            >
              Submit for Review
            </button>
          </div>
        </div>
      </div>
    `;

    // Replacing the container removes its previous child
    // elements, so these handlers are attached only to this
    // new editor instance.
    container.addEventListener("click", handleClick);
    container.addEventListener("input", handleInput);
    container.addEventListener("change", handleInput);

    renderClips();
    renderEffects();
    updatePreview();

    if (options.template) {
      loadTemplate(options.template);
    }

    return true;
  }

  function getState() {
    return {
      template: state.container ? readForm() : null,
      clips: state.clips.map(function (clip) {
        return Object.assign({}, clip);
      }),
      effects: state.effects.slice()
    };
  }

  function destroy() {
    if (!state.container) return;

    state.container.removeEventListener("click", handleClick);
    state.container.removeEventListener("input", handleInput);
    state.container.removeEventListener("change", handleInput);

    state.container = null;
    state.clips = [];
    state.effects = [];
    state.currentTemplate = null;
  }

  window.RockyXTemplateEditor = {
    init: init,
    destroy: destroy,
    getState: getState,
    getDrafts: getDrafts,
    loadTemplate: loadTemplate
  };
})();