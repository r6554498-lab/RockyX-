/* =========================================
   ROCKYX — VIDEO MODULE
   Handles video playback independently.
   ========================================= */
"use strict";
window.RockyXVideo = (() => {
  const initializedVideos = new WeakSet();
  /**
   * Initialize controls for a video element.
   *
   * Add data-rx-video to a video element
   * when connecting this module to the page.
   */
  function initializeVideo(video) {
    if (!(video instanceof HTMLVideoElement)) return;
    if (initializedVideos.has(video)) return;
    initializedVideos.add(video);
    // Mobile-friendly playback settings.
    video.playsInline = true;
    video.preload = "metadata";
    // Prevent videos from playing with sound
    // automatically when entering the viewport.
    video.muted = true;
    video.addEventListener("click", () => {
      if (video.paused) {
        play(video);
      } else {
        pause(video);
      }
    });
    video.addEventListener("play", () => {
      video.dataset.rxPlaying = "true";
    });
    video.addEventListener("pause", () => {
      video.dataset.rxPlaying = "false";
    });
    video.addEventListener("error", () => {
      console.warn("RockyX: A video could not be loaded.", video.currentSrc);
    });
  }
  /**
   * Attempt to play a video.
   */
  async function play(video) {
    if (!(video instanceof HTMLVideoElement)) return false;
    try {
      await video.play();
      return true;
    } catch (error) {
      console.info(
        "RockyX: Playback requires another user action.",
        error
      );
      return false;
    }
  }
  /**
   * Pause a video.
   */
  function pause(video) {
    if (!(video instanceof HTMLVideoElement)) return;
    video.pause();
  }
  /**
   * Pause all initialized videos except the selected one.
   */
  function pauseOthers(selectedVideo) {
    document.querySelectorAll("video[data-rx-video]").forEach((video) => {
      if (video !== selectedVideo) {
        pause(video);
      }
    });
  }
  /**
   * Automatically play visible videos silently
   * and pause videos that leave the viewport.
   */
  function enableVisibilityPlayback() {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
            pauseOthers(video);
            play(video);
          } else {
            pause(video);
          }
        });
      },
      {
        threshold: [0, 0.25, 0.65, 1]
      }
    );
    document.querySelectorAll("video[data-rx-video]").forEach((video) => {
      observer.observe(video);
    });
  }
  /**
   * Initialize every marked video on the page.
   */
  function init() {
    const videos = document.querySelectorAll("video[data-rx-video]");
    videos.forEach(initializeVideo);
    enableVisibilityPlayback();
    console.info(`RockyX Video: initialized ${videos.length} video(s).`);
  }
  return {
    init,
    play,
    pause,
    pauseOthers
  };
})();