/* =====================================================
   ROCKYX — OFFLINE VIDEO LIBRARY
   Front-end demonstration module
   ===================================================== */

(() => {
  "use strict";

  const savedVideos = [
    {
      id: 1,
      title: "Creative Editing Tips",
      creator: "@rockyx_creator",
      duration: "02:45",
      size: 24,
      status: "Saved"
    },
    {
      id: 2,
      title: "Exploring Beautiful Places",
      creator: "@travel_world",
      duration: "01:38",
      size: 18,
      status: "Saved"
    },
    {
      id: 3,
      title: "Music Production Basics",
      creator: "@music_lab",
      duration: "04:12",
      size: 36,
      status: "Saved"
    }
  ];

  let activeFilter = "all";

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function getStorageUsed() {
    return savedVideos.reduce((total, video) => {
      return total + video.size;
    }, 0);
  }

  function render() {
    const root = document.querySelector("#app-content");

    if (!root) {
      console.error("RockyX Offline: #app-content was not found.");
      return;
    }

    const videos = activeFilter === "all"
      ? savedVideos
      : savedVideos.filter(video => video.status === "Saved");

    root.innerHTML = `
      <section class="offline-page">

        <header class="page-header">
          <span class="section-label">YOUR PERSONAL LIBRARY</span>
          <h1>Offline Videos</h1>
          <p>Your saved videos, organised in one place.</p>
        </header>

        <section class="offline-storage card">
          <div class="offline-storage-heading">
            <div>
              <h2>Storage Overview</h2>
              <p>Demonstration storage information</p>
            </div>
            <span class="offline-storage-icon">▣</span>
          </div>

          <div class="offline-storage-numbers">
            <strong>${getStorageUsed()} MB</strong>
            <span>Demo storage used</span>
          </div>

          <div class="offline-storage-bar">
            <div style="width:${Math.min(getStorageUsed() / 500 * 100, 100)}%"></div>
          </div>

          <small>Illustrative 500 MB storage allowance.</small>
        </section>

        <section class="offline-library">

          <div class="offline-library-heading">
            <h2>Saved Videos</h2>
            <span>${savedVideos.length} videos</span>
          </div>

          <div class="offline-filters">
            <button class="offline-filter ${activeFilter === "all" ? "active" : ""}"
              data-filter="all">All</button>

            <button class="offline-filter ${activeFilter === "saved" ? "active" : ""}"
              data-filter="saved">Available</button>
          </div>

          <div class="offline-video-list">

            ${videos.length ? videos.map(video => `
              <article class="offline-video card">

                <div class="offline-video-thumbnail">
                  <span>▶</span>
                </div>

                <div class="offline-video-info">
                  <h3>${escapeHTML(video.title)}</h3>
                  <p>${escapeHTML(video.creator)}</p>
                  <small>
                    ${escapeHTML(video.duration)} · ${video.size} MB
                  </small>
                  <span class="offline-status">${escapeHTML(video.status)}</span>
                </div>

                <button
                  class="offline-remove"
                  data-remove="${video.id}"
                  aria-label="Remove ${escapeHTML(video.title)}"
                >×</button>

              </article>
            `).join("") : `
              <div class="offline-empty card">
                <span>▣</span>
                <h3>No saved videos</h3>
                <p>Your offline video library is currently empty.</p>
              </div>
            `}

          </div>

          <button class="offline-clear-button" data-clear-all>
            Clear All Saved Videos
          </button>

        </section>

        <div class="offline-notice card">
          <strong>Important</strong>
          <p>
            This is a front-end demonstration. These sample entries do not
            represent actual downloaded videos. Real offline downloads,
            storage management and playback require additional implementation.
          </p>
        </div>

      </section>
    `;

    attachEvents(root);
  }

  function attachEvents(root) {
    if (root.dataset.offlineReady === "true") return;

    root.dataset.offlineReady = "true";

    root.addEventListener("click", event => {
      const filterButton = event.target.closest("[data-filter]");

      if (filterButton) {
        activeFilter = filterButton.dataset.filter;
        render();
        return;
      }

      const removeButton = event.target.closest("[data-remove]");

      if (removeButton) {
        const id = Number(removeButton.dataset.remove);

        const index = savedVideos.findIndex(video => video.id === id);

        if (index !== -1) {
          savedVideos.splice(index, 1);
          render();
        }

        return;
      }

      const clearButton = event.target.closest("[data-clear-all]");

      if (clearButton) {
        if (!savedVideos.length) {
          alert("Your offline library is already empty.");
          return;
        }

        const confirmed = confirm(
          "Are you sure you want to remove all saved video entries?"
        );

        if (confirmed) {
          savedVideos.length = 0;
          activeFilter = "all";
          render();
        }
      }
    });
  }

  const Offline = {
    initialize() {
      console.log("RockyX Offline module initialized.");
    },

    render
  };

  if (window.RockyX) {
    window.RockyX.registerModule("offline", Offline);
  } else {
    console.error("RockyX core must load before offline.js.");
  }

})();