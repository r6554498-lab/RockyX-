/* =========================================
   ROCKYX REFERRALS
   Invite codes, referral tracking, rewards
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_referrals";
  const REWARDS_KEY = "rockyx_referral_rewards";

  const REFERRAL_STATUSES = [
    "invited",
    "registered",
    "qualified",
    "rewarded",
    "rejected"
  ];

  function load(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
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

  function createCode() {
    return "RX" +
      Math.random().toString(36).slice(2, 6).toUpperCase() +
      Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function getOrCreateReferralCode(userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return {
        success: false,
        message: "A user profile is required."
      };
    }

    const referrals = load(STORAGE_KEY);

    const existing = referrals.find(function (item) {
      return item.referrerId === userId && item.isCodeRecord;
    });

    if (existing) {
      return {
        success: true,
        code: existing.code
      };
    }

    let code;
    let attempts = 0;

    do {
      code = createCode();
      attempts++;
    } while (
      referrals.some(function (item) {
        return item.code === code && item.isCodeRecord;
      }) &&
      attempts < 20
    );

    if (
      referrals.some(function (item) {
        return item.code === code && item.isCodeRecord;
      })
    ) {
      return {
        success: false,
        message: "Could not generate a unique code. Try again."
      };
    }

    referrals.push({
      id: createId("refcode"),
      isCodeRecord: true,
      referrerId: userId,
      code: code,
      createdAt: new Date().toISOString()
    });

    save(STORAGE_KEY, referrals);

    return {
      success: true,
      code: code
    };
  }

  function recordInvitation(options) {
    options = options || {};

    const referrerId = resolveUserId(options.referrerId);
    const referredUserId = options.referredUserId
      ? String(options.referredUserId)
      : null;

    const code = String(options.code || "").trim().toUpperCase();

    if (!referrerId || !code) {
      return {
        success: false,
        message: "A referrer and referral code are required."
      };
    }

    if (referredUserId && referrerId === referredUserId) {
      return {
        success: false,
        message: "You cannot refer yourself."
      };
    }

    const referrals = load(STORAGE_KEY);

    const codeRecord = referrals.find(function (item) {
      return item.isCodeRecord && item.code === code;
    });

    if (!codeRecord || codeRecord.referrerId !== referrerId) {
      return {
        success: false,
        message: "The referral code does not belong to this referrer."
      };
    }

    if (
      referredUserId &&
      referrals.some(function (item) {
        return (
          !item.isCodeRecord &&
          item.referredUserId === referredUserId
        );
      })
    ) {
      return {
        success: false,
        message: "This user already has a referral record."
      };
    }

    const referral = {
      id: createId("referral"),
      isCodeRecord: false,
      referrerId: referrerId,
      referredUserId: referredUserId,
      code: code,
      status: referredUserId ? "registered" : "invited",
      rewardAmountMinor: 0,
      currency: "GHS",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    referrals.push(referral);
    save(STORAGE_KEY, referrals);

    return {
      success: true,
      referral: referral
    };
  }

  function attachRegisteredUser(referralId, userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return {
        success: false,
        message: "A registered user ID is required."
      };
    }

    const referrals = load(STORAGE_KEY);

    const referral = referrals.find(function (item) {
      return item.id === referralId && !item.isCodeRecord;
    });

    if (!referral) {
      return {
        success: false,
        message: "Referral record not found."
      };
    }

    if (referral.referrerId === userId) {
      return {
        success: false,
        message: "A user cannot refer themselves."
      };
    }

    const alreadyReferred = referrals.some(function (item) {
      return (
        !item.isCodeRecord &&
        item.id !== referralId &&
        item.referredUserId === userId
      );
    });

    if (alreadyReferred) {
      return {
        success: false,
        message: "This user already has a referral record."
      };
    }

    if (
      referral.referredUserId &&
      referral.referredUserId !== userId
    ) {
      return {
        success: false,
        message: "This referral is already linked to another user."
      };
    }

    referral.referredUserId = userId;
    referral.status = "registered";
    referral.updatedAt = new Date().toISOString();

    save(STORAGE_KEY, referrals);

    return {
      success: true,
      referral: referral
    };
  }

  function updateReferralStatus(referralId, status, options) {
    options = options || {};

    if (!REFERRAL_STATUSES.includes(status)) {
      return {
        success: false,
        message: "Invalid referral status."
      };
    }

    const referrals = load(STORAGE_KEY);

    const referral = referrals.find(function (item) {
      return item.id === referralId && !item.isCodeRecord;
    });

    if (!referral) {
      return {
        success: false,
        message: "Referral record not found."
      };
    }

    const allowedTransitions = {
      invited: ["registered", "rejected"],
      registered: ["qualified", "rejected"],
      qualified: ["rewarded", "rejected"],
      rewarded: [],
      rejected: []
    };

    if (
      !allowedTransitions[referral.status] ||
      !allowedTransitions[referral.status].includes(status)
    ) {
      return {
        success: false,
        message: "This referral status change is not allowed."
      };
    }

    referral.status = status;
    referral.updatedAt = new Date().toISOString();

    if (status === "qualified") {
      referral.qualifiedAt = new Date().toISOString();
    }

    if (status === "rejected") {
      referral.rejectionReason = String(
        options.reason || ""
      ).trim().slice(0, 1000);
    }

    save(STORAGE_KEY, referrals);

    return {
      success: true,
      referral: referral
    };
  }

  function recordReward(options) {
    options = options || {};

    const referralId = String(options.referralId || "");
    const amountMinor = options.amountMinor;
    const currency = String(options.currency || "GHS").toUpperCase();

    if (
      !Number.isSafeInteger(amountMinor) ||
      amountMinor <= 0
    ) {
      return {
        success: false,
        message: "Reward must be a positive integer in minor currency units."
      };
    }

    if (!["GHS", "USD"].includes(currency)) {
      return {
        success: false,
        message: "Unsupported reward currency."
      };
    }

    const referrals = load(STORAGE_KEY);

    const referral = referrals.find(function (item) {
      return item.id === referralId && !item.isCodeRecord;
    });

    if (!referral || referral.status !== "qualified") {
      return {
        success: false,
        message: "Only qualified referrals can receive a reward."
      };
    }

    if (referral.rewardRecorded) {
      return {
        success: false,
        message: "A reward has already been recorded for this referral."
      };
    }

    const rewards = load(REWARDS_KEY);

    const reward = {
      id: createId("refreward"),
      referralId: referral.id,
      userId: referral.referrerId,
      amountMinor: amountMinor,
      currency: currency,
      status: "pending_verification",
      createdAt: new Date().toISOString()
    };

    rewards.push(reward);
    save(REWARDS_KEY, rewards);

    referral.rewardRecorded = true;
    referral.rewardAmountMinor = amountMinor;
    referral.currency = currency;
    referral.status = "rewarded";
    referral.updatedAt = new Date().toISOString();

    save(STORAGE_KEY, referrals);

    return {
      success: true,
      reward: reward,
      message: "Reward recorded locally; it has not been paid."
    };
  }

  function getReferrals(userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return [];
    }

    return load(STORAGE_KEY)
      .filter(function (item) {
        return !item.isCodeRecord && item.referrerId === userId;
      })
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }

  function getRewards(userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return [];
    }

    return load(REWARDS_KEY).filter(function (item) {
      return item.userId === userId;
    });
  }

  function getSummary(userId) {
    const referrals = getReferrals(userId);

    return referrals.reduce(function (summary, referral) {
      summary.total++;

      if (referral.status === "invited") {
        summary.invited++;
      }

      if (referral.status === "registered") {
        summary.registered++;
      }

      if (referral.status === "qualified") {
        summary.qualified++;
      }

      if (referral.status === "rewarded") {
        summary.rewarded++;
      }

      if (referral.status === "rejected") {
        summary.rejected++;
      }

      return summary;
    }, {
      total: 0,
      invited: 0,
      registered: 0,
      qualified: 0,
      rewarded: 0,
      rejected: 0
    });
  }

  window.RockyXReferrals = {
    getOrCreateReferralCode: getOrCreateReferralCode,
    recordInvitation: recordInvitation,
    attachRegisteredUser: attachRegisteredUser,
    updateReferralStatus: updateReferralStatus,
    recordReward: recordReward,
    getReferrals: getReferrals,
    getRewards: getRewards,
    getSummary: getSummary,
    getStatuses: function () {
      return REFERRAL_STATUSES.slice();
    }
  };

})();