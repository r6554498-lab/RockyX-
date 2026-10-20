/* =====================================================
   ROCKYX ADMIN SECURITY CENTER
   Security incidents and investigation records.
   LOCAL PROTOTYPE ONLY.
   Does not detect attacks or secure real accounts.
   ===================================================== */

(function () {
  "use strict";

  const INCIDENTS_KEY = "rockyx_admin_security_incidents_v1";
  const AUDIT_KEY = "rockyx_admin_security_audit_v1";
  const SETTINGS_KEY = "rockyx_admin_security_settings_v1";

  const SEVERITIES = [
    "low",
    "medium",
    "high",
    "critical"
  ];

  const STATUSES = [
    "new",
    "investigating",
    "contained",
    "resolved",
    "closed"
  ];

  const INCIDENT_TYPES = [
    "suspicious_login",
    "account_compromise",
    "unauthorized_access",
    "suspicious_activity",
    "data_exposure",
    "payment_security",
    "spam_or_abuse",
    "staff_access",
    "system_issue",
    "other"
  ];

  const DEFAULT_SETTINGS = {
    incidentNotificationsEnabled: true,
    criticalIncidentRequiresReview: true,
    requireResolutionNotes: true,
    defaultSeverity: "medium",
    lastUpdated: null
  };

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error("RockyX Security: Storage read failed.", error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("RockyX Security: Storage write failed.", error);
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
      .slice(0, maxLength || 300);
  }

  function getIncidents() {
    const incidents = readJSON(INCIDENTS_KEY, []);
    return Array.isArray(incidents) ? incidents : [];
  }

  function getAuditEntries() {
    const entries = readJSON(AUDIT_KEY, []);
    return Array.isArray(entries) ? entries : [];
  }

  function getSettings() {
    return Object.assign(
      {},
      DEFAULT_SETTINGS,
      readJSON(SETTINGS_KEY, {})
    );
  }

  function addAudit(action, incidentId, actorId, details) {
    const entries = getAuditEntries();

    entries.unshift({
      id: makeId("secaudit"),
      action: cleanText(action, 100),
      incidentId: incidentId || null,
      actorId: cleanText(actorId, 100) || "local-demo",
      details: cleanText(details, 500),
      timestamp: nowISO(),
      environment: "local-demo"
    });

    return writeJSON(AUDIT_KEY, entries.slice(0, 1000));
  }

  function createIncident(input, actorId) {
    if (!input || typeof input !== "object") {
      return {
        success: false,
        error: "Provide incident details."
      };
    }

    const title = cleanText(input.title, 160);
    const description = cleanText(input.description, 2000);
    const type = cleanText(input.type, 80);
    const severity = cleanText(
      input.severity || getSettings().defaultSeverity,
      30
    );

    if (!title) {
      return {
        success: false,
        error: "Incident title is required."
      };
    }

    if (!description) {
      return {
        success: false,
        error: "Incident description is required."
      };
    }

    if (!INCIDENT_TYPES.includes(type)) {
      return {
        success: false,
        error: "Select a supported incident type."
      };
    }

    if (!SEVERITIES.includes(severity)) {
      return {
        success: false,
        error: "Select a supported severity level."
      };
    }

    const incidents = getIncidents();

    const incident = {
      id: makeId("incident"),
      reference: makeId("RXSEC").toUpperCase(),
      title: title,
      description: description,
      type: type,
      severity: severity,
      status: "new",
      affectedAccountReference: cleanText(
        input.affectedAccountReference,
        150
      ) || null,
      assignedTeam: cleanText(input.assignedTeam, 100) || null,
      assignedStaffReference: cleanText(
        input.assignedStaffReference,
        100
      ) || null,
      investigationNotes: [],
      resolutionNotes: "",
      createdBy: cleanText(actorId, 100) || "local-demo",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      resolvedAt: null,
      environment: "local-demo"
    };

    incidents.unshift(incident);

    if (!writeJSON(INCIDENTS_KEY, incidents)) {
      return {
        success: false,
        error: "Could not save the incident."
      };
    }

    addAudit(
      "incident_created",
      incident.id,
      actorId,
      "Created incident with severity " + severity
    );

    return {
      success: true,
      incident: incident,
      demoOnly: true,
      warning: "This creates a local incident record only. It does not detect or stop a real attack."
    };
  }

  function listIncidents(filters) {
    filters = filters || {};

    let incidents = getIncidents();

    if (filters.status) {
      incidents = incidents.filter(function (incident) {
        return incident.status === filters.status;
      });
    }

    if (filters.severity) {
      incidents = incidents.filter(function (incident) {
        return incident.severity === filters.severity;
      });
    }

    if (filters.type) {
      incidents = incidents.filter(function (incident) {
        return incident.type === filters.type;
      });
    }

    if (filters.assignedTeam) {
      incidents = incidents.filter(function (incident) {
        return incident.assignedTeam === filters.assignedTeam;
      });
    }

    if (filters.search) {
      const search = cleanText(filters.search, 200).toLowerCase();

      incidents = incidents.filter(function (incident) {
        return (
          incident.title.toLowerCase().includes(search) ||
          incident.description.toLowerCase().includes(search) ||
          incident.reference.toLowerCase().includes(search)
        );
      });
    }

    return incidents;
  }

  function getIncident(incidentId) {
    return getIncidents().find(function (incident) {
      return incident.id === incidentId ||
        incident.reference === incidentId;
    }) || null;
  }

  function updateIncident(incidentId, changes, actorId) {
    if (!changes || typeof changes !== "object") {
      return {
        success: false,
        error: "Provide incident changes."
      };
    }

    const incidents = getIncidents();

    const index = incidents.findIndex(function (incident) {
      return incident.id === incidentId ||
        incident.reference === incidentId;
    });

    if (index === -1) {
      return {
        success: false,
        error: "Incident not found."
      };
    }

    const incident = incidents[index];

    if (
      incident.status === "closed" ||
      incident.status === "resolved"
    ) {
      return {
        success: false,
        error: "Reopen the incident through an authorized workflow before editing it."
      };
    }

    if (Object.prototype.hasOwnProperty.call(changes, "title")) {
      const title = cleanText(changes.title, 160);

      if (!title) {
        return {
          success: false,
          error: "Incident title cannot be empty."
        };
      }

      incident.title = title;
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, "description")
    ) {
      incident.description = cleanText(changes.description, 2000);
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, "severity")
    ) {
      if (!SEVERITIES.includes(changes.severity)) {
        return {
          success: false,
          error: "Unsupported severity."
        };
      }

      incident.severity = changes.severity;
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, "assignedTeam")
    ) {
      incident.assignedTeam =
        cleanText(changes.assignedTeam, 100) || null;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        changes,
        "assignedStaffReference"
      )
    ) {
      incident.assignedStaffReference =
        cleanText(changes.assignedStaffReference, 100) || null;
    }

    incident.updatedAt = nowISO();
    incidents[index] = incident;

    if (!writeJSON(INCIDENTS_KEY, incidents)) {
      return {
        success: false,
        error: "Could not save incident changes."
      };
    }

    addAudit(
      "incident_updated",
      incident.id,
      actorId,
      "Updated incident details."
    );

    return {
      success: true,
      incident: incident,
      demoOnly: true
    };
  }

  function addInvestigationNote(incidentId, note, actorId) {
    const text = cleanText(note, 2000);

    if (!text) {
      return {
        success: false,
        error: "Investigation note cannot be empty."
      };
    }

    const incidents = getIncidents();

    const index = incidents.findIndex(function (incident) {
      return incident.id === incidentId ||
        incident.reference === incidentId;
    });

    if (index === -1) {
      return {
        success: false,
        error: "Incident not found."
      };
    }

    const incident = incidents[index];

    if (
      incident.status === "closed" ||
      incident.status === "resolved"
    ) {
      return {
        success: false,
        error: "This incident is already closed."
      };
    }

    incident.investigationNotes.push({
      id: makeId("note"),
      note: text,
      createdBy: cleanText(actorId, 100) || "local-demo",
      createdAt: nowISO()
    });

    incident.updatedAt = nowISO();
    incidents[index] = incident;

    if (!writeJSON(INCIDENTS_KEY, incidents)) {
      return {
        success: false,
        error: "Could not save the investigation note."
      };
    }

    addAudit(
      "investigation_note_added",
      incident.id,
      actorId,
      "Added an investigation note."
    );

    return {
      success: true,
      incident: incident,
      demoOnly: true
    };
  }

  function changeIncidentStatus(
    incidentId,
    status,
    actorId,
    resolutionNotes
  ) {
    if (!STATUSES.includes(status)) {
      return {
        success: false,
        error: "Unsupported incident status."
      };
    }

    const incidents = getIncidents();

    const index = incidents.findIndex(function (incident) {
      return incident.id === incidentId ||
        incident.reference === incidentId;
    });

    if (index === -1) {
      return {
        success: false,
        error: "Incident not found."
      };
    }

    const incident = incidents[index];

    if (
      incident.status === "closed" ||
      incident.status === "resolved"
    ) {
      return {
        success: false,
        error: "Closed incidents cannot be changed in this workflow."
      };
    }

    const notes = cleanText(resolutionNotes, 2000);
    const settings = getSettings();

    if (
      (status === "resolved" || status === "closed") &&
      settings.requireResolutionNotes &&
      !notes
    ) {
      return {
        success: false,
        error: "Resolution notes are required before resolving or closing an incident."
      };
    }

    if (
      incident.severity === "critical" &&
      settings.criticalIncidentRequiresReview &&
      (status === "resolved" || status === "closed") &&
      !notes
    ) {
      return {
        success: false,
        error: "Critical incidents require documented review notes."
      };
    }

    incident.status = status;
    incident.updatedAt = nowISO();

    if (status === "resolved" || status === "closed") {
      incident.resolutionNotes = notes;
      incident.resolvedAt = nowISO();
    }

    incidents[index] = incident;

    if (!writeJSON(INCIDENTS_KEY, incidents)) {
      return {
        success: false,
        error: "Could not save the incident status."
      };
    }

    addAudit(
      "incident_status_changed",
      incident.id,
      actorId,
      "Changed status to " + status +
        (notes ? ". Notes: " + notes : "")
    );

    return {
      success: true,
      incident: incident,
      demoOnly: true,
      warning: "This changes only the local prototype. It does not contain or remediate a real security incident."
    };
  }

  function getSummary() {
    const incidents = getIncidents();

    const summary = {
      total: incidents.length,
      byStatus: {},
      bySeverity: {},
      byType: {},
      criticalOpen: 0,
      highOpen: 0,
      generatedAt: nowISO(),
      demoOnly: true
    };

    incidents.forEach(function (incident) {
      summary.byStatus[incident.status] =
        (summary.byStatus[incident.status] || 0) + 1;

      summary.bySeverity[incident.severity] =
        (summary.bySeverity[incident.severity] || 0) + 1;

      summary.byType[incident.type] =
        (summary.byType[incident.type] || 0) + 1;

      const isOpen =
        incident.status !== "resolved" &&
        incident.status !== "closed";

      if (isOpen && incident.severity === "critical") {
        summary.criticalOpen += 1;
      }

      if (isOpen && incident.severity === "high") {
        summary.highOpen += 1;
      }
    });

    return summary;
  }

  function saveSettings(changes) {
    if (!changes || typeof changes !== "object") {
      return {
        success: false,
        error: "Provide settings."
      };
    }

    const current = getSettings();
    const allowedKeys = [
      "incidentNotificationsEnabled",
      "criticalIncidentRequiresReview",
      "requireResolutionNotes",
      "defaultSeverity"
    ];

    const next = Object.assign({}, current);

    for (const key of allowedKeys) {
      if (!Object.prototype.hasOwnProperty.call(changes, key)) {
        continue;
      }

      if (key === "defaultSeverity") {
        if (!SEVERITIES.includes(changes[key])) {
          return {
            success: false,
            error: "Unsupported default severity."
          };
        }

        next.defaultSeverity = changes[key];
      } else {
        if (typeof changes[key] !== "boolean") {
          return {
            success: false,
            error: key + " must be true or false."
          };
        }

        next[key] = changes[key];
      }
    }

    next.lastUpdated = nowISO();

    if (!writeJSON(SETTINGS_KEY, next)) {
      return {
        success: false,
        error: "Could not save security settings."
      };
    }

    addAudit(
      "security_settings_updated",
      null,
      "local-demo",
      "Updated local security settings."
    );

    return {
      success: true,
      settings: next,
      demoOnly: true
    };
  }

  function getAuditLog(filters) {
    filters = filters || {};

    let entries = getAuditEntries();

    if (filters.incidentId) {
      entries = entries.filter(function (entry) {
        return entry.incidentId === filters.incidentId;
      });
    }

    if (filters.action) {
      entries = entries.filter(function (entry) {
        return entry.action === filters.action;
      });
    }

    return entries;
  }

  function exportData() {
    return {
      exportedAt: nowISO(),
      environment: "local-demo",
      incidents: getIncidents(),
      settings: getSettings(),
      auditLog: getAuditEntries(),
      warning: "Prototype data only. This export is not a verified security report."
    };
  }

  window.RockyXAdminSecurity = {
    version: "1.0.0",
    demoOnly: true,

    severities: SEVERITIES.slice(),
    statuses: STATUSES.slice(),
    incidentTypes: INCIDENT_TYPES.slice(),

    getSettings: getSettings,
    saveSettings: saveSettings,

    createIncident: createIncident,
    listIncidents: listIncidents,
    getIncident: getIncident,
    updateIncident: updateIncident,

    addInvestigationNote: addInvestigationNote,
    changeIncidentStatus: changeIncidentStatus,

    getSummary: getSummary,
    getAuditLog: getAuditLog,
    exportData: exportData
  };

  console.log(
    "RockyX Security Center loaded. Local prototype only."
  );
})();