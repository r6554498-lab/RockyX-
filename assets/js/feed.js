/* =========================================
   ROCKYX — FEED MODULE
   Handles feed interactions and engagement.
   ========================================= */
"use strict";
window.RockyXFeed = (() => {
  const STORAGE_KEY = "rockyx_feed_interactions_v1";
  let initialized = false;
  let observer = null;
  function loadInteractions() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn("RockyX: Could not load saved interactions.");
      return {};
    }
  }
  function saveInteractions(interactions) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(interactions)
      );
    } catch (error) {
      console.warn("RockyX: Could not save interactions.");
    }
  }
  let interactions = loadInteractions();
  function getPostId(post) {
    if (post.dataset.postId) {
      return post.dataset.postId;
    }
    const existing = post.querySelector("[data-rx-post-id]");
    if (existing?.dataset.rxPostId) {
      post.dataset.postId = existing.dataset.rxPostId;
      return post.dataset.postId;
    }
    const generated =
      "post-" +
      Math.random().toString(36).slice(2, 10);
    post.dataset.postId = generated;
    return generated;
  }
  function getPostInteraction(post) {
    const id = getPostId(post);
    if (!interactions[id]) {
      interactions[id] = {
        liked: false,
        likes: Number(post.dataset.likes || 0)
      };
    }
    return interactions[id];
  }
  function updateLikeButton(post) {
    const button = post.querySelector("[data-rx-like]");
    if (!button) return;
    const interaction = getPostInteraction(post);
    button.setAttribute(
      "aria-pressed",
      String(interaction.liked)
    );
    button.classList.toggle(
      "is-liked",
      interaction.liked
    );
    const count = button.querySelector("[data-rx-like-count]");
    if (count) {
      count.textContent = String(interaction.likes);
    } else {
      button.dataset.rxLikeCount = String(interaction.likes);
    }
    button.setAttribute(
      "aria-label",
      interaction.liked ? "Unlike video" : "Like video"
    );
  }
  function toggleLike(post) {
    const interaction = getPostInteraction(post);
    if (interaction.liked) {
      interaction.liked = false;
      interaction.likes = Math.max(0, interaction.likes - 1);
    } else {
      interaction.liked = true;
      interaction.likes += 1;
    }
    saveInteractions(interactions);
    updateLikeButton(post);
  }
  async function sharePost(post) {
    const title =
      post.dataset.title ||
      "Check out this video on RockyX";
    const shareData = {
      title: "RockyX",
      text: title,
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      if (window.RockyX?.notify) {
        window.RockyX.notify("Link copied to clipboard.");
      }
    } catch (error) {
      if (window.RockyX?.notify) {
        window.RockyX.notify(
          "Use your browser's share option to share RockyX."
        );
      }
    }
  }
  function handleClick(event) {
    const likeButton = event.target.closest("[data-rx-like]");
    const shareButton = event.target.closest("[data-rx-share]");
    if (likeButton) {
      const post = likeButton.closest("[data-rx-post]");
      if (post) {
        event.preventDefault();
        toggleLike(post);
      }
      return;
    }
    if (shareButton) {
      const post = shareButton.closest("[data-rx-post]");
      if (post) {
        event.preventDefault();
        sharePost(post);
      }
    }
  }
  function initializePosts() {
    document.querySelectorAll("[data-rx-post]").forEach((post) => {
      getPostInteraction(post);
      updateLikeButton(post);
    });
  }
  function init() {
    if (initialized) return;
    initialized = true;
    document.addEventListener("click", handleClick);
    initializePosts();
    console.info("RockyX Feed initialized.");
  }
  return {
    init,
    toggleLike,
    sharePost,
    initializePosts
  };
})();