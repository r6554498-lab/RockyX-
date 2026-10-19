/* =========================================
   ROCKYX — EXPORT MODULE
   Export is separate from social publishing.
   ========================================= */
"use strict";
window.RockyXExport = (() => {
  let initialized = false;
  let exporting = false;
  let exportedBlob = null;
  let exportedFileName = "rockyx-video.mp4";
  let downloadUrl = null;
  const state = {
    status: "idle",
    quality: "1080p"
  };
  const allowedQualities = ["720p", "1080p", "4K"];
  function notify(message) {
    if (window.RockyX?.notify) {
      window.RockyX.notify(message);
    } else {
      console.info("RockyX Export:", message);
    }
  }
  function setStatus(status) {
    state.status = status;
    document.dispatchEvent(
      new CustomEvent("rockyx:export-status", {
        detail: { status }
      })
    );
  }
  function setQuality(quality) {
    if (!allowedQualities.includes(quality)) {
      notify("Choose a supported export quality.");
      return false;
    }
    state.quality = quality;
    document.dispatchEvent(
      new CustomEvent("rockyx:export-quality-changed", {
        detail: { quality }
      })
    );
    return true;
  }
  /*
   * Accept a completed video Blob from the editor.
   *
   * The editor must provide the actual rendered video.
   * This function does not render an editing timeline.
   */
  function setExportedVideo(blob, fileName = "rockyx-video.mp4") {
    if (!(blob instanceof Blob) || blob.size === 0) {
      notify("A valid, finished video is required.");
      return false;
    }
    if (!blob.type.startsWith("video/")) {
      notify("The exported file must be a video.");
      return false;
    }
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
    exportedBlob = blob;
    exportedFileName = fileName;
    downloadUrl = URL.createObjectURL(blob);
    setStatus("ready");
    document.dispatchEvent(
      new CustomEvent("rockyx:video-exported", {
        detail: {
          fileName: exportedFileName,
          size: exportedBlob.size,
          type: exportedBlob.type
        }
      })
    );
    if (window.RockyXAnalytics?.videoExported) {
      window.RockyXAnalytics.videoExported({});
    }
    return true;
  }
  /*
   * Download the completed export to the device.
   * Download support varies by browser and device.
   */
  function download() {
    if (!exportedBlob || !downloadUrl) {
      notify("Export a finished video first.");
      return false;
    }
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = exportedFileName;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  }
  /*
   * Continue to the separate posting workflow.
   * This does not publish the video automatically.
   */
  function continueToPost() {
    if (!exportedBlob) {
      notify("Export your video before continuing to Post.");
      return false;
    }
    document.dispatchEvent(
      new CustomEvent("rockyx:continue-to-post", {
        detail: {
          fileName: exportedFileName,
          blob: exportedBlob,
          type: exportedBlob.type,
          size: exportedBlob.size
        }
      })
    );
    return true;
  }
  function init() {
    if (initialized) return;
    initialized = true;
    document.querySelectorAll("[data-rx-export-quality]").forEach(
      (button) => {
        button.addEventListener("click", () => {
          setQuality(button.dataset.rxExportQuality);
        });
      }
    );
    document.querySelectorAll("[data-rx-export-download]").forEach(
      (button) => {
        button.addEventListener("click", download);
      }
    );
    document.querySelectorAll("[data-rx-continue-to-post]").forEach(
      (button) => {
        button.addEventListener("click", continueToPost);
      }
    );
    window.addEventListener("beforeunload", () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    });
    console.info("RockyX Export initialized.");
  }
  return {
    init,
    setQuality,
    setExportedVideo,
    download,
    continueToPost,
    getState: () => ({ ...state }),
    getExportedVideo: () => exportedBlob
  };
})();