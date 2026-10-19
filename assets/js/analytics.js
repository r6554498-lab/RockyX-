/* =========================================
   ROCKYX — ANALYTICS MODULE
   Tracks distinct template and video events.
   ========================================= */
"use strict";
window.RockyXAnalytics = (() => {
  let initialized = false;
  const EVENT_TYPES = [
    "template_view",
    "template_use",
    "video_export",
    "video_post"
  ];
  const state = {
    sessionId: createSessionId()
  };
  function createSessionId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2)
    );
  }
  /**
   * Validate and prepare an analytics event.
   *
   * This prototype does not send events to a server.
   */
  function track(type, details = {}) {
    if (!EVENT_TYPES.includes(type)) {
      console.warn("RockyX Analytics: Unknown event type.");
      return false;
    }
    const event = {
      type,
      sessionId: state.sessionId,
      occurredAt: new Date().toISOString(),
      templateId: details.templateId || null,
      templateCreatorId: details.templateCreatorId || null,
      videoId: details.videoId || null
    };
    document.dispatchEvent(
      new CustomEvent("rockyx:analytics-event", {
        detail: event
      })
    );
    console.info("RockyX Analytics event:", event);
    return true;
  }
  function templateViewed(details = {}) {
    return track("template_view", details);
  }
  function templateUsed(details = {}) {
    return track("template_use", details);
  }
  function videoExported(details = {}) {
    return track("video_export", details);
  }
  function videoPosted(details = {}) {
    return track("video_post", details);
  }
  function init() {
    if (initialized) return;
    initialized = true;
    console.info("RockyX Analytics initialized.");
  }
  return {
    init,
    track,
    templateViewed,
    templateUsed,
    videoExported,
    videoPosted
  };
})();