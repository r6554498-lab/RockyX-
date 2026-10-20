/* =========================================
   ROCKYX SHIPPING & DELIVERY
   Local prototype
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_marketplace_shipments";

  const SHIPPING_METHODS = [
    {
      id: "standard",
      name: "Standard Delivery",
      estimatedDays: { min: 3, max: 7 },
      baseFee: 25
    },
    {
      id: "express",
      name: "Express Delivery",
      estimatedDays: { min: 1, max: 3 },
      baseFee: 50
    },
    {
      id: "pickup",
      name: "Pickup",
      estimatedDays: { min: 0, max: 2 },
      baseFee: 0
    }
  ];

  const SHIPMENT_STATUSES = [
    "pending",
    "processing",
    "ready_for_dispatch",
    "shipped",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "delivery_failed",
    "returned",
    "cancelled"
  ];

  function readShipments() {
    try {
      const shipments = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(shipments) ? shipments : [];
    } catch (error) {
      return [];
    }
  }

  function saveShipments(shipments) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(shipments)
    );

    window.dispatchEvent(
      new CustomEvent("rockyx:shipping-updated", {
        detail: { count: shipments.length }
      })
    );

    return shipments;
  }

  function getMethods() {
    return SHIPPING_METHODS.map(method => ({
      ...method,
      estimatedDays: { ...method.estimatedDays }
    }));
  }

  function getMethod(methodId) {
    return SHIPPING_METHODS.find(
      method => method.id === String(methodId)
    ) || null;
  }

  function calculateFee(methodId, options) {
    options = options || {};

    const method = getMethod(methodId);

    if (!method) {
      return {
        success: false,
        message: "Choose a supported shipping method."
      };
    }

    const distanceKm = Number(options.distanceKm || 0);
    const weightKg = Number(options.weightKg || 0);

    if (
      !Number.isFinite(distanceKm) ||
      !Number.isFinite(weightKg) ||
      distanceKm < 0 ||
      weightKg < 0
    ) {
      return {
        success: false,
        message: "Distance and weight must be valid non-negative numbers."
      };
    }

    // Illustrative estimates only, not live carrier quotes.
    let fee = method.baseFee;

    if (method.id !== "pickup") {
      fee += Math.ceil(distanceKm / 10) * 2;
      fee += Math.ceil(weightKg) * 3;
    }

    return {
      success: true,
      method: method.id,
      currency: "GHS",
      fee: Number(fee.toFixed(2)),
      estimatedDays: { ...method.estimatedDays },
      note: "Illustrative estimate only; confirm actual delivery costs with a provider."
    };
  }

  function validateAddress(address) {
    if (!address || typeof address !== "object") {
      return {
        success: false,
        message: "A delivery address is required."
      };
    }

    const requiredFields = [
      "recipientName",
      "phone",
      "addressLine",
      "city",
      "region"
    ];

    const missing = requiredFields.filter(field =>
      !String(address[field] || "").trim()
    );

    if (missing.length > 0) {
      return {
        success: false,
        message: "Please provide: " + missing.join(", ") + "."
      };
    }

    return { success: true };
  }

  function createShipment(data) {
    if (!data || typeof data !== "object") {
      return {
        success: false,
        message: "Shipment information is required."
      };
    }

    if (!String(data.orderId || "").trim()) {
      return {
        success: false,
        message: "An order ID is required."
      };
    }

    const addressResult = validateAddress(data.address);

    if (!addressResult.success) {
      return addressResult;
    }

    const method = getMethod(data.method);

    if (!method) {
      return {
        success: false,
        message: "Choose a supported shipping method."
      };
    }

    const feeResult = calculateFee(data.method, {
      distanceKm: data.distanceKm,
      weightKg: data.weightKg
    });

    if (!feeResult.success) {
      return feeResult;
    }

    const shipments = readShipments();

    const duplicate = shipments.find(shipment =>
      shipment.orderId === String(data.orderId) &&
      !["cancelled", "returned"].includes(shipment.status)
    );

    if (duplicate) {
      return {
        success: false,
        message: "An active shipment already exists for this order."
      };
    }

    const shipment = {
      id: "rxs_" + Date.now().toString(36) +
        "_" + Math.random().toString(36).slice(2, 8),

      trackingNumber: "RXD-" +
        Date.now().toString(36).toUpperCase() +
        "-" +
        Math.random().toString(36).slice(2, 6).toUpperCase(),

      orderId: String(data.orderId),
      customerId: String(data.customerId || ""),
      sellerId: String(data.sellerId || ""),

      method: method.id,
      address: {
        recipientName: String(data.address.recipientName).trim(),
        phone: String(data.address.phone).trim(),
        addressLine: String(data.address.addressLine).trim(),
        city: String(data.address.city).trim(),
        region: String(data.address.region).trim(),
        postalCode: String(data.address.postalCode || "").trim(),
        deliveryInstructions: String(
          data.address.deliveryInstructions || ""
        ).trim()
      },

      fee: feeResult.fee,
      currency: feeResult.currency,
      estimatedDays: feeResult.estimatedDays,

      status: "pending",
      history: [
        {
          status: "pending",
          timestamp: new Date().toISOString(),
          note: "Local shipment record created."
        }
      ],

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    shipments.unshift(shipment);
    saveShipments(shipments);

    return {
      success: true,
      shipment: shipment,
      message: "Local shipment record created. Carrier booking is not connected."
    };
  }

  function getShipment(shipmentId) {
    return readShipments().find(shipment =>
      shipment.id === String(shipmentId) ||
      shipment.trackingNumber === String(shipmentId)
    ) || null;
  }

  function getOrderShipments(orderId) {
    return readShipments().filter(shipment =>
      shipment.orderId === String(orderId)
    );
  }

  function getCustomerShipments(customerId) {
    if (!customerId) {
      return [];
    }

    return readShipments().filter(shipment =>
      shipment.customerId === String(customerId)
    );
  }

  function updateStatus(shipmentId, newStatus, note) {
    if (!SHIPMENT_STATUSES.includes(newStatus)) {
      return {
        success: false,
        message: "Invalid shipment status."
      };
    }

    const shipments = readShipments();

    const index = shipments.findIndex(shipment =>
      shipment.id === String(shipmentId) ||
      shipment.trackingNumber === String(shipmentId)
    );

    if (index === -1) {
      return {
        success: false,
        message: "Shipment not found."
      };
    }

    const current = shipments[index];

    const transitions = {
      pending: ["processing", "cancelled"],
      processing: ["ready_for_dispatch", "cancelled"],
      ready_for_dispatch: ["shipped", "cancelled"],
      shipped: ["in_transit", "out_for_delivery"],
      in_transit: ["out_for_delivery", "delivery_failed"],
      out_for_delivery: ["delivered", "delivery_failed"],
      delivery_failed: ["in_transit", "out_for_delivery", "returned"],
      delivered: [],
      returned: [],
      cancelled: []
    };

    if (
      current.status !== newStatus &&
      !transitions[current.status].includes(newStatus)
    ) {
      return {
        success: false,
        message: "That status change is not allowed."
      };
    }

    current.status = newStatus;
    current.updatedAt = new Date().toISOString();

    current.history.push({
      status: newStatus,
      timestamp: current.updatedAt,
      note: String(note || "")
    });

    shipments[index] = current;
    saveShipments(shipments);

    return {
      success: true,
      shipment: current
    };
  }

  function getTrackingHistory(shipmentId) {
    const shipment = getShipment(shipmentId);

    return shipment ? shipment.history.slice() : [];
  }

  window.RockyXShipping = {
    getMethods,
    getMethod,
    calculateFee,
    validateAddress,
    createShipment,
    getShipment,
    getOrderShipments,
    getCustomerShipments,
    updateStatus,
    getTrackingHistory
  };

  console.log("RockyX Shipping loaded.");
})();