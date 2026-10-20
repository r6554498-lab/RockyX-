/* =========================================
   ROCKYX SUBSCRIPTIONS
   Pro, creator memberships, and entitlements
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_subscriptions";
  const PURCHASES_KEY = "rockyx_template_purchases";

  const TYPES = [
    "rockyx_pro",
    "creator_membership"
  ];

  const STATUSES = [
    "pending",
    "active",
    "cancelled",
    "expired"
  ];

  const PRO_PLANS = [
    {
      id: "pro_monthly",
      name: "RockyX Pro Monthly",
      interval: "month",
      currency: "GHS",
      price: null
    },
    {
      id: "pro_yearly",
      name: "RockyX Pro Yearly",
      interval: "year",
      currency: "GHS",
      price: null
    }
  ];

  function load(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function createId(prefix) {
    return prefix + "_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 9);
  }

  function getCurrentUser() {
    if (window.RockyXUserAccounts) {
      return window.RockyXUserAccounts.getCurrentUser();
    }

    return null;
  }

  function resolveUserId(userId) {
    if (userId) {
      return String(userId);
    }

    const user = getCurrentUser();
    return user && user.id ? String(user.id) : null;
  }

  function getSubscriptionTypes() {
    return TYPES.slice();
  }

  function getStatuses() {
    return STATUSES.slice();
  }

  function getProPlans() {
    return PRO_PLANS.map(function (plan) {
      return Object.assign({}, plan);
    });
  }

  function createSubscription(options) {
    options = options || {};

    const userId = resolveUserId(options.userId);
    const type = String(options.type || "");
    const planId = String(options.planId || "");

    if (!userId) {
      return {
        success: false,
        message: "A user profile is required."
      };
    }

    if (!TYPES.includes(type)) {
      return {
        success: false,
        message: "Unsupported subscription type."
      };
    }

    if (
      type === "rockyx_pro" &&
      !PRO_PLANS.some(function (plan) {
        return plan.id === planId;
      })
    ) {
      return {
        success: false,
        message: "Choose a valid RockyX Pro plan."
      };
    }

    if (
      type === "creator_membership" &&
      !String(options.creatorId || "").trim()
    ) {
      return {
        success: false,
        message: "A creator ID is required."
      };
    }

    const subscription = {
      id: createId("subscription"),
      userId: userId,
      type: type,
      planId: planId || null,
      creatorId: options.creatorId
        ? String(options.creatorId)
        : null,
      status: "pending",
      startedAt: null,
      expiresAt: null,
      cancelledAt: null,
      createdAt: new Date().toISOString()
    };

    const subscriptions = load(STORAGE_KEY);
    subscriptions.push(subscription);
    save(STORAGE_KEY, subscriptions);

    return {
      success: true,
      subscription: subscription,
      message: "Subscription record created. Payment is not connected."
    };
  }

  function getSubscription(subscriptionId) {
    return load(STORAGE_KEY).find(function (item) {
      return item.id === subscriptionId;
    }) || null;
  }

  function getUserSubscriptions(userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return [];
    }

    return load(STORAGE_KEY).filter(function (item) {
      return item.userId === userId;
    });
  }

  function activateSubscription(subscriptionId, durationDays) {
    const subscriptions = load(STORAGE_KEY);

    const subscription = subscriptions.find(function (item) {
      return item.id === subscriptionId;
    });

    if (!subscription) {
      return {
        success: false,
        message: "Subscription not found."
      };
    }

    if (subscription.status === "expired") {
      return {
        success: false,
        message: "Expired subscriptions must be renewed."
      };
    }

    durationDays = Number(durationDays || 30);

    if (!Number.isFinite(durationDays) || durationDays <= 0) {
      return {
        success: false,
        message: "Subscription duration must be positive."
      };
    }

    const now = new Date();

    subscription.status = "active";
    subscription.startedAt = now.toISOString();
    subscription.expiresAt = new Date(
      now.getTime() + durationDays * 86400000
    ).toISOString();

    save(STORAGE_KEY, subscriptions);

    return {
      success: true,
      subscription: subscription
    };
  }

  function cancelSubscription(subscriptionId) {
    const subscriptions = load(STORAGE_KEY);

    const subscription = subscriptions.find(function (item) {
      return item.id === subscriptionId;
    });

    if (!subscription) {
      return {
        success: false,
        message: "Subscription not found."
      };
    }

    subscription.status = "cancelled";
    subscription.cancelledAt = new Date().toISOString();

    save(STORAGE_KEY, subscriptions);

    return {
      success: true,
      subscription: subscription
    };
  }

  function expireSubscription(subscriptionId) {
    const subscriptions = load(STORAGE_KEY);

    const subscription = subscriptions.find(function (item) {
      return item.id === subscriptionId;
    });

    if (!subscription) {
      return {
        success: false,
        message: "Subscription not found."
      };
    }

    subscription.status = "expired";

    save(STORAGE_KEY, subscriptions);

    return {
      success: true,
      subscription: subscription
    };
  }

  function isActive(subscription) {
    if (!subscription || subscription.status !== "active") {
      return false;
    }

    if (!subscription.expiresAt) {
      return true;
    }

    return Date.parse(subscription.expiresAt) > Date.now();
  }

  function hasActivePro(userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return false;
    }

    return getUserSubscriptions(userId).some(function (subscription) {
      return (
        subscription.type === "rockyx_pro" &&
        isActive(subscription)
      );
    });
  }

  function hasCreatorSubscription(userId, creatorId) {
    userId = resolveUserId(userId);

    if (!userId || !creatorId) {
      return false;
    }

    return getUserSubscriptions(userId).some(function (subscription) {
      return (
        subscription.type === "creator_membership" &&
        subscription.creatorId === String(creatorId) &&
        isActive(subscription)
      );
    });
  }

  function recordTemplatePurchase(options) {
    options = options || {};

    const userId = resolveUserId(options.userId);
    const templateId = String(options.templateId || "");
    const purchaseId = String(options.purchaseId || "");

    if (!userId || !templateId || !purchaseId) {
      return {
        success: false,
        message: "User, template, and purchase IDs are required."
      };
    }

    const purchases = load(PURCHASES_KEY);

    const existing = purchases.some(function (purchase) {
      return (
        purchase.userId === userId &&
        purchase.templateId === templateId &&
        purchase.status === "completed"
      );
    });

    if (existing) {
      return {
        success: true,
        alreadyPurchased: true
      };
    }

    const purchase = {
      id: createId("template_purchase"),
      purchaseId: purchaseId,
      userId: userId,
      templateId: templateId,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    purchases.push(purchase);
    save(PURCHASES_KEY, purchases);

    return {
      success: true,
      purchase: purchase,
      message: "Purchase record created; payment is not verified."
    };
  }

  function confirmTemplatePurchase(purchaseId) {
    const purchases = load(PURCHASES_KEY);

    const purchase = purchases.find(function (item) {
      return item.purchaseId === String(purchaseId);
    });

    if (!purchase) {
      return {
        success: false,
        message: "Purchase not found."
      };
    }

    purchase.status = "completed";
    purchase.completedAt = new Date().toISOString();

    save(PURCHASES_KEY, purchases);

    return {
      success: true,
      purchase: purchase
    };
  }

  function hasTemplateEntitlement(userId, templateId, options) {
    userId = resolveUserId(userId);
    options = options || {};

    if (!userId || !templateId) {
      return false;
    }

    const template = options.template || null;

    // Free templates are accessible to everyone.
    if (template && template.access === "free") {
      return true;
    }

    // Pro templates can be accessed through RockyX Pro
    // when the template is eligible for the subscription.
    if (
      template &&
      template.access === "pro" &&
      template.proEligible !== false &&
      hasActivePro(userId)
    ) {
      return true;
    }

    // An individual purchase grants access to its template.
    return load(PURCHASES_KEY).some(function (purchase) {
      return (
        purchase.userId === userId &&
        purchase.templateId === String(templateId) &&
        purchase.status === "completed"
      );
    });
  }

  window.RockyXSubscriptions = {
    createSubscription: createSubscription,
    activateSubscription: activateSubscription,
    getSubscription: getSubscription,
    getUserSubscriptions: getUserSubscriptions,
    cancelSubscription: cancelSubscription,
    expireSubscription: expireSubscription,
    hasActivePro: hasActivePro,
    hasCreatorSubscription: hasCreatorSubscription,
    recordTemplatePurchase: recordTemplatePurchase,
    confirmTemplatePurchase: confirmTemplatePurchase,
    hasTemplateEntitlement: hasTemplateEntitlement,
    getSubscriptionTypes: getSubscriptionTypes,
    getStatuses: getStatuses,
    getProPlans: getProPlans
  };

})();