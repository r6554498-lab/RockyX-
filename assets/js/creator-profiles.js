/* =========================================
   ROCKYX CREATOR PROFILES
   Public creator profile foundation
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_creator_profiles";

  const CREATOR_TYPES = [
    "social",
    "music",
    "template",
    "video",
    "multi"
  ];

  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return "creator-" + Date.now() +
      "-" + Math.random().toString(36).slice(2, 9);
  }

  function normalizeId(value) {
    if (typeof value !== "string" && typeof value !== "number") {
      return null;
    }

    const id = String(value).trim();
    return id || null;
  }

  function loadProfiles() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const profiles = saved ? JSON.parse(saved) : [];

      return Array.isArray(profiles) ? profiles : [];
    } catch (error) {
      console.error("RockyX creator profiles could not be loaded:", error);
      return [];
    }
  }

  function saveProfiles(profiles) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));

      window.dispatchEvent(
        new CustomEvent("rockyx:creator-profiles-updated", {
          detail: { count: profiles.length }
        })
      );

      return true;
    } catch (error) {
      console.error("RockyX creator profiles could not be saved:", error);
      return false;
    }
  }

  function cleanText(value, maxLength) {
    if (typeof value !== "string") return "";

    return value.trim().slice(0, maxLength || 500);
  }

  function normalizeLinks(links) {
    if (!Array.isArray(links)) return [];

    return links.slice(0, 10).map(link => {
      if (!link || typeof link !== "object") return null;

      const title = cleanText(link.title, 60);
      const url = cleanText(link.url, 500);

      if (!title || !url) return null;

      try {
        const parsed = new URL(url);

        if (!["http:", "https:"].includes(parsed.protocol)) {
          return null;
        }

        return { title, url: parsed.href };
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
  }

  function createProfile(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        error: "Creator profile details are required."
      };
    }

    const ownerId = normalizeId(details.ownerId);
    const username = cleanText(details.username, 30).replace(/^@/, "");

    if (!ownerId || !username) {
      return {
        success: false,
        error: "A valid owner ID and username are required."
      };
    }

    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      return {
        success: false,
        error: "Username can contain letters, numbers, periods, and underscores."
      };
    }

    const profiles = loadProfiles();

    const duplicateUsername = profiles.some(
      profile => profile.username.toLowerCase() === username.toLowerCase()
    );

    if (duplicateUsername) {
      return {
        success: false,
        error: "That creator username is already in use."
      };
    }

    const existingProfile = profiles.find(
      profile => profile.ownerId === ownerId
    );

    if (existingProfile) {
      return {
        success: false,
        error: "This account already has a creator profile."
      };
    }

    const requestedType = CREATOR_TYPES.includes(details.creatorType)
      ? details.creatorType
      : "social";

    const profile = {
      id: createId(),
      ownerId,
      username,
      displayName: cleanText(details.displayName, 100) || username,
      bio: cleanText(details.bio, 1000),
      profilePicture: cleanText(details.profilePicture, 1000),
      coverImage: cleanText(details.coverImage, 1000),
      creatorType: requestedType,
      category: cleanText(details.category, 80),
      location: cleanText(details.location, 100),
      website: "",
      links: normalizeLinks(details.links),
      verified: false,
      verificationStatus: "not_requested",
      publicProfile: true,
      stats: {
        followers: 0,
        following: 0,
        posts: 0,
        views: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (details.website) {
      try {
        const website = new URL(details.website);

        if (["http:", "https:"].includes(website.protocol)) {
          profile.website = website.href;
        }
      } catch (error) {
        // Ignore invalid optional website values.
      }
    }

    profiles.push(profile);

    if (!saveProfiles(profiles)) {
      return {
        success: false,
        error: "Creator profile could not be saved."
      };
    }

    return {
      success: true,
      profile: { ...profile }
    };
  }

  function getProfile(profileId) {
    const id = normalizeId(profileId);
    if (!id) return null;

    const profile = loadProfiles().find(
      item => item.id === id || item.ownerId === id
    );

    return profile ? JSON.parse(JSON.stringify(profile)) : null;
  }

  function getByUsername(username) {
    const normalized = cleanText(username, 30).replace(/^@/, "").toLowerCase();

    if (!normalized) return null;

    const profile = loadProfiles().find(
      item => item.username.toLowerCase() === normalized
    );

    return profile ? JSON.parse(JSON.stringify(profile)) : null;
  }

  function searchCreators(query, options) {
    const term = cleanText(query, 200).toLowerCase();
    const settings = options || {};

    let profiles = loadProfiles();

    if (settings.publicOnly !== false) {
      profiles = profiles.filter(profile => profile.publicProfile);
    }

    if (term) {
      profiles = profiles.filter(profile => {
        const searchable = [
          profile.username,
          profile.displayName,
          profile.bio,
          profile.category,
          profile.creatorType,
          profile.location
        ].join(" ").toLowerCase();

        return searchable.includes(term);
      });
    }

    if (settings.creatorType) {
      profiles = profiles.filter(
        profile => profile.creatorType === settings.creatorType
      );
    }

    return profiles.map(
      profile => JSON.parse(JSON.stringify(profile))
    );
  }

  function updateProfile(profileId, changes) {
    const id = normalizeId(profileId);

    if (
      !id ||
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes)
    ) {
      return false;
    }

    const allowedFields = [
      "displayName",
      "bio",
      "profilePicture",
      "coverImage",
      "category",
      "location",
      "website",
      "links",
      "publicProfile"
    ];

    const profiles = loadProfiles();

    const profile = profiles.find(
      item => item.id === id || item.ownerId === id
    );

    if (!profile) return false;

    for (const field of allowedFields) {
      if (!Object.prototype.hasOwnProperty.call(changes, field)) {
        continue;
      }

      if (field === "publicProfile") {
        if (typeof changes[field] === "boolean") {
          profile[field] = changes[field];
        }
      } else if (field === "links") {
        profile.links = normalizeLinks(changes.links);
      } else if (field === "website") {
        try {
          const website = new URL(changes.website);

          if (["http:", "https:"].includes(website.protocol)) {
            profile.website = website.href;
          }
        } catch (error) {
          return false;
        }
      } else {
        const limits = {
          displayName: 100,
          bio: 1000,
          profilePicture: 1000,
          coverImage: 1000,
          category: 80,
          location: 100
        };

        profile[field] = cleanText(
          changes[field],
          limits[field]
        );
      }
    }

    profile.updatedAt = new Date().toISOString();

    return saveProfiles(profiles);
  }

  function requestVerification(profileId) {
    const id = normalizeId(profileId);
    if (!id) return false;

    const profiles = loadProfiles();

    const profile = profiles.find(
      item => item.id === id || item.ownerId === id
    );

    if (!profile || profile.verified) return false;

    profile.verificationStatus = "pending";
    profile.updatedAt = new Date().toISOString();

    return saveProfiles(profiles);
  }

  function updateStats(profileId, changes) {
    const id = normalizeId(profileId);

    if (
      !id ||
      !changes ||
      typeof changes !== "object"
    ) {
      return false;
    }

    const allowedStats = [
      "followers",
      "following",
      "posts",
      "views"
    ];

    const profiles = loadProfiles();

    const profile = profiles.find(
      item => item.id === id || item.ownerId === id
    );

    if (!profile) return false;

    for (const stat of allowedStats) {
      if (
        Number.isFinite(changes[stat]) &&
        changes[stat] >= 0
      ) {
        profile.stats[stat] = Math.floor(changes[stat]);
      }
    }

    profile.updatedAt = new Date().toISOString();

    return saveProfiles(profiles);
  }

  function deleteProfile(profileId) {
    const id = normalizeId(profileId);
    if (!id) return false;

    const profiles = loadProfiles();

    const remaining = profiles.filter(
      item => item.id !== id && item.ownerId !== id
    );

    if (remaining.length === profiles.length) {
      return false;
    }

    return saveProfiles(remaining);
  }

  window.RockyXCreatorProfiles = {
    createProfile,
    getProfile,
    getByUsername,
    searchCreators,
    updateProfile,
    requestVerification,
    updateStats,
    deleteProfile,
    getCreatorTypes: () => [...CREATOR_TYPES]
  };

})();