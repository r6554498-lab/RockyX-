/* =========================================
   ROCKYX MARKETPLACE CHAT
   Local prototype
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_marketplace_conversations";
  const BLOCKS_KEY = "rockyx_marketplace_chat_blocks";

  function readStorage(key, fallback) {
    try {
      return JSON.parse(
        localStorage.getItem(key) || JSON.stringify(fallback)
      );
    } catch (error) {
      return fallback;
    }
  }

  function readConversations() {
    const data = readStorage(STORAGE_KEY, []);
    return Array.isArray(data) ? data : [];
  }

  function saveConversations(conversations) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(conversations)
    );

    window.dispatchEvent(
      new CustomEvent("rockyx:marketplace-chat-updated", {
        detail: { count: conversations.length }
      })
    );

    return conversations;
  }

  function readBlocks() {
    const data = readStorage(BLOCKS_KEY, {});
    return data && typeof data === "object" ? data : {};
  }

  function isBlocked(userA, userB) {
    const blocks = readBlocks();
    const a = String(userA);
    const b = String(userB);

    return Array.isArray(blocks[a]) && blocks[a].includes(b);
  }

  function getConversation(conversationId) {
    return readConversations().find(conversation =>
      conversation.id === String(conversationId)
    ) || null;
  }

  function startConversation(data) {
    if (!data || typeof data !== "object") {
      return {
        success: false,
        message: "Conversation information is required."
      };
    }

    const buyerId = String(data.buyerId || "").trim();
    const sellerId = String(data.sellerId || "").trim();

    if (!buyerId || !sellerId) {
      return {
        success: false,
        message: "Buyer and seller IDs are required."
      };
    }

    if (buyerId === sellerId) {
      return {
        success: false,
        message: "You cannot start a conversation with yourself."
      };
    }

    if (isBlocked(buyerId, sellerId) || isBlocked(sellerId, buyerId)) {
      return {
        success: false,
        message: "This conversation cannot be started."
      };
    }

    const productId = String(data.productId || "");
    const orderId = String(data.orderId || "");

    const conversations = readConversations();

    const existing = conversations.find(conversation =>
      conversation.buyerId === buyerId &&
      conversation.sellerId === sellerId &&
      conversation.productId === productId &&
      conversation.orderId === orderId
    );

    if (existing) {
      return {
        success: true,
        conversation: existing,
        existing: true
      };
    }

    const now = new Date().toISOString();

    const conversation = {
      id: "rxchat_" + Date.now().toString(36) +
        "_" + Math.random().toString(36).slice(2, 8),

      buyerId,
      sellerId,
      productId: productId || null,
      orderId: orderId || null,

      messages: [],
      unreadCounts: {
        [buyerId]: 0,
        [sellerId]: 0
      },

      createdAt: now,
      updatedAt: now,
      status: "active"
    };

    conversations.unshift(conversation);
    saveConversations(conversations);

    return {
      success: true,
      conversation,
      existing: false
    };
  }

  function sendMessage(conversationId, senderId, text) {
    const id = String(conversationId || "");
    const sender = String(senderId || "").trim();
    const body = String(text || "").trim();

    if (!sender || !body) {
      return {
        success: false,
        message: "Sender ID and message text are required."
      };
    }

    if (body.length > 5000) {
      return {
        success: false,
        message: "Messages cannot exceed 5,000 characters."
      };
    }

    const conversations = readConversations();

    const conversation = conversations.find(item =>
      item.id === id
    );

    if (!conversation) {
      return {
        success: false,
        message: "Conversation not found."
      };
    }

    if (conversation.status !== "active") {
      return {
        success: false,
        message: "This conversation is not active."
      };
    }

    if (
      sender !== conversation.buyerId &&
      sender !== conversation.sellerId
    ) {
      return {
        success: false,
        message: "You are not a participant in this conversation."
      };
    }

    const recipient = sender === conversation.buyerId
      ? conversation.sellerId
      : conversation.buyerId;

    if (isBlocked(sender, recipient) || isBlocked(recipient, sender)) {
      return {
        success: false,
        message: "This message cannot be sent."
      };
    }

    const message = {
      id: "rxmsg_" + Date.now().toString(36) +
        "_" + Math.random().toString(36).slice(2, 8),

      senderId: sender,
      text: body,
      createdAt: new Date().toISOString(),
      readAt: null
    };

    conversation.messages.push(message);
    conversation.unreadCounts[recipient] =
      (conversation.unreadCounts[recipient] || 0) + 1;

    conversation.updatedAt = message.createdAt;

    saveConversations(conversations);

    window.dispatchEvent(
      new CustomEvent("rockyx:marketplace-message-sent", {
        detail: {
          conversationId: conversation.id,
          messageId: message.id
        }
      })
    );

    return {
      success: true,
      message
    };
  }

  function getConversations(userId) {
    const id = String(userId || "");

    if (!id) {
      return [];
    }

    return readConversations()
      .filter(conversation =>
        conversation.buyerId === id ||
        conversation.sellerId === id
      )
      .sort((a, b) =>
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );
  }

  function getMessages(conversationId, userId) {
    const conversation = getConversation(conversationId);
    const id = String(userId || "");

    if (!conversation) {
      return {
        success: false,
        message: "Conversation not found."
      };
    }

    if (
      id !== conversation.buyerId &&
      id !== conversation.sellerId
    ) {
      return {
        success: false,
        message: "You are not a participant in this conversation."
      };
    }

    return {
      success: true,
      messages: conversation.messages.slice()
    };
  }

  function markAsRead(conversationId, userId) {
    const id = String(conversationId || "");
    const user = String(userId || "");

    const conversations = readConversations();

    const conversation = conversations.find(item =>
      item.id === id
    );

    if (!conversation) {
      return {
        success: false,
        message: "Conversation not found."
      };
    }

    if (
      user !== conversation.buyerId &&
      user !== conversation.sellerId
    ) {
      return {
        success: false,
        message: "You are not a participant in this conversation."
      };
    }

    const now = new Date().toISOString();

    conversation.messages.forEach(message => {
      if (message.senderId !== user && !message.readAt) {
        message.readAt = now;
      }
    });

    conversation.unreadCounts[user] = 0;
    saveConversations(conversations);

    return {
      success: true
    };
  }

  function getUnreadCount(userId) {
    const id = String(userId || "");

    return getConversations(id).reduce(
      (total, conversation) =>
        total + (conversation.unreadCounts[id] || 0),
      0
    );
  }

  function blockUser(userId, blockedUserId) {
    const user = String(userId || "").trim();
    const blocked = String(blockedUserId || "").trim();

    if (!user || !blocked || user === blocked) {
      return {
        success: false,
        message: "Provide two different user IDs."
      };
    }

    const blocks = readBlocks();

    if (!Array.isArray(blocks[user])) {
      blocks[user] = [];
    }

    if (!blocks[user].includes(blocked)) {
      blocks[user].push(blocked);
    }

    localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));

    return {
      success: true,
      message: "User blocked in this browser."
    };
  }

  function unblockUser(userId, blockedUserId) {
    const user = String(userId || "").trim();
    const blocked = String(blockedUserId || "").trim();

    const blocks = readBlocks();

    if (Array.isArray(blocks[user])) {
      blocks[user] = blocks[user].filter(
        id => id !== blocked
      );
    }

    localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));

    return {
      success: true,
      message: "User unblocked in this browser."
    };
  }

  function closeConversation(conversationId, userId) {
    const conversations = readConversations();

    const conversation = conversations.find(item =>
      item.id === String(conversationId)
    );

    if (!conversation) {
      return {
        success: false,
        message: "Conversation not found."
      };
    }

    const user = String(userId || "");

    if (
      user !== conversation.buyerId &&
      user !== conversation.sellerId
    ) {
      return {
        success: false,
        message: "You are not a participant in this conversation."
      };
    }

    conversation.status = "closed";
    conversation.updatedAt = new Date().toISOString();

    saveConversations(conversations);

    return {
      success: true
    };
  }

  window.RockyXMarketplaceChat = {
    startConversation,
    sendMessage,
    getConversation,
    getConversations,
    getMessages,
    markAsRead,
    getUnreadCount,
    blockUser,
    unblockUser,
    closeConversation
  };

  console.log("RockyX Marketplace Chat loaded.");
})();