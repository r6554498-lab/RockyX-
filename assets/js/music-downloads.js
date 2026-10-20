/* =====================================================
   ROCKYX MUSIC DOWNLOADS
   Download library and offline-access foundation
   Version 1.0
   Prototype only.
   Real offline downloads require file storage,
   licensing permissions, and playback integration.
   ===================================================== */
(function () {
  "use strict";
  const STORAGE_KEY = "rockyx_music_downloads_v1";
  function readDownloads() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }
  function saveDownloads(downloads) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(downloads)
      );
      return true;
    } catch (error) {
      return false;
    }
  }
  function emit(name, detail) {
    window.dispatchEvent(
      new CustomEvent(name, {
        detail: detail || {}
      })
    );
  }
  /*
   * Register an eligible track for download.
   * This records metadata only; it does not download audio.
   */
  function registerDownload(track, userId) {
    if (!track || !track.id || !userId) {
      return {
        success: false,
        message: "A track and user ID are required."
      };
    }
    if (track.downloadable !== true) {
      return {
        success: false,
        message: "This track is not marked as downloadable."
      };
    }
    if (!track.audioUrl) {
      return {
        success: false,
        message: "No audio file is available for this track."
      };
    }
    const downloads = readDownloads();
    const existing = downloads.find(function (item) {
      return (
        item.userId === String(userId) &&
        item.trackId === String(track.id)
      );
    });
    if (existing) {
      return {
        success: false,
        message: "This track is already in your download library."
      };
    }
    const record = {
      id: "rxdownload-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 8),
      userId: String(userId),
      trackId: String(track.id),
      title: String(track.title || "Untitled"),
      artist: String(track.artist || "Unknown artist"),
      audioUrl: String(track.audioUrl),
      status: "registered",
      registeredAt: new Date().toISOString()
    };
    downloads.unshift(record);
    if (!saveDownloads(downloads)) {
      return {
        success: false,
        message: "Unable to save the download record."
      };
    }
    emit("rockyx:music-download-registered", {
      download: record
    });
    return {
      success: true,
      download: record,
      message: "Added to the download list. Audio has not been downloaded."
    };
  }
  function getDownloads(userId) {
    if (!userId) {
      return [];
    }
    return readDownloads().filter(function (item) {
      return item.userId === String(userId);
    });
  }
  function removeDownload(downloadId, userId) {
    const downloads = readDownloads();
    const remaining = downloads.filter(function (item) {
      return !(
        item.id === String(downloadId) &&
        item.userId === String(userId)
      );
    });
    if (remaining.length === downloads.length) {
      return {
        success: false,
        message: "Download record not found."
      };
    }
    if (!saveDownloads(remaining)) {
      return {
        success: false,
        message: "Unable to remove the download record."
      };
    }
    emit("rockyx:music-download-removed", {
      downloadId: String(downloadId)
    });
    return {
      success: true
    };
  }
  /*
   * Report offline status.
   * A registered download is not proof that an audio file
   * exists on the device.
   */
  function getStatus() {
    return {
      online: navigator.onLine,
      offlinePlaybackAvailable: false,
      message: "Actual offline playback is not implemented yet."
    };
  }
  window.addEventListener("online", function () {
    emit("rockyx:music-network-changed", {
      online: true
    });
  });
  window.addEventListener("offline", function () {
    emit("rockyx:music-network-changed", {
      online: false
    });
  });
  window.RockyXMusicDownloads = {
    registerDownload: registerDownload,
    getDownloads: getDownloads,
    removeDownload: removeDownload,
    getStatus: getStatus
  };
})();