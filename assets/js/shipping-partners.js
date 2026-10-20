/*
 * RockyX Shipping Partners
 *
 * Local prototype for managing delivery partners,
 * service areas, delivery methods, and partner status.
 *
 * IMPORTANT:
 * This module does not connect to real courier companies.
 * Production shipping requires a secure backend and
 * verified partner integrations.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_shipping_partners";

  const PARTNER_STATUSES = [
    "pending_review",
    "active",
    "paused",
    "rejected",
    "suspended"
  ];

  const PARTNER_TYPES = [
    "courier",
    "local_delivery",
    "freight",
    "rockyx_delivery"
  ];

  const DELIVERY_STATUSES = [
    "available",
    "unavailable"
  ];

  function readPartners() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
    } catch (error) {
      console.error("RockyX shipping partner storage error:", error);
      return [];
    }
  }

  function savePartners(partners) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(partners)
      );
      return true;
    } catch (error) {
      console.error("RockyX shipping partner save error:", error);
      return false;
    }
  }

  function createId() {
    return "shipping_partner_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function cleanText(value, fallback) {
    return typeof value === "string" && value.trim()
      ? value.trim()
      : fallback || "";
  }

  /*
   * Create a partner application.
   * The partner remains pending review by default.
   */
  function registerPartner(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "Partner details are required."
      };
    }

    if (
      typeof details.ownerId !== "string" ||
      !details.ownerId.trim()
    ) {
      return {
        success: false,
        message: "A partner owner ID is required."
      };
    }

    if (
      typeof details.name !== "string" ||
      !details.name.trim()
    ) {
      return {
        success: false,
        message: "Enter the delivery partner's name."
      };
    }

    if (!PARTNER_TYPES.includes(details.type)) {
      return {
        success: false,
        message: "Choose a valid partner type."
      };
    }

    if (
      !Array.isArray(details.serviceAreas) ||
      details.serviceAreas.length === 0
    ) {
      return {
        success: false,
        message: "Add at least one service area."
      };
    }

    const partners = readPartners();

    const partner = {
      id: createId(),
      ownerId: details.ownerId.trim(),
      name: details.name.trim(),
      type: details.type,
      description: cleanText(details.description),
      contactEmail: cleanText(details.contactEmail),
      contactPhone: cleanText(details.contactPhone),
      country: cleanText(details.country),
      serviceAreas: details.serviceAreas
        .filter(function (area) {
          return typeof area === "string" && area.trim();
        })
        .map(function (area) {
          return area.trim();
        }),
      deliveryMethods: Array.isArray(details.deliveryMethods)
        ? details.deliveryMethods.filter(function (method) {
            return typeof method === "string" && method.trim();
          })
          .map(function (method) {
            return method.trim();
          })
        : [],
      estimatedDelivery: cleanText(
        details.estimatedDelivery,
        "To be confirmed"
      ),
      status: "pending_review",
      deliveryStatus: "unavailable",
      verified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: "Prototype record. Partner identity and services are not verified."
    };

    if (partner.serviceAreas.length === 0) {
      return {
        success: false,
        message: "Add at least one valid service area."
      };
    }

    partners.push(partner);

    if (!savePartners(partners)) {
      return {
        success: false,
        message: "Could not save the partner application."
      };
    }

    return {
      success: true,
      partner: partner,
      message: "Partner application saved for review."
    };
  }

  function getPartner(partnerId) {
    return readPartners().find(function (partner) {
      return partner.id === partnerId;
    }) || null;
  }

  function getPartners(filters) {
    const options = filters || {};

    return readPartners().filter(function (partner) {
      if (options.status && partner.status !== options.status) {
        return false;
      }

      if (options.type && partner.type !== options.type) {
        return false;
      }

      if (
        options.country &&
        partner.country.toLowerCase() !==
          String(options.country).toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }

  function getOwnerPartners(ownerId) {
    return readPartners().filter(function (partner) {
      return partner.ownerId === ownerId;
    });
  }

  /*
   * Public discovery should only show active, approved partners.
   */
  function getAvailablePartners(options) {
    const filters = options || {};

    return readPartners().filter(function (partner) {
      if (
        partner.status !== "active" ||
        partner.deliveryStatus !== "available" ||
        partner.verified !== true
      ) {
        return false;
      }

      if (
        filters.country &&
        partner.country.toLowerCase() !==
          String(filters.country).toLowerCase()
      ) {
        return false;
      }

      if (
        filters.serviceArea &&
        !partner.serviceAreas.some(function (area) {
          return area.toLowerCase() ===
            String(filters.serviceArea).toLowerCase();
        })
      ) {
        return false;
      }

      if (filters.type && partner.type !== filters.type) {
        return false;
      }

      return true;
    });
  }

  /*
   * Prototype-only management function.
   * Real status and verification changes must be authorized
   * and enforced on the backend.
   */
  function updatePartner(partnerId, changes) {
    if (!changes || typeof changes !== "object") {
      return {
        success: false,
        message: "Partner changes are required."
      };
    }

    const partners = readPartners();

    const index = partners.findIndex(function (partner) {
      return partner.id === partnerId;
    });

    if (index === -1) {
      return {
        success: false,
        message: "Partner not found."
      };
    }

    if (
      changes.status &&
      !PARTNER_STATUSES.includes(changes.status)
    ) {
      return {
        success: false,
        message: "Invalid partner status."
      };
    }

    if (
      changes.type &&
      !PARTNER_TYPES.includes(changes.type)
    ) {
      return {
        success: false,
        message: "Invalid partner type."
      };
    }

    const protectedFields = [
      "id",
      "ownerId",
      "createdAt"
    ];

    const safeChanges = {};

    Object.keys(changes).forEach(function (key) {
      if (!protectedFields.includes(key)) {
        safeChanges[key] = changes[key];
      }
    });

    partners[index] = Object.assign(
      {},
      partners[index],
      safeChanges,
      {
        updatedAt: new Date().toISOString()
      }
    );

    if (!savePartners(partners)) {
      return {
        success: false,
        message: "Could not update the partner."
      };
    }

    return {
      success: true,
      partner: partners[index],
      message: "Partner record updated locally."
    };
  }

  function setPartnerStatus(partnerId, status) {
    if (!PARTNER_STATUSES.includes(status)) {
      return {
        success: false,
        message: "Invalid partner status."
      };
    }

    return updatePartner(partnerId, {
      status: status,
      deliveryStatus: status === "active"
        ? "available"
        : "unavailable"
    });
  }

  /*
   * Prototype verification flag.
   * This does not verify legal registration or identity.
   */
  function setVerification(partnerId, verified) {
    if (typeof verified !== "boolean") {
      return {
        success: false,
        message: "Verification must be true or false."
      };
    }

    return updatePartner(partnerId, {
      verified: verified
    });
  }

  function deletePartner(partnerId) {
    const partners = readPartners();

    const remaining = partners.filter(function (partner) {
      return partner.id !== partnerId;
    });

    if (remaining.length === partners.length) {
      return {
        success: false,
        message: "Partner not found."
      };
    }

    if (!savePartners(remaining)) {
      return {
        success: false,
        message: "Could not delete the partner."
      };
    }

    return {
      success: true,
      message: "Partner removed from local storage."
    };
  }

  function getPartnerTypes() {
    return PARTNER_TYPES.slice();
  }

  function getPartnerStatuses() {
    return PARTNER_STATUSES.slice();
  }

  function getDeliveryStatuses() {
    return DELIVERY_STATUSES.slice();
  }

  window.RockyXShippingPartners = {
    registerPartner: registerPartner,
    getPartner: getPartner,
    getPartners: getPartners,
    getOwnerPartners: getOwnerPartners,
    getAvailablePartners: getAvailablePartners,
    updatePartner: updatePartner,
    setPartnerStatus: setPartnerStatus,
    setVerification: setVerification,
    deletePartner: deletePartner,
    getPartnerTypes: getPartnerTypes,
    getPartnerStatuses: getPartnerStatuses,
    getDeliveryStatuses: getDeliveryStatuses
  };
})();