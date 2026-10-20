/* =========================================
   ROCKYX HASHTAGS
   Hashtag discovery, search, and trends
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_hashtags";

  function loadData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        hashtags: {},
        content: []
      };
    } catch (error) {
      return {
        hashtags: {},
        content: []
      };
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function normalizeTag(tag) {
    return String(tag || "")
      .trim()
      .replace(/^#+/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
  }

  function extractHashtags(text) {
    const matches = String(text || "").match(/#[a-zA-Z0-9_]+/g) || [];

    return Array.from(
      new Set(
        matches
          .map(normalizeTag)
          .filter(Boolean)
      )
    );
  }

  function registerContent(options) {
    options = options || {};

    if (!options.contentId || !options.contentType) {
      return {
        success: false,
        message: "Content ID and content type are required."
      };
    }

    const tags = Array.from(
      new Set(
        (options.hashtags || [])
          .concat(extractHashtags(options.text || ""))
          .map(normalizeTag)
          .filter(Boolean)
      )
    );

    const data = loadData();
    const contentId = String(options.contentId);
    const contentType = String(options.contentType);

    // Replace existing registration for this content
    data.content = data.content.filter(function (item) {
      return !(
        item.contentId === contentId &&
        item.contentType === contentType
      );
    });

    data.content.push({
      contentId: contentId,
      contentType: contentType,
      hashtags: tags,
      createdAt: new Date().toISOString()
    });

    tags.forEach(function (tag) {
      if (!data.hashtags[tag]) {
        data.hashtags[tag] = {
          name: tag,
          usageCount: 0,
          views: 0,
          createdAt: new Date().toISOString()
        };
      }
    });

    // Recalculate usage from registered content
    Object.keys(data.hashtags).forEach(function (tag) {
      data.hashtags[tag].usageCount = data.content.filter(function (item) {
        return item.hashtags.indexOf(tag) !== -1;
      }).length;
    });

    saveData(data);

    return {
      success: true,
      hashtags: tags
    };
  }

  function searchHashtags(query) {
    const search = normalizeTag(query);
    const data = loadData();

    return Object.values(data.hashtags)
      .filter(function (tag) {
        return tag.name.includes(search);
      })
      .sort(function (a, b) {
        return b.usageCount - a.usageCount;
      });
  }

  function getTrending(limit) {
    limit = limit || 10;

    const data = loadData();

    return Object.values(data.hashtags)
      .sort(function (a, b) {
        return b.usageCount - a.usageCount;
      })
      .slice(0, limit);
  }

  function getContentByHashtag(tag, contentType) {
    tag = normalizeTag(tag);

    const data = loadData();

    return data.content.filter(function (item) {
      return (
        item.hashtags.indexOf(tag) !== -1 &&
        (!contentType || item.contentType === contentType)
      );
    });
  }

  function recordView(tag) {
    tag = normalizeTag(tag);

    if (!tag) {
      return {
        success: false,
        message: "A hashtag is required."
      };
    }

    const data = loadData();

    if (!data.hashtags[tag]) {
      data.hashtags[tag] = {
        name: tag,
        usageCount: 0,
        views: 0,
        createdAt: new Date().toISOString()
      };
    }

    data.hashtags[tag].views += 1;
    saveData(data);

    return {
      success: true,
      views: data.hashtags[tag].views
    };
  }

  function getHashtag(tag) {
    tag = normalizeTag(tag);

    const data = loadData();

    return data.hashtags[tag] || null;
  }

  function getRelatedHashtags(tag, limit) {
    tag = normalizeTag(tag);
    limit = limit || 5;

    const data = loadData();
    const target = data.hashtags[tag];

    if (!target) {
      return [];
    }

    const related = {};

    data.content.forEach(function (item) {
      if (item.hashtags.indexOf(tag) === -1) {
        return;
      }

      item.hashtags.forEach(function (otherTag) {
        if (otherTag !== tag) {
          related[otherTag] = (related[otherTag] || 0) + 1;
        }
      });
    });

    return Object.keys(related)
      .sort(function (a, b) {
        return related[b] - related[a];
      })
      .slice(0, limit)
      .map(function (name) {
        return data.hashtags[name];
      })
      .filter(Boolean);
  }

  window.RockyXHashtags = {
    normalizeTag: normalizeTag,
    extractHashtags: extractHashtags,
    registerContent: registerContent,
    searchHashtags: searchHashtags,
    getTrending: getTrending,
    getContentByHashtag: getContentByHashtag,
    recordView: recordView,
    getHashtag: getHashtag,
    getRelatedHashtags: getRelatedHashtags
  };

})();