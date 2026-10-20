/* =========================================
   ROCKYX NOTIFICATION CENTER
   Local notification management foundation
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_notification_center";
  const PREFERENCES_KEY = "rockyx_notification_preferences";
  const MAX_NOTIFICATIONS = 500;

  const CATEGORIES = [
    "social",
    "messages",
    "livestreams",
    "music",
    "marketplace",
    "studio",
    "creator_rewards",
    "subscriptions",
    "system"
  ];

  const DEFAULT_PREFERENCES = {
    social: true,
    messages: true,
    livestreams: true,
    music: true,
    marketplace: true,
    studio: true,
    creator_rewards: true,
    subscriptions: true,
    system: true
  };

  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return "notification-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 10);
  }

  function normalizeId(value) {
    if (typeof value !== "string" && typeof value !== "number") {
      return null;
    }

    const id = String(value).trim();
    return id || null;
  }

  function cleanText(value, limit) {
    if (typeof value !== "string") return "";

    return value.trim().slice(0, limit || 500);
  }

  function loadNotifications() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const data = saved ? JSON.parse(saved) : [];

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(
        "RockyX notifications could not be loaded:",
        error
      );

      return [];
    }
  }

  function saveNotifications(notifications) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(notifications)
      );

      window.dispatchEvent(
        new CustomEvent("rockyx:notification-center-updated", {
          detail: {
            total: notifications.length,
            unread: notifications.filter(item => !item.read).length
          }
        })
      );

      return true;
    } catch (error) {
      console.error(
        "RockyX notifications could not be saved:",
        error
      );

      return false;
    }
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      const data = saved ? JSON.parse(saved) : {};

      return {
        ...DEFAULT_PREFERENCES,
        ...(data && typeof data === "object" ? data : {})
      };
    } catch (error) {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  function savePreferences(preferences) {
    try {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify(preferences)
      );

      window.dispatchEvent(
        new CustomEvent("rockyx:notification-preferences-updated", {
          detail: { ...preferences }
        })
      );

      return true;
    } catch (error) {
      console.error(
        "RockyX notification preferences could not be saved:",
        error
      );

      return false;
    }
  }

  function createNotification(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        error: "Notification details are required."
      };
    }

    const userId = normalizeId(details.userId);
    const category = details.category;
    const title = cleanText(details.title, 150);
    const message = cleanText(details.message, 1000);

    if (!userId) {
      return {
        success: false,
        error: "A valid recipient ID is required."
      };
    }

    if (!CATEGORIES.includes(category)) {
      return {
        success: false,
        error: "Unsupported notification category."
      };
    }

    if (!title || !message) {
      return {
        success: false,
        error: "A notification title and message are required."
      };
    }

    const preferences = loadPreferences();

    if (preferences[category] === false) {
      return {
        success: true,
        skipped: true,
        reason: "This notification category is disabled."
      };
    }

    const notification = {
      id: createId(),
      userId,
      category,
      type: cleanText(details.type, 60) || category,
      title,
      message,
      actorId: normalizeId(details.actorId),
      targetType: cleanText(details.targetType, 60),
      targetId: normalizeId(details.targetId),
      link: safeInternalLink(details.link),
      read: false,
      createdAt: new Date().toISOString()
    };

    const notifications = loadNotifications();

    notifications.unshift(notification);

    if (notifications.length > MAX_NOTIFICATIONS) {
      notifications.length = MAX_NOTIFICATIONS;
    }

    if (!saveNotifications(notifications)) {
      return {
        success: false,
        error: "The notification could not be saved."
      };
    }

    window.dispatchEvent(
      new CustomEvent("rockyx:notification-created", {
        detail: { ...notification }
      })
    );

    return {
      success: true,
      notification: { ...notification }
    };
  }

  function safeInternalLink(link) {
    if (typeof link !== "string" || !link.trim()) {
      return "";
    }

    const value = link.trim();

    // Only allow relative app paths, not external URLs or script URLs.
    if (
      !value.startsWith("/") ||
      value.startsWith("//") ||
      value.startsWith("/\\")
    ) {
      return "";
    }

    return value.slice(0, 1000);
  }

  function getNotifications(userId, options) {
    const id = normalizeId(userId);
    if (!id) return [];

    const settings = options || {};
    let notifications = loadNotifications().filter(
      item => item.userId === id
    );

    if (settings.unreadOnly === true) {
      notifications = notifications.filter(item => !item.read);
    }

    if (settings.category) {
      notifications = notifications.filter(
        item => item.category === settings.category
      );
    }

    const limit = Number.isInteger(settings.limit)
      ? Math.max(1, Math.min(settings.limit, MAX_NOTIFICATIONS))
      : 100;

    return notifications
      .slice(0, limit)
      .map(item => ({ ...item }));
  }

  function markAsRead(notificationId, userId) {
    const id = normalizeId(notificationId);
    const ownerId = normalizeId(userId);

    if (!id || !ownerId) return false;

    const notifications = loadNotifications();

    const notification = notifications.find(
      item => item.id === id && item.userId === ownerId
    );

    if (!notification) return false;

    notification.read = true;
    notification.readAt = new Date().toISOString();

    return saveNotifications(notifications);
  }

  function markAllAsRead(userId) {
    const id = normalizeId(userId);
    if (!id) return false;

    const notifications = loadNotifications();

    let changed = false;

    notifications.forEach(notification => {
      if (notification.userId === id && !notification.read) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        changed = true;
      }
    });

    return changed ? saveNotifications(notifications) : true;
  }

  function deleteNotification(notificationId, userId) {
    const id = normalizeId(notificationId);
    const ownerId = normalizeId(userId);

    if (!id || !ownerId) return false;

    const notifications = loadNotifications();
    const filtered = notifications.filter(
      item => !(item.id === id && item.userId === ownerId)
    );

    if (filtered.length === notifications.length) {
      return false;
    }

    return saveNotifications(filtered);
  }

  function clearNotifications(userId) {
    const id = normalizeId(userId);
    if (!id) return false;

    const notifications = loadNotifications();
    const filtered = notifications.filter(
      item => item.userId !== id
    );

    return saveNotifications(filtered);
  }

  function getUnreadCount(userId) {
    const id = normalizeId(userId);
    if (!id) return 0;

    return loadNotifications().filter(
      item => item.userId === id && !item.read
    ).length;
  }

  function updatePreferences(changes) {
    if (
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes)
    ) {
      return false;
    }

    const preferences = loadPreferences();

    CATEGORIES.forEach(category => {
      if (typeof changes[category] === "boolean") {
        preferences[category] = changes[category];
      }
    });

    return savePreferences(preferences);
  }

  function getPreferences() {
    return { ...loadPreferences() };
  }

  function getCategories() {
    return [...CATEGORIES];
  }

  window.RockyXNotificationCenter = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
    getUnreadCount,
    updatePreferences,
    getPreferences,
    getCategories
  };

})();