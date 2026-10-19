/* RockyX Direct Messages
   Frontend prototype.
   Real private messaging requires a secure backend.
*/

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_messages_v1";

  function loadMessages() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveMessages(messages) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages)
    );
  }

  function sendMessage(conversationId, senderId, text) {
    if (!conversationId || !senderId) {
      return {
        success: false,
        message: "Conversation and sender IDs are required."
      };
    }

    if (typeof text !== "string" || !text.trim()) {
      return {
        success: false,
        message: "Message cannot be empty."
      };
    }

    const message = {
      id: "rxmsg-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 8),
      conversationId: String(conversationId),
      senderId: String(senderId),
      text: text.trim().slice(0, 5000),
      createdAt: new Date().toISOString(),
      read: false
    };

    const messages = loadMessages();
    messages.push(message);
    saveMessages(messages);

    window.dispatchEvent(
      new CustomEvent("rockyx:message-sent", {
        detail: message
      })
    );

    return {
      success: true,
      message: message
    };
  }

  function getConversation(conversationId) {
    return loadMessages()
      .filter(function (message) {
        return message.conversationId === String(conversationId);
      })
      .sort(function (a, b) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  }

  function markConversationRead(conversationId, readerId) {
    const messages = loadMessages();
    let changed = false;

    messages.forEach(function (message) {
      if (
        message.conversationId === String(conversationId) &&
        message.senderId !== String(readerId) &&
        !message.read
      ) {
        message.read = true;
        changed = true;
      }
    });

    if (changed) {
      saveMessages(messages);

      window.dispatchEvent(
        new CustomEvent("rockyx:messages-read", {
          detail: {
            conversationId: String(conversationId)
          }
        })
      );
    }

    return {
      success: true,
      messages: getConversation(conversationId)
    };
  }

  function getUnreadCount(conversationId, readerId) {
    return loadMessages().filter(function (message) {
      return (
        message.conversationId === String(conversationId) &&
        message.senderId !== String(readerId) &&
        !message.read
      );
    }).length;
  }

  window.RockyXMessages = {
    sendMessage: sendMessage,
    getConversation: getConversation,
    markConversationRead: markConversationRead,
    getUnreadCount: getUnreadCount
  };
})();