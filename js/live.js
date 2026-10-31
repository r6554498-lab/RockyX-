/* =========================================================
   ROCKYX — LIVE STREAMING MODULE
   Version: 1.0.0
   Status: Front-end foundation with demonstration data
   ========================================================= */

(function () {
  "use strict";

  const RockyXLive = {
    name: "live",
    version: "1.0.0",

    isLive: false,
    isFollowing: false,
    activeCategory: "All",
    chatMessages: [],

    viewerCount: 1248,
    likes: 0,

    categories: [
      "All",
      "Gaming",
      "Music",
      "Lifestyle",
      "Education",
      "Entertainment"
    ],

    streams: [
      {
        id: "live-001",
        host: "Alex Morgan",
        initials: "AM",
        title: "Evening music session",
        category: "Music",
        viewers: 1248,
        color: "#6946a8"
      },
      {
        id: "live-002",
        host: "Jordan Lee",
        initials: "JL",
        title: "Gaming with friends",
        category: "Gaming",
        viewers: 864,
        color: "#315f91"
      },
      {
        id: "live-003",
        host: "Taylor James",
        initials: "TJ",
        title: "Creative business tips",
        category: "Education",
        viewers: 542,
        color: "#397969"
      },
      {
        id: "live-004",
        host: "Chris Adams",
        initials: "CA",
        title: "Daily lifestyle chat",
        category: "Lifestyle",
        viewers: 327,
        color: "#98536e"
      }
    ],

    initialize() {
      console.log("RockyX LIVE initialized.");
    },

    escapeHTML(value) {
      return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]);
    },

    getFilteredStreams() {
      if (this.activeCategory === "All") {
        return this.streams;
      }

      return this.streams.filter(
        (stream) => stream.category === this.activeCategory
      );
    },

    render() {
      const screen = document.getElementById("app-screen");

      if (!screen) {
        console.error("RockyX LIVE: app-screen not found.");
        return;
      }

      screen.innerHTML = `
        <section class="live-page">

          <header class="live-heading">
            <div>
              <span class="live-eyebrow">
                CONNECT IN REAL TIME
              </span>

              <h1>RockyX LIVE</h1>

              <p>
                Watch live sessions and connect with creators.
              </p>
            </div>

            <button
              type="button"
              class="live-start-button"
              data-live-start
            >
              <span>●</span>
              Go LIVE
            </button>
          </header>

          <div class="live-demo-notice">
            <strong>LIVE demonstration</strong>
            <p>
              These streams and viewer counts are sample data.
              Real broadcasting and viewers are not connected.
            </p>
          </div>

          <div class="live-categories">

            ${this.categories.map((category) => `
              <button
                type="button"
                class="live-category ${
                  this.activeCategory === category ? "active" : ""
                }"
                data-live-category="${this.escapeHTML(category)}"
              >
                ${this.escapeHTML(category)}
              </button>
            `).join("")}

          </div>

          <div class="live-section-heading">
            <h2>Discover LIVE</h2>
            <span>${this.getFilteredStreams().length} streams</span>
          </div>

          <div class="live-stream-grid">

            ${this.getFilteredStreams().map((stream) => `
              <article class="live-stream-card">

                <div
                  class="live-stream-preview"
                  style="--live-color: ${stream.color}"
                >

                  <span class="live-indicator">
                    ● LIVE DEMO
                  </span>

                  <span class="live-preview-logo">
                    ROCKYX
                  </span>

                  <span class="live-viewer-count">
                    ◉ ${stream.viewers.toLocaleString()}
                  </span>

                </div>

                <div class="live-stream-info">

                  <div class="live-host-avatar">
                    ${this.escapeHTML(stream.initials)}
                  </div>

                  <div class="live-host-details">

                    <h3>
                      ${this.escapeHTML(stream.title)}
                    </h3>

                    <p>
                      ${this.escapeHTML(stream.host)}
                    </p>

                    <span>
                      ${this.escapeHTML(stream.category)}
                    </span>

                  </div>

                  <button
                    type="button"
                    class="live-watch-button"
                    data-watch-stream="${this.escapeHTML(stream.id)}"
                  >
                    Watch
                  </button>

                </div>

              </article>
            `).join("")}

          </div>

          <div id="live-overlay"></div>

        </section>
      `;

      this.attachEvents(screen);
    },

    attachEvents(screen) {
      if (screen.dataset.liveEvents === "true") {
        return;
      }

      screen.dataset.liveEvents = "true";

      screen.addEventListener("click", (event) => {

        const categoryButton = event.target.closest(
          "[data-live-category]"
        );

        if (categoryButton) {
          this.activeCategory =
            categoryButton.dataset.liveCategory;

          this.render();
          return;
        }

        if (event.target.closest("[data-live-start]")) {
          this.showHostSetup();
          return;
        }

        const watchButton = event.target.closest(
          "[data-watch-stream]"
        );

        if (watchButton) {
          this.watchStream(
            watchButton.dataset.watchStream
          );
          return;
        }

        if (event.target.closest("[data-live-close]")) {
          this.closeOverlay();
          return;
        }

        if (event.target.closest("[data-live-follow]")) {
          this.toggleFollow();
          return;
        }

        if (event.target.closest("[data-live-like]")) {
          this.sendLike();
          return;
        }

        if (event.target.closest("[data-live-end]")) {
          this.endStream();
          return;
        }

        if (event.target.closest("[data-live-moderate]")) {
          alert(
            "LIVE moderation tools will be connected to the secure streaming backend."
          );
        }

      });

      screen.addEventListener("submit", (event) => {

        if (event.target.id === "live-chat-form") {
          event.preventDefault();

          const input = document.getElementById(
            "live-chat-input"
          );

          if (input) {
            this.sendChatMessage(input.value);
          }

          return;
        }

        if (event.target.id === "live-host-form") {
          event.preventDefault();

          const formData = new FormData(event.target);

          const title = String(
            formData.get("title") || ""
          ).trim();

          const category = String(
            formData.get("category") || ""
          );

          if (!title || !category) {
            alert("Please complete all fields.");
            return;
          }

          this.startStream(title, category);
        }

      });
    },

    watchStream(streamId) {
      const stream = this.streams.find(
        (item) => item.id === streamId
      );

      if (!stream) {
        return;
      }

      this.viewerCount = stream.viewers;
      this.likes = 0;
      this.isFollowing = false;

      this.showViewer(stream);
    },

    showViewer(stream) {
      const overlay = document.getElementById("live-overlay");

      if (!overlay) {
        return;
      }

      overlay.innerHTML = `
        <div class="live-modal-backdrop">

          <section
            class="live-viewer-modal"
            role="dialog"
            aria-modal="true"
            aria-label="LIVE stream demonstration"
          >

            <button
              type="button"
              class="live-modal-close"
              data-live-close
              aria-label="Close"
            >
              ×
            </button>

            <div class="live-video-placeholder">

              <span class="live-indicator">
                ● LIVE DEMO
              </span>

              <span class="live-placeholder-logo">
                ROCKYX
              </span>

              <p>
                Live video will appear here when streaming is connected.
              </p>

              <span class="live-viewer-count">
                ◉ ${this.viewerCount.toLocaleString()} viewers
              </span>

            </div>

            <div class="live-viewer-info">

              <div>
                <h2>${this.escapeHTML(stream.title)}</h2>
                <p>${this.escapeHTML(stream.host)}</p>
              </div>

              <button
                type="button"
                data-live-follow
                class="live-follow-button"
              >
                Follow
              </button>

            </div>

            <div class="live-viewer-actions">

              <button
                type="button"
                data-live-like
                class="live-like-button"
              >
                ♥ <span id="live-like-count">0</span>
              </button>

            </div>

            <div class="live-chat-panel">

              <h3>LIVE Chat</h3>

              <div id="live-chat-messages">
                <p class="live-chat-demo-message">
                  Welcome to this demonstration stream.
                </p>
              </div>

              <form id="live-chat-form">

                <input
                  type="text"
                  id="live-chat-input"
                  maxlength="300"
                  placeholder="Say something..."
                  required
                >

                <button type="submit">
                  Send
                </button>

              </form>

            </div>

          </section>

        </div>
      `;
    },

    showHostSetup() {
      const overlay = document.getElementById("live-overlay");

      if (!overlay) {
        return;
      }

      overlay.innerHTML = `
        <div class="live-modal-backdrop">

          <section
            class="live-host-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Start a LIVE stream"
          >

            <button
              type="button"
              class="live-modal-close"
              data-live-close
              aria-label="Close"
            >
              ×
            </button>

            <span class="live-eyebrow">
              ROCKYX BROADCAST
            </span>

            <h2>Set up your LIVE</h2>

            <div class="live-demo-notice">
              This creates a local demonstration session.
              It does not broadcast video or audio.
            </div>

            <form id="live-host-form">

              <label for="live-title">
                Stream title
              </label>

              <input
                type="text"
                id="live-title"
                name="title"
                maxlength="100"
                placeholder="Give your stream a title"
                required
              >

              <label for="live-category">
                Category
              </label>

              <select
                id="live-category"
                name="category"
                required
              >
                <option value="">Choose category</option>
                ${this.categories
                  .filter((category) => category !== "All")
                  .map((category) => `
                    <option value="${this.escapeHTML(category)}">
                      ${this.escapeHTML(category)}
                    </option>
                  `).join("")}
              </select>

              <button
                type="submit"
                class="live-broadcast-button"
              >
                Start demo session
              </button>

            </form>

          </section>

        </div>
      `;
    },

    startStream(title, category) {
      this.isLive = true;
      this.isFollowing = false;
      this.viewerCount = 0;
      this.likes = 0;
      this.chatMessages = [];

      const stream = {
        id: `live-${Date.now()}`,
        host: "You",
        initials: "YO",
        title,
        category,
        viewers: 0,
        color: "#6745a8"
      };

      this.streams.unshift(stream);

      window.dispatchEvent(
        new CustomEvent("rockyx:live-started", {
          detail: {
            title,
            category
          }
        })
      );

      this.showHostStream(stream);
    },

    showHostStream(stream) {
      const overlay = document.getElementById("live-overlay");

      if (!overlay) {
        return;
      }

      overlay.innerHTML = `
        <div class="live-modal-backdrop">

          <section
            class="live-host-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Your LIVE session"
          >

            <div class="live-video-placeholder">

              <span class="live-indicator">
                ● DEMO SESSION
              </span>

              <span class="live-placeholder-logo">
                ROCKYX
              </span>

              <p>
                Your broadcast preview will appear here
                after streaming infrastructure is connected.
              </p>

            </div>

            <h2>${this.escapeHTML(stream.title)}</h2>

            <p>
              Category: ${this.escapeHTML(stream.category)}
            </p>

            <p>
              Demo viewers:
              <strong id="live-host-viewers">0</strong>
            </p>

            <div class="live-host-controls">

              <button
                type="button"
                data-live-moderate
              >
                Moderation
              </button>

              <button
                type="button"
                data-live-end
                class="live-end-button"
              >
                End session
              </button>

            </div>

          </section>

        </div>
      `;
    },

    endStream() {
      this.isLive = false;

      window.dispatchEvent(
        new CustomEvent("rockyx:live-ended")
      );

      this.closeOverlay();

      alert("Your demonstration LIVE session has ended.");

      this.render();
    },

    toggleFollow() {
      this.isFollowing = !this.isFollowing;

      const button = document.querySelector(
        "[data-live-follow]"
      );

      if (button) {
        button.textContent = this.isFollowing
          ? "Following"
          : "Follow";
      }
    },

    sendLike() {
      this.likes += 1;

      const counter = document.getElementById(
        "live-like-count"
      );

      if (counter) {
        counter.textContent = this.likes;
      }
    },

    sendChatMessage(text) {
      const message = String(text).trim();

      if (!message) {
        return;
      }

      this.chatMessages.push({
        id: `chat-${Date.now()}`,
        text: message
      });

      const container = document.getElementById(
        "live-chat-messages"
      );

      if (container) {
        const messageElement = document.createElement("p");

        messageElement.className = "live-chat-demo-message";
        messageElement.textContent = message;

        container.appendChild(messageElement);
        container.scrollTop = container.scrollHeight;
      }

      const input = document.getElementById(
        "live-chat-input"
      );

      if (input) {
        input.value = "";
      }
    },

    closeOverlay() {
      const overlay = document.getElementById("live-overlay");

      if (overlay) {
        overlay.innerHTML = "";
      }
    }
  };

  window.RockyXLive = RockyXLive;

  if (
    window.RockyX &&
    typeof window.RockyX.registerModule === "function"
  ) {
    window.RockyX.registerModule("live", RockyXLive);
  }

})();