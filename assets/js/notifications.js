/* RockyX Notifications
   Frontend foundation.
   Real-time and cross-device notifications require a backend.
*/
(function () {
  "use strict";
  const STORAGE_KEY = "rockyx_notifications_v1";
  const MAX_NOTIFICATIONS = 200;
  function loadNotifications() {
    try {
      const items = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      return Array.isArray(items) ? items : [];
    } catch (error) {
      return [];
    }
  }
  function saveNotifications(items) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_NOTIFICATIONS))
    );
  }
  function create(notification) {
    if (
      !notification ||
      typeof notification.title !== "string" ||
      !notification.title.trim()
    ) {
      return {
        success: false,
        message: "A notification title is required."
      };
    }
    const item = {
      id: "rx-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 9),
      type: notification.type || "general",
      title: notification.title.trim().slice(0, 120),
      message: String(notification.message || "").slice(0, 500),
      link: typeof notification.link === "string"
        ? notification.link
        : "",
      createdAt: new Date().toISOString(),
      read: false
    };
    const items = loadNotifications();
    items.unshift(item);
    saveNotifications(items);
    window.dispatchEvent(
      new CustomEvent("rockyx:notification-created", {
        detail: item
      })
    );
    return {
      success: true,
      notification: item
    };
  }
  function getAll(options) {
    const settings = options || {};
    let items = loadNotifications();
    if (settings.unreadOnly) {
      items = items.filter(function (item) {
        return !item.read;
      });
    }
    return items;
  }
  function getUnreadCount() {
    return loadNotifications().filter(function (item) {
      return !item.read;
    }).length;
  }
  function markRead(id) {
    const items = loadNotifications();
    const item = items.find(function (entry) {
      return entry.id === id;
    });
    if (!item) {
      return {
        success: false,
        message: "Notification not found."
      };
    }
    item.read = true;
    saveNotifications(items);
    window.dispatchEvent(
      new CustomEvent("rockyx:notifications-updated", {
        detail: {
          unreadCount: getUnreadCount()
        }
      })
    );
    return {
      success: true,
      notification: item
    };
  }
  function markAllRead() {
    const items = loadNotifications().map(function (item) {
      return {
        ...item,
        read: true
      };
    });
    saveNotifications(items);
    window.dispatchEvent(
      new CustomEvent("rockyx:notifications-updated", {
        detail: {
          unreadCount: 0
        }
      })
    );
    return {
      success: true,
      unreadCount: 0
    };
  }
  function remove(id) {
    const items = loadNotifications();
    const remaining = items.filter(function (item) {
      return item.id !== id;
    });
    if (remaining.length === items.length) {
      return {
        success: false,
        message: "Notification not found."
      };
    }
    saveNotifications(remaining);
    window.dispatchEvent(
      new CustomEvent("rockyx:notifications-updated", {
        detail: {
          unreadCount: getUnreadCount()
        }
      })
    );
    return {
      success: true
    };
  }
  window.RockyXNotifications = {
    create: create,
    getAll: getAll,
    getUnreadCount: getUnreadCount,
    markRead: markRead,
    markAllRead: markAllRead,
    remove: remove
  };
})();