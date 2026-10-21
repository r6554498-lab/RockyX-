/* =====================================================
   ROCKYX VIDEO INTERACTIONS
   Double-tap to like, animated hearts, like/unlike.
   ===================================================== */

(function () {
  "use strict";

  if (window.RockyXVideoInteractions) return;

  const likedVideos = new WeakMap();
  const lastTaps = new WeakMap();
  const DOUBLE_TAP_DELAY = 300;

  function getVideoCard(element) {
    return element.closest(
      "[data-video-card], .video-card, .feed-card, .video-item"
    );
  }

  function getVideoId(card) {
    if (!card) return null;

    return (
      card.dataset.videoId ||
      card.id ||
      card.querySelector("video")?.currentSrc ||
      card.querySelector("video")?.getAttribute("src") ||
      card
    );
  }

  function isLiked(card) {
    const id = getVideoId(card);

    if (!id) return false;

    if (typeof id === "string") {
      return card.dataset.rockyxLiked === "true";
    }

    return likedVideos.get(card) === true;
  }

  function setLiked(card, liked) {
    if (!card) return;

    card.dataset.rockyxLiked = String(liked);
    likedVideos.set(card, liked);

    const likeButton = card.querySelector(
      ".like, .like-btn, [data-action='like']"
    );

    if (likeButton) {
      likeButton.classList.toggle("liked", liked);
      likeButton.setAttribute("aria-pressed", String(liked));

      const icon = likeButton.querySelector(
        "i, svg, .like-icon"
      );

      if (icon && icon.tagName === "I") {
        icon.classList.toggle("fas", liked);
        icon.classList.toggle("far", !liked);
      }

      likeButton.style.color = liked ? "#ff2d55" : "";
    }

    const count = card.querySelector(
      "[data-like-count], .like-count, .likes-count"
    );

    if (count) {
      const current = Number(
        count.dataset.baseCount ??
        count.textContent.replace(/[^\d]/g, "")
      ) || 0;

      if (count.dataset.baseCount === undefined) {
        count.dataset.baseCount = String(
          Math.max(0, current - (liked ? 0 : 0))
        );
      }

      const base = Number(count.dataset.baseCount) || 0;
      count.textContent = formatCount(base + (liked ? 1 : 0));
    }

    card.dispatchEvent(
      new CustomEvent("rockyx:video-liked", {
        bubbles: true,
        detail: { liked, videoId: card.dataset.videoId || null }
      })
    );
  }

  function formatCount(number) {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }

    if (number >= 1000) {
      return (number / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }

    return String(number);
  }

  function showHeart(card, x, y) {
    const heart = document.createElement("div");

    heart.className = "rockyx-double-tap-heart";
    heart.textContent = "♥";
    heart.setAttribute("aria-hidden", "true");

    Object.assign(heart.style, {
      position: "absolute",
      left: x + "px",
      top: y + "px",
      transform: "translate(-50%, -50%) scale(.2) rotate(-15deg)",
      fontSize: "100px",
      lineHeight: "1",
      color: "#ff2d55",
      textShadow: "0 4px 20px rgba(0,0,0,.35)",
      pointerEvents: "none",
      zIndex: "50",
      opacity: "0",
      transition: "transform .35s ease, opacity .35s ease"
    });

    if (getComputedStyle(card).position === "static") {
      card.style.position = "relative";
    }

    card.appendChild(heart);

    requestAnimationFrame(() => {
      heart.style.opacity = "1";
      heart.style.transform =
        "translate(-50%, -50%) scale(1.15) rotate(0deg)";
    });

    setTimeout(() => {
      heart.style.opacity = "0";
      heart.style.transform =
        "translate(-50%, -80%) scale(.8)";
    }, 450);

    setTimeout(() => heart.remove(), 850);
  }

  function toggleLike(card) {
    if (!card) return;

    setLiked(card, !isLiked(card));
  }

  function handleTap(event, card) {
    if (!card) return;

    // Do not treat buttons, links, or controls as video taps.
    if (
      event.target.closest(
        "button, a, input, textarea, select, [contenteditable='true']"
      )
    ) {
      return;
    }

    const now = Date.now();
    const previous = lastTaps.get(card) || 0;

    if (now - previous < DOUBLE_TAP_DELAY) {
      lastTaps.set(card, 0);

      if (!isLiked(card)) {
        setLiked(card, true);
      }

      const rect = card.getBoundingClientRect();
      showHeart(
        card,
        event.clientX - rect.left,
        event.clientY - rect.top
      );
    } else {
      lastTaps.set(card, now);
    }
  }

  function init(root = document) {
    if (root.dataset && root.dataset.rockyxVideoInteractions === "true") {
      return;
    }

    if (root.dataset) {
      root.dataset.rockyxVideoInteractions = "true";
    }

    root.addEventListener("click", function (event) {
      const button = event.target.closest(
        ".like, .like-btn, [data-action='like']"
      );

      if (!button || !root.contains(button)) return;

      const card = getVideoCard(button);
      if (!card) return;

      // Prevent the existing inline handler from changing the same
      // button twice once this module is integrated.
      event.preventDefault();
      event.stopImmediatePropagation();

      toggleLike(card);
    }, true);

    root.addEventListener("pointerup", function (event) {
      if (event.button !== undefined && event.button !== 0) return;

      const card = getVideoCard(event.target);
      if (!card || !root.contains(card)) return;

      handleTap(event, card);
    }, { passive: true });
  }

  window.RockyXVideoInteractions = {
    init,
    toggleLike,
    setLiked,
    isLiked
  };
})();