/* =========================================
   ROCKYX MUSIC RECOMMENDATIONS
   Rule-based recommendation prototype
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_music_preferences";

  function readPreferences() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        favoriteGenres: [],
        favoriteArtists: [],
        excludedTracks: []
      };
    } catch (error) {
      return {
        favoriteGenres: [],
        favoriteArtists: [],
        excludedTracks: []
      };
    }
  }

  function savePreferences(preferences) {
    const current = readPreferences();

    const updated = {
      favoriteGenres: Array.isArray(preferences.favoriteGenres)
        ? preferences.favoriteGenres
        : current.favoriteGenres,

      favoriteArtists: Array.isArray(preferences.favoriteArtists)
        ? preferences.favoriteArtists
        : current.favoriteArtists,

      excludedTracks: Array.isArray(preferences.excludedTracks)
        ? preferences.excludedTracks
        : current.excludedTracks
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return updated;
  }

  function getCatalog() {
    if (
      window.RockyXMusic &&
      typeof window.RockyXMusic.getTracks === "function"
    ) {
      const tracks = window.RockyXMusic.getTracks();
      return Array.isArray(tracks) ? tracks : [];
    }

    return [];
  }

  function getTrackId(track) {
    return String(track.id ?? track.trackId ?? "");
  }

  function getTrackGenre(track) {
    return String(track.genre ?? "").toLowerCase();
  }

  function getArtistName(track) {
    const artist = track.artist ?? track.artistName ?? "";

    if (typeof artist === "string") {
      return artist.toLowerCase();
    }

    if (artist && typeof artist === "object") {
      return String(artist.name ?? "").toLowerCase();
    }

    return "";
  }

  function getTrackTitle(track) {
    return String(track.title ?? track.name ?? "").toLowerCase();
  }

  function getForYou(limit) {
    const preferences = readPreferences();
    const tracks = getCatalog();
    const maxResults = Math.max(1, Number(limit) || 20);

    const favoriteGenres = preferences.favoriteGenres.map(value =>
      String(value).toLowerCase()
    );

    const favoriteArtists = preferences.favoriteArtists.map(value =>
      String(value).toLowerCase()
    );

    const excludedTracks = new Set(
      preferences.excludedTracks.map(String)
    );

    return tracks
      .filter(track => !excludedTracks.has(getTrackId(track)))
      .map((track, index) => {
        let score = 0;

        if (favoriteGenres.includes(getTrackGenre(track))) {
          score += 10;
        }

        if (favoriteArtists.includes(getArtistName(track))) {
          score += 15;
        }

        if (track.featured === true || track.isFeatured === true) {
          score += 2;
        }

        if (track.isNew === true || track.newRelease === true) {
          score += 3;
        }

        return {
          ...track,
          recommendationScore: score,
          recommendationReason:
            score >= 15
              ? "Because you like this artist"
              : score >= 10
              ? "Because you like this genre"
              : score >= 3
              ? "Featured or new music"
              : "You might discover something new",
          _originalOrder: index
        };
      })
      .sort((a, b) => {
        return (
          b.recommendationScore - a.recommendationScore ||
          a._originalOrder - b._originalOrder
        );
      })
      .slice(0, maxResults)
      .map(({ _originalOrder, ...track }) => track);
  }

  function getSimilarTracks(trackId, limit) {
    const tracks = getCatalog();
    const selected = tracks.find(
      track => getTrackId(track) === String(trackId)
    );

    if (!selected) {
      return [];
    }

    const selectedGenre = getTrackGenre(selected);
    const selectedArtist = getArtistName(selected);
    const maxResults = Math.max(1, Number(limit) || 10);

    return tracks
      .filter(track => getTrackId(track) !== String(trackId))
      .map(track => {
        let score = 0;

        if (
          selectedGenre &&
          getTrackGenre(track) === selectedGenre
        ) {
          score += 2;
        }

        if (
          selectedArtist &&
          getArtistName(track) === selectedArtist
        ) {
          score += 3;
        }

        return { track, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.track);
  }

  function getByGenre(genre, limit) {
    const targetGenre = String(genre || "").toLowerCase();
    const maxResults = Math.max(1, Number(limit) || 20);

    if (!targetGenre) {
      return [];
    }

    return getCatalog()
      .filter(track => getTrackGenre(track) === targetGenre)
      .slice(0, maxResults);
  }

  function excludeTrack(trackId) {
    const preferences = readPreferences();
    const id = String(trackId);

    if (!id) {
      return preferences;
    }

    if (!preferences.excludedTracks.includes(id)) {
      preferences.excludedTracks.push(id);
    }

    return savePreferences(preferences);
  }

  function resetExcludedTracks() {
    return savePreferences({ excludedTracks: [] });
  }

  window.RockyXMusicRecommendations = {
    getForYou,
    getSimilarTracks,
    getByGenre,
    savePreferences,
    getPreferences: readPreferences,
    excludeTrack,
    resetExcludedTracks
  };

  console.log("RockyX Music Recommendations loaded.");
})();