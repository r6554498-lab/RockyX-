/* =========================================
   ROCKYX — POST MODULE
   Prepares finished videos for social posting.
   Export and Post are separate actions.
   ========================================= */
"use strict";
window.RockyXPost = (() => {
  let initialized = false;
  let selectedVideo = null;
  const state = {
    caption: "",
    visibility: "public",
    allowComments: true,
    allowRemixing: true,
    templateId: null,
    templateCreatorId: null
  };
  function notify(message) {
    if (window.RockyX?.notify) {
      window.RockyX.notify(message);
    } else {
      console.info("RockyX Post:", message);
    }
  }
  function setVideo(video) {
    if (!(video instanceof Blob) || video.size === 0) {
      notify("Export a finished video before preparing a post.");
      return false;
    }
    if (!video.type.startsWith("video/")) {
      notify("The selected file must be a video.");
      return false;
    }
    selectedVideo = video;
    document.dispatchEvent(
      new CustomEvent("rockyx:post-video-selected", {
        detail: {
          type: video.type,
          size: video.size
        }
      })
    );
    return true;
  }
  function setCaption(caption) {
    state.caption = String(caption || "").slice(0, 2200);
    return state.caption;
  }
  function setVisibility(visibility) {
    const allowed = ["public", "followers", "private"];
    if (!allowed.includes(visibility)) {
      notify("Choose a valid audience setting.");
      return false;
    }
    state.visibility = visibility;
    return true;
  }
  function setOptions(options = {}) {
    if (typeof options.allowComments === "boolean") {
      state.allowComments = options.allowComments;
    }
    if (typeof options.allowRemixing === "boolean") {
      state.allowRemixing = options.allowRemixing;
    }
    if (options.templateId) {
      state.templateId = options.templateId;
    }
    if (options.templateCreatorId) {
      state.templateCreatorId = options.templateCreatorId;
    }
    return { ...state };
  }
  /*
   * Prepare a post request.
   *
   * A secure backend must upload the video, verify the
   * user's permissions, and save the published post.
   */
  async function publish() {
    if (!selectedVideo) {
      notify("Please export or select a finished video first.");
      return false;
    }
    const postRequest = {
      caption: state.caption,
      visibility: state.visibility,
      allowComments: state.allowComments,
      allowRemixing: state.allowRemixing,
      templateId: state.templateId,
      templateCreatorId: state.templateCreatorId,
      videoType: selectedVideo.type,
      videoSize: selectedVideo.size
    };
    document.dispatchEvent(
      new CustomEvent("rockyx:post-requested", {
        detail: postRequest
      })
    );
    notify(
      "Post prepared. Video upload and publishing services are not connected yet."
    );
    return true;
  }
  function handleExportedVideo(event) {
    if (event.detail?.blob instanceof Blob) {
      setVideo(event.detail.blob);
    }
  }
  function init() {
    if (initialized) return;
    initialized = true;
    document.addEventListener(
      "rockyx:continue-to-post",
      handleExportedVideo
    );
    const captionInput =
      document.querySelector("[data-rx-post-caption]");
    if (captionInput) {
      captionInput.addEventListener("input", (event) => {
        setCaption(event.target.value);
      });
    }
    const audienceInput =
      document.querySelector("[data-rx-post-visibility]");
    if (audienceInput) {
      audienceInput.addEventListener("change", (event) => {
        setVisibility(event.target.value);
      });
    }
    document.querySelectorAll("[data-rx-post-submit]").forEach(
      (button) => {
        button.addEventListener("click", publish);
      }
    );
    console.info("RockyX Post initialized.");
  }
  return {
    init,
    setVideo,
    setCaption,
    setVisibility,
    setOptions,
    publish,
    getState: () => ({ ...state })
  };
})();