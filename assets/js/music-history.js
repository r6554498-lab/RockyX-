/* =========================================
   ROCKYX MUSIC LISTENING HISTORY
   Local prototype
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_music_listening_history";
  const MAX_HISTORY = 200;

  function readHistory() {
    try {
      const history = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(history) ? history : [];
    } catch (error) {
      return [];
    }
  }

  function saveHistory(history) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(history.slice(0, MAX_HISTORY))
    );

    return history.slice(0, MAX_HISTORY);
  }

  function normalizeTrack(track) {
    if (!track || typeof track !== "object") {
      return null;
    }

    const id = track.id ?? track.trackId;

    if (id === undefined || id === null || String(id) === "") {
      return null;
    }

    return {
      id: String(id),
      title: String(track.title ?? track.name ?? "Unknown Track"),
      artist: typeof track.artist === "string"
        ? track.artist
        : String(track.artist?.name ?? track.artistName ?? "Unknown Artist"),
      genre: String(track.genre ?? ""),
      audioUrl: String(track.audioUrl ?? ""),
      artwork: String(track.artwork ?? track.coverUrl ?? ""),
      playedAt: new Date().toISOString()
    };
  }

  function recordPlayed(track) {
    const normalized = normalizeTrack(track);

    if (!normalized) {
      return {
        success: false,
        message: "A valid track is required."
      };
    }

    const history = readHistory();

    // Remove the previous entry for this track from the recent list.
    const updated = history.filter(
      item => String(item.id) !== normalized.id
    );

    updated.unshift(normalized);
    saveHistory(updated);

    window.dispatchEvent(
      new CustomEvent("rockyx:music-history-updated", {
        detail: { track: normalized }
      })
    );

    return {
      success: true,
      track: normalized
    };
  }

  function getRecentlyPlayed(limit) {
    const maxResults = Math.max(1, Number(limit) || 20);

    return readHistory().slice(0, maxResults);
  }

  function getTrackHistory(trackId) {
    return readHistory().find(
      item => String(item.id) === String(trackId)
    ) || null;
  }

  function getListeningStats() {
    const history = readHistory();
    const genres = {};
    const artists = {};

    history.forEach(track => {
      if (track.genre) {
        genres[track.genre] = (genres[track.genre] || 0) + 1;
      }

      if (track.artist) {
        artists[track.artist] = (artists[track.artist] || 0) + 1;
      }
    });

    return {
      recentlyPlayedCount: history.length,
      genres,
      artists
    };
  }

  function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);

    window.dispatchEvent(
      new CustomEvent("rockyx:music-history-cleared")
    );

    return true;
  }

  function removeTrack(trackId) {
    const updated = readHistory().filter(
      item => String(item.id) !== String(trackId)
    );

    saveHistory(updated);
    return updated;
  }

  // Public module API.
  window.RockyXMusicHistory = {
    recordPlayed,
    getRecentlyPlayed,
    getTrackHistory,
    getListeningStats,
    clearHistory,
    removeTrack
  };

  // Optional integration with the existing music player.
  // This records a track when the player reports that playback starts.
  window.addEventListener("rockyx:music-play-requested", function (event) {
    const detail = event.detail;

    if (detail && detail.track) {
      recordPlayed(detail.track);
    }
  });

  console.log("RockyX Music History loaded.");
})();