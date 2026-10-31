/* =========================================================
   ROCKYX — MUSIC MODULE
   Version: 1.0.0
   Status: Front-end foundation with demo music data
   ========================================================= */

(function () {
  "use strict";

  const RockyXMusic = {
    name: "music",
    version: "1.0.0",

    activeCategory: "All",
    searchQuery: "",
    activeTrack: null,
    favourites: new Set(),
    recentlyPlayed: [],

    categories: [
      "All",
      "Afrobeats",
      "Hip-Hop",
      "Pop",
      "Electronic",
      "Chill",
      "Cinematic"
    ],

    // Demo entries only. These are not real licensed recordings.
    tracks: [
      {
        id: "music-001",
        title: "Golden Hour",
        artist: "RockyX Demo Artist",
        genre: "Afrobeats",
        duration: "0:30",
        mood: "Feel good",
        color: "#7650b8"
      },
      {
        id: "music-002",
        title: "Night Drive",
        artist: "RockyX Demo Artist",
        genre: "Electronic",
        duration: "0:30",
        mood: "Energetic",
        color: "#315a91"
      },
      {
        id: "music-003",
        title: "Deep Thoughts",
        artist: "RockyX Demo Artist",
        genre: "Chill",
        duration: "0:30",
        mood: "Relaxed",
        color: "#397b70"
      },
      {
        id: "music-004",
        title: "The Come Up",
        artist: "RockyX Demo Artist",
        genre: "Hip-Hop",
        duration: "0:30",
        mood: "Motivational",
        color: "#a05d42"
      },
      {
        id: "music-005",
        title: "Summer Feeling",
        artist: "RockyX Demo Artist",
        genre: "Pop",
        duration: "0:30",
        mood: "Happy",
        color: "#a34f7c"
      },
      {
        id: "music-006",
        title: "Epic Journey",
        artist: "RockyX Demo Artist",
        genre: "Cinematic",
        duration: "0:30",
        mood: "Dramatic",
        color: "#594a9a"
      }
    ],

    initialize() {
      console.log("RockyX Music initialized.");
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

    getFilteredTracks() {
      return this.tracks.filter((track) => {
        const matchesCategory =
          this.activeCategory === "All" ||
          track.genre === this.activeCategory;

        const search = this.searchQuery.toLowerCase();

        const matchesSearch =
          track.title.toLowerCase().includes(search) ||
          track.artist.toLowerCase().includes(search) ||
          track.genre.toLowerCase().includes(search) ||
          track.mood.toLowerCase().includes(search);

        return matchesCategory && matchesSearch;
      });
    },

    render() {
      const screen = document.getElementById("app-screen");

      if (!screen) {
        console.error("RockyX Music: app-screen not found.");
        return;
      }

      const filteredTracks = this.getFilteredTracks();

      screen.innerHTML = `
        <section class="music-page">

          <header class="music-heading">
            <div>
              <span class="music-eyebrow">ROCKYX STUDIO</span>
              <h1>Music Library</h1>
              <p>Find the sound for your next creation.</p>
            </div>
          </header>

          <div class="music-notice">
            <strong>Demo music library</strong>
            <p>
              These are demonstration track listings, not licensed
              recordings. Real music and usage rights will be connected later.
            </p>
          </div>

          <div class="music-search">
            <input
              type="search"
              id="music-search"
              placeholder="Search songs, artists or moods..."
              value="${this.escapeHTML(this.searchQuery)}"
              aria-label="Search music"
            >
          </div>

          <div class="music-categories">
            ${this.categories.map((category) => `
              <button
                type="button"
                class="music-category ${
                  this.activeCategory === category ? "active" : ""
                }"
                data-music-category="${this.escapeHTML(category)}"
              >
                ${this.escapeHTML(category)}
              </button>
            `).join("")}
          </div>

          <div class="music-section-heading">
            <h2>Explore music</h2>
            <span>${filteredTracks.length} tracks</span>
          </div>

          ${
            filteredTracks.length
              ? `
                <div class="music-track-list">
                  ${filteredTracks.map((track) => `
                    <article class="music-track">

                      <div
                        class="music-artwork"
                        style="--music-color: ${track.color}"
                      >
                        <span>RX</span>
                      </div>

                      <div class="music-track-info">
                        <h3>${this.escapeHTML(track.title)}</h3>
                        <p>
                          ${this.escapeHTML(track.artist)}
                          ·
                          ${this.escapeHTML(track.genre)}
                        </p>
                        <span class="music-mood">
                          ${this.escapeHTML(track.mood)}
                        </span>
                      </div>

                      <span class="music-duration">
                        ${this.escapeHTML(track.duration)}
                      </span>

                      <button
                        type="button"
                        class="music-favourite ${
                          this.favourites.has(track.id) ? "active" : ""
                        }"
                        data-music-favourite="${this.escapeHTML(track.id)}"
                        aria-label="Toggle favourite"
                        aria-pressed="${this.favourites.has(track.id)}"
                      >
                        ${this.favourites.has(track.id) ? "♥" : "♡"}
                      </button>

                      <button
                        type="button"
                        class="music-select"
                        data-music-select="${this.escapeHTML(track.id)}"
                      >
                        Select
                      </button>

                    </article>
                  `).join("")}
                </div>
              `
              : `
                <div class="music-empty">
                  <h3>No music found</h3>
                  <p>Try another search or genre.</p>
                </div>
              `
          }

          <section class="music-favourites-section">
            <h2>Your favourites</h2>
            <p>
              ${this.favourites.size} saved demo tracks
            </p>
          </section>

          <section class="music-recent-section">
            <h2>Recently selected</h2>
            ${
              this.recentlyPlayed.length
                ? this.recentlyPlayed.map((track) => `
                    <p>${this.escapeHTML(track.title)}</p>
                  `).join("")
                : "<p>Your selected tracks will appear here.</p>"
            }
          </section>

        </section>
      `;

      this.attachEvents(screen);
    },

    attachEvents(screen) {
      if (screen.dataset.musicEvents === "true") {
        return;
      }

      screen.dataset.musicEvents = "true";

      screen.addEventListener("input", (event) => {
        if (event.target.id !== "music-search") {
          return;
        }

        this.searchQuery = event.target.value;
        this.render();

        const input = document.getElementById("music-search");

        if (input) {
          input.focus();
          input.setSelectionRange(
            this.searchQuery.length,
            this.searchQuery.length
          );
        }
      });

      screen.addEventListener("click", (event) => {
        const categoryButton = event.target.closest(
          "[data-music-category]"
        );

        if (categoryButton) {
          this.activeCategory =
            categoryButton.dataset.musicCategory;

          this.render();
          return;
        }

        const favouriteButton = event.target.closest(
          "[data-music-favourite]"
        );

        if (favouriteButton) {
          this.toggleFavourite(
            favouriteButton.dataset.musicFavourite
          );

          this.render();
          return;
        }

        const selectButton = event.target.closest(
          "[data-music-select]"
        );

        if (selectButton) {
          this.selectTrack(
            selectButton.dataset.musicSelect
          );
        }
      });
    },

    toggleFavourite(trackId) {
      if (this.favourites.has(trackId)) {
        this.favourites.delete(trackId);
      } else {
        this.favourites.add(trackId);
      }
    },

    selectTrack(trackId) {
      const track = this.tracks.find(
        (item) => item.id === trackId
      );

      if (!track) {
        console.error("RockyX Music: Track not found.");
        return;
      }

      this.activeTrack = track;

      this.recentlyPlayed = [
        track,
        ...this.recentlyPlayed.filter(
          (item) => item.id !== track.id
        )
      ].slice(0, 5);

      window.dispatchEvent(
        new CustomEvent("rockyx:music-selected", {
          detail: {
            trackId: track.id,
            title: track.title,
            artist: track.artist,
            genre: track.genre,
            duration: track.duration
          }
        })
      );

      alert(
        `"${track.title}" selected. Music-to-editor integration will be connected later.`
      );
    }
  };

  window.RockyXMusic = RockyXMusic;

  if (
    window.RockyX &&
    typeof window.RockyX.registerModule === "function"
  ) {
    window.RockyX.registerModule("music", RockyXMusic);
  }

})();