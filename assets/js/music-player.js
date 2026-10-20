/* =====================================================
   ROCKYX MUSIC PLAYER
   Playback controls and queue management
   Version 1.0
   Requires:
   assets/js/music.js
   This module prepares real audio playback using the
   browser Audio API. Audio URLs must be accessible and
   legally authorized for streaming.
   ===================================================== */
(function () {
  "use strict";
  const audio = new Audio();
  audio.preload = "metadata";
  let currentTrack = null;
  let queue = [];
  let queueIndex = -1;
  let shuffle = false;
  let repeat = "off";
  let volume = 0.8;
  audio.volume = volume;
  function emit(name, detail) {
    window.dispatchEvent(
      new CustomEvent(name, {
        detail: detail || {}
      })
    );
  }
  function getState() {
    return {
      currentTrack: currentTrack,
      isPlaying: !audio.paused && !audio.ended,
      currentTime: audio.currentTime || 0,
      duration: Number.isFinite(audio.duration)
        ? audio.duration
        : 0,
      volume: audio.volume,
      muted: audio.muted,
      shuffle: shuffle,
      repeat: repeat,
      queue: queue.slice(),
      queueIndex: queueIndex,
      source: audio.currentSrc || ""
    };
  }
  function notifyState() {
    emit("rockyx:player-state-changed", getState());
  }
  function loadTrack(track, autoplay) {
    if (!track || !track.audioUrl) {
      return {
        success: false,
        message: "This track has no playable audio URL."
      };
    }
    currentTrack = track;
    audio.src = track.audioUrl;
    audio.load();
    emit("rockyx:player-track-changed", {
      track: currentTrack
    });
    if (autoplay !== false) {
      return play();
    }
    notifyState();
    return {
      success: true,
      track: currentTrack,
      isPlaying: false
    };
  }
  async function play() {
    if (!audio.src) {
      return {
        success: false,
        message: "Select a track with a playable audio URL first."
      };
    }
    try {
      await audio.play();
      emit("rockyx:player-playing", {
        track: currentTrack
      });
      notifyState();
      return {
        success: true,
        track: currentTrack
      };
    } catch (error) {
      emit("rockyx:player-error", {
        message: error.message
      });
      return {
        success: false,
        message: "Playback failed. Check the audio URL and try again."
      };
    }
  }
  function pause() {
    audio.pause();
    emit("rockyx:player-paused", {
      track: currentTrack
    });
    notifyState();
    return {
      success: true
    };
  }
  function togglePlay() {
    return audio.paused ? play() : Promise.resolve(pause());
  }
  function setQueue(tracks, startIndex) {
    if (!Array.isArray(tracks)) {
      return {
        success: false,
        message: "The queue must be a list of tracks."
      };
    }
    queue = tracks.filter(function (track) {
      return track && track.id && track.audioUrl;
    });
    if (!queue.length) {
      queueIndex = -1;
      return {
        success: false,
        message: "No playable tracks were provided."
      };
    }
    const requestedIndex = Number.isInteger(startIndex)
      ? startIndex
      : 0;
    queueIndex = Math.max(
      0,
      Math.min(requestedIndex, queue.length - 1)
    );
    return loadTrack(queue[queueIndex], true);
  }
  function playNext() {
    if (!queue.length) {
      return {
        success: false,
        message: "The queue is empty."
      };
    }
    if (shuffle && queue.length > 1) {
      let nextIndex = queueIndex;
      while (nextIndex === queueIndex) {
        nextIndex = Math.floor(Math.random() * queue.length);
      }
      queueIndex = nextIndex;
    } else if (queueIndex < queue.length - 1) {
      queueIndex += 1;
    } else if (repeat === "all") {
      queueIndex = 0;
    } else {
      pause();
      return {
        success: false,
        message: "You have reached the end of the queue."
      };
    }
    return loadTrack(queue[queueIndex], true);
  }
  function playPrevious() {
    if (!queue.length) {
      return {
        success: false,
        message: "The queue is empty."
      };
    }
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      notifyState();
      return {
        success: true,
        message: "Restarted the current track."
      };
    }
    if (queueIndex > 0) {
      queueIndex -= 1;
    } else if (repeat === "all") {
      queueIndex = queue.length - 1;
    } else {
      audio.currentTime = 0;
      notifyState();
      return {
        success: true,
        message: "Restarted the current track."
      };
    }
    return loadTrack(queue[queueIndex], true);
  }
  function seek(seconds) {
    const target = Number(seconds);
    if (!Number.isFinite(target) ||
        !Number.isFinite(audio.duration)) {
      return {
        success: false,
        message: "The playback position is not available."
      };
    }
    audio.currentTime = Math.max(
      0,
      Math.min(target, audio.duration)
    );
    notifyState();
    return {
      success: true,
      currentTime: audio.currentTime
    };
  }
  function setVolume(value) {
    const nextVolume = Number(value);
    if (!Number.isFinite(nextVolume)) {
      return {
        success: false,
        message: "Volume must be a number between 0 and 1."
      };
    }
    volume = Math.max(0, Math.min(1, nextVolume));
    audio.volume = volume;
    if (volume > 0) {
      audio.muted = false;
    }
    notifyState();
    return {
      success: true,
      volume: audio.volume
    };
  }
  function toggleMute() {
    audio.muted = !audio.muted;
    notifyState();
    return {
      success: true,
      muted: audio.muted
    };
  }
  function setShuffle(enabled) {
    shuffle = Boolean(enabled);
    notifyState();
    return {
      success: true,
      shuffle: shuffle
    };
  }
  function setRepeat(mode) {
    if (!["off", "one", "all"].includes(mode)) {
      return {
        success: false,
        message: 'Repeat must be "off", "one", or "all".'
      };
    }
    repeat = mode;
    notifyState();
    return {
      success: true,
      repeat: repeat
    };
  }
  audio.addEventListener("timeupdate", function () {
    emit("rockyx:player-time-update", {
      currentTime: audio.currentTime || 0,
      duration: Number.isFinite(audio.duration)
        ? audio.duration
        : 0
    });
  });
  audio.addEventListener("loadedmetadata", notifyState);
  audio.addEventListener("play", notifyState);
  audio.addEventListener("pause", notifyState);
  audio.addEventListener("ended", function () {
    if (repeat === "one") {
      audio.currentTime = 0;
      play();
      return;
    }
    playNext();
  });
  audio.addEventListener("error", function () {
    emit("rockyx:player-error", {
      message: "The audio file could not be loaded."
    });
  });
  window.RockyXMusicPlayer = {
    loadTrack: loadTrack,
    play: play,
    pause: pause,
    togglePlay: togglePlay,
    setQueue: setQueue,
    next: playNext,
    previous: playPrevious,
    seek: seek,
    setVolume: setVolume,
    toggleMute: toggleMute,
    setShuffle: setShuffle,
    setRepeat: setRepeat,
    getState: getState
  };
  /*
   * Connect playback requests from music.js.
   */
  window.addEventListener(
    "rockyx:music-play-requested",
    function (event) {
      const track = event.detail && event.detail.track;
      if (track) {
        loadTrack(track, true);
      }
    }
  );
  /*
   * Keep pause requests from music.js connected.
   */
  window.addEventListener(
    "rockyx:music-pause-requested",
    pause
  );
})();