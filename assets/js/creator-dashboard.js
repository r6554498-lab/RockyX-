/* =========================================
   ROCKYX CREATOR DASHBOARD
   Unified creator dashboard foundation
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_creator_dashboard";

  const CREATOR_ROLES = [
    "social",
    "music",
    "template"
  ];

  function normalizeId(value) {
    if (typeof value !== "string" && typeof value !== "number") {
      return null;
    }

    const id = String(value).trim();
    return id || null;
  }

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const data = saved ? JSON.parse(saved) : {};

      return data && typeof data === "object" && !Array.isArray(data)
        ? data
        : {};
    } catch (error) {
      console.error("RockyX creator dashboard could not load:", error);
      return {};
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      window.dispatchEvent(
        new CustomEvent("rockyx:creator-dashboard-updated", {
          detail: { updatedAt: new Date().toISOString() }
        })
      );

      return true;
    } catch (error) {
      console.error("RockyX creator dashboard could not save:", error);
      return false;
    }
  }

  function getUserData(userId) {
    const id = normalizeId(userId);
    if (!id) return null;

    const data = loadData();

    if (!data[id]) {
      data[id] = {
        userId: id,
        roles: [],
        stats: {
          social: {
            videos: 0,
            views: 0,
            followers: 0,
            likes: 0
          },
          music: {
            tracks: 0,
            plays: 0,
            listeners: 0
          },
          template: {
            templates: 0,
            views: 0,
            uses: 0,
            exports: 0,
            publishedVideos: 0
          }
        },
        earnings: {
          social: 0,
          music: 0,
          template: 0,
          other: 0
        },
        updatedAt: new Date().toISOString()
      };
    }

    return data[id];
  }

  function ensureUser(userId) {
    const id = normalizeId(userId);
    if (!id) return false;

    const data = loadData();

    if (!data[id]) {
      getUserData(id);
      data[id] = getUserData(id);
    }

    return saveData(data);
  }

  function getDashboard(userId) {
    const id = normalizeId(userId);
    if (!id) return null;

    ensureUser(id);

    const userData = getUserData(id);

    if (!userData) return null;

    return JSON.parse(JSON.stringify(userData));
  }

  function setRoles(userId, roles) {
    const id = normalizeId(userId);

    if (!id || !Array.isArray(roles)) {
      return false;
    }

    const validRoles = [...new Set(
      roles.filter(role => CREATOR_ROLES.includes(role))
    )];

    const data = loadData();
    const userData = getUserData(id);

    if (!userData) return false;

    userData.roles = validRoles;
    userData.updatedAt = new Date().toISOString();

    data[id] = userData;

    return saveData(data);
  }

  function addRole(userId, role) {
    if (!CREATOR_ROLES.includes(role)) {
      return false;
    }

    const dashboard = getDashboard(userId);
    if (!dashboard) return false;

    if (dashboard.roles.includes(role)) {
      return true;
    }

    dashboard.roles.push(role);

    const data = loadData();
    data[dashboard.userId] = dashboard;

    return saveData(data);
  }

  function removeRole(userId, role) {
    const id = normalizeId(userId);

    if (!id || !CREATOR_ROLES.includes(role)) {
      return false;
    }

    const dashboard = getDashboard(id);
    if (!dashboard) return false;

    dashboard.roles = dashboard.roles.filter(
      item => item !== role
    );

    const data = loadData();
    data[id] = dashboard;

    return saveData(data);
  }

  function updateStats(userId, role, changes) {
    const id = normalizeId(userId);

    if (
      !id ||
      !CREATOR_ROLES.includes(role) ||
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes)
    ) {
      return false;
    }

    const dashboard = getDashboard(id);
    if (!dashboard) return false;

    const allowedFields = {
      social: ["videos", "views", "followers", "likes"],
      music: ["tracks", "plays", "listeners"],
      template: [
        "templates",
        "views",
        "uses",
        "exports",
        "publishedVideos"
      ]
    };

    for (const field of allowedFields[role]) {
      if (
        Number.isFinite(changes[field]) &&
        changes[field] >= 0
      ) {
        dashboard.stats[role][field] = Math.floor(changes[field]);
      }
    }

    dashboard.updatedAt = new Date().toISOString();

    const data = loadData();
    data[id] = dashboard;

    return saveData(data);
  }

  function updateEarnings(userId, category, amount) {
    const id = normalizeId(userId);

    const allowedCategories = [
      "social",
      "music",
      "template",
      "other"
    ];

    if (
      !id ||
      !allowedCategories.includes(category) ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      return false;
    }

    const dashboard = getDashboard(id);
    if (!dashboard) return false;

    dashboard.earnings[category] = amount;
    dashboard.updatedAt = new Date().toISOString();

    const data = loadData();
    data[id] = dashboard;

    return saveData(data);
  }

  function getEarningsSummary(userId) {
    const dashboard = getDashboard(userId);

    if (!dashboard) return null;

    const earnings = dashboard.earnings;

    const total = Object.values(earnings).reduce(
      (sum, amount) => sum + amount,
      0
    );

    return {
      social: earnings.social,
      music: earnings.music,
      template: earnings.template,
      other: earnings.other,
      total
    };
  }

  function getRoleSummary(userId) {
    const dashboard = getDashboard(userId);

    if (!dashboard) return null;

    return dashboard.roles.map(role => ({
      role,
      stats: JSON.parse(
        JSON.stringify(dashboard.stats[role])
      )
    }));
  }

  function getCreatorLevel(userId, role) {
    const id = normalizeId(userId);

    if (
      !id ||
      !["social", "template"].includes(role)
    ) {
      return null;
    }

    const levels = [
      { name: "Starter", points: 0 },
      { name: "Rising", points: 100 },
      { name: "Emerging", points: 500 },
      { name: "Established", points: 1500 },
      { name: "Expert", points: 5000 },
      { name: "Elite", points: 15000 },
      { name: "Master", points: 50000 }
    ];

    let points = 0;

    try {
      if (role === "social") {
        const tasks = JSON.parse(
          localStorage.getItem("rockyx_creator_tasks") || "{}"
        );

        const userTasks = tasks[id];

        if (userTasks && Number.isFinite(userTasks.points)) {
          points = Math.max(0, userTasks.points);
        }
      }

      if (role === "template") {
        const tasks = JSON.parse(
          localStorage.getItem("rockyx_template_creator_tasks") || "{}"
        );

        const userTasks = tasks[id];

        if (userTasks && Number.isFinite(userTasks.points)) {
          points = Math.max(0, userTasks.points);
        }
      }
    } catch (error) {
      console.error("RockyX creator level could not be loaded:", error);
    }

    let currentLevel = levels[0];
    let nextLevel = null;

    for (let i = 0; i < levels.length; i++) {
      if (points >= levels[i].points) {
        currentLevel = levels[i];
      } else {
        nextLevel = levels[i];
        break;
      }
    }

    return {
      role,
      points,
      level: currentLevel.name,
      nextLevel: nextLevel ? nextLevel.name : null,
      pointsToNextLevel: nextLevel
        ? nextLevel.points - points
        : 0
    };
  }

  function getOverview(userId) {
    const dashboard = getDashboard(userId);

    if (!dashboard) return null;

    return {
      userId: dashboard.userId,
      roles: [...dashboard.roles],
      totalViews:
        dashboard.stats.social.views +
        dashboard.stats.template.views,
      totalFollowers: dashboard.stats.social.followers,
      totalMusicPlays: dashboard.stats.music.plays,
      totalTemplateUses: dashboard.stats.template.uses,
      totalPublishedVideos:
        dashboard.stats.template.publishedVideos,
      earnings: getEarningsSummary(userId),
      socialLevel: getCreatorLevel(userId, "social"),
      templateLevel: getCreatorLevel(userId, "template")
    };
  }

  window.RockyXCreatorDashboard = {
    getDashboard,
    setRoles,
    addRole,
    removeRole,
    updateStats,
    updateEarnings,
    getEarningsSummary,
    getRoleSummary,
    getCreatorLevel,
    getOverview,
    getCreatorRoles: () => [...CREATOR_ROLES]
  };

})();