/* =====================================================
   ROCKYX MUSIC CHARTS
   Rankings and music discovery foundation
   Version 1.0
   Prototype only.
   Official charts require verified server-side listening
   data and anti-manipulation controls.
   ===================================================== */
(function () {
  "use strict";
  const STORAGE_KEY = "rockyx_music_chart_activity_v1";
  const PERIODS = ["daily", "weekly", "monthly", "all-time"];
  function readActivity() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }
  function saveActivity(activity) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(activity.slice(-5000))
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
   * Record a prototype activity event.
   * This does not verify a genuine stream.
   */
  function recordActivity(details) {
    const input = details || {};
    if (
      !input.type ||
      !input.itemId ||
      !["play", "like", "follow"].includes(input.type)
    ) {
      return {
        success: false,
        message: "Provide a valid activity type and item ID."
      };
    }
    const event = {
      id: "rxchart-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 8),
      type: input.type,
      itemId: String(input.itemId),
      itemType: String(input.itemType || "song"),
      genre: String(input.genre || "Other"),
      country: String(input.country || ""),
      createdAt: new Date().toISOString()
    };
    const activity = readActivity();
    activity.push(event);
    if (!saveActivity(activity)) {
      return {
        success: false,
        message: "Unable to save chart activity."
      };
    }
    emit("rockyx:music-chart-activity", {
      activity: event
    });
    return {
      success: true,
      activity: event
    };
  }
  function getStartDate(period) {
    const now = new Date();
    const start = new Date(now);
    if (period === "daily") {
      start.setHours(0, 0, 0, 0);
    } else if (period === "weekly") {
      const day = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
    } else if (period === "monthly") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else if (period !== "all-time") {
      return null;
    }
    return period === "all-time" ? null : start;
  }
  function getRankings(options) {
    const settings = options || {};
    const period = settings.period || "weekly";
    const itemType = settings.itemType || "song";
    const metric = settings.metric || "play";
    if (!PERIODS.includes(period)) {
      return {
        success: false,
        message: "Unsupported chart period."
      };
    }
    if (!["play", "like", "follow"].includes(metric)) {
      return {
        success: false,
        message: "Unsupported ranking metric."
      };
    }
    const startDate = getStartDate(period);
    let activity = readActivity().filter(function (event) {
      if (event.type !== metric) {
        return false;
      }
      if (event.itemType !== itemType) {
        return false;
      }
      if (
        settings.genre &&
        event.genre.toLowerCase() !==
          String(settings.genre).toLowerCase()
      ) {
        return false;
      }
      if (
        settings.country &&
        event.country.toLowerCase() !==
          String(settings.country).toLowerCase()
      ) {
        return false;
      }
      if (startDate &&
          new Date(event.createdAt) < startDate) {
        return false;
      }
      return true;
    });
    const counts = {};
    activity.forEach(function (event) {
      counts[event.itemId] = (counts[event.itemId] || 0) + 1;
    });
    let rankings = Object.keys(counts).map(function (itemId) {
      return {
        itemId: itemId,
        score: counts[itemId]
      };
    });
    rankings.sort(function (a, b) {
      return b.score - a.score;
    });
    if (settings.limit) {
      rankings = rankings.slice(0, settings.limit);
    }
    return {
      success: true,
      period: period,
      itemType: itemType,
      metric: metric,
      rankings: rankings
    };
  }
  function getTrendingSongs(limit) {
    return getRankings({
      period: "weekly",
      itemType: "song",
      metric: "play",
      limit: limit || 50
    });
  }
  function getTopArtists(limit) {
    return getRankings({
      period: "monthly",
      itemType: "artist",
      metric: "follow",
      limit: limit || 50
    });
  }
  function getTopAlbums(limit) {
    return getRankings({
      period: "monthly",
      itemType: "album",
      metric: "play",
      limit: limit || 50
    });
  }
  function getGenreChart(genre, limit) {
    return getRankings({
      period: "weekly",
      itemType: "song",
      metric: "play",
      genre: genre,
      limit: limit || 50
    });
  }
  function getCountryChart(country, limit) {
    return getRankings({
      period: "weekly",
      itemType: "song",
      metric: "play",
      country: country,
      limit: limit || 50
    });
  }
  window.RockyXMusicCharts = {
    periods: PERIODS.slice(),
    recordActivity: recordActivity,
    getRankings: getRankings,
    getTrendingSongs: getTrendingSongs,
    getTopArtists: getTopArtists,
    getTopAlbums: getTopAlbums,
    getGenreChart: getGenreChart,
    getCountryChart: getCountryChart
  };
})();