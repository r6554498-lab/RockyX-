/* =====================================================
   ROCKYX ARTISTS
   Artist profiles and following foundation
   Version 1.0
   Frontend prototype.
   Real accounts, verification and follower counts
   require a secure backend.
   ===================================================== */
(function () {
  "use strict";
  const ARTISTS_KEY = "rockyx_artists_v1";
  const FOLLOWS_KEY = "rockyx_artist_follows_v1";
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
  function emit(name, detail) {
    window.dispatchEvent(
      new CustomEvent(name, {
        detail: detail || {}
      })
    );
  }
  function getArtists() {
    const artists = readStorage(ARTISTS_KEY, []);
    return Array.isArray(artists) ? artists : [];
  }
  function getArtist(artistId) {
    return getArtists().find(function (artist) {
      return artist.id === String(artistId);
    }) || null;
  }
  function createProfile(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "Artist profile details are required."
      };
    }
    if (
      !details.ownerId ||
      typeof details.name !== "string" ||
      !details.name.trim()
    ) {
      return {
        success: false,
        message: "An owner ID and artist name are required."
      };
    }
    const artists = getArtists();
    const existing = artists.find(function (artist) {
      return artist.ownerId === String(details.ownerId);
    });
    if (existing) {
      return {
        success: false,
        message: "This account already has an artist profile.",
        artist: existing
      };
    }
    const artist = {
      id: "rxartist-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 8),
      ownerId: String(details.ownerId),
      name: details.name.trim().slice(0, 150),
      username: String(details.username || "")
        .trim()
        .replace(/^@/, "")
        .slice(0, 40),
      bio: String(details.bio || "").slice(0, 2000),
      profileImage: String(details.profileImage || ""),
      coverImage: String(details.coverImage || ""),
      location: String(details.location || "").slice(0, 150),
      genres: Array.isArray(details.genres)
        ? details.genres.slice(0, 20)
        : [],
      website: String(details.website || ""),
      socialLinks: details.socialLinks || {},
      verified: false,
      verificationStatus: "not_requested",
      followers: 0,
      createdAt: new Date().toISOString()
    };
    artists.unshift(artist);
    if (!writeStorage(ARTISTS_KEY, artists)) {
      return {
        success: false,
        message: "Unable to save the artist profile."
      };
    }
    emit("rockyx:artist-profile-created", {
      artist: artist
    });
    return {
      success: true,
      artist: artist
    };
  }
  function updateProfile(artistId, ownerId, changes) {
    const artists = getArtists();
    const artist = artists.find(function (item) {
      return (
        item.id === String(artistId) &&
        item.ownerId === String(ownerId)
      );
    });
    if (!artist) {
      return {
        success: false,
        message: "Artist profile not found."
      };
    }
    const allowedFields = [
      "name",
      "username",
      "bio",
      "profileImage",
      "coverImage",
      "location",
      "genres",
      "website",
      "socialLinks"
    ];
    allowedFields.forEach(function (field) {
      if (
        Object.prototype.hasOwnProperty.call(changes, field)
      ) {
        artist[field] = changes[field];
      }
    });
    if (!writeStorage(ARTISTS_KEY, artists)) {
      return {
        success: false,
        message: "Unable to save profile changes."
      };
    }
    emit("rockyx:artist-profile-updated", {
      artist: artist
    });
    return {
      success: true,
      artist: artist
    };
  }
  function searchArtists(query) {
    const term = String(query || "").trim().toLowerCase();
    if (!term) {
      return getArtists();
    }
    return getArtists().filter(function (artist) {
      return [
        artist.name,
        artist.username,
        artist.bio,
        artist.location
      ].some(function (value) {
        return String(value || "").toLowerCase().includes(term);
      });
    });
  }
  function getFollowedArtists(ownerId) {
    const follows = readStorage(FOLLOWS_KEY, {});
    const ids = Array.isArray(follows[String(ownerId)])
      ? follows[String(ownerId)]
      : [];
    return ids.map(getArtist).filter(Boolean);
  }
  function isFollowing(ownerId, artistId) {
    const follows = readStorage(FOLLOWS_KEY, {});
    const ids = follows[String(ownerId)] || [];
    return ids.includes(String(artistId));
  }
  function toggleFollow(ownerId, artistId) {
    if (!ownerId || !artistId) {
      return {
        success: false,
        message: "Account and artist IDs are required."
      };
    }
    const artist = getArtist(artistId);
    if (!artist) {
      return {
        success: false,
        message: "Artist not found."
      };
    }
    if (String(ownerId) === artist.ownerId) {
      return {
        success: false,
        message: "You cannot follow your own artist profile."
      };
    }
    const follows = readStorage(FOLLOWS_KEY, {});
    const key = String(ownerId);
    if (!Array.isArray(follows[key])) {
      follows[key] = [];
    }
    const index = follows[key].indexOf(String(artistId));
    let following;
    if (index >= 0) {
      follows[key].splice(index, 1);
      following = false;
    } else {
      follows[key].push(String(artistId));
      following = true;
    }
    if (!writeStorage(FOLLOWS_KEY, follows)) {
      return {
        success: false,
        message: "Unable to save follow status."
      };
    }
    emit("rockyx:artist-follow-updated", {
      ownerId: String(ownerId),
      artistId: String(artistId),
      following: following
    });
    return {
      success: true,
      following: following
    };
  }
  function requestVerification(artistId, ownerId) {
    const artists = getArtists();
    const artist = artists.find(function (item) {
      return (
        item.id === String(artistId) &&
        item.ownerId === String(ownerId)
      );
    });
    if (!artist) {
      return {
        success: false,
        message: "Artist profile not found."
      };
    }
    if (artist.verified) {
      return {
        success: false,
        message: "This artist is already verified."
      };
    }
    if (artist.verificationStatus === "pending") {
      return {
        success: false,
        message: "Verification is already pending."
      };
    }
    artist.verificationStatus = "pending";
    if (!writeStorage(ARTISTS_KEY, artists)) {
      return {
        success: false,
        message: "Unable to save verification request."
      };
    }
    emit("rockyx:artist-verification-requested", {
      artistId: artist.id
    });
    return {
      success: true,
      status: "pending",
      message: "Prototype request recorded. Admin review is not connected."
    };
  }
  window.RockyXArtists = {
    getArtists: getArtists,
    getArtist: getArtist,
    createProfile: createProfile,
    updateProfile: updateProfile,
    searchArtists: searchArtists,
    getFollowedArtists: getFollowedArtists,
    isFollowing: isFollowing,
    toggleFollow: toggleFollow,
    requestVerification: requestVerification
  };
})();