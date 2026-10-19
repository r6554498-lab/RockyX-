/* =========================================
   ROCKYX — UPLOAD MODULE
   Video selection and local preview.
   ========================================= */
"use strict";
window.RockyXUpload = (() => {
  let initialized = false;
  let selectedFile = null;
  let previewUrl = null;
  const MAX_FILE_SIZE = 100 * 1024 * 1024;
  const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
  function notify(message) {
    if (window.RockyX?.notify) {
      window.RockyX.notify(message);
    } else {
      alert(message);
    }
  }
  function getElement(selector) {
    return document.querySelector(selector);
  }
  function releasePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  }
  function formatFileSize(bytes) {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  function clearSelection() {
    releasePreview();
    selectedFile = null;
    const input = getElement("[data-rx-upload-input]");
    const preview = getElement("[data-rx-upload-preview]");
    const details = getElement("[data-rx-upload-details]");
    const publishButton = getElement("[data-rx-publish]");
    if (input) input.value = "";
    if (preview) preview.removeAttribute("src");
    if (details) details.textContent = "";
    if (publishButton) publishButton.disabled = true;
  }
  function showPreview(file) {
    const preview = getElement("[data-rx-upload-preview]");
    const details = getElement("[data-rx-upload-details]");
    const publishButton = getElement("[data-rx-publish]");
    if (!preview || !details) {
      notify("The upload interface is not connected yet.");
      return;
    }
    releasePreview();
    previewUrl = URL.createObjectURL(file);
    preview.src = previewUrl;
    preview.load();
    details.textContent =
      `${file.name} · ${formatFileSize(file.size)}`;
    if (publishButton) {
      publishButton.disabled = false;
    }
  }
  function handleFile(file) {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      notify("Please select an MP4, WebM, or QuickTime video.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      notify("This video exceeds the 100 MB prototype limit.");
      return;
    }
    selectedFile = file;
    showPreview(file);
  }
  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }
  function handlePublish() {
    if (!selectedFile) {
      notify("Choose a video first.");
      return;
    }
    notify(
      "Preview ready. Publishing will be enabled after backend integration."
    );
  }
  function init() {
    if (initialized) return;
    initialized = true;
    const input = getElement("[data-rx-upload-input]");
    const publishButton = getElement("[data-rx-publish]");
    const cancelButton = getElement("[data-rx-upload-cancel]");
    if (input) {
      input.addEventListener("change", handleFileChange);
    }
    if (publishButton) {
      publishButton.disabled = true;
      publishButton.addEventListener("click", handlePublish);
    }
    if (cancelButton) {
      cancelButton.addEventListener("click", clearSelection);
    }
    window.addEventListener("beforeunload", releasePreview);
    console.info("RockyX Upload initialized.");
  }
  return {
    init,
    clearSelection,
    getSelectedFile: () => selectedFile
  };
})();