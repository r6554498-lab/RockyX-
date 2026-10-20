/* =====================================================
   ROCKYX ALBUMS & EPs
   Album, mixtape, and tracklist management
   Version 1.0
   Frontend prototype.
   Production releases require a secure backend.
   ===================================================== */
(function () {
  "use strict";
  const STORAGE_KEY = "rockyx_albums_v1";
  const RELEASE_TYPES = [
    "single",
    "ep",
    "album",
    "mixtape"
  ];
  function readAlbums() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }
  function saveAlbums(albums) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(albums)
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
  function create(details) {
    const input = details || {};
    if (!input.artistId) {
      return {
        success: false,
        message: "An artist profile ID is required."
      };
    }
    if (
      typeof input.title !== "string" ||
      !input.title.trim()
    ) {
      return {
        success: false,
        message: "Enter an album or release title."
      };
    }
    const type = RELEASE_TYPES.includes(input.type)
      ? input.type
      : "album";
    const album = {
      id: "rxalbum-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 8),
      artistId: String(input.artistId),
      title: input.title.trim().slice(0, 200),
      type: type,
      description: String(input.description || "")
        .slice(0, 2000),
      artwork: String(input.artwork || ""),
      genre: String(input.genre || "Other"),
      releaseDate: input.releaseDate || null,
      trackIds: [],
      status: input.publishNow === true
        ? "pending_review"
        : "draft",
      createdAt: new Date().toISOString()
    };
    const albums = readAlbums();
    albums.unshift(album);
    if (!saveAlbums(albums)) {
      return {
        success: false,
        message: "Unable to save this release."
      };
    }
    emit("rockyx:album-created", {
      album: album
    });
    return {
      success: true,
      album: album
    };
  }
  function getById(albumId) {
    return readAlbums().find(function (album) {
      return album.id === String(albumId);
    }) || null;
  }
  function getAll(options) {
    const settings = options || {};
    let albums = readAlbums();
    if (settings.artistId) {
      albums = albums.filter(function (album) {
        return album.artistId === String(settings.artistId);
      });
    }
    if (settings.type) {
      albums = albums.filter(function (album) {
        return album.type === settings.type;
      });
    }
    if (settings.status) {
      albums = albums.filter(function (album) {
        return album.status === settings.status;
      });
    }
    if (settings.limit) {
      albums = albums.slice(0, settings.limit);
    }
    return albums;
  }
  function update(albumId, artistId, changes) {
    const albums = readAlbums();
    const album = albums.find(function (item) {
      return (
        item.id === String(albumId) &&
        item.artistId === String(artistId)
      );
    });
    if (!album) {
      return {
        success: false,
        message: "Release not found."
      };
    }
    const allowedFields = [
      "title",
      "description",
      "artwork",
      "genre",
      "releaseDate",
      "type"
    ];
    allowedFields.forEach(function (field) {
      if (
        Object.prototype.hasOwnProperty.call(changes, field)
      ) {
        if (
          field === "type" &&
          !RELEASE_TYPES.includes(changes[field])
        ) {
          return;
        }
        album[field] = changes[field];
      }
    });
    if (!saveAlbums(albums)) {
      return {
        success: false,
        message: "Unable to update this release."
      };
    }
    emit("rockyx:album-updated", {
      album: album
    });
    return {
      success: true,
      album: album
    };
  }
  function addTrack(albumId, artistId, trackId) {
    const albums = readAlbums();
    const album = albums.find(function (item) {
      return (
        item.id === String(albumId) &&
        item.artistId === String(artistId)
      );
    });
    if (!album) {
      return {
        success: false,
        message: "Release not found."
      };
    }
    if (!trackId) {
      return {
        success: false,
        message: "A track ID is required."
      };
    }
    if (album.trackIds.includes(String(trackId))) {
      return {
        success: false,
        message: "This track is already in the release."
      };
    }
    album.trackIds.push(String(trackId));
    if (!saveAlbums(albums)) {
      return {
        success: false,
        message: "Unable to update the tracklist."
      };
    }
    emit("rockyx:album-track-added", {
      albumId: album.id,
      trackId: String(trackId)
    });
    return {
      success: true,
      album: album
    };
  }
  function removeTrack(albumId, artistId, trackId) {
    const albums = readAlbums();
    const album = albums.find(function (item) {
      return (
        item.id === String(albumId) &&
        item.artistId === String(artistId)
      );
    });
    if (!album) {
      return {
        success: false,
        message: "Release not found."
      };
    }
    album.trackIds = album.trackIds.filter(function (id) {
      return id !== String(trackId);
    });
    if (!saveAlbums(albums)) {
      return {
        success: false,
        message: "Unable to update the tracklist."
      };
    }
    emit("rockyx:album-track-removed", {
      albumId: album.id,
      trackId: String(trackId)
    });
    return {
      success: true,
      album: album
    };
  }
  function deleteDraft(albumId, artistId) {
    const albums = readAlbums();
    const album = albums.find(function (item) {
      return (
        item.id === String(albumId) &&
        item.artistId === String(artistId)
      );
    });
    if (!album) {
      return {
        success: false,
        message: "Release not found."
      };
    }
    if (album.status !== "draft") {
      return {
        success: false,
        message: "Only draft releases can be deleted."
      };
    }
    const remaining = albums.filter(function (item) {
      return item.id !== album.id;
    });
    if (!saveAlbums(remaining)) {
      return {
        success: false,
        message: "Unable to delete this release."
      };
    }
    return {
      success: true
    };
  }
  window.RockyXAlbums = {
    releaseTypes: RELEASE_TYPES.slice(),
    create: create,
    getById: getById,
    getAll: getAll,
    update: update,
    addTrack: addTrack,
    removeTrack: removeTrack,
    deleteDraft: deleteDraft
  };
})();