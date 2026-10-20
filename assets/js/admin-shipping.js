/*
 * RockyX Admin Shipping
 *
 * Local prototype for shipping operations in the
 * private RockyX Admin dashboard.
 *
 * IMPORTANT:
 * This is not secure admin access.
 * Production actions must be authorized and enforced
 * by a trusted backend.
 */

(function () {
  "use strict";

  const SETTINGS_KEY = "rockyx_admin_shipping_settings";
  const AUDIT_KEY = "rockyx_admin_shipping_audit";

  const DEFAULT_SETTINGS = {
    defaultDeliveryMethod: "standard",
    allowPartnerDelivery: true,
    allowSellerManagedDelivery: true,
    allowRockyXDelivery: false,
    requireVerifiedPartners: true,
    requireAdminPartnerApproval: true,
    currency: "GHS"
  };

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error("RockyX admin shipping storage error:", error);
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("RockyX admin shipping save error:", error);
      return false;
    }
  }

  function getSettings() {
    return Object.assign(
      {},
      DEFAULT_SETTINGS,
      readStorage(SETTINGS_KEY, {})
    );
  }

  function getAuditLog() {
    return readStorage(AUDIT_KEY, []).slice().reverse();
  }

  function recordAction(action, details) {
    const audit = readStorage(AUDIT_KEY, []);

    audit.push({
      id: "shipping_audit_" + Date.now() + "_" +
        Math.random().toString(36).slice(2, 8),
      action: action,
      details: details || {},
      createdAt: new Date().toISOString(),
      note: "Local prototype audit entry; not tamper-proof."
    });

    return writeStorage(AUDIT_KEY, audit);
  }

  /*
   * Prototype settings update.
   * This function must not be exposed as a trusted
   * production admin operation without backend authorization.
   */
  function updateSettings(changes) {
    if (!changes || typeof changes !== "object") {
      return {
        success: false,
        message: "Shipping settings are required."
      };
    }

    const current = getSettings();
    const allowedKeys = Object.keys(DEFAULT_SETTINGS);
    const updated = Object.assign({}, current);

    for (const key of Object.keys(changes)) {
      if (!allowedKeys.includes(key)) {
        return {
          success: false,
          message: "Unsupported shipping setting: " + key
        };
      }

      const expected = DEFAULT_SETTINGS[key];

      if (typeof changes[key] !== typeof expected) {
        return {
          success: false,
          message: "Invalid value type for setting: " + key
        };
      }

      updated[key] = changes[key];
    }

    if (
      typeof updated.currency !== "string" ||
      !/^[A-Z]{3}$/.test(updated.currency)
    ) {
      return {
        success: false,
        message: "Currency must be a three-letter code."
      };
    }

    if (
      typeof updated.defaultDeliveryMethod !== "string" ||
      !updated.defaultDeliveryMethod.trim()
    ) {
      return {
        success: false,
        message: "Default delivery method cannot be empty."
      };
    }

    if (!writeStorage(SETTINGS_KEY, updated)) {
      return {
        success: false,
        message: "Could not save shipping settings."
      };
    }

    recordAction("shipping_settings_updated", changes);

    return {
      success: true,
      settings: updated,
      message: "Local shipping settings updated."
    };
  }

  /*
   * Read partner records from the existing prototype module.
   */
  function getPartnerOverview(filters) {
    const module = window.RockyXShippingPartners;

    if (!module) {
      return {
        success: false,
        message: "Shipping partners module is not loaded."
      };
    }

    return {
      success: true,
      partners: module.getPartners(filters || {})
    };
  }

  /*
   * Read delivery records from the existing prototype module.
   */
  function getDeliveryOverview(filters) {
    const module = window.RockyXDeliveryManagement;

    if (!module) {
      return {
        success: false,
        message: "Delivery management module is not loaded."
      };
    }

    return {
      success: true,
      deliveries: module.getAllDeliveries(filters || {})
    };
  }

  /*
   * Review a partner application in the local prototype.
   * Production use requires authenticated admin permissions.
   */
  function reviewPartner(partnerId, decision) {
    const module = window.RockyXShippingPartners;

    if (!module) {
      return {
        success: false,
        message: "Shipping partners module is not loaded."
      };
    }

    const decisions = {
      approve: "active",
      pause: "paused",
      reject: "rejected",
      suspend: "suspended"
    };

    if (!Object.prototype.hasOwnProperty.call(
      decisions,
      decision
    )) {
      return {
        success: false,
        message: "Unsupported partner review decision."
      };
    }

    const result = module.setPartnerStatus(
      partnerId,
      decisions[decision]
    );

    if (result.success) {
      recordAction("partner_reviewed", {
        partnerId: partnerId,
        decision: decision
      });
    }

    return result;
  }

  /*
   * Change a delivery status in the local prototype.
   * This does not confirm a physical delivery event.
   */
  function updateDeliveryStatus(deliveryId, status, details) {
    const module = window.RockyXDeliveryManagement;

    if (!module) {
      return {
        success: false,
        message: "Delivery management module is not loaded."
      };
    }

    const result = module.updateStatus(
      deliveryId,
      status,
      details || {}
    );

    if (result.success) {
      recordAction("delivery_status_updated", {
        deliveryId: deliveryId,
        status: status
      });
    }

    return result;
  }

  function getShippingSummary() {
    const partnersModule = window.RockyXShippingPartners;
    const deliveriesModule = window.RockyXDeliveryManagement;

    if (!partnersModule || !deliveriesModule) {
      return {
        success: false,
        message: "Shipping modules are not loaded."
      };
    }

    const partners = partnersModule.getPartners();
    const deliveries = deliveriesModule.getAllDeliveries();

    const partnerCounts = {
      total: partners.length,
      pendingReview: 0,
      active: 0,
      paused: 0,
      rejected: 0,
      suspended: 0
    };

    partners.forEach(function (partner) {
      if (partner.status === "pending_review") {
        partnerCounts.pendingReview++;
      } else if (partner.status === "active") {
        partnerCounts.active++;
      } else if (partner.status === "paused") {
        partnerCounts.paused++;
      } else if (partner.status === "rejected") {
        partnerCounts.rejected++;
      } else if (partner.status === "suspended") {
        partnerCounts.suspended++;
      }
    });

    const deliveryCounts = {
      total: deliveries.length,
      awaitingDispatch: 0,
      inTransit: 0,
      delivered: 0,
      failed: 0,
      cancelled: 0
    };

    deliveries.forEach(function (delivery) {
      if (delivery.status === "awaiting_dispatch") {
        deliveryCounts.awaitingDispatch++;
      } else if (
        delivery.status === "picked_up" ||
        delivery.status === "in_transit" ||
        delivery.status === "arrived_at_destination"
      ) {
        deliveryCounts.inTransit++;
      } else if (delivery.status === "delivered") {
        deliveryCounts.delivered++;
      } else if (delivery.status === "delivery_failed") {
        deliveryCounts.failed++;
      } else if (delivery.status === "cancelled") {
        deliveryCounts.cancelled++;
      }
    });

    return {
      success: true,
      partners: partnerCounts,
      deliveries: deliveryCounts,
      generatedAt: new Date().toISOString(),
      note: "Summary reflects local prototype records only."
    };
  }

  window.RockyXAdminShipping = {
    getSettings: getSettings,
    updateSettings: updateSettings,
    getAuditLog: getAuditLog,
    getPartnerOverview: getPartnerOverview,
    getDeliveryOverview: getDeliveryOverview,
    reviewPartner: reviewPartner,
    updateDeliveryStatus: updateDeliveryStatus,
    getShippingSummary: getShippingSummary
  };
})();