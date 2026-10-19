/* RockyX Gifts
   Frontend prototype only.
   Real gifts, payments and creator earnings require
   authenticated accounts and a secure backend.
*/
(function () {
  "use strict";
  const STORAGE_KEY = "rockyx_gift_history_v1";
  const GIFTS = [
    { id: "heart", name: "Heart", coins: 1, emoji: "❤️" },
    { id: "star", name: "Star", coins: 5, emoji: "⭐" },
    { id: "flower", name: "Flower", coins: 10, emoji: "🌹" },
    { id: "diamond", name: "Diamond", coins: 100, emoji: "💎" },
    { id: "crown", name: "Crown", coins: 500, emoji: "👑" }
  ];
  function loadHistory() {
    try {
      const history = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      return Array.isArray(history) ? history : [];
    } catch (error) {
      return [];
    }
  }
  function saveHistory(history) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(history.slice(0, 1000))
    );
  }
  function getGifts() {
    return GIFTS.map(function (gift) {
      return { ...gift };
    });
  }
  function sendGift(senderId, creatorId, liveRoomId, giftId) {
    if (!senderId || !creatorId || !liveRoomId) {
      return {
        success: false,
        message: "Sender, creator and live room are required."
      };
    }
    const gift = GIFTS.find(function (item) {
      return item.id === giftId;
    });
    if (!gift) {
      return {
        success: false,
        message: "Gift not found."
      };
    }
    const transaction = {
      id: "rxgift-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 8),
      senderId: String(senderId),
      creatorId: String(creatorId),
      liveRoomId: String(liveRoomId),
      giftId: gift.id,
      giftName: gift.name,
      emoji: gift.emoji,
      coins: gift.coins,
      createdAt: new Date().toISOString(),
      status: "prototype"
    };
    const history = loadHistory();
    history.unshift(transaction);
    saveHistory(history);
    window.dispatchEvent(
      new CustomEvent("rockyx:gift-sent", {
        detail: transaction
      })
    );
    return {
      success: true,
      transaction: transaction,
      message: "Prototype gift recorded. No payment was made."
    };
  }
  function getHistory(options) {
    const settings = options || {};
    return loadHistory().filter(function (item) {
      if (
        settings.creatorId &&
        item.creatorId !== String(settings.creatorId)
      ) {
        return false;
      }
      if (
        settings.senderId &&
        item.senderId !== String(settings.senderId)
      ) {
        return false;
      }
      if (
        settings.liveRoomId &&
        item.liveRoomId !== String(settings.liveRoomId)
      ) {
        return false;
      }
      return true;
    });
  }
  function getCreatorStats(creatorId) {
    const transactions = getHistory({
      creatorId: creatorId
    });
    return {
      giftCount: transactions.length,
      totalCoins: transactions.reduce(function (total, item) {
        return total + item.coins;
      }, 0),
      transactions: transactions
    };
  }
  window.RockyXGifts = {
    getGifts: getGifts,
    sendGift: sendGift,
    getHistory: getHistory,
    getCreatorStats: getCreatorStats
  };
})();