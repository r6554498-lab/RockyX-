/* =========================================
   ROCKYX CREATOR EARNINGS
   Local earnings and payout tracking foundation
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_creator_earnings";

  const EARNING_SOURCES = [
    "social_rewards",
    "gifts",
    "music_royalties",
    "template_rewards",
    "template_sales",
    "subscriptions",
    "other"
  ];

  const PAYOUT_STATUSES = [
    "pending",
    "processing",
    "completed",
    "failed",
    "cancelled"
  ];

  function createId(prefix) {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return prefix + "-" + window.crypto.randomUUID();
    }

    return prefix + "-" + Date.now() +
      "-" + Math.random().toString(36).slice(2, 10);
  }

  function normalizeId(value) {
    if (typeof value !== "string" && typeof value !== "number") {
      return null;
    }

    const id = String(value).trim();
    return id || null;
  }

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const data = saved ? JSON.parse(saved) : {};

      return data &&
        typeof data === "object" &&
        !Array.isArray(data)
        ? data
        : {};
    } catch (error) {
      console.error("RockyX earnings could not be loaded:", error);
      return {};
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      window.dispatchEvent(
        new CustomEvent("rockyx:creator-earnings-updated", {
          detail: {
            updatedAt: new Date().toISOString()
          }
        })
      );

      return true;
    } catch (error) {
      console.error("RockyX earnings could not be saved:", error);
      return false;
    }
  }

  function ensureAccount(data, userId) {
    if (!data[userId]) {
      data[userId] = {
        userId,
        currency: "GHS",
        entries: [],
        payouts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    return data[userId];
  }

  function recordEarning(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        error: "Earning details are required."
      };
    }

    const userId = normalizeId(details.userId);
    const source = details.source;
    const amount = details.amount;
    const currency = typeof details.currency === "string"
      ? details.currency.trim().toUpperCase()
      : "GHS";

    if (!userId) {
      return {
        success: false,
        error: "A valid user ID is required."
      };
    }

    if (!EARNING_SOURCES.includes(source)) {
      return {
        success: false,
        error: "Unsupported earning source."
      };
    }

    if (
      !Number.isSafeInteger(amount) ||
      amount <= 0
    ) {
      return {
        success: false,
        error: "Amount must be a positive integer in the currency's minor units."
      };
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      return {
        success: false,
        error: "A valid three-letter currency code is required."
      };
    }

    const data = loadData();
    const account = ensureAccount(data, userId);

    if (account.currency !== currency && account.entries.length > 0) {
      return {
        success: false,
        error: "This account uses a different currency. Currency conversion is not supported."
      };
    }

    account.currency = currency;

    const entry = {
      id: createId("earning"),
      userId,
      source,
      amountMinor: amount,
      currency,
      description: typeof details.description === "string"
        ? details.description.trim().slice(0, 300)
        : "",
      reference: typeof details.reference === "string"
        ? details.reference.trim().slice(0, 150)
        : "",
      status: "recorded",
      createdAt: new Date().toISOString()
    };

    account.entries.push(entry);
    account.updatedAt = new Date().toISOString();

    if (!saveData(data)) {
      return {
        success: false,
        error: "The earning record could not be saved."
      };
    }

    return {
      success: true,
      entry: { ...entry }
    };
  }

  function getEntries(userId, options) {
    const id = normalizeId(userId);
    if (!id) return [];

    const data = loadData();
    const account = data[id];

    if (!account) return [];

    const settings = options || {};
    let entries = account.entries.slice();

    if (settings.source) {
      entries = entries.filter(
        entry => entry.source === settings.source
      );
    }

    if (settings.from) {
      const from = new Date(settings.from).getTime();

      if (Number.isFinite(from)) {
        entries = entries.filter(
          entry => new Date(entry.createdAt).getTime() >= from
        );
      }
    }

    if (settings.to) {
      const to = new Date(settings.to).getTime();

      if (Number.isFinite(to)) {
        entries = entries.filter(
          entry => new Date(entry.createdAt).getTime() <= to
        );
      }
    }

    return entries
      .sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      .map(entry => ({ ...entry }));
  }

  function getSummary(userId) {
    const id = normalizeId(userId);
    if (!id) return null;

    const data = loadData();
    const account = data[id];

    if (!account) {
      return {
        userId: id,
        currency: "GHS",
        totalRecordedMinor: 0,
        pendingPayoutMinor: 0,
        completedPayoutMinor: 0,
        availableEstimateMinor: 0,
        bySource: {}
      };
    }

    const bySource = {};
    let totalRecordedMinor = 0;

    account.entries.forEach(entry => {
      totalRecordedMinor += entry.amountMinor;

      bySource[entry.source] =
        (bySource[entry.source] || 0) + entry.amountMinor;
    });

    const pendingPayoutMinor = account.payouts
      .filter(payout =>
        ["pending", "processing"].includes(payout.status)
      )
      .reduce((sum, payout) => sum + payout.amountMinor, 0);

    const completedPayoutMinor = account.payouts
      .filter(payout => payout.status === "completed")
      .reduce((sum, payout) => sum + payout.amountMinor, 0);

    return {
      userId: id,
      currency: account.currency,
      totalRecordedMinor,
      pendingPayoutMinor,
      completedPayoutMinor,
      availableEstimateMinor: Math.max(
        0,
        totalRecordedMinor - pendingPayoutMinor - completedPayoutMinor
      ),
      bySource
    };
  }

  function requestPayout(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        error: "Payout details are required."
      };
    }

    const userId = normalizeId(details.userId);
    const amount = details.amount;

    if (!userId) {
      return {
        success: false,
        error: "A valid user ID is required."
      };
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return {
        success: false,
        error: "Payout amount must be a positive integer in minor currency units."
      };
    }

    const data = loadData();
    const account = data[userId];

    if (!account) {
      return {
        success: false,
        error: "No earnings account exists."
      };
    }

    const summary = getSummary(userId);

    if (amount > summary.availableEstimateMinor) {
      return {
        success: false,
        error: "The requested amount exceeds the estimated available balance."
      };
    }

    const payout = {
      id: createId("payout"),
      userId,
      amountMinor: amount,
      currency: account.currency,
      status: "pending",
      method: typeof details.method === "string"
        ? details.method.trim().slice(0, 50)
        : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    account.payouts.push(payout);
    account.updatedAt = new Date().toISOString();

    if (!saveData(data)) {
      return {
        success: false,
        error: "The payout request could not be saved."
      };
    }

    return {
      success: true,
      payout: { ...payout }
    };
  }

  function getPayouts(userId) {
    const id = normalizeId(userId);
    if (!id) return [];

    const account = loadData()[id];

    if (!account) return [];

    return account.payouts
      .slice()
      .sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      .map(payout => ({ ...payout }));
  }

  /*
   * DEMO ONLY:
   * This function is not a secure payout processor.
   * Production payout status must be updated by
   * authenticated backend services and payment providers.
   */
  function updatePayoutStatus(payoutId, status, note) {
    const id = normalizeId(payoutId);

    if (
      !id ||
      !PAYOUT_STATUSES.includes(status)
    ) {
      return {
        success: false,
        error: "A valid payout ID and status are required."
      };
    }

    const data = loadData();

    for (const account of Object.values(data)) {
      const payout = account.payouts.find(
        item => item.id === id
      );

      if (!payout) continue;

      payout.status = status;
      payout.note = typeof note === "string"
        ? note.trim().slice(0, 500)
        : "";
      payout.updatedAt = new Date().toISOString();

      if (!saveData(data)) {
        return {
          success: false,
          error: "Payout status could not be saved."
        };
      }

      return {
        success: true,
        payout: { ...payout }
      };
    }

    return {
      success: false,
      error: "Payout not found."
    };
  }

  window.RockyXCreatorEarnings = {
    recordEarning,
    getEntries,
    getSummary,
    requestPayout,
    getPayouts,
    updatePayoutStatus,
    getEarningSources: () => [...EARNING_SOURCES],
    getPayoutStatuses: () => [...PAYOUT_STATUSES]
  };

})();