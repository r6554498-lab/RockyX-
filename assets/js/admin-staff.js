/* =====================================================
   ROCKYX ADMIN STAFF
   Staff, teams, roles and permissions foundation.
   LOCAL DEMO ONLY — NOT SECURE AUTHORIZATION.
   ===================================================== */

(function () {
  "use strict";

  const STAFF_KEY = "rockyx_admin_staff_v1";
  const TEAMS_KEY = "rockyx_admin_teams_v1";
  const AUDIT_KEY = "rockyx_admin_staff_audit_v1";

  const ROLES = {
    super_admin: {
      label: "Super Admin",
      description: "Full administrative role. Assign only to the owner."
    },
    security_manager: {
      label: "Security Manager",
      description: "Manage security reviews and security incidents."
    },
    security_analyst: {
      label: "Security Analyst",
      description: "Review security alerts and suspicious activity."
    },
    content_moderator: {
      label: "Content Moderator",
      description: "Review reported content."
    },
    support_agent: {
      label: "Support Agent",
      description: "Handle user support cases."
    },
    creator_manager: {
      label: "Creator Manager",
      description: "Review creator applications and issues."
    },
    template_manager: {
      label: "Template Manager",
      description: "Review templates and template creator applications."
    },
    finance_staff: {
      label: "Finance Staff",
      description: "Review finance records and payout requests."
    },
    marketplace_manager: {
      label: "Marketplace Manager",
      description: "Review marketplace issues and seller cases."
    },
    advertising_manager: {
      label: "Advertising Manager",
      description: "Review advertisements and boost campaigns."
    },
    explore_manager: {
      label: "Explore Manager",
      description: "Review Explore listings and reports."
    },
    music_manager: {
      label: "Music Manager",
      description: "Review artist applications and music reports."
    },
    analytics_staff: {
      label: "Analytics Staff",
      description: "View approved platform reports."
    },
    technical_staff: {
      label: "Technical Staff",
      description: "Handle approved technical maintenance tasks."
    },
    custom: {
      label: "Custom Role",
      description: "A role configured for a specific responsibility."
    }
  };

  const PERMISSIONS = [
    "dashboard.view",
    "users.view",
    "users.manage",
    "content.view",
    "content.moderate",
    "support.manage",
    "creators.review",
    "templates.review",
    "finance.view",
    "finance.review",
    "marketplace.manage",
    "advertising.manage",
    "explore.manage",
    "music.manage",
    "analytics.view",
    "security.view",
    "security.manage",
    "staff.view",
    "staff.manage",
    "settings.manage",
    "audit.view"
  ];

  const TEAM_DEFINITIONS = [
    {
      id: "security",
      name: "Security",
      description: "Security alerts, investigations and incident response."
    },
    {
      id: "content",
      name: "Content Moderation",
      description: "Reports involving videos, comments, images and LIVE."
    },
    {
      id: "support",
      name: "User Support",
      description: "User questions, complaints and account support."
    },
    {
      id: "creators",
      name: "Creator Management",
      description: "Creator applications, eligibility and creator issues."
    },
    {
      id: "templates",
      name: "Template Management",
      description: "Template reviews and template creator applications."
    },
    {
      id: "finance",
      name: "Finance",
      description: "Financial reviews, commissions and payout requests."
    },
    {
      id: "marketplace",
      name: "Marketplace",
      description: "Seller cases, orders, returns and disputes."
    },
    {
      id: "advertising",
      name: "Advertising",
      description: "Ad campaign reviews and boost management."
    },
    {
      id: "explore",
      name: "Explore",
      description: "Business, transport and service listing reviews."
    },
    {
      id: "music",
      name: "Music",
      description: "Artist applications and music content reviews."
    },
    {
      id: "analytics",
      name: "Analytics",
      description: "Approved reporting and platform performance."
    },
    {
      id: "technical",
      name: "Technical Operations",
      description: "Application maintenance and technical issues."
    }
  ];

  const DEFAULT_ROLE_PERMISSIONS = {
    super_admin: PERMISSIONS.slice(),

    security_manager: [
      "dashboard.view",
      "security.view",
      "security.manage",
      "audit.view"
    ],

    security_analyst: [
      "dashboard.view",
      "security.view"
    ],

    content_moderator: [
      "dashboard.view",
      "content.view",
      "content.moderate"
    ],

    support_agent: [
      "dashboard.view",
      "support.manage"
    ],

    creator_manager: [
      "dashboard.view",
      "creators.review"
    ],

    template_manager: [
      "dashboard.view",
      "templates.review"
    ],

    finance_staff: [
      "dashboard.view",
      "finance.view",
      "finance.review"
    ],

    marketplace_manager: [
      "dashboard.view",
      "marketplace.manage"
    ],

    advertising_manager: [
      "dashboard.view",
      "advertising.manage"
    ],

    explore_manager: [
      "dashboard.view",
      "explore.manage"
    ],

    music_manager: [
      "dashboard.view",
      "music.manage"
    ],

    analytics_staff: [
      "dashboard.view",
      "analytics.view"
    ],

    technical_staff: [
      "dashboard.view"
    ],

    custom: [
      "dashboard.view"
    ]
  };

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error("RockyX Staff: Storage read failed.", error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("RockyX Staff: Storage write failed.", error);
      return false;
    }
  }

  function makeId(prefix) {
    return prefix + "_" +
      Date.now().toString(36) + "_" +
      Math.random().toString(36).slice(2, 10);
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function cleanText(value, maxLength) {
    return String(value || "")
      .trim()
      .slice(0, maxLength || 200);
  }

  function getStaffRecords() {
    const records = readJSON(STAFF_KEY, []);
    return Array.isArray(records) ? records : [];
  }

  function getTeams() {
    const saved = readJSON(TEAMS_KEY, null);

    if (Array.isArray(saved)) {
      return saved;
    }

    return TEAM_DEFINITIONS.map(function (team) {
      return Object.assign({}, team);
    });
  }

  function getAuditEntries() {
    const entries = readJSON(AUDIT_KEY, []);
    return Array.isArray(entries) ? entries : [];
  }

  function addAudit(action, staffId, actorId, details) {
    const entries = getAuditEntries();

    entries.unshift({
      id: makeId("staffaudit"),
      action: cleanText(action, 100),
      staffId: staffId || null,
      actorId: cleanText(actorId, 100) || "local-demo",
      details: cleanText(details, 400),
      timestamp: nowISO(),
      environment: "local-demo"
    });

    return writeJSON(AUDIT_KEY, entries.slice(0, 1000));
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      String(email || "").trim()
    );
  }

  function getRolePermissions(role) {
    const permissions = DEFAULT_ROLE_PERMISSIONS[role];

    return Array.isArray(permissions)
      ? permissions.slice()
      : [];
  }

  function listRoles() {
    return Object.keys(ROLES).map(function (id) {
      return {
        id: id,
        label: ROLES[id].label,
        description: ROLES[id].description,
        defaultPermissions: getRolePermissions(id)
      };
    });
  }

  function listPermissions() {
    return PERMISSIONS.map(function (permission) {
      return {
        id: permission,
        description: permission.replace(/\./g, " ")
      };
    });
  }

  function listTeams() {
    return getTeams();
  }

  function addTeam(input, actorId) {
    if (!input || typeof input !== "object") {
      return {
        success: false,
        error: "Provide team details."
      };
    }

    const name = cleanText(input.name, 100);
    const description = cleanText(input.description, 300);

    if (!name) {
      return {
        success: false,
        error: "Team name is required."
      };
    }

    const teams = getTeams();

    if (teams.some(function (team) {
      return team.name.toLowerCase() === name.toLowerCase();
    })) {
      return {
        success: false,
        error: "A team with that name already exists."
      };
    }

    const team = {
      id: makeId("team"),
      name: name,
      description: description,
      createdAt: nowISO(),
      environment: "local-demo"
    };

    teams.push(team);

    if (!writeJSON(TEAMS_KEY, teams)) {
      return {
        success: false,
        error: "Could not save the team."
      };
    }

    addAudit("team_created", null, actorId, "Created team: " + name);

    return {
      success: true,
      team: team,
      demoOnly: true
    };
  }

  function createStaff(input, actorId) {
    if (!input || typeof input !== "object") {
      return {
        success: false,
        error: "Provide staff details."
      };
    }

    const fullName = cleanText(input.fullName, 120);
    const email = cleanText(input.email, 200).toLowerCase();
    const role = cleanText(input.role, 60);
    const teamId = cleanText(input.teamId, 100);
    const jobTitle = cleanText(input.jobTitle, 100);

    if (!fullName) {
      return {
        success: false,
        error: "Staff member name is required."
      };
    }

    if (!validateEmail(email)) {
      return {
        success: false,
        error: "Enter a valid email address."
      };
    }

    if (!Object.prototype.hasOwnProperty.call(ROLES, role)) {
      return {
        success: false,
        error: "Select a supported role."
      };
    }

    if (role === "super_admin") {
      return {
        success: false,
        error: "Super Admin cannot be assigned through staff creation."
      };
    }

    const teams = getTeams();

    if (teamId && !teams.some(function (team) {
      return team.id === teamId;
    })) {
      return {
        success: false,
        error: "The selected team does not exist."
      };
    }

    const staff = getStaffRecords();

    if (staff.some(function (person) {
      return person.email === email;
    })) {
      return {
        success: false,
        error: "A staff record already uses this email."
      };
    }

    const member = {
      id: makeId("staff"),
      fullName: fullName,
      email: email,
      jobTitle: jobTitle,
      role: role,
      teamId: teamId || null,
      permissions: getRolePermissions(role),
      status: "invited",
      invitationStatus: "not_sent",
      lastLoginAt: null,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      createdBy: cleanText(actorId, 100) || "local-demo",
      environment: "local-demo"
    };

    staff.unshift(member);

    if (!writeJSON(STAFF_KEY, staff)) {
      return {
        success: false,
        error: "Could not save the staff record."
      };
    }

    addAudit(
      "staff_record_created",
      member.id,
      actorId,
      "Created local staff record for " + member.email
    );

    return {
      success: true,
      staff: member,
      demoOnly: true,
      warning: "This creates a local record only. It does not invite anyone or create a login account."
    };
  }

  function listStaff(filters) {
    filters = filters || {};

    let staff = getStaffRecords();

    if (filters.role) {
      staff = staff.filter(function (person) {
        return person.role === filters.role;
      });
    }

    if (filters.teamId) {
      staff = staff.filter(function (person) {
        return person.teamId === filters.teamId;
      });
    }

    if (filters.status) {
      staff = staff.filter(function (person) {
        return person.status === filters.status;
      });
    }

    if (filters.search) {
      const search = cleanText(filters.search, 150).toLowerCase();

      staff = staff.filter(function (person) {
        return (
          person.fullName.toLowerCase().includes(search) ||
          person.email.toLowerCase().includes(search) ||
          person.jobTitle.toLowerCase().includes(search)
        );
      });
    }

    return staff;
  }

  function getStaff(staffId) {
    return getStaffRecords().find(function (person) {
      return person.id === staffId;
    }) || null;
  }

  function updateStaff(staffId, changes, actorId) {
    if (!changes || typeof changes !== "object") {
      return {
        success: false,
        error: "Provide staff changes."
      };
    }

    const staff = getStaffRecords();

    const index = staff.findIndex(function (person) {
      return person.id === staffId;
    });

    if (index === -1) {
      return {
        success: false,
        error: "Staff member not found."
      };
    }

    const member = staff[index];
    const allowedKeys = ["fullName", "jobTitle", "teamId"];

    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(changes, key)) {
        if (key === "teamId") {
          const teamId = cleanText(changes.teamId, 100);

          if (teamId && !getTeams().some(function (team) {
            return team.id === teamId;
          })) {
            return {
              success: false,
              error: "The selected team does not exist."
            };
          }

          member.teamId = teamId || null;
        } else {
          const value = cleanText(changes[key], 150);

          if (key === "fullName" && !value) {
            return {
              success: false,
              error: "Staff name cannot be empty."
            };
          }

          member[key] = value;
        }
      }
    }

    member.updatedAt = nowISO();
    staff[index] = member;

    if (!writeJSON(STAFF_KEY, staff)) {
      return {
        success: false,
        error: "Could not save staff changes."
      };
    }

    addAudit(
      "staff_record_updated",
      staffId,
      actorId,
      "Updated local staff record."
    );

    return {
      success: true,
      staff: member,
      demoOnly: true
    };
  }

  function assignPermissions(staffId, permissions, actorId) {
    if (!Array.isArray(permissions)) {
      return {
        success: false,
        error: "Permissions must be an array."
      };
    }

    const staff = getStaffRecords();

    const index = staff.findIndex(function (person) {
      return person.id === staffId;
    });

    if (index === -1) {
      return {
        success: false,
        error: "Staff member not found."
      };
    }

    const invalid = permissions.filter(function (permission) {
      return !PERMISSIONS.includes(permission);
    });

    if (invalid.length) {
      return {
        success: false,
        error: "Unknown permissions: " + invalid.join(", ")
      };
    }

    staff[index].permissions = Array.from(new Set(permissions));
    staff[index].updatedAt = nowISO();

    if (!writeJSON(STAFF_KEY, staff)) {
      return {
        success: false,
        error: "Could not save permissions."
      };
    }

    addAudit(
      "staff_permissions_changed",
      staffId,
      actorId,
      "Updated local permission assignments."
    );

    return {
      success: true,
      staff: staff[index],
      demoOnly: true,
      warning: "These permissions are descriptive only until enforced by a secure backend."
    };
  }

  function changeRole(staffId, role, actorId) {
    if (!Object.prototype.hasOwnProperty.call(ROLES, role)) {
      return {
        success: false,
        error: "Unsupported role."
      };
    }

    if (role === "super_admin") {
      return {
        success: false,
        error: "Super Admin cannot be assigned through this function."
      };
    }

    const staff = getStaffRecords();

    const index = staff.findIndex(function (person) {
      return person.id === staffId;
    });

    if (index === -1) {
      return {
        success: false,
        error: "Staff member not found."
      };
    }

    staff[index].role = role;
    staff[index].permissions = getRolePermissions(role);
    staff[index].updatedAt = nowISO();

    if (!writeJSON(STAFF_KEY, staff)) {
      return {
        success: false,
        error: "Could not save the role."
      };
    }

    addAudit(
      "staff_role_changed",
      staffId,
      actorId,
      "Changed local role to " + role
    );

    return {
      success: true,
      staff: staff[index],
      demoOnly: true
    };
  }

  function setStaffStatus(staffId, status, actorId, reason) {
    const allowedStatuses = [
      "invited",
      "active",
      "suspended",
      "inactive"
    ];

    if (!allowedStatuses.includes(status)) {
      return {
        success: false,
        error: "Unsupported staff status."
      };
    }

    const staff = getStaffRecords();

    const index = staff.findIndex(function (person) {
      return person.id === staffId;
    });

    if (index === -1) {
      return {
        success: false,
        error: "Staff member not found."
      };
    }

    staff[index].status = status;
    staff[index].updatedAt = nowISO();

    if (!writeJSON(STAFF_KEY, staff)) {
      return {
        success: false,
        error: "Could not update staff status."
      };
    }

    addAudit(
      "staff_status_changed",
      staffId,
      actorId,
      "Status: " + status + ". Reason: " + cleanText(reason, 300)
    );

    return {
      success: true,
      staff: staff[index],
      demoOnly: true,
      warning: "This does not disable a real account or revoke active sessions."
    };
  }

  function getAuditLog(filters) {
    filters = filters || {};

    let entries = getAuditEntries();

    if (filters.staffId) {
      entries = entries.filter(function (entry) {
        return entry.staffId === filters.staffId;
      });
    }

    if (filters.action) {
      entries = entries.filter(function (entry) {
        return entry.action === filters.action;
      });
    }

    return entries;
  }

  function getSummary() {
    const staff = getStaffRecords();

    const summary = {
      total: staff.length,
      byStatus: {},
      byRole: {},
      byTeam: {},
      generatedAt: nowISO(),
      demoOnly: true
    };

    staff.forEach(function (member) {
      summary.byStatus[member.status] =
        (summary.byStatus[member.status] || 0) + 1;

      summary.byRole[member.role] =
        (summary.byRole[member.role] || 0) + 1;

      const team = member.teamId || "unassigned";

      summary.byTeam[team] =
        (summary.byTeam[team] || 0) + 1;
    });

    return summary;
  }

  function exportData() {
    return {
      exportedAt: nowISO(),
      environment: "local-demo",
      staff: getStaffRecords(),
      teams: getTeams(),
      auditLog: getAuditEntries(),
      warning: "This export contains prototype data, not verified employee accounts or a security audit."
    };
  }

  window.RockyXAdminStaff = {
    version: "1.0.0",
    demoOnly: true,

    roles: Object.assign({}, ROLES),

    listRoles: listRoles,
    listPermissions: listPermissions,

    listTeams: listTeams,
    addTeam: addTeam,

    createStaff: createStaff,
    listStaff: listStaff,
    getStaff: getStaff,
    updateStaff: updateStaff,

    assignPermissions: assignPermissions,
    changeRole: changeRole,
    setStaffStatus: setStaffStatus,

    getAuditLog: getAuditLog,
    getSummary: getSummary,
    exportData: exportData
  };

  console.log(
    "RockyX Admin Staff loaded. Local prototype only; permissions are not security enforcement."
  );
})();