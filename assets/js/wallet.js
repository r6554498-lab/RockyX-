/* =========================================
   ROCKYX WALLET & EARNINGS
   Local wallet and transaction foundation
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_wallets";
  const TRANSACTIONS_KEY = "rockyx_wallet_transactions";
  const WITHDRAWALS_KEY = "rockyx_wallet_withdrawals";

  const CURRENCIES = ["GHS", "USD"];

  const EARNING_SOURCES = [
    "creator_rewards",
    "template_rewards",
    "template_sales",
    "music_royalties",
    "marketplace_sales",
    "gifts",
    "subscriptions",
    "advertising"
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

  function validAmount(amount) {
    return Number.isSafeInteger(amount) && amount > 0;
  }

  function getWallet(userId, currency) {
    userId = resolveUserId(userId);
    currency = String(currency || "GHS").toUpperCase();

    if (!userId || !CURRENCIES.includes(currency)) {
      return null;
    }

    const wallets = load(STORAGE_KEY);

    return wallets.find(function (wallet) {
      return (
        wallet.userId === userId &&
        wallet.currency === currency
      );
    }) || null;
  }

  function createWallet(userId, currency) {
    userId = resolveUserId(userId);
    currency = String(currency || "GHS").toUpperCase();

    if (!userId) {
      return {
        success: false,
        message: "A user profile is required."
      };
    }

    if (!CURRENCIES.includes(currency)) {
      return {
        success: false,
        message: "Unsupported wallet currency."
      };
    }

    const wallets = load(STORAGE_KEY);

    const existing = wallets.find(function (wallet) {
      return (
        wallet.userId === userId &&
        wallet.currency === currency
      );
    });

    if (existing) {
      return {
        success: true,
        wallet: existing,
        alreadyExists: true
      };
    }

    const wallet = {
      id: createId("wallet"),
      userId: userId,
      currency: currency,
      balance: 0,
      pendingBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    wallets.push(wallet);
    save(STORAGE_KEY, wallets);

    return {
      success: true,
      wallet: wallet
    };
  }

  function getOrCreateWallet(userId, currency) {
    const existing = getWallet(userId, currency);

    if (existing) {
      return existing;
    }

    const result = createWallet(userId, currency);

    return result.success ? result.wallet : null;
  }

  /*
   * Demonstration only.
   * Never use client-side functions to credit real money.
   */
  function recordDemoEarning(options) {
    options = options || {};

    const userId = resolveUserId(options.userId);
    const currency = String(options.currency || "GHS").toUpperCase();
    const source = String(options.source || "");
    const amount = options.amountMinor;

    if (!userId) {
      return {
        success: false,
        message: "A user profile is required."
      };
    }

    if (!validAmount(amount)) {
      return {
        success: false,
        message: "Amount must be a positive integer in minor currency units."
      };
    }

    if (!CURRENCIES.includes(currency)) {
      return {
        success: false,
        message: "Unsupported currency."
      };
    }

    if (!EARNING_SOURCES.includes(source)) {
      return {
        success: false,
        message: "Unsupported earning source."
      };
    }

    const wallet = getOrCreateWallet(userId, currency);

    if (!wallet) {
      return {
        success: false,
        message: "Could not create wallet."
      };
    }

    const wallets = load(STORAGE_KEY);
    const index = wallets.findIndex(function (item) {
      return item.id === wallet.id;
    });

    wallets[index].pendingBalance += amount;
    wallets[index].updatedAt = new Date().toISOString();

    save(STORAGE_KEY, wallets);

    const transaction = {
      id: createId("transaction"),
      walletId: wallet.id,
      userId: userId,
      type: "earning_pending",
      source: source,
      amountMinor: amount,
      currency: currency,
      status: "pending",
      reference: options.reference || null,
      createdAt: new Date().toISOString()
    };

    const transactions = load(TRANSACTIONS_KEY);
    transactions.push(transaction);
    save(TRANSACTIONS_KEY, transactions);

    return {
      success: true,
      transaction: transaction,
      message: "Demonstration earning recorded as pending."
    };
  }

  /*
   * Prototype confirmation only.
   * A real system must confirm earnings on the backend.
   */
  function confirmDemoEarning(transactionId) {
    const transactions = load(TRANSACTIONS_KEY);
    const wallets = load(STORAGE_KEY);

    const transaction = transactions.find(function (item) {
      return (
        item.id === transactionId &&
        item.type === "earning_pending" &&
        item.status === "pending"
      );
    });

    if (!transaction) {
      return {
        success: false,
        message: "Pending earning not found."
      };
    }

    const wallet = wallets.find(function (item) {
      return item.id === transaction.walletId;
    });

    if (
      !wallet ||
      wallet.pendingBalance < transaction.amountMinor
    ) {
      return {
        success: false,
        message: "Wallet balance is inconsistent."
      };
    }

    wallet.pendingBalance -= transaction.amountMinor;
    wallet.balance += transaction.amountMinor;
    wallet.updatedAt = new Date().toISOString();

    transaction.status = "completed";
    transaction.type = "earning";
    transaction.completedAt = new Date().toISOString();

    save(STORAGE_KEY, wallets);
    save(TRANSACTIONS_KEY, transactions);

    return {
      success: true,
      transaction: transaction,
      wallet: wallet
    };
  }

  function getTransactions(userId, options) {
    userId = resolveUserId(userId);
    options = options || {};

    if (!userId) {
      return [];
    }

    let transactions = load(TRANSACTIONS_KEY).filter(function (item) {
      return item.userId === userId;
    });

    if (options.status) {
      transactions = transactions.filter(function (item) {
        return item.status === options.status;
      });
    }

    if (options.source) {
      transactions = transactions.filter(function (item) {
        return item.source === options.source;
      });
    }

    return transactions.sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function requestWithdrawal(options) {
    options = options || {};

    const userId = resolveUserId(options.userId);
    const currency = String(options.currency || "GHS").toUpperCase();
    const amount = options.amountMinor;
    const method = String(options.method || "").trim();

    if (!userId) {
      return {
        success: false,
        message: "A user profile is required."
      };
    }

    if (!validAmount(amount)) {
      return {
        success: false,
        message: "Enter a valid positive withdrawal amount."
      };
    }

    if (!method || method.length > 50) {
      return {
        success: false,
        message: "A withdrawal method is required."
      };
    }

    const wallet = getWallet(userId, currency);

    if (!wallet || wallet.balance < amount) {
      return {
        success: false,
        message: "Insufficient available demonstration balance."
      };
    }

    const withdrawals = load(WITHDRAWALS_KEY);

    const withdrawal = {
      id: createId("withdrawal"),
      userId: userId,
      walletId: wallet.id,
      amountMinor: amount,
      currency: currency,
      method: method,
      status: "requested",
      createdAt: new Date().toISOString()
    };

    withdrawals.push(withdrawal);
    save(WITHDRAWALS_KEY, withdrawals);

    return {
      success: true,
      withdrawal: withdrawal,
      message: "Demonstration withdrawal request recorded."
    };
  }

  function getWithdrawals(userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return [];
    }

    return load(WITHDRAWALS_KEY)
      .filter(function (item) {
        return item.userId === userId;
      })
      .sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }

  function getSummary(userId, currency) {
    const wallet = getWallet(userId, currency);

    if (!wallet) {
      return {
        balanceMinor: 0,
        pendingBalanceMinor: 0,
        currency: String(currency || "GHS").toUpperCase()
      };
    }

    return {
      balanceMinor: wallet.balance,
      pendingBalanceMinor: wallet.pendingBalance,
      currency: wallet.currency
    };
  }

  window.RockyXWallet = {
    getWallet: getWallet,
    createWallet: createWallet,
    recordDemoEarning: recordDemoEarning,
    confirmDemoEarning: confirmDemoEarning,
    getTransactions: getTransactions,
    requestWithdrawal: requestWithdrawal,
    getWithdrawals: getWithdrawals,
    getSummary: getSummary,
    getCurrencies: function () {
      return CURRENCIES.slice();
    },
    getEarningSources: function () {
      return EARNING_SOURCES.slice();
    }
  };

})();