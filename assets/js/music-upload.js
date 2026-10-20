/* =====================================================
   ROCKYX MUSIC UPLOADS
   Artist upload and release-management foundation
   Version 1.0
   Prototype only:
   - Files are selected in the browser.
   - Metadata is stored locally.
   - Real uploads require backend storage.
   ===================================================== */
(function () {
  "use strict";
  const RELEASES_KEY = "rockyx_music_releases_v1";
  const MAX_AUDIO_SIZE = 100 * 1024 * 1024;
  const MAX_ARTWORK_SIZE = 10 * 1024 * 1024;
  const AUDIO_TYPES = [
    "audio/mpeg",
    "audio/mp4",
    "audio/aac",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "audio/flac",
    "audio/webm"
  ];
  const IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];
  function readReleases() {
    try {
      const value = JSON.parse(
        localStorage.getItem(RELEASES_KEY) || "[]"
      );
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }
  function saveReleases(releases) {
    try {
      localStorage.setItem(
        RELEASES_KEY,
        JSON.stringify(releases)
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
  function validateAudio(file) {
    if (!file) {
      return {
        success: false,
        message: "Select an audio file."
      };
    }
    if (file.size > MAX_AUDIO_SIZE) {
      return {
        success: false,
        message: "Audio files must be 100 MB or smaller."
      };
    }
    if (
      file.type &&
      !AUDIO_TYPES.includes(file.type)
    ) {
      return {
        success: false,
        message: "This audio format is not supported."
      };
    }
    return {
      success: true
    };
  }
  function validateArtwork(file) {
    if (!file) {
      return {
        success: true
      };
    }
    if (file.size > MAX_ARTWORK_SIZE) {
      return {
        success: false,
        message: "Artwork must be 10 MB or smaller."
      };
    }
    if (
      file.type &&
      !IMAGE_TYPES.includes(file.type)
    ) {
      return {
        success: false,
        message: "Artwork must be JPG, PNG, or WebP."
      };
    }
    return {
      success: true
    };
  }
  /*
   * Prepare a release draft.
   *
   * The selected audio file is not uploaded.
   * The file is held in memory until the page closes.
   */
  let selectedAudio = null;
  let selectedArtwork = null;
  function selectAudio(file) {
    const result = validateAudio(file);
    if (!result.success) {
      return result;
    }
    selectedAudio = file;
    emit("rockyx:music-audio-selected", {
      name: file.name,
      size: file.size,
      type: file.type
    });
    return {
      success: true,
      name: file.name,
      size: file.size,
      type: file.type
    };
  }
  function selectArtwork(file) {
    const result = validateArtwork(file);
    if (!result.success) {
      return result;
    }
    selectedArtwork = file || null;
    emit("rockyx:music-artwork-selected", {
      name: file ? file.name : "",
      size: file ? file.size : 0
    });
    return {
      success: true,
      name: file ? file.name : ""
    };
  }
  function createRelease(details) {
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
        message: "Enter a release title."
      };
    }
    if (!selectedAudio) {
      return {
        success: false,
        message: "Select an audio file first."
      };
    }
    const audioCheck = validateAudio(selectedAudio);
    if (!audioCheck.success) {
      return audioCheck;
    }
    const artworkCheck = validateArtwork(selectedArtwork);
    if (!artworkCheck.success) {
      return artworkCheck;
    }
    const releases = readReleases();
    const release = {
      id: "rxrelease-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 8),
      artistId: String(input.artistId),
      title: input.title.trim().slice(0, 200),
      description: String(input.description || "")
        .slice(0, 2000),
      type: ["single", "ep", "album", "mixtape"]
        .includes(input.type)
        ? input.type
        : "single",
      genre: String(input.genre || "Other"),
      releaseDate: input.releaseDate || null,
      audioFileName: selectedAudio.name,
      audioFileSize: selectedAudio.size,
      audioFileType: selectedAudio.type,
      artworkFileName: selectedArtwork
        ? selectedArtwork.name
        : "",
      status: input.publishNow === true
        ? "pending_review"
        : "draft",
      createdAt: new Date().toISOString()
    };
    releases.unshift(release);
    if (!saveReleases(releases)) {
      return {
        success: false,
        message: "Unable to save the release details."
      };
    }
    emit("rockyx:music-release-created", {
      release: release
    });
    return {
      success: true,
      release: release,
      message: release.status === "draft"
        ? "Release draft saved locally."
        : "Release submitted locally for review."
    };
  }
  function getReleases(artistId) {
    const releases = readReleases();
    if (!artistId) {
      return releases;
    }
    return releases.filter(function (release) {
      return release.artistId === String(artistId);
    });
  }
  function deleteDraft(releaseId, artistId) {
    const releases = readReleases();
    const release = releases.find(function (item) {
      return (
        item.id === String(releaseId) &&
        item.artistId === String(artistId)
      );
    });
    if (!release) {
      return {
        success: false,
        message: "Release not found."
      };
    }
    if (release.status !== "draft") {
      return {
        success: false,
        message: "Only drafts can be deleted using this method."
      };
    }
    const remaining = releases.filter(function (item) {
      return item.id !== release.id;
    });
    if (!saveReleases(remaining)) {
      return {
        success: false,
        message: "Unable to delete the draft."
      };
    }
    return {
      success: true
    };
  }
  function getSelectedFiles() {
    return {
      audio: selectedAudio
        ? {
            name: selectedAudio.name,
            size: selectedAudio.size,
            type: selectedAudio.type
          }
        : null,
      artwork: selectedArtwork
        ? {
            name: selectedArtwork.name,
            size: selectedArtwork.size,
            type: selectedArtwork.type
          }
        : null
    };
  }
  window.RockyXMusicUpload = {
    selectAudio: selectAudio,
    selectArtwork: selectArtwork,
    getSelectedFiles: getSelectedFiles,
    createRelease: createRelease,
    getReleases: getReleases,
    deleteDraft: deleteDraft
  };
})();