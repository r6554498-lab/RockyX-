/* =========================================
   ROCKYX UNIFIED SEARCH
   Cross-module search foundation
   ========================================= */

(function () {
  "use strict";

  const SEARCH_HISTORY_KEY = "rockyx_search_history";
  const MAX_HISTORY = 20;

  const SEARCH_TYPES = [
    "all",
    "users",
    "videos",
    "livestreams",
    "music",
    "artists",
    "albums",
    "products",
    "sellers",
    "places",
    "templates"
  ];

  function cleanText(value) {
    return typeof value === "string"
      ? value.trim().toLowerCase()
      : "";
  }

  function getValue(object, keys) {
    for (const key of keys) {
      if (
        object &&
        object[key] !== undefined &&
        object[key] !== null
      ) {
        return String(object[key]);
      }
    }

    return "";
  }

  function getSearchHistory() {
    try {
      const history = JSON.parse(
        localStorage.getItem(SEARCH_HISTORY_KEY) || "[]"
      );

      return Array.isArray(history) ? history : [];
    } catch (error) {
      return [];
    }
  }

  function saveSearchHistory(query) {
    const normalized = cleanText(query);

    if (!normalized) return false;

    try {
      let history = getSearchHistory();

      history = history.filter(
        item => cleanText(item.query) !== normalized
      );

      history.unshift({
        query: query.trim(),
        searchedAt: new Date().toISOString()
      });

      history = history.slice(0, MAX_HISTORY);

      localStorage.setItem(
        SEARCH_HISTORY_KEY,
        JSON.stringify(history)
      );

      return true;
    } catch (error) {
      console.error("RockyX search history could not be saved:", error);
      return false;
    }
  }

  function clearSearchHistory() {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
      return true;
    } catch (error) {
      return false;
    }
  }

  function removeHistoryItem(query) {
    const normalized = cleanText(query);

    try {
      const history = getSearchHistory().filter(
        item => cleanText(item.query) !== normalized
      );

      localStorage.setItem(
        SEARCH_HISTORY_KEY,
        JSON.stringify(history)
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  function matchesQuery(item, query, keys) {
    const normalizedQuery = cleanText(query);

    if (!normalizedQuery) return false;

    const searchableText = keys
      .map(key => getValue(item, [key]))
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  }

  function searchUsers(query) {
    const accounts = window.RockyXUserAccounts;

    if (!accounts || typeof accounts.searchProfiles !== "function") {
      return [];
    }

    try {
      return accounts.searchProfiles(query).map(item => ({
        id: getValue(item, ["id", "userId", "username"]),
        type: "user",
        title: getValue(item, ["displayName", "name", "username"]),
        username: getValue(item, ["username"]),
        description: getValue(item, ["bio", "description"]),
        image: getValue(item, ["profilePicture", "avatar"]),
        source: "RockyXUserAccounts"
      }));
    } catch (error) {
      console.error("RockyX user search failed:", error);
      return [];
    }
  }

  function searchMusic(query) {
    const music = window.RockyXMusic;

    if (!music || typeof music.search !== "function") {
      return [];
    }

    try {
      const results = music.search(query);

      if (!Array.isArray(results)) return [];

      return results.map(item => ({
        id: getValue(item, ["id", "trackId"]),
        type: "music",
        title: getValue(item, ["title", "name"]),
        description: getValue(item, ["artist", "artistName", "album"]),
        image: getValue(item, ["cover", "coverUrl", "artwork"]),
        source: "RockyXMusic"
      }));
    } catch (error) {
      console.error("RockyX music search failed:", error);
      return [];
    }
  }

  function searchProducts(query) {
    const marketplace = window.RockyXMarketplace;

    if (
      !marketplace ||
      typeof marketplace.searchProducts !== "function"
    ) {
      return [];
    }

    try {
      const results = marketplace.searchProducts(query);

      if (!Array.isArray(results)) return [];

      return results.map(item => ({
        id: getValue(item, ["id", "productId"]),
        type: "product",
        title: getValue(item, ["name", "title"]),
        description: getValue(item, ["description", "category"]),
        image: getValue(item, ["image", "imageUrl"]),
        price: item.price,
        source: "RockyXMarketplace"
      }));
    } catch (error) {
      console.error("RockyX product search failed:", error);
      return [];
    }
  }

  function searchArtists(query) {
    const artists = window.RockyXArtists;

    if (!artists || typeof artists.searchArtists !== "function") {
      return [];
    }

    try {
      const results = artists.searchArtists(query);

      if (!Array.isArray(results)) return [];

      return results.map(item => ({
        id: getValue(item, ["id", "artistId", "userId"]),
        type: "artist",
        title: getValue(item, ["stageName", "artistName", "name"]),
        description: getValue(item, ["bio", "genre"]),
        image: getValue(item, ["profilePicture", "avatar"]),
        source: "RockyXArtists"
      }));
    } catch (error) {
      console.error("RockyX artist search failed:", error);
      return [];
    }
  }

  function searchAlbums(query) {
    const albums = window.RockyXAlbums;

    if (!albums || typeof albums.getAlbums !== "function") {
      return [];
    }

    try {
      const results = albums.getAlbums();

      if (!Array.isArray(results)) return [];

      return results
        .filter(item =>
          matchesQuery(
            item,
            query,
            ["title", "name", "artist", "artistName", "type"]
          )
        )
        .map(item => ({
          id: getValue(item, ["id", "albumId"]),
          type: "album",
          title: getValue(item, ["title", "name"]),
          description: getValue(item, ["artist", "artistName", "type"]),
          image: getValue(item, ["cover", "coverUrl", "artwork"]),
          source: "RockyXAlbums"
        }));
    } catch (error) {
      console.error("RockyX album search failed:", error);
      return [];
    }
  }

  function searchTemplates(query) {
    const templates = window.RockyXTemplates;

    if (!templates || typeof templates.searchTemplates !== "function") {
      return [];
    }

    try {
      const results = templates.searchTemplates(query);

      if (!Array.isArray(results)) return [];

      return results.map(item => ({
        id: getValue(item, ["id", "templateId"]),
        type: "template",
        title: getValue(item, ["title", "name"]),
        description: getValue(item, ["description", "creatorName"]),
        image: getValue(item, ["thumbnail", "thumbnailUrl", "cover"]),
        source: "RockyXTemplates"
      }));
    } catch (error) {
      console.error("RockyX template search failed:", error);
      return [];
    }
  }

  function searchLocalStorage(query, key, type, fields) {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return [];

      const data = JSON.parse(saved);
      if (!Array.isArray(data)) return [];

      return data
        .filter(item => matchesQuery(item, query, fields))
        .map(item => ({
          id: getValue(item, ["id", "userId"]),
          type,
          title: getValue(item, ["title", "name", "username"]),
          description: getValue(item, ["description", "bio", "category"]),
          image: getValue(item, ["image", "imageUrl", "thumbnail"]),
          source: key
        }));
    } catch (error) {
      return [];
    }
  }

  function searchType(query, type) {
    switch (type) {
      case "users":
        return searchUsers(query);

      case "music":
        return searchMusic(query);

      case "artists":
        return searchArtists(query);

      case "albums":
        return searchAlbums(query);

      case "products":
        return searchProducts(query);

      case "templates":
        return searchTemplates(query);

      case "videos":
        return searchLocalStorage(
          query,
          "rockyx_videos",
          "video",
          ["title", "caption", "description", "creator", "username", "hashtags"]
        );

      case "livestreams":
        return searchLocalStorage(
          query,
          "rockyx_live_rooms",
          "livestream",
          ["title", "description", "host", "username"]
        );

      case "sellers":
        return searchLocalStorage(
          query,
          "rockyx_seller_profiles",
          "seller",
          ["name", "businessName", "username", "description"]
        );

      case "places":
        return searchLocalStorage(
          query,
          "rockyx_places",
          "place",
          ["name", "title", "category", "description", "address"]
        );

      default:
        return [];
    }
  }

  function search(query, options) {
    const originalQuery =
      typeof query === "string" ? query.trim() : "";

    const normalizedQuery = cleanText(originalQuery);

    if (!normalizedQuery) {
      return {
        query: originalQuery,
        total: 0,
        results: []
      };
    }

    const settings = options || {};
    const requestedType = settings.type || "all";
    const limit = Number.isFinite(settings.limit)
      ? Math.max(1, Math.min(settings.limit, 100))
      : 50;

    if (!SEARCH_TYPES.includes(requestedType)) {
      return {
        query: originalQuery,
        total: 0,
        results: [],
        error: "Unsupported search type."
      };
    }

    const types = requestedType === "all"
      ? SEARCH_TYPES.filter(type => type !== "all")
      : [requestedType];

    let results = [];

    types.forEach(type => {
      results = results.concat(searchType(originalQuery, type));
    });

    results = results.filter(item => item.title || item.id);

    const unique = [];
    const seen = new Set();

    results.forEach(item => {
      const identity = `${item.type}:${item.id || item.title}`;

      if (!seen.has(identity)) {
        seen.add(identity);
        unique.push(item);
      }
    });

    unique.sort((a, b) => {
      const aExact = cleanText(a.title) === normalizedQuery ? 1 : 0;
      const bExact = cleanText(b.title) === normalizedQuery ? 1 : 0;
      return bExact - aExact;
    });

    saveSearchHistory(originalQuery);

    const finalResults = unique.slice(0, limit);

    window.dispatchEvent(
      new CustomEvent("rockyx:search-completed", {
        detail: {
          query: originalQuery,
          type: requestedType,
          total: unique.length
        }
      })
    );

    return {
      query: originalQuery,
      type: requestedType,
      total: unique.length,
      results: finalResults
    };
  }

  function getSuggestions(query) {
    const normalized = cleanText(query);

    if (!normalized) {
      return getSearchHistory().map(item => item.query);
    }

    return getSearchHistory()
      .map(item => item.query)
      .filter(item => cleanText(item).includes(normalized))
      .slice(0, 8);
  }

  function getSupportedTypes() {
    return [...SEARCH_TYPES];
  }

  window.RockyXSearch = {
    search,
    searchUsers,
    searchMusic,
    searchProducts,
    searchArtists,
    getSearchHistory,
    clearSearchHistory,
    removeHistoryItem,
    getSuggestions,
    getSupportedTypes
  };

})();