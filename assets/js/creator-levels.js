/* RockyX Creator Levels
   Separate progression tracks for Social and Template Creators.
   Production levels must be verified by the backend.
*/
(function () {
  "use strict";
  const LEVELS = [
    { name: "Starter", minPoints: 0 },
    { name: "Rising", minPoints: 100 },
    { name: "Emerging", minPoints: 300 },
    { name: "Established", minPoints: 700 },
    { name: "Expert", minPoints: 1500 },
    { name: "Elite", minPoints: 3000 },
    { name: "Master", minPoints: 6000 }
  ];
  const STORAGE_KEYS = {
    creator: "rockyx_creator_level_points_v1",
    template: "rockyx_template_creator_level_points_v1"
  };
  function getPoints(track) {
    const key = STORAGE_KEYS[track];
    if (!key) {
      throw new Error(
        'Track must be "creator" or "template".'
      );
    }
    try {
      const value = Number(localStorage.getItem(key) || 0);
      return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch (error) {
      return 0;
    }
  }
  function getLevel(points) {
    let current = LEVELS[0];
    let next = null;
    for (let i = 0; i < LEVELS.length; i += 1) {
      if (points >= LEVELS[i].minPoints) {
        current = LEVELS[i];
      } else {
        next = LEVELS[i];
        break;
      }
    }
    return {
      name: current.name,
      minPoints: current.minPoints,
      nextLevel: next ? next.name : null,
      nextLevelPoints: next ? next.minPoints : null,
      pointsToNext: next ? next.minPoints - points : 0,
      points: points,
      isMaxLevel: next === null
    };
  }
  function getProgress(track) {
    return getLevel(getPoints(track));
  }
  function addPoints(track, amount) {
    if (!STORAGE_KEYS[track]) {
      return {
        success: false,
        message: 'Track must be "creator" or "template".'
      };
    }
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isInteger(amount)
    ) {
      return {
        success: false,
        message: "Points must be a positive whole number."
      };
    }
    const oldProgress = getProgress(track);
    const newPoints = getPoints(track) + amount;
    localStorage.setItem(STORAGE_KEYS[track], String(newPoints));
    const newProgress = getProgress(track);
    const result = {
      success: true,
      track: track,
      pointsAdded: amount,
      progress: newProgress,
      leveledUp: oldProgress.name !== newProgress.name
    };
    window.dispatchEvent(
      new CustomEvent("rockyx:creator-level-updated", {
        detail: result
      })
    );
    return result;
  }
  window.RockyXCreatorLevels = {
    levels: LEVELS,
    getProgress: getProgress,
    addPoints: addPoints
  };
})();