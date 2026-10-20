/* =========================================
   ROCKYX ACCESS CONTROL
   Roles, permissions, and access checks
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_access_control";

  const ROLES = [
    "user",
    "creator",
    "template_creator",
    "seller",
    "advertiser",
    "moderator",
    "admin"
  ];

  const PERMISSIONS = {
    user: [
      "profile.view",
      "profile.edit",
      "content.view",
      "content.comment",
      "content.like",
      "content.share",
      "content.report",
      "music.listen",
      "music.playlist",
      "marketplace.browse",
      "marketplace.purchase",
      "template.use"
    ],

    creator: [
      "creator.dashboard",
      "content.publish",
      "livestream.create",
      "creator.tasks.view",
      "creator.analytics.view"
    ],

    template_creator: [
      "template_creator.dashboard",
      "template.create",
      "template.edit_own",
      "template.submit",
      "template.analytics.view"
    ],

    seller: [
      "seller.dashboard",
      "product.create",
      "product.edit_own",
      "product.manage_inventory",
      "seller.orders.view"
    ],

    advertiser: [
      "advertising.dashboard",
      "advertising.campaign.create",
      "advertising.campaign.edit_own",
      "advertising.analytics.view"
    ],

    moderator: [
      "moderation.dashboard",
      "moderation.reports.view",
      "moderation.reports.review",
      "moderation.content.hide",
      "moderation.content.restore"
    ],

    admin: [
      "admin.dashboard",
      "admin.users.view",
      "admin.users.manage",
      "admin.roles.manage",
      "admin.settings.manage",
      "admin.reports.view",
      "admin.platform.manage"
    ]
  };

  function loadAssignments() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return data && typeof data === "object" && !Array.isArray(data)
        ? data
        : {};
    } catch (error) {
      return {};
    }
  }

  function saveAssignments(assignments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  }

  function getCurrentUser() {
    if (window.RockyXUserAccounts) {
      return window.RockyXUserAccounts.getCurrentUser();
    }

    return null;
  }

  function getUserId(userId) {
    if (userId) {
      return String(userId);
    }

    const user = getCurrentUser();
    return user && user.id ? String(user.id) : null;
  }

  function getRoles() {
    return ROLES.slice();
  }

  function getPermissionsForRole(role) {
    return PERMISSIONS[role]
      ? PERMISSIONS[role].slice()
      : [];
  }

  function getUserRoles(userId) {
    userId = getUserId(userId);

    if (!userId) {
      return ["user"];
    }

    const assignments = loadAssignments();

    const roles = assignments[userId];

    if (!Array.isArray(roles)) {
      return ["user"];
    }

    return Array.from(new Set(
      ["user"].concat(
        roles.filter(function (role) {
          return ROLES.includes(role);
        })
      )
    ));
  }

  function hasRole(role, userId) {
    if (!ROLES.includes(role)) {
      return false;
    }

    return getUserRoles(userId).includes(role);
  }

  function hasPermission(permission, userId) {
    const roles = getUserRoles(userId);

    return roles.some(function (role) {
      return getPermissionsForRole(role).includes(permission);
    });
  }

  function getUserPermissions(userId) {
    const roles = getUserRoles(userId);
    const permissions = new Set();

    roles.forEach(function (role) {
      getPermissionsForRole(role).forEach(function (permission) {
        permissions.add(permission);
      });
    });

    return Array.from(permissions);
  }

  function getRoleSummary(userId) {
    const roles = getUserRoles(userId);

    return {
      roles: roles,
      permissions: getUserPermissions(userId)
    };
  }

  /*
   * This function is intended for a trusted backend
   * integration later. Do not use browser storage as
   * proof that someone is an administrator.
   */
  function assignRoleForPrototype(userId, role) {
    if (!userId || !ROLES.includes(role)) {
      return {
        success: false,
        message: "A valid user ID and role are required."
      };
    }

    if (role === "admin" || role === "moderator") {
      return {
        success: false,
        message: "Privileged roles must be assigned by a secure backend."
      };
    }

    const assignments = loadAssignments();
    const key = String(userId);

    const currentRoles = Array.isArray(assignments[key])
      ? assignments[key]
      : ["user"];

    if (!currentRoles.includes(role)) {
      currentRoles.push(role);
    }

    assignments[key] = Array.from(new Set(
      ["user"].concat(currentRoles)
    ));

    saveAssignments(assignments);

    return {
      success: true,
      roles: assignments[key]
    };
  }

  /*
   * Prototype-only removal. Real role changes must
   * be authorized and audited by the backend.
   */
  function removeRoleForPrototype(userId, role) {
    if (!userId || !ROLES.includes(role)) {
      return {
        success: false,
        message: "A valid user ID and role are required."
      };
    }

    if (role === "user" || role === "admin" || role === "moderator") {
      return {
        success: false,
        message: "This role cannot be removed through the prototype."
      };
    }

    const assignments = loadAssignments();
    const key = String(userId);

    if (!Array.isArray(assignments[key])) {
      return {
        success: false,
        message: "No role assignments were found."
      };
    }

    assignments[key] = assignments[key].filter(function (item) {
      return item !== role;
    });

    if (!assignments[key].includes("user")) {
      assignments[key].unshift("user");
    }

    saveAssignments(assignments);

    return {
      success: true,
      roles: assignments[key]
    };
  }

  window.RockyXAccessControl = {
    getRoles: getRoles,
    getPermissionsForRole: getPermissionsForRole,
    getUserRoles: getUserRoles,
    hasRole: hasRole,
    hasPermission: hasPermission,
    getUserPermissions: getUserPermissions,
    getRoleSummary: getRoleSummary,
    assignRoleForPrototype: assignRoleForPrototype,
    removeRoleForPrototype: removeRoleForPrototype
  };

})();