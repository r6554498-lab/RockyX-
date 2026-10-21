/* =====================================================
   ROCKYX COMMENT REACTIONS
   Press and hold a comment to react with an emoji.
   ===================================================== */

(function () {
  "use strict";

  if (window.RockyXCommentReactions) return;

  const EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];
  const HOLD_DELAY = 500;

  const userReactions = new WeakMap();
  const activeTimers = new WeakMap();
  const openPickers = new Set();

  function findComment(element) {
    return element.closest(
      "[data-comment], .comment-item, .comment"
    );
  }

  function getReactionArea(comment) {
    let area = comment.querySelector(".rockyx-reactions");

    if (!area) {
      area = document.createElement("div");
      area.className = "rockyx-reactions";
      area.setAttribute("aria-label", "Comment reactions");
      comment.appendChild(area);
    }

    return area;
  }

  function getCounts(comment) {
    if (!comment._rockyxReactionCounts) {
      comment._rockyxReactionCounts = {};
    }

    return comment._rockyxReactionCounts;
  }

  function renderReactions(comment) {
    const area = getReactionArea(comment);
    const counts = getCounts(comment);
    const selected = userReactions.get(comment);

    area.replaceChildren();

    EMOJIS.forEach((emoji) => {
      const count = counts[emoji] || 0;

      if (count < 1 && selected !== emoji) return;

      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "rockyx-reaction-chip";
      chip.textContent = emoji + (count > 0 ? " " + count : "");
      chip.setAttribute("aria-label", emoji + " reaction");
      chip.setAttribute(
        "aria-pressed",
        String(selected === emoji)
      );

      if (selected === emoji) {
        chip.classList.add("is-selected");
      }

      chip.addEventListener("click", (event) => {
        event.stopPropagation();
        chooseReaction(comment, emoji);
      });

      area.appendChild(chip);
    });

    if (!area.children.length) {
      area.remove();
    }
  }

  function chooseReaction(comment, emoji) {
    const counts = getCounts(comment);
    const previous = userReactions.get(comment);

    // Tapping the same emoji removes your reaction.
    if (previous === emoji) {
      counts[emoji] = Math.max(0, (counts[emoji] || 0) - 1);
      userReactions.delete(comment);
    } else {
      // Remove the previous reaction before adding another.
      if (previous) {
        counts[previous] = Math.max(
          0,
          (counts[previous] || 0) - 1
        );
      }

      counts[emoji] = (counts[emoji] || 0) + 1;
      userReactions.set(comment, emoji);
    }

    renderReactions(comment);
    closePicker(comment);

    comment.dispatchEvent(
      new CustomEvent("rockyx:comment-reaction", {
        bubbles: true,
        detail: {
          emoji: userReactions.get(comment) || null,
          counts: { ...counts }
        }
      })
    );
  }

  function closePicker(comment) {
    const picker = comment.querySelector(
      ".rockyx-emoji-picker"
    );

    if (picker) picker.remove();

    openPickers.delete(comment);
  }

  function showPicker(comment) {
    // Close any other open picker first.
    openPickers.forEach((otherComment) => {
      if (otherComment !== comment) {
        closePicker(otherComment);
      }
    });

    closePicker(comment);

    const picker = document.createElement("div");
    picker.className = "rockyx-emoji-picker";
    picker.setAttribute("role", "group");
    picker.setAttribute("aria-label", "Choose a reaction");

    Object.assign(picker.style, {
      display: "flex",
      gap: "8px",
      alignItems: "center",
      flexWrap: "wrap",
      padding: "10px",
      marginTop: "8px",
      width: "fit-content",
      maxWidth: "100%",
      background: "#242424",
      border: "1px solid #444",
      borderRadius: "24px",
      boxShadow: "0 5px 20px rgba(0,0,0,.3)",
      position: "relative",
      zIndex: "100"
    });

    EMOJIS.forEach((emoji) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = emoji;
      button.setAttribute("aria-label", "React " + emoji);

      Object.assign(button.style, {
        fontSize: "24px",
        padding: "4px",
        border: "0",
        background: "transparent",
        cursor: "pointer",
        borderRadius: "12px"
      });

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        chooseReaction(comment, emoji);
      });

      picker.appendChild(button);
    });

    comment.appendChild(picker);
    openPickers.add(comment);
  }

  function cancelHold(comment) {
    const timer = activeTimers.get(comment);

    if (timer) {
      clearTimeout(timer);
      activeTimers.delete(comment);
    }
  }

  function init(root = document) {
    if (root.dataset && root.dataset.rockyxCommentReactions === "true") {
      return;
    }

    if (root.dataset) {
      root.dataset.rockyxCommentReactions = "true";
    }

    root.addEventListener("pointerdown", (event) => {
      const comment = findComment(event.target);

      if (!comment || !root.contains(comment)) return;

      // Ignore interactive controls inside the comment.
      if (
        event.target.closest(
          "button, a, input, textarea, select, [contenteditable='true']"
        )
      ) {
        return;
      }

      cancelHold(comment);

      const timer = setTimeout(() => {
        showPicker(comment);
        activeTimers.delete(comment);
      }, HOLD_DELAY);

      activeTimers.set(comment, timer);
    });

    ["pointerup", "pointerleave", "pointercancel"].forEach((name) => {
      root.addEventListener(name, (event) => {
        const comment = findComment(event.target);

        if (comment) cancelHold(comment);
      });
    });

    root.addEventListener("click", (event) => {
      // Close a picker when the user taps outside it.
      if (event.target.closest(".rockyx-emoji-picker")) return;

      openPickers.forEach((comment) => {
        if (!comment.contains(event.target)) {
          closePicker(comment);
        }
      });
    });
  }

  window.RockyXCommentReactions = {
    init,
    chooseReaction,
    showPicker,
    closePicker
  };
})();