/*
 * RockyX Admin Notifications
 *
 * Local prototype for managing platform announcements.
 *
 * IMPORTANT:
 * This module does not send real notifications.
 * Production announcements, scheduling, and audience
 * targeting must be authorized and processed by a backend.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_admin_announcements";
  const AUDIT_KEY = "rockyx_admin_notifications_audit";

  const STATUSES = [
    "draft",
    "scheduled",
    "published",
    "paused",
    "cancelled"
  ];

  const AUDIENCES = [
    "everyone",
    "buyers",
    "sellers",
    "creators",
    "template_creators",
    "artists",
    "subscribers"
  ];

  function readStorage(key) {
    try {
      return JSON.parse(
        localStorage.getItem(key) || "[]"
      );
    } catch (error) {
      console.error(
        "RockyX admin notifications storage error:",
        error
      );
      return [];
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(
        "RockyX admin notifications save error:",
        error
      );
      return false;
    }
  }

  function createId(prefix) {
    return prefix + "_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function recordAction(action, details) {
    const audit = readStorage(AUDIT_KEY);

    audit.push({
      id: createId("admin_notification_audit"),
      action: action,
      details: details || {},
      createdAt: new Date().toISOString(),
      note: "Local prototype audit entry; not tamper-proof."
    });

    return saveStorage(AUDIT_KEY, audit);
  }

  function validateAnnouncement(details) {
    if (!details || typeof details !== "object") {
      return "Announcement details are required.";
    }

    if (
      typeof details.title !== "string" ||
      !details.title.trim()
    ) {
      return "An announcement title is required.";
    }

    if (details.title.trim().length > 120) {
      return "The title cannot exceed 120 characters.";
    }

    if (
      typeof details.message !== "string" ||
      !details.message.trim()
    ) {
      return "An announcement message is required.";
    }

    if (details.message.trim().length > 5000) {
      return "The message cannot exceed 5000 characters.";
    }

    if (!AUDIENCES.includes(details.audience)) {
      return "Choose a supported audience.";
    }

    if (
      details.scheduledAt &&
      Number.isNaN(new Date(details.scheduledAt).getTime())
    ) {
      return "The scheduled date is invalid.";
    }

    return null;
  }

  /*
   * Create an announcement draft or scheduled announcement.
   * This does not deliver the announcement to users.
   */
  function createAnnouncement(details) {
    const error = validateAnnouncement(details);

    if (error) {
      return {
        success: false,
        message: error
      };
    }

    const announcements = readStorage(STORAGE_KEY);

    const requestedStatus =
      details.status === "scheduled" &&
      details.scheduledAt
        ? "scheduled"
        : "draft";

    const announcement = {
      id: createId("announcement"),
      title: details.title.trim(),
      message: details.message.trim(),
      audience: details.audience,
      channel: details.channel || "in_app",
      status: requestedStatus,
      scheduledAt: details.scheduledAt || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null,
      createdBy: details.createdBy || null,
      note: "Local announcement record. No notification has been sent."
    };

    announcements.push(announcement);

    if (!saveStorage(STORAGE_KEY, announcements)) {
      return {
        success: false,
        message: "Could not save the announcement."
      };
    }

    recordAction("announcement_created", {
      announcementId: announcement.id,
      status: announcement.status,
      audience: announcement.audience
    });

    return {
      success: true,
      announcement: announcement,
      message: "Announcement saved locally."
    };
  }

  function getAnnouncement(announcementId) {
    return readStorage(STORAGE_KEY).find(
      function (announcement) {
        return announcement.id === announcementId;
      }
    ) || null;
  }

  function getAnnouncements(filters) {
    const options = filters || {};

    return readStorage(STORAGE_KEY).filter(
      function (announcement) {
        if (
          options.status &&
          announcement.status !== options.status
        ) {
          return false;
        }

        if (
          options.audience &&
          announcement.audience !== options.audience
        ) {
          return false;
        }

        return true;
      }
    );
  }

  /*
   * Update announcement content.
   * This prototype does not enforce admin permissions.
   */
  function updateAnnouncement(announcementId, changes) {
    if (
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes)
    ) {
      return {
        success: false,
        message: "Announcement changes are required."
      };
    }

    const announcements = readStorage(STORAGE_KEY);

    const index = announcements.findIndex(
      function (announcement) {
        return announcement.id === announcementId;
      }
    );

    if (index === -1) {
      return {
        success: false,
        message: "Announcement not found."
      };
    }

    const current = announcements[index];

    if (
      current.status === "published" ||
      current.status === "cancelled"
    ) {
      return {
        success: false,
        message: "Published or cancelled announcements cannot be edited."
      };
    }

    const updated = Object.assign({}, current);

    const editableFields = [
      "title",
      "message",
      "audience",
      "channel",
      "scheduledAt"
    ];

    editableFields.forEach(function (key) {
      if (
        Object.prototype.hasOwnProperty.call(changes, key)
      ) {
        updated[key] = changes[key];
      }
    });

    const error = validateAnnouncement(updated);

    if (error) {
      return {
        success: false,
        message: error
      };
    }

    updated.updatedAt = new Date().toISOString();

    announcements[index] = updated