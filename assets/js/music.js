/* =====================================================
   ROCKYX MUSIC
   Music discovery and catalog foundation
   Version 1.0
   ===================================================== */
(function () {
  "use strict";
  const STORAGE_KEY = "rockyx_music_catalog_v1";
  const PLAYLIST_KEY = "rockyx_music_playlists_v1";
  const FAVORITES_KEY = "rockyx_music_favorites_v1";
  const GENRES = [
    "Afrobeats",
    "Hip-Hop",
    "Gospel",
    "R&B",
    "Dancehall",
    "Amapiano",
    "Highlife",
    "Reggae",
    "Pop",
    "Electronic",
    "Podcasts",
    "Other"
  ];
  let currentTrack = null;
  let queue = [];
  let currentQueueIndex = -1;
  let isPlaying = false;
  /* ---------- STORAGE ---------- */
  function readStorage(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }
  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }
  function getCatalog() {
    const catalog = readStorage(STORAGE_KEY, []);
    return Array.isArray(catalog) ? catalog : [];
  }
  /* ---------- MUSIC CATALOG ---------- */
  function addTrack(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "Track details are required."
      };
    }
    if (
      typeof details.title !== "string" ||
      !details.title.trim() ||
      typeof details.artist !== "string" ||
      !details.artist.trim()
    ) {
      return {
        success: false,
        message: "A song title and artist are required."
      };
    }
    const catalog = getCatalog();
    const track = {
      id: "rxmusic-" +
        Date.now() + "-" +
        Math.random().toString(36).slice(2, 8),
      title: details.title.trim().slice(0, 200),
      artist: details.artist.trim().slice(0, 200),
      album: String(details.album || "").slice(0, 200),
      genre: String(details.genre || "Other"),
      artwork: String(details.artwork || ""),
      audioUrl: String(details.audioUrl || ""),
      description: String(details.description || "").slice(0, 2000),
      type: details.type || "song",
      ownerId: String(details.ownerId || ""),
      releaseDate: details.releaseDate || null,
      plays: 0,
      likes: 0,
      status: "published",
      createdAt: new Date().toISOString()
    };
    catalog.unshift(track);
    if (!writeStorage(STORAGE_KEY, catalog)) {
      return {
        success: false,
        message: "Unable to save the track in this browser."
      };
    }
    emit("rockyx:music-track-added", {
      track: track
    });
    return {
      success: true,
      track: track
    };
  }
  function getTrack(trackId) {
    return getCatalog().find(function (track) {
      return track.id === trackId;
    }) || null;
  }
  function getTracks(options) {
    const settings = options || {};
    let tracks = getCatalog();
    if (settings.genre) {
      tracks = tracks.filter(function (track) {
        return track.genre.toLowerCase() ===
          String(settings.genre).toLowerCase();
      });
    }
    if (settings.artist) {
      tracks = tracks.filter(function (track) {
        return track.artist.toLowerCase() ===
          String(settings.artist).toLowerCase();
      });
    }
    if (settings.album) {
      tracks = tracks.filter(function (track) {
        return track.album.toLowerCase() ===
          String(settings.album).toLowerCase();
      });
    }
    if (settings.type) {
      tracks = tracks.filter(function (track) {
        return track.type === settings.type;
      });
    }
    if (settings.limit) {
      tracks = tracks.slice(0, Math.max(0, settings.limit));
    }
    return tracks;
  }
  /* ---------- SEARCH ---------- */
  function search(query) {
    const term = String(query || "").trim().toLowerCase();
    if (!term) {
      return [];
    }
    return getCatalog().filter(function (track) {
      return [
        track.title,
        track.artist,
        track.album,
        track.genre,
        track.description
      ].some(function (value) {
        return String(value || "").toLowerCase().includes(term);
      });
    });
  }
  /* ---------- MUSIC DISCOVERY ---------- */
  function getTrending(limit) {
    return getCatalog()
      .filter(function (track) {
        return track.status === "published";
      })
      .sort(function (a, b) {
        return (b.plays || 0) - (a.plays || 0);
      })
      .slice(0, limit || 20);
  }
  function getNewReleases(limit) {
    return getCatalog()
      .filter(function (track) {
        return track.status === "published";
      })
      .sort(function (a, b) {
        return new Date(b.releaseDate || b.createdAt) -
          new Date(a.releaseDate || a.createdAt);
      })
      .slice(0, limit || 20);
  }
  function getFeaturedArtists(limit) {
    const artists = new Map();
    getCatalog().forEach(function (track) {
      const key = track.artist.toLowerCase();
      if (!artists.has(key)) {
        artists.set(key, {
          name: track.artist,
          tracks: 0,
          plays: 0
        });
      }
      const artist = artists.get(key);
      artist.tracks += 1;
      artist.plays += track.plays || 0;
    });
    return Array.from(artists.values())
      .sort(function (a, b) {
        return b.plays - a.plays;
      })
      .slice(0, limit || 12);
  }
  function getGenres() {
    return GENRES.slice();
  }
  /* ---------- PLAYBACK REQUESTS ---------- */
  function emit(eventName, detail) {
    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail: detail
      })
    );
  }
  function play(trackId) {
    const track = getTrack(trackId);
    if (!track) {
      return {
        success: false,
        message: "Track not found."
      };
    }
    if (!track.audioUrl) {
      return {
        success: false,
        message: "This track has no audio file connected yet."
      };
    }
    currentTrack = track;
    isPlaying = true;
    if (!queue.some(function (item) {
      return item.id === track.id;
    })) {
      queue.push(track);
    }
    currentQueueIndex = queue.findIndex(function (item) {
      return item.id === track.id;
    });
    emit("rockyx:music-play-requested", {
      track: track,
      audioUrl: track.audioUrl
    });
    return {
      success: true,
      track: track,
      isPlaying: isPlaying
    };
  }
  function pause() {
    isPlaying = false;
    emit("rockyx:music-pause-requested", {
      track: currentTrack
    });
    return {
      success: true,
      isPlaying: false
    };
  }
  function next() {
    if (currentQueueIndex < 0 ||
        currentQueueIndex >= queue.length - 1) {
      return {
        success: false,
        message: "There is no next track in the queue."
      };
    }
    return play(queue[currentQueueIndex + 1].id);
  }
  function previous() {
    if (currentQueueIndex <= 0) {
      return {
        success: false,
        message: "There is no previous track in the queue."
      };
    }
    return play(queue[currentQueueIndex - 1].id);
  }
  function getPlaybackState() {
    return {
      currentTrack: currentTrack,
      isPlaying: isPlaying,
      queue: queue.slice(),
      queueIndex: currentQueueIndex
    };
  }
  /* ---------- FAVORITES ---------- */
  function getFavorites() {
    const favorites = readStorage(FAVORITES_KEY, []);
    return Array.isArray(favorites) ? favorites : [];
  }
  function toggleFavorite(trackId) {
    if (!getTrack(trackId)) {
      return {
        success: false,
        message: "Track not found."
      };
    }
    const favorites = getFavorites();
    const index = favorites.indexOf(trackId);
    let liked;
    if (index >= 0) {
      favorites.splice(index, 1);
      liked = false;
    } else {
      favorites.push(trackId);
      liked = true;
    }
    if (!writeStorage(FAVORITES_KEY, favorites)) {
      return {
        success: false,
        message: "Unable to save your favorites."
      };
    }
    emit("rockyx:music-favorite-updated", {
      trackId: trackId,
      liked: liked
    });
    return {
      success: true,
      liked: liked
    };
  }
  /* ---------- PLAYLISTS ---------- */
  function getPlaylists(ownerId) {
    const playlists = readStorage(PLAYLIST_KEY, []);
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
  function createPlaylist(name, ownerId, description) {
    if (!String(name || "").trim() || !ownerId) {
      return {
        success: false,
        message: "Playlist name and owner ID are required."
      };
    }
    const playlists = getPlaylists();
    const playlist = {
      id: "rxplaylist-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 7),
      name: String(name).trim().slice(0, 150),
      description: String(description || "").slice(0, 1000),
      ownerId: String(ownerId),
      trackIds: [],
      createdAt: new Date().toISOString()
    };
    playlists.unshift(playlist);
    if (!writeStorage(PLAYLIST_KEY, playlists)) {
      return {
        success: false,
        message: "Unable to save this playlist."
      };
    }
    emit("rockyx:music-playlist-created", {
      playlist: playlist
    });
    return {
      success: true,
      playlist: playlist
    };
  }
  function addToPlaylist(playlistId, trackId) {
    const playlists = getPlaylists();
    const playlist = playlists.find(function (item) {
      return item.id === playlistId;
    });
    if (!playlist || !getTrack(trackId)) {
      return {
        success: false,
        message: "Playlist or track not found."
      };
    }
    if (!playlist.trackIds.includes(trackId)) {
      playlist.trackIds.push(trackId);
    }
    if (!writeStorage(PLAYLIST_KEY, playlists)) {
      return {
        success: false,
        message: "Unable to update the playlist."
      };
    }
    return {
      success: true,
      playlist: playlist
    };
  }
  /* ---------- PUBLIC MODULE API ---------- */
  window.RockyXMusic = {
    getGenres: getGenres,
    addTrack: addTrack,
    getTrack: getTrack,
    getTracks: getTracks,
    search: search,
    getTrending: getTrending,
    getNewReleases: getNewReleases,
    getFeaturedArtists: getFeaturedArtists,
    play: play,
    pause: pause,
    next: next,
    previous: previous,
    getPlaybackState: getPlaybackState,
    getFavorites: getFavorites,
    toggleFavorite: toggleFavorite,
    getPlaylists: getPlaylists,
    createPlaylist: createPlaylist,
    addToPlaylist: addToPlaylist
  };
})();