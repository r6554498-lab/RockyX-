/* RockyX Template Analytics
   Frontend prototype.
   Production analytics must be verified by the backend.
*/
(function () {
  "use strict";
  const STORAGE_KEY = "rockyx_template_analytics_v1";
  function loadData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
      return {};
    }
  }
  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  function getTemplate(templateId) {
    const data = loadData();
    if (!data[templateId]) {
      data[templateId] = {
        views: 0,
        uses: 0,
        completedExports: 0,
        publishedVideos: 0
      };
    }
    return data[templateId];
  }
  function record(templateId, metric) {
    if (!templateId) {
      return {
        success: false,
        message: "A template ID is required."
      };
    }
    const allowedMetrics = [
      "views",
      "uses",
      "completedExports",
      "publishedVideos"
    ];
    if (!allowedMetrics.includes(metric)) {
      return {
        success: false,
        message: "Unknown analytics metric."
      };
    }
    const data = loadData();
    if (!data[templateId]) {
      data[templateId] = {
        views: 0,
        uses: 0,
        completedExports: 0,
        publishedVideos: 0
      };
    }
    data[templateId][metric] += 1;
    saveData(data);
    const result = {
      success: true,
      templateId: templateId,
      metric: metric,
      totals: { ...data[templateId] }
    };
    window.dispatchEvent(
      new CustomEvent("rockyx:template-analytics-updated", {
        detail: result
      })
    );
    return result;
  }
  function getStats(templateId) {
    const data = loadData();
    if (templateId) {
      return {
        templateId: templateId,
        ...(data[templateId] || {
          views: 0,
          uses: 0,
          completedExports: 0,
          publishedVideos: 0
        })
      };
    }
    return data;
  }
  window.RockyXTemplateAnalytics = {
    recordView: function (id) {
      return record(id, "views");
    },
    recordUse: function (id) {
      return record(id, "uses");
    },
    recordCompletedExport: function (id) {
      return record(id, "completedExports");
    },
    recordPublishedVideo: function (id) {
      return record(id, "publishedVideos");
    },
    getStats: getStats
  };
})();