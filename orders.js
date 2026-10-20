/* =========================================
   ROCKYX ORDERS
   Local prototype — not a payment system
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_marketplace_orders";

  const ALLOWED_STATUSES = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled"
  ];

  function readOrders() {
    try {
      const orders = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(orders) ? orders : [];
    } catch (error) {
      return [];
    }
  }

  function saveOrders(orders) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(orders)
    );

    window.dispatchEvent(
      new CustomEvent("rockyx:orders-updated", {
        detail: { count: orders.length }
      })
    );

    return orders;
  }

  function createOrderNumber() {
    return "RX-" +
      Date.now().toString(36).toUpperCase() +
      "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function createOrder(customerId, shippingAddress) {
    if (!window.RockyXShoppingCart) {
      return {
        success: false,
        message: "Shopping cart module is not available."
      };
    }

    if (!customerId) {
      return {
        success: false,
        message: "A customer account ID is required."
      };
    }

    const checkout =
      window.RockyXShoppingCart.prepareCheckout();

    if (!checkout.success) {
      return {
        success: false,
        message: checkout.message
      };
    }

    const summary =
      window.RockyXShoppingCart.getSummary();

    const orderItems = summary.items.map(item => ({
      productId: item.productId,
      name: item.product ? item.product.name : "Unknown product",
      sellerId: item.product ? item.product.sellerId : "",
      quantity: item.quantity,
      unitPrice: item.product
        ? Number(item.product.price)
        : 0,
      currency: item.currency,
      lineTotal: item.lineTotal
    }));

    const order = {
      id: "rxo_" + Date.now().toString(36) +
        "_" + Math.random().toString(36).slice(2, 8),

      orderNumber: createOrderNumber(),
      customerId: String(customerId),

      items: orderItems,
      subtotal: checkout.subtotal,
      currency: checkout.currency,

      shippingAddress: shippingAddress || null,

      status: "pending",
      paymentStatus: "unpaid",

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      note: "Local prototype order. No payment has been processed."
    };

    const orders = readOrders();
    orders.unshift(order);
    saveOrders(orders);

    window.dispatchEvent(
      new CustomEvent("rockyx:order-created", {
        detail: {
          orderId: order.id,
          orderNumber: order.orderNumber
        }
      })
    );

    return {
      success: true,
      order: order,
      message: "Local order record created. Payment and fulfillment are not connected."
    };
  }

  function getOrders(customerId) {
    const orders = readOrders();

    if (!customerId) {
      return [];
    }

    return orders.filter(
      order => order.customerId === String(customerId)
    );
  }

  function getOrder(orderId) {
    return readOrders().find(order =>
      order.id === String(orderId) ||
      order.orderNumber === String(orderId)
    ) || null;
  }

  function updateOrderStatus(orderId, newStatus) {
    if (!ALLOWED_STATUSES.includes(newStatus)) {
      return {
        success: false,
        message: "Invalid order status."
      };
    }

    const orders = readOrders();

    const index = orders.findIndex(order =>
      order.id === String(orderId) ||
      order.orderNumber === String(orderId)
    );

    if (index === -1) {
      return {
        success: false,
        message: "Order not found."
      };
    }

    const current = orders[index];

    const transitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: []
    };

    if (
      current.status !== newStatus &&
      !transitions[current.status].includes(newStatus)
    ) {
      return {
        success: false,
        message:
          "This status change is not allowed from the current status."
      };
    }

    current.status = newStatus;
    current.updatedAt = new Date().toISOString();

    orders[index] = current;
    saveOrders(orders);

    return {
      success: true,
      order: current
    };
  }

  function cancelOrder(orderId, customerId) {
    const order = getOrder(orderId);

    if (!order) {
      return {
        success: false,
        message: "Order not found."
      };
    }

    if (order.customerId !== String(customerId)) {
      return {
        success: false,
        message: "This order does not belong to this customer."
      };
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      return {
        success: false,
        message: "This order can no longer be cancelled here."
      };
    }

    return updateOrderStatus(order.id, "cancelled");
  }

  function getOrderSummary(customerId) {
    const orders = getOrders(customerId);

    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter(
        order => order.status === "pending"
      ).length,
      shippedOrders: orders.filter(
        order => order.status === "shipped"
      ).length,
      deliveredOrders: orders.filter(
        order => order.status === "delivered"
      ).length,
      cancelledOrders: orders.filter(
        order => order.status === "cancelled"
      ).length
    };
  }

  window.RockyXOrders = {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    cancelOrder,
    getOrderSummary
  };

  console.log("RockyX Orders loaded.");
})();