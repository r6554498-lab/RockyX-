/* =========================================
   ROCKYX SUBSCRIPTIONS
   Local subscription management foundation
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_subscriptions";

  const SUBSCRIPTION_TYPES = [
    "rockyx_pro",
    "creator",
    "template"
  ];

  const STATUSES = [
    "pending",
    "active",
    "cancelled",
    "expired",
    "failed"
  ];

  const PRO_PLANS = {
    monthly: {
      id: "pro_monthly",
      name: "RockyX Pro Monthly",
      interval: "month"
    },
    yearly: {
      id: "pro_yearly",
      name: "RockyX Pro Yearly",
      interval: "year"
    }
  };

  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return "subscription-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 10);
  }

  function normalizeId(value) {
    if (typeof value !== "string" && typeof value !== "number") {
      return null;
    }

    const id = String(value).trim();
    return id || null;
  }

  function loadSubscriptions() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const subscriptions = saved ? JSON.parse(saved) : [];

      return Array.isArray(subscriptions) ? subscriptions : [];
    } catch (error) {
      console.error(
        "RockyX subscriptions could not be loaded:",
        error
      );

      return [];
    }
  }

  function saveSubscriptions(subscriptions) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(subscriptions)
      );

      window.dispatchEvent(
        new CustomEvent("rockyx:subscriptions-updated", {
          detail: {
            count: subscriptions.length
          }
        })
      );

      return true;
    } catch (error) {
      console.error(
        "RockyX subscriptions could not be saved:",
        error
      );

      return false;
    }
  }

  function addMonths(date, months) {
    const result = new Date(date);
    const originalDay = result.getDate();

    result.setDate(1);
    result.setMonth(result.getMonth() + months);

    const lastDay = new Date(
      result.getFullYear(),
      result.getMonth() + 1,
      0
    ).getDate();

    result.setDate(Math.min(originalDay, lastDay));

    return result;
  }

  function getPeriodEnd(startDate, interval) {
    if (interval === "month") {
      return addMonths(startDate, 1).toISOString();
    }

    if (interval === "year") {
      return addMonths(startDate, 12).toISOString();
    }

    if (interval === "one_time") {
      return null;
    }

    return null;
  }

  function createSubscription(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        error: "Subscription details are required."
      };
    }

    const userId = normalizeId(details.userId);
    const type = details.type;
    const productId = normalizeId(details.productId);

    if (!userId || !SUBSCRIPTION_TYPES.includes(type)) {
      return {
        success: false,
        error: "A valid user ID and subscription type are required."
      };
    }

    if (!productId) {
      return {
        success: false,
        error: "A product or plan ID is required."
      };
    }

    if (type === "creator" && !normalizeId(details.creatorId)) {
      return {
        success: false,
        error: "A creator ID is required for creator subscriptions."
      };
    }

    if (type === "template" && !normalizeId(details.templateId)) {
      return {
        success: false,
        error: "A template ID is required for template purchases."
      };
    }

    const subscriptions = loadSubscriptions();

    const existing = subscriptions.find(subscription => {
      if (
        subscription.userId !== userId ||
        subscription.type !== type ||
        subscription.status !== "active"
      ) {
        return false;
      }

      if (type === "creator") {
        return subscription.creatorId ===
          normalizeId(details.creatorId);
      }

      if (type === "template") {
        return subscription.templateId ===
          normalizeId(details.templateId);
      }

      return true;
    });

    if (existing) {
      return {
        success: false,
        error: "An active subscription or entitlement already exists.",
        subscription: { ...existing }
      };
    }

    const interval = details.interval || "month";

    if (!["month", "year", "one_time"].includes(interval)) {
      return {
        success: false,
        error: "Unsupported billing interval."
      };
    }

    const now = new Date();
    const subscription = {
      id: createId(),
      userId,
      type,
      productId,
      creatorId: type === "creator"
        ? normalizeId(details.creatorId)
        : null,
      templateId: type === "template"
        ? normalizeId(details.templateId)
        : null,
      planId: normalizeId(details.planId),
      interval,
      amountMinor: Number.isSafeInteger(details.amountMinor) &&
        details.amountMinor >= 0
          ? details.amountMinor
          : null,
      currency: typeof details.currency === "string" &&
        /^[A-Z]{3}$/.test(details.currency.trim().toUpperCase())
          ? details.currency.trim().toUpperCase()
          : "GHS",
      status: "pending",
      paymentReference: null,
      startedAt: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    subscriptions.unshift(subscription);

    if (!saveSubscriptions(subscriptions)) {
      return {
        success: false,
        error: "The subscription could not be saved."
      };
    }

    return {
      success: true,
      subscription: { ...subscription }
    };
  }

  /*
   * DEMO ONLY:
   * Never use this client-side function to confirm real payment.
   * Production activation must come from a trusted backend
   * after the payment provider verifies the transaction.
   */
  function activateSubscription(subscriptionId, paymentReference) {
    const id = normalizeId(subscriptionId);

    if (!id) {
      return {
        success: false,
        error: "A valid subscription ID is required."
      };
    }

    const subscriptions = loadSubscriptions();

    const subscription = subscriptions.find(
      item => item.id === id
    );

    if (!subscription) {
      return {
        success: false,
        error: "Subscription not found."
      };
    }

    if (subscription.status !== "pending") {
      return {
        success: false,
        error: "Only pending subscriptions can be activated."
      };
    }

    const now = new Date();

    subscription.status = "active";
    subscription.startedAt = now.toISOString();
    subscription.updatedAt = now.toISOString();
    subscription.paymentReference =
      typeof paymentReference === "string"
        ? paymentReference.trim().slice(0, 150)
        : null;

    subscription.currentPeriodEnd = getPeriodEnd(
      now,
      subscription.interval
    );

    if (!saveSubscriptions(subscriptions)) {
      return {
        success: false,
        error: "Subscription activation could not be saved."
      };
    }

    window.dispatchEvent(
      new CustomEvent("rockyx:subscription-activated", {
        detail: {
          subscriptionId: subscription.id,
          type: subscription.type
        }
      })
    );

    return {
      success: true,
      subscription: { ...subscription }
    };
  }

  function getSubscription(subscriptionId) {
    const id = normalizeId(subscriptionId);
    if (!id) return null;

    const subscription = loadSubscriptions().find(
      item => item.id === id
    );

    return subscription ? { ...subscription } : null;
  }

  function getUserSubscriptions(userId, options) {
    const id = normalizeId(userId);
    if (!id) return [];

    const settings = options || {};

    return loadSubscriptions()
      .filter(subscription => {
        if (subscription.userId !== id) return false;

        if (settings.type && subscription.type !== settings.type) {
          return false;
        }

        if (
          settings.status &&
          subscription.status !== settings.status
        ) {
          return false;
        }

        return true;
      })
      .map(subscription => ({ ...subscription }));
  }

  function cancelSubscription(subscriptionId, userId) {
    const id = normalizeId(subscriptionId);
    const ownerId = normalizeId(userId);

    if (!id || !ownerId) return false;

    const subscriptions = loadSubscriptions();

    const subscription = subscriptions.find(
      item => item.id === id && item.userId === ownerId
    );

    if (
      !subscription ||
      subscription.status !== "active"
    ) {
      return false;
    }

    subscription.cancelAtPeriodEnd = true;
    subscription.updatedAt = new Date().toISOString();

    return saveSubscriptions(subscriptions);
  }

  function expireSubscription(subscriptionId) {
    const id = normalizeId(subscriptionId);
    if (!id) return false;

    const subscriptions = loadSubscriptions();

    const subscription = subscriptions.find(
      item => item.id === id
    );

    if (!subscription || subscription.status !== "active") {
      return false;
    }

    subscription.status = "expired";
    subscription.updatedAt = new Date().toISOString();

    return saveSubscriptions(subscriptions);
  }

  function hasActivePro(userId) {
    const id = normalizeId(userId);
    if (!id) return false;

    const now = Date.now();

    return loadSubscriptions().some(subscription => {
      if (
        subscription.userId !== id ||
        subscription.type !== "rockyx_pro" ||
        subscription.status !== "active"
      ) {
        return false;
      }

      if (!subscription.currentPeriodEnd) return true;

      return new Date(subscription.currentPeriodEnd).getTime() > now;
    });
  }

  function hasCreatorSubscription(userId, creatorId) {
    const id = normalizeId(userId);
    const targetCreator = normalizeId(creatorId);

    if (!id || !targetCreator) return false;

    const now = Date.now();

    return loadSubscriptions().some(subscription => {
      if (
        subscription.userId !== id ||
        subscription.type !== "creator" ||
        subscription.creatorId !== targetCreator ||
        subscription.status !== "active"
      ) {
        return false;
      }

      if (!subscription.currentPeriodEnd) return true;

      return new Date(subscription.currentPeriodEnd).getTime() > now;
    });
  }

  function hasTemplateEntitlement(userId, templateId) {
    const id = normalizeId(userId);
    const targetTemplate = normalizeId(templateId);

    if (!id || !targetTemplate) return false;

    if (hasActivePro(id)) {
      // Production must check whether the specific template
      // is included in the user's Pro entitlement.
      return true;
    }

    return loadSubscriptions().some(subscription => {
      if (
        subscription.userId !== id ||
        subscription.type !== "template" ||
        subscription.templateId !== targetTemplate ||
        subscription.status !== "active"
      ) {
        return false;
      }

      // Individual template purchases are one-time entitlements.
      return subscription.interval === "one_time";
    });
  }

  window.RockyXSubscriptions = {
    createSubscription,
    activateSubscription,
    getSubscription,
    getUserSubscriptions,
    cancelSubscription,
    expireSubscription,
    hasActivePro,
    hasCreatorSubscription,
    hasTemplateEntitlement,
    getSubscriptionTypes: () => [...SUBSCRIPTION_TYPES],
    getStatuses: () => [...STATUSES],
    getProPlans: () => JSON.parse(JSON.stringify(PRO_PLANS))
  };

})();