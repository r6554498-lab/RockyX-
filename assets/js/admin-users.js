/*
 * RockyX Admin Users
 *
 * Local prototype for administrative user management.
 *
 * IMPORTANT:
 * This module stores demo records in the current browser.
 * It does not access real user accounts or authenticate admins.
 * Real suspensions, verification, and account restrictions
 * must be enforced by a secure backend.
 */

(function () {
  "use strict";

  const USERS_KEY = "rockyx_admin_user_records";
  const AUDIT_KEY = "rockyx_admin_users_audit";

  const STATUSES = [
    "active",
    "restricted",
    "suspended",
    "banned",
    "pending_review"
  ];

  const VERIFICATION_STATUSES = [
    "not_submitted",
    "pending",
    "approved",
    "rejected"
  ];

  const RESTRICTION_TYPES = [
    "none",
    "posting",
    "commenting",
    "messaging",
    "livestreaming",
    "marketplace",
    "all_activity"
  ];

  function readStorage(key) {
    try {
      const value = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error(
        "RockyX admin users: storage read failed.",
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
        "RockyX admin users: storage save failed.",
        error
      );

      return false;
    }
  }

  function createId(prefix) {
    return prefix + "_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function normalizeText(value, maxLength) {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim().slice(0, maxLength);
  }

  function recordAudit(action, details) {
    const entries = readStorage(AUDIT_KEY);

    entries.push({
      id: createId("user_audit"),
      action: action,
      details: details || {},
      createdAt: new Date().toISOString(),
      note: "Local demo log; not secure or tamper-proof."
    });

    return saveStorage(AUDIT_KEY, entries);
  }

  function findUserIndex(users, userId) {
    return users.findIndex(function (user) {
      return user.id === userId;
    });
  }

  function createUserRecord(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "User record details are required."
      };
    }

    const username = normalizeText(
      details.username,
      40
    );

    if (!username) {
      return {
        success: false,
        message: "A username is required."
      };
    }

    const users = readStorage(USERS_KEY);

    const duplicate = users.some(function (user) {
      return user.username.toLowerCase() ===
        username.toLowerCase();
    });

    if (duplicate) {
      return {
        success: false,
        message: "That username already exists in these demo records."
      };
    }

    const user = {
      id: createId("admin_user"),
      username: username,
      displayName: normalizeText(
        details.displayName || username,
        100
      ),
      email: normalizeText(details.email, 254),
      country: normalizeText(details.country, 100),
      accountType: normalizeText(
        details.accountType || "user",
        40
      ),
      status: "active",
      restrictionType: "none",
      restrictionReason: "",
      verificationStatus: "not_submitted",
      adminNotes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: "Demo record only; not a real authenticated account."
    };

    users.push(user);

    if (!saveStorage(USERS_KEY, users)) {
      return {
        success: false,
        message: "Could not save the user record."
      };
    }

    recordAudit("user_record_created", {
      userId: user.id,
      username: user.username
    });

    return {
      success: true,
      user: user,
      message: "Demo user record created."
    };
  }

  function getUser(userId) {
    return readStorage(USERS_KEY).find(function (user) {
      return user.id === userId;
    }) || null;
  }

  function getUsers(filters) {
    const options = filters || {};

    const query = normalizeText(
      options.search || "",
      200
    ).toLowerCase();

    return readStorage(USERS_KEY).filter(
      function (user) {
        if (
          options.status &&
          user.status !== options.status
        ) {
          return false;
        }

        if (
          options.accountType &&
          user.accountType !== options.accountType
        ) {
          return false;
        }

        if (
          options.country &&
          user.country.toLowerCase() !==
            String(options.country).toLowerCase()
        ) {
          return false;
        }

        if (query) {
          const searchable = [
            user.username,
            user.displayName,
            user.email,
            user.country
          ].join(" ").toLowerCase();

          if (!searchable.includes(query)) {
            return false;
          }
        }

        return true;
      }
    );
  }

  function updateUser(userId, changes) {
    if (
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes)
    ) {
      return {
        success: false,
        message: "User changes are required."
      };
    }

    const allowedFields = [
      "displayName",
      "country",
      "accountType",
      "adminNotes"
    ];

    const users = readStorage(USERS_KEY);
    const index = findUserIndex(users, userId);

    if (index === -1) {
      return {
        success: false,
        message: "User record not found."
      };
    }

    const updated = Object.assign({}, users[index]);

    for (const key of Object.keys(changes)) {
      if (!allowedFields.includes(key)) {
        return {
          success: false,
          message: "This field cannot be changed here: " + key
        };
      }

      const limits = {
        displayName: 100,
        country: 100,
        accountType: 40,
        adminNotes: 2000
      };

      if (typeof changes[key] !== "string") {
        return {
          success: false,
          message: "Invalid value for " + key
        };
      }

      updated[key] = normalizeText(
        changes[key],
        limits[key]
      );
    }

    updated.updatedAt = new Date().toISOString();
    users[index] = updated;

    if (!saveStorage(USERS_KEY, users)) {
      return {
        success: false,
        message: "Could not update the user record."
      };
    }

    recordAudit("user_record_updated", {
      userId: userId,
      fields: Object.keys(changes)
    });

    return {
      success: true,
      user: updated,
      message: "Demo user record updated."
    };
  }

  /*
   * Records a proposed administrative status change.
   * It does NOT suspend or restrict a real account.
   */
  function setUserStatus(userId, status, reason) {
    if (!STATUSES.includes(status)) {
      return {
        success: false,
        message: "Invalid account status."
      };
    }

    const users = readStorage(USERS_KEY);
    const index = findUserIndex(users, userId);

    if (index === -1) {
      return {
        success: false,
        message: "User record not found."
      };
    }

    users[index].status = status;
    users[index].updatedAt = new Date().toISOString();

    if (status === "active") {
      users[index].restrictionType = "none";
      users[index].restrictionReason = "";
    } else {
      users[index].restrictionReason = normalizeText(
        reason || "",
        1000
      );
    }

    if (!saveStorage(USERS_KEY, users)) {
      return {
        success: false,
        message: "Could not save account status."
      };
    }

    recordAudit("user_status_changed", {
      userId: userId,
      status: status,
      reason: normalizeText(reason || "", 1000)
    });

    return {
      success: true,
      user: users[index],
      message: "Demo status updated locally.",
      note: "No real account has been restricted."
    };
  }

  /*
   * Records a proposed feature restriction.
   * Actual enforcement requires backend authorization.
   */
  function setRestriction(userId, restrictionType, reason) {
    if (!RESTRICTION_TYPES.includes(restrictionType)) {
      return {
        success: false,
        message: "Invalid restriction type."
      };
    }

    const users = readStorage(USERS_KEY);
    const index = findUserIndex(users, userId);

    if (index === -1) {
      return {
        success: false,
        message: "User record not found."
      };
    }

    users[index].restrictionType = restrictionType;
    users[index].restrictionReason =
      normalizeText(reason || "", 1000);
    users[index].updatedAt = new Date().toISOString();

    if (restrictionType !== "none") {
      users[index].status = "restricted";
    } else if (users[index].status === "restricted") {
      users[index].status = "active";
    }

    if (!saveStorage(USERS_KEY, users)) {
      return {
        success: false,
        message: "Could not save restriction."
      };
    }

    recordAudit("user_restriction_changed", {
      userId: userId,
      restrictionType: restrictionType,
      reason: users[index].restrictionReason
    });

    return {
      success: true,
      user: users[index],
      message: "Demo restriction saved locally.",
      note: "This does not enforce a real restriction."
    };
  }

  /*
   * Records a verification decision for the demo record.
   * Real verification requires a protected review workflow.
   */
  function reviewVerification(userId, status, reason) {
    if (!VERIFICATION_STATUSES.includes(status)) {
      return {
        success: false,
        message: "Invalid verification status."
      };
    }

    if (status === "not_submitted") {
      return {
        success: false,
        message: "A review cannot set this status."
      };
    }

    const users = readStorage(USERS_KEY);
    const index = findUserIndex(users, userId);

    if (index === -1) {
      return {
        success: false,
        message: "User record not found."
      };
    }

    users[index].verificationStatus = status;
    users[index].updatedAt = new Date().toISOString();

    if (!saveStorage(USERS_KEY, users)) {
      return {
        success: false,
        message: "Could not save verification status."
      };
    }

    recordAudit("verification_review_recorded", {
      userId: userId,
      status: status,
      reason: normalizeText(reason || "", 1000)
    });

    return {
      success: true,
      user: users[index],
      message: "Demo verification decision recorded.",
      note: "This does not verify a real person's identity."
    };
  }

  function getSummary() {
    const users = readStorage(USERS_KEY);

    const summary = {
      total: users.length,
      active: 0,
      restricted: 0,
      suspended: 0,
      banned: 0,
      pendingReview: 0,
      verificationPending: 0,
      verificationApproved: 0
    };

    users.forEach(function (user) {
      if (Object.prototype.hasOwnProperty.call(
        summary,
        user.status === "pending_review"
          ? "pendingReview"
          : user.status
      )) {
        const key = user.status === "pending_review"
          ? "pendingReview"
          : user.status;

        summary[key]++;
      }

      if (user.verificationStatus === "pending") {
        summary.verificationPending++;
      }

      if (user.verificationStatus === "approved") {
        summary.verificationApproved++;
      }
    });

    return {
      success: true,
      summary: summary,
      note: "Counts include only local demo records."
    };
  }

  function getAuditLog() {
    return readStorage(AUDIT_KEY).slice().reverse();
  }

  window.RockyXAdminUsers = {
    createUserRecord: createUserRecord,
    getUser: getUser,
    getUsers: getUsers,
    updateUser: updateUser,
    setUserStatus: setUserStatus,
    setRestriction: setRestriction,
    reviewVerification: reviewVerification,
    getSummary: getSummary,
    getAuditLog: getAuditLog,

    getStatuses: function () {
      return STATUSES.slice();
    },

    getVerificationStatuses: function () {
      return VERIFICATION_STATUSES.slice();
    },

    getRestrictionTypes: function () {
      return RESTRICTION_TYPES.slice();
    }
  };
})();