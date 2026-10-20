/* =====================================================
   ROCKYX PLAYLISTS
   Playlist management and music library foundation
   Version 1.0
   Frontend prototype.
   Shared playlists and synchronized data require a backend.
   ===================================================== */
(function () {
  "use strict";
  const PLAYLISTS_KEY = "rockyx_playlists_v1";
  const SAVED_KEY = "rockyx_saved_playlists_v1";
  const HISTORY_KEY = "rockyx_listening_history_v1";
  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }
  function emit(name, detail) {
    window.dispatchEvent(
      new CustomEvent(name, { detail: detail || {} })
    );
  }
  function getAll(ownerId) {
    const playlists = read(PLAYLISTS_KEY, []);
    if (!Array.isArray(playlists)) {
      return [];
    }
    if (!ownerId) {
      return playlists;
    }
    return playlists.filter(function (playlist) {
      return playlist.ownerId === String(ownerId);
    });
  }
  function getById(playlistId) {
    return getAll().find(function (playlist) {
      return playlist.id === String(playlistId);
    }) || null;
  }
  function create(details) {
    const input = details || {};
    if (!input.ownerId || !String(input.name || "").trim()) {
      return {
        success: false,
        message: "An owner ID and playlist name are required."
      };
    }
    const playlist = {
      id: "rxpl-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 8),
      ownerId: String(input.ownerId),
      name: String(input.name).trim().slice(0, 150),
      description: String(input.description || "").slice(0, 1000),
      artwork: String(input.artwork || ""),
      visibility: input.visibility === "private"
        ? "private"
        : "public",
      trackIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const playlists = getAll();
    playlists.unshift(playlist);
    if (!write(PLAYLISTS_KEY, playlists)) {
      return {
        success: false,
        message: "Unable to save the playlist."
      };
    }
    emit("rockyx:playlist-created", {
      playlist: playlist
    });
    return {
      success: true,
      playlist: playlist
    };
  }
  function update(playlistId, ownerId, changes) {
    const playlists = getAll();
    const playlist = playlists.find(function (item) {
      return (
        item.id === String(playlistId) &&
        item.ownerId === String(ownerId)
      );
    });
    if (!playlist) {
      return {
        success: false,
        message: "Playlist not found."
      };
    }
    const input = changes || {};
    if (typeof input.name === "string" && input.name.trim()) {
      playlist.name = input.name.trim().slice(0, 150);
    }
    if (typeof input.description === "string") {
      playlist.description = input.description.slice(0, 1000);
    }
    if (typeof input.artwork === "string") {
      playlist.artwork = input.artwork;
    }
    if (["public", "private"].includes(input.visibility)) {
      playlist.visibility = input.visibility;
    }
    playlist.updatedAt = new Date().toISOString();
    if (!write(PLAYLISTS_KEY, playlists)) {
      return {
        success: false,
        message: "Unable to update the playlist."
      };
    }
    emit("rockyx:playlist-updated", {
      playlist: playlist
    });
    return {
      success: true,
      playlist: playlist
    };
  }
  function addTrack(playlistId, ownerId, trackId) {
    const playlists = getAll();
    const playlist = playlists.find(function (item) {
      return (
        item.id === String(playlistId) &&
        item.ownerId === String(ownerId)
      );
    });
    if (!playlist || !trackId) {
      return {
        success: false,
        message: "Playlist and track IDs are required."
      };
    }
    if (playlist.trackIds.includes(String(trackId))) {
      return {
        success: false,
        message: "This track is already in the playlist."
      };
    }
    playlist.trackIds.push(String(trackId));
    playlist.updatedAt = new Date().toISOString();
    if (!write(PLAYLISTS_KEY, playlists)) {
      return {
        success: false,
        message: "Unable to add the track."
      };
    }
    emit("rockyx:playlist-track-added", {
      playlistId: playlist.id,
      trackId: String(trackId)
    });
    return {
      success: true,
      playlist: playlist
    };
  }
  function removeTrack(playlistId, ownerId, trackId) {
    const playlists = getAll();
    const playlist = playlists.find(function (item) {
      return (
        item.id === String(playlistId) &&
        item.ownerId === String(ownerId)
      );
    });
    if (!playlist) {
      return {
        success: false,
        message: "Playlist not found."
      };
    }
    playlist.trackIds = playlist.trackIds.filter(function (id) {
      return id !== String(trackId);
    });
    playlist.updatedAt = new Date().toISOString();
    if (!write(PLAYLISTS_KEY, playlists)) {
      return {
        success: false,
        message: "Unable to remove the track."
      };
    }
    emit("rockyx:playlist-track-removed", {
      playlistId: playlist.id,
      trackId: String(trackId)
    });
    return {
      success: true,
      playlist: playlist
    };
  }
  function moveTrack(playlistId, ownerId, fromIndex, toIndex) {
    const playlists = getAll();
    const playlist = playlists.find(function (item) {
      return (
        item.id === String(playlistId) &&
        item.ownerId === String(ownerId)
      );
    });
    if (!playlist) {
      return {
        success: false,
        message: "Playlist not found."
      };
    }
    const ids = playlist.trackIds;
    if (
      !Number.isInteger(fromIndex) ||
      !Number.isInteger(toIndex) ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= ids.length ||
      toIndex >= ids.length
    ) {
      return {
        success: false,
        message: "Invalid track positions."
      };
    }
    const moved = ids.splice(fromIndex, 1)[0];
    ids.splice(toIndex, 0, moved);
    playlist.updatedAt = new Date().toISOString();
    if (!write(PLAYLISTS_KEY, playlists)) {
      return {
        success: false,
        message: "Unable to reorder the playlist."
      };
    }
    return {
      success: true,
      playlist: playlist
    };
  }
  function deletePlaylist(playlistId, ownerId) {
    const playlists = getAll();
    const remaining = playlists.filter(function (playlist) {
      return !(
        playlist.id === String(playlistId) &&
        playlist.ownerId === String(ownerId)
      );
    });
    if (remaining.length === playlists.length) {
      return {
        success: false,
        message: "Playlist not found."
      };
    }
    if (!write(PLAYLISTS_KEY, remaining)) {
      return {
        success: false,
        message: "Unable to delete the playlist."
      };
    }
    return {
      success: true
    };
  }
  function toggleSaved(userId, playlistId) {
    if (!userId || !getById(playlistId)) {
      return {
        success: false,
        message: "User or playlist not found."
      };
    }
    const saved = read(SAVED_KEY, {});
    const key = String(userId);
    if (!Array.isArray(saved[key])) {
      saved[key] = [];
    }
    const index = saved[key].indexOf(String(playlistId));
    let isSaved;
    if (index >= 0) {
      saved[key].splice(index, 1);
      isSaved = false;
    } else {
      saved[key].push(String(playlistId));
      isSaved = true;
    }
    if (!write(SAVED_KEY, saved)) {
      return {
        success: false,
        message: "Unable to save playlist preference."
      };
    }
    emit("rockyx:playlist-saved-updated", {
      userId: String(userId),
      playlistId: String(playlistId),
      saved: isSaved
    });
    return {
      success: true,
      saved: isSaved
    };
  }
  function getSaved(userId) {
    const saved = read(SAVED_KEY, {});
    const ids = saved[String(userId)] || [];
    return ids.map(getById).filter(Boolean);
  }
  function recordPlay(userId, trackId) {
    if (!userId || !trackId) {
      return {
        success: false,
        message: "User and track IDs are required."
      };
    }
    const history = read(HISTORY_KEY, {});
    const key = String(userId);
    if (!Array.isArray(history[key])) {
      history[key] = [];
    }
    history[key].unshift({
      trackId: String(trackId),
      playedAt: new Date().toISOString()
    });
    history[key] = history[key].slice(0, 500);
    if (!write(HISTORY_KEY, history)) {
      return {
        success: false,
        message: "Unable to save listening history."
      };
    }
    emit("rockyx:music-history-updated", {
      userId: key,
      trackId: String(trackId)
    });
    return {
      success: true
    };
  }
  function getHistory(userId) {
    const history = read(HISTORY_KEY, {});
    const items = history[String(userId)] || [];
    return Array.isArray(items) ? items : [];
  }
  window.RockyXPlaylists = {
    getAll: getAll,
    getById: getById,
    create: create,
    update: update,
    addTrack: addTrack,
    removeTrack: removeTrack,
    moveTrack: moveTrack,
    deletePlaylist: deletePlaylist,
    toggleSaved: toggleSaved,
    getSaved: getSaved,
    recordPlay: recordPlay,
    getHistory: getHistory
  };
})();