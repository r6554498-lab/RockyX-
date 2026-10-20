/*
 * RockyX Delivery Management
 *
 * Local prototype for tracking marketplace deliveries,
 * assigning delivery partners, and recording delivery statuses.
 *
 * IMPORTANT:
 * This is not a live courier integration.
 * Production delivery assignments, tracking, and proof of
 * delivery must be validated by a secure backend.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_delivery_management";

  const STATUSES = [
    "awaiting_dispatch",
    "ready_for_pickup",
    "assigned",
    "picked_up",
    "in_transit",
    "arrived_at_destination",
    "delivered",
    "delivery_failed",
    "returned_to_sender",
    "cancelled"
  ];

  function readDeliveries() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
    } catch (error) {
      console.error("RockyX delivery storage error:", error);
      return [];
    }
  }

  function saveDeliveries(deliveries) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(deliveries)
      );
      return true;
    } catch (error) {
      console.error("RockyX delivery save error:", error);
      return false;
    }
  }

  function createId(prefix) {
    return prefix + "_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function cleanText(value) {
    return typeof value === "string"
      ? value.trim()
      : "";
  }

  function validateAddress(address, label) {
    if (!address || typeof address !== "object") {
      return label + " address is required.";
    }

    if (
      typeof address.addressLine !== "string" ||
      !address.addressLine.trim()
    ) {
      return label + " address line is required.";
    }

    if (
      typeof address.city !== "string" ||
      !address.city.trim()
    ) {
      return label + " city is required.";
    }

    if (
      typeof address.country !== "string" ||
      !address.country.trim()
    ) {
      return label + " country is required.";
    }

    return null;
  }

  function addHistory(delivery, status, note) {
    if (!Array.isArray(delivery.history)) {
      delivery.history = [];
    }

    delivery.history.push({
      status: status,
      note: note || "",
      timestamp: new Date().toISOString()
    });
  }

  /*
   * Create a delivery record for an existing order.
   *
   * The backend must verify that the order exists,
   * that the seller is authorized, and that the order
   * is eligible for dispatch.
   */
  function createDelivery(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "Delivery details are required."
      };
    }

    if (
      typeof details.orderId !== "string" ||
      !details.orderId.trim()
    ) {
      return {
        success: false,
        message: "An order ID is required."
      };
    }

    if (
      typeof details.buyerId !== "string" ||
      !details.buyerId.trim()
    ) {
      return {
        success: false,
        message: "A buyer ID is required."
      };
    }

    if (
      typeof details.sellerId !== "string" ||
      !details.sellerId.trim()
    ) {
      return {
        success: false,
        message: "A seller ID is required."
      };
    }

    const pickupError = validateAddress(
      details.pickupAddress,
      "Pickup"
    );

    if (pickupError) {
      return {
        success: false,
        message: pickupError
      };
    }

    const destinationError = validateAddress(
      details.deliveryAddress,
      "Delivery"
    );

    if (destinationError) {
      return {
        success: false,
        message: destinationError
      };
    }

    const deliveries = readDeliveries();

    const existing = deliveries.find(function (delivery) {
      return delivery.orderId === details.orderId.trim() &&
        ![
          "cancelled",
          "returned_to_sender"
        ].includes(delivery.status);
    });

    if (existing) {
      return {
        success: false,
        message: "An active delivery record already exists for this order.",
        delivery: existing
      };
    }

    const delivery = {
      id: createId("delivery"),
      trackingNumber: createId("RX"),
      orderId: details.orderId.trim(),
      buyerId: details.buyerId.trim(),
      sellerId: details.sellerId.trim(),
      partnerId: null,
      pickupAddress: {
        addressLine: cleanText(
          details.pickupAddress.addressLine
        ),
        city: cleanText(details.pickupAddress.city),
        region: cleanText(details.pickupAddress.region),
        country: cleanText(details.pickupAddress.country),
        postalCode: cleanText(details.pickupAddress.postalCode)
      },
      deliveryAddress: {
        addressLine: cleanText(
          details.deliveryAddress.addressLine
        ),
        city: cleanText(details.deliveryAddress.city),
        region: cleanText(details.deliveryAddress.region),
        country: cleanText(details.deliveryAddress.country),
        postalCode: cleanText(details.deliveryAddress.postalCode)
      },
      deliveryMethod: details.deliveryMethod || "standard",
      deliveryFeeMinor: Number.isSafeInteger(
        details.deliveryFeeMinor
      ) && details.deliveryFeeMinor >= 0
        ? details.deliveryFeeMinor
        : 0,
      currency: details.currency || "GHS",
      status: "awaiting_dispatch",
      estimatedDeliveryAt: details.estimatedDeliveryAt || null,
      trackingReference: null,
      deliveryNotes: cleanText(details.deliveryNotes),
      failureReason: null,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: "Local prototype record. Order and address details are not verified."
    };

    addHistory(
      delivery,
      delivery.status,
      "Delivery record created."
    );

    deliveries.push(delivery);

    if (!saveDeliveries(deliveries)) {
      return {
        success: false,
        message: "Could not save the delivery record."
      };
    }

    return {
      success: true,
      delivery: delivery,
      message: "Delivery record created locally."
    };
  }

  function getDelivery(deliveryId) {
    return readDeliveries().find(function (delivery) {
      return delivery.id === deliveryId;
    }) || null;
  }

  function getByTrackingNumber(trackingNumber) {
    return readDeliveries().find(function (delivery) {
      return delivery.trackingNumber === trackingNumber;
    }) || null;
  }

  function getOrderDeliveries(orderId) {
    return readDeliveries().filter(function (delivery) {
      return delivery.orderId === orderId;
    });
  }

  function getBuyerDeliveries(buyerId) {
    return readDeliveries().filter(function (delivery) {
      return delivery.buyerId === buyerId;
    });
  }

  function getSellerDeliveries(sellerId) {
    return readDeliveries().filter(function (delivery) {
      return delivery.sellerId === sellerId;
    });
  }

  function getPartnerDeliveries(partnerId) {
    return readDeliveries().filter(function (delivery) {
      return delivery.partnerId === partnerId;
    });
  }

  function getAllDeliveries(filters) {
    const options = filters || {};

    return readDeliveries().filter(function (delivery) {
      if (
        options.status &&
        delivery.status !== options.status
      ) {
        return false;
      }

      if (
        options.partnerId &&
        delivery.partnerId !== options.partnerId
      ) {
        return false;
      }

      if (
        options.country &&
        delivery.deliveryAddress.country.toLowerCase() !==
          String(options.country).toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }

  /*
   * Prototype-only assignment.
   * Production assignment must verify the partner's approval,
   * service area, availability, and authorization server-side.
   */
  function assignPartner(deliveryId, partnerId) {
    if (
      typeof partnerId !== "string" ||
      !partnerId.trim()
    ) {
      return {
        success: false,
        message: "A delivery partner ID is required."
      };
    }

    const deliveries = readDeliveries();

    const delivery = deliveries.find(function (item) {
      return item.id === deliveryId;
    });

    if (!delivery) {
      return {
        success: false,
        message: "Delivery not found."
      };
    }

    if (
      [
        "delivered",
        "cancelled",
        "returned_to_sender"
      ].includes(delivery.status)
    ) {
      return {
        success: false,
        message: "This delivery can no longer be assigned."
      };
    }

    delivery.partnerId = partnerId.trim();
    delivery.status = "assigned";
    delivery.updatedAt = new Date().toISOString();

    addHistory(
      delivery,
      "assigned",
      "Partner assignment recorded locally."
    );

    if (!saveDeliveries(deliveries)) {
      return {
        success: false,
        message: "Could not save the partner assignment."
      };
    }

    return {
      success: true,
      delivery: delivery,
      message: "Partner assignment recorded locally."
    };
  }

  /*
   * Update delivery status.
   * This prototype records statuses but cannot verify
   * physical pickup, location, or successful delivery.
   */
  function updateStatus(deliveryId, status, details) {
    if (!STATUSES.includes(status)) {
      return {
        success: false,
        message: "Invalid delivery status."
      };
    }

    const deliveries = readDeliveries();

    const delivery = deliveries.find(function (item) {
      return item.id === deliveryId;
    });

    if (!delivery) {
      return {
        success: false,
        message: "Delivery not found."
      };
    }

    const options = details || {};

    if (
      delivery.status === "delivered" ||
      delivery.status === "cancelled" ||
      delivery.status === "returned_to_sender"
    ) {
      return {
        success: false,
        message: "This delivery is already closed."
      };
    }

    if (
      status === "assigned" &&
      !delivery.partnerId
    ) {
      return {
        success: false,
        message: "Assign a delivery partner first."
      };
    }

    if (
      status === "delivery_failed" &&
      !cleanText(options.failureReason)
    ) {
      return {
        success: false,
        message: "Provide a reason for the failed delivery."
      };
    }

    delivery.status = status;
    delivery.updatedAt = new Date().toISOString();

    if (status === "delivery_failed") {
      delivery.failureReason = cleanText(
        options.failureReason
      );
    }

    if (options.trackingReference) {
      delivery.trackingReference = cleanText(
        options.trackingReference
      );
    }

    addHistory(
      delivery,
      status,
      cleanText(options.note)
    );

    if (!saveDeliveries(deliveries)) {
      return {
        success: false,
        message: "Could not update the delivery."
      };
    }

    return {
      success: true,
      delivery: delivery,
      message: "Delivery status updated locally."
    };
  }

  function cancelDelivery(deliveryId, reason) {
    const deliveries = readDeliveries();

    const delivery = deliveries.find(function (item) {
      return item.id === deliveryId;
    });

    if (!delivery) {
      return {
        success: false,
        message: "Delivery not found."
      };
    }

    if (
      ["delivered", "cancelled", "returned_to_sender"].includes(
        delivery.status
      )
    ) {
      return {
        success: false,
        message: "This delivery is already closed."
      };
    }

    delivery.status = "cancelled";
    delivery.updatedAt = new Date().toISOString();

    addHistory(
      delivery,
      "cancelled",
      cleanText(reason) || "Delivery cancelled."
    );

    if (!saveDeliveries(deliveries)) {
      return {
        success: false,
        message: "Could not cancel the delivery."
      };
    }

    return {
      success: true,
      delivery: delivery,
      message: "Delivery cancelled in the local prototype."
    };
  }

  function getTrackingHistory(deliveryId) {
    const delivery = getDelivery(deliveryId);

    return delivery && Array.isArray(delivery.history)
      ? delivery.history.slice()
      : [];
  }

  function getStatuses() {
    return STATUSES.slice();
  }

  window.RockyXDeliveryManagement = {
    createDelivery: createDelivery,
    getDelivery: getDelivery,
    getByTrackingNumber: getByTrackingNumber,
    getOrderDeliveries: getOrderDeliveries,
    getBuyerDeliveries: getBuyerDeliveries,
    getSellerDeliveries: getSellerDeliveries,
    getPartnerDeliveries: getPartnerDeliveries,
    getAllDeliveries: getAllDeliveries,
    assignPartner: assignPartner,
    updateStatus: updateStatus,
    cancelDelivery: cancelDelivery,
    getTrackingHistory: getTrackingHistory,
    getStatuses: getStatuses
  };
})();