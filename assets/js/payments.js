/* =========================================
   ROCKYX PAYMENTS
   Local prototype — no real money processed
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_marketplace_payments";

  const PAYMENT_METHODS = [
    "mobile_money",
    "card",
    "bank_transfer",
    "pay_on_delivery"
  ];

  const PAYMENT_STATUSES = [
    "pending",
    "processing",
    "successful",
    "failed",
    "cancelled",
    "refunded"
  ];

  function readPayments() {
    try {
      const payments = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(payments) ? payments : [];
    } catch (error) {
      return [];
    }
  }

  function savePayments(payments) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(payments)
    );

    window.dispatchEvent(
      new CustomEvent("rockyx:payments-updated", {
        detail: { count: payments.length }
      })
    );

    return payments;
  }

  function createPayment(orderId, method) {
    if (!orderId) {
      return {
        success: false,
        message: "An order ID is required."
      };
    }

    if (!PAYMENT_METHODS.includes(method)) {
      return {
        success: false,
        message: "Choose a supported payment method."
      };
    }

    if (!window.RockyXOrders) {
      return {
        success: false,
        message: "RockyX Orders is not available."
      };
    }

    const order = window.RockyXOrders.getOrder(orderId);

    if (!order) {
      return {
        success: false,
        message: "Order not found."
      };
    }

    if (order.status === "cancelled") {
      return {
        success: false,
        message: "Payment cannot be started for a cancelled order."
      };
    }

    if (order.paymentStatus === "paid") {
      return {
        success: false,
        message: "This order is already marked as paid."
      };
    }

    const payments = readPayments();

    const existingPending = payments.find(payment =>
      payment.orderId === order.id &&
      ["pending", "processing"].includes(payment.status)
    );

    if (existingPending) {
      return {
        success: false,
        message: "A payment attempt is already pending for this order."
      };
    }

    const payment = {
      id: "rxpay_" + Date.now().toString(36) +
        "_" + Math.random().toString(36).slice(2, 8),

      reference: "RXP-" +
        Date.now().toString(36).toUpperCase() +
        "-" +
        Math.random().toString(36).slice(2, 6).toUpperCase(),

      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,

      amount: Number(order.subtotal),
      currency: String(order.currency || "GHS"),

      method: method,
      status: "pending",

      provider: null,
      providerTransactionId: null,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      message: "Local payment record created. No money has been processed."
    };

    payments.unshift(payment);
    savePayments(payments);

    window.dispatchEvent(
      new CustomEvent("rockyx:payment-created", {
        detail: {
          paymentId: payment.id,
          reference: payment.reference,
          orderId: payment.orderId
        }
      })
    );

    return {
      success: true,
      payment: payment,
      message: payment.message
    };
  }

  function getPayment(paymentId) {
    return readPayments().find(payment =>
      payment.id === String(paymentId) ||
      payment.reference === String(paymentId)
    ) || null;
  }

  function getOrderPayments(orderId) {
    return readPayments().filter(payment =>
      payment.orderId === String(orderId)
    );
  }

  function getCustomerPayments(customerId) {
    if (!customerId) {
      return [];
    }

    return readPayments().filter(payment =>
      payment.customerId === String(customerId)
    );
  }

  function getPaymentMethods() {
    return PAYMENT_METHODS.map(method => ({
      id: method,
      label: {
        mobile_money: "Mobile Money",
        card: "Debit or Credit Card",
        bank_transfer: "Bank Transfer",
        pay_on_delivery: "Pay on Delivery"
      }[method]
    }));
  }

  function getStatuses() {
    return PAYMENT_STATUSES.slice();
  }

  function getSummary(customerId) {
    const payments = getCustomerPayments(customerId);

    return {
      totalAttempts: payments.length,
      pending: payments.filter(
        payment => payment.status === "pending"
      ).length,
      successful: payments.filter(
        payment => payment.status === "successful"
      ).length,
      failed: payments.filter(
        payment => payment.status === "failed"
      ).length,
      refunded: payments.filter(
        payment => payment.status === "refunded"
      ).length
    };
  }

  /*
   * This module deliberately does not expose a function
   * that lets the browser mark a payment as successful.
   *
   * In production, payment status must be confirmed by
   * the trusted payment provider through a secure backend.
   */

  window.RockyXPayments = {
    createPayment,
    getPayment,
    getOrderPayments,
    getCustomerPayments,
    getPaymentMethods,
    getStatuses,
    getSummary
  };

  console.log("RockyX Payments module loaded.");
})();