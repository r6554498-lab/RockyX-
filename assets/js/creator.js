/* =========================================
   ROCKYX — CREATOR MODULE
   Creator profiles and follow interactions.
   ========================================= */
"use strict";
window.RockyXCreator = (() => {
  const STORAGE_KEY = "rockyx_creator_follows_v1";
  let initialized = false;
  let follows = loadFollows();
  function loadFollows() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      );
    } catch (error) {
      return {};
    }
  }
  function saveFollows() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(follows)
      );
    } catch (error) {
      console.warn("RockyX: Could not save creator follows.");
    }
  }
  function getCreatorId(element) {
    const creator = element.closest("[data-rx-creator]");
    return (
      element.dataset.creatorId ||
      creator?.dataset.creatorId ||
      creator?.dataset.rxCreator ||
      ""
    );
  }
  function updateFollowButton(button, creatorId) {
    const following = Boolean(follows[creatorId]);
    button.classList.toggle("is-following", following);
    button.setAttribute("aria-pressed", String(following));
    const label = button.querySelector("[data-rx-follow-label]");
    if (label) {
      label.textContent = following ? "Following" : "Follow";
    } else {
      button.textContent = following ? "Following" : "Follow";
    }
  }
  function updateFollowerCount(creatorId, change) {
    document
      .querySelectorAll("[data-rx-follower-count]")
      .forEach((element) => {
        const container = element.closest("[data-rx-creator]");
        const elementCreatorId =
          element.dataset.creatorId ||
          container?.dataset.creatorId ||
          container?.dataset.rxCreator ||
          "";
        if (elementCreatorId !== creatorId) return;
        const initial = Number(element.dataset.initialCount || element.textContent || 0);
        if (!element.dataset.initialCount) {
          element.dataset.initialCount = String(initial);
        }
        const count = Math.max(
          0,
          initial + (follows[creatorId] ? 1 : 0)
        );
        element.textContent = String(count);
      });
  }
  function toggleFollow(button) {
    const creatorId = getCreatorId(button);
    if (!creatorId) {
      console.warn(
        "RockyX: Follow button needs a creator ID."
      );
      return;
    }
    const wasFollowing = Boolean(follows[creatorId]);
    if (wasFollowing) {
      delete follows[creatorId];
    } else {
      follows[creatorId] = true;
    }
    saveFollows();
    document
      .querySelectorAll("[data-rx-follow]")
      .forEach((otherButton) => {
        if (getCreatorId(otherButton) === creatorId) {
          updateFollowButton(otherButton, creatorId);
        }
      });
    updateFollowerCount(
      creatorId,
      wasFollowing ? -1 : 1
    );
  }
  function handleClick(event) {
    const button = event.target.closest("[data-rx-follow]");
    if (!button) return;
    event.preventDefault();
    toggleFollow(button);
  }
  function init() {
    if (initialized) return;
    initialized = true;
    document.addEventListener("click", handleClick);
    document.querySelectorAll("[data-rx-follow]").forEach((button) => {
      const creatorId = getCreatorId(button);
      if (creatorId) {
        updateFollowButton(button, creatorId);
      }
    });
    console.info("RockyX Creator initialized.");
  }
  return {
    init,
    toggleFollow
  };
})();