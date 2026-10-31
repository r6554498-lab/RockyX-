/* =========================================================
   ROCKYX — INBOX MODULE
   Version: 1.0.0
   Status: Front-end foundation with demonstration messages
   ========================================================= */

(function () {
  "use strict";

  const RockyXInbox = {
    name: "inbox",
    version: "1.0.0",

    activeConversation: null,
    searchQuery: "",
    conversations: [
      {
        id: "chat-001",
        name: "Alex Morgan",
        initials: "AM",
        online: true,
        unread: 2,
        group: false,
        messages: [
          {
            id: "msg-001",
            sender: "them",
            text: "Hey! How is your new project going?",
            time: "09:15",
            reactions: []
          },
          {
            id: "msg-002",
            sender: "me",
            text: "It's coming along nicely!",
            time: "09:17",
            reactions: []
          },
          {
            id: "msg-003",
            sender: "them",
            text: "Looking forward to seeing it.",
            time: "09:20",
            reactions: []
          }
        ]
      },
      {
        id: "chat-002",
        name: "RockyX Creators",
        initials: "RC",
        online: true,
        unread: 1,
        group: true,
        messages: [
          {
            id: "msg-004",
            sender: "them",
            text: "Welcome to the creators group!",
            time: "Yesterday",
            reactions: []
          }
        ]
      },
      {
        id: "chat-003",
        name: "Jordan Lee",
        initials: "JL",
        online: false,
        unread: 0,
        group: false,
        messages: [
          {
            id: "msg-005",
            sender: "them",
            text: "See you tomorrow.",
            time: "Monday",
            reactions: []
          }
        ]
      }
    ],

    initialize() {
      console.log("RockyX Inbox initialized.");
    },

    escapeHTML(value) {
      return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]);
    },

    getFilteredConversations() {
      const query = this.searchQuery.toLowerCase();

      return this.conversations.filter((conversation) => {
        const lastMessage =
          conversation.messages[conversation.messages.length - 1];

        return (
          conversation.name.toLowerCase().includes(query) ||
          (lastMessage &&
            lastMessage.text.toLowerCase().includes(query))
        );
      });
    },

    getLastMessage(conversation) {
      const message =
        conversation.messages[conversation.messages.length - 1];

      return message ? message.text : "No messages yet.";
    },

    getUnreadCount() {
      return this.conversations.reduce(
        (total, conversation) => total + conversation.unread,
        0
      );
    },

    render() {
      const screen = document.getElementById("app-screen");

      if (!screen) {
        console.error("RockyX Inbox: app-screen not found.");
        return;
      }

      const filtered = this.getFilteredConversations();

      screen.innerHTML = `
        <section class="inbox-page">

          <header class="inbox-heading">
            <div>
              <span class="inbox-eyebrow">STAY CONNECTED</span>
              <h1>Inbox</h1>
              <p>Your conversations in one place.</p>
            </div>

            <span class="inbox-unread-total">
              ${this.getUnreadCount()} unread
            </span>
          </header>

          <div class="inbox-notice">
            Demonstration conversations only.
            Real private messaging will be connected to a secure backend.
          </div>

          <div class="inbox-search">
            <input
              type="search"
              id="inbox-search"
              placeholder="Search conversations..."
              value="${this.escapeHTML(this.searchQuery)}"
              aria-label="Search conversations"
            >
          </div>

          <div class="inbox-layout">

            <aside class="inbox-conversation-list">
              <h2>Messages</h2>

              ${
                filtered.length
                  ? filtered.map((conversation) => `
                    <button
                      type="button"
                      class="inbox-conversation ${
                        this.activeConversation === conversation.id
                          ? "active"
                          : ""
                      }"
                      data-open-conversation="${this.escapeHTML(conversation.id)}"
                    >

                      <span class="inbox-avatar">
                        ${this.escapeHTML(conversation.initials)}
                        ${
                          conversation.online
                            ? '<span class="inbox-online-dot"></span>'
                            : ""
                        }
                      </span>

                      <span class="inbox-conversation-info">
                        <strong>
                          ${this.escapeHTML(conversation.name)}
                        </strong>

                        <span>
                          ${this.escapeHTML(this.getLastMessage(conversation))}
                        </span>
                      </span>

                      ${
                        conversation.unread
                          ? `<span class="inbox-unread-badge">
                              ${conversation.unread}
                            </span>`
                          : ""
                      }

                    </button>
                  `).join("")
                  : `
                    <div class="inbox-empty">
                      No conversations found.
                    </div>
                  `
              }
            </aside>

            <div class="inbox-chat-area">
              ${
                this.activeConversation
                  ? this.renderConversation()
                  : `
                    <div class="inbox-welcome">
                      <div class="inbox-welcome-icon">✉</div>
                      <h2>Your messages</h2>
                      <p>
                        Select a conversation to view messages.
                      </p>
                    </div>
                  `
              }
            </div>

          </div>

        </section>
      `;

      this.attachEvents(screen);
    },

    renderConversation() {
      const conversation = this.conversations.find(
        (item) => item.id === this.activeConversation
      );

      if (!conversation) {
        return "";
      }

      return `
        <div class="inbox-chat-header">

          <div class="inbox-chat-person">
            <span class="inbox-avatar">
              ${this.escapeHTML(conversation.initials)}
            </span>

            <div>
              <strong>
                ${this.escapeHTML(conversation.name)}
              </strong>

              <span>
                ${
                  conversation.group
                    ? "Group conversation"
                    : conversation.online
                      ? "Online"
                      : "Offline"
                }
              </span>
            </div>
          </div>

          <span class="inbox-demo-label">DEMO</span>

        </div>

        <div class="inbox-messages" id="inbox-messages">

          ${conversation.messages.map((message) => `
            <div class="inbox-message ${
              message.sender === "me" ? "mine" : "theirs"
            }">

              <div class="inbox-message-bubble">
                ${this.escapeHTML(message.text)}
              </div>

              <span class="inbox-message-time">
                ${this.escapeHTML(message.time)}
              </span>

              <button
                type="button"
                class="inbox-reaction-button"
                data-react-message="${this.escapeHTML(message.id)}"
                aria-label="React to message"
              >
                ${message.reactions.length
                  ? this.escapeHTML(message.reactions.join(" "))
                  : "♡"}
              </button>

            </div>
          `).join("")}

        </div>

        <form class="inbox-message-form" id="inbox-message-form">

          <button
            type="button"
            class="inbox-attachment-button"
            data-inbox-attachment
            aria-label="Attach file"
          >
            +
          </button>

          <input
            type="text"
            id="inbox-message-input"
            placeholder="Write a message..."
            maxlength="2000"
            autocomplete="off"
            aria-label="Write a message"
            required
          >

          <button
            type="button"
            class="inbox-voice-button"
            data-inbox-voice
            aria-label="Voice message"
          >
            🎙
          </button>

          <button
            type="submit"
            class="inbox-send-button"
          >
            Send
          </button>

        </form>

        <input
          type="file"
          id="inbox-file-input"
          hidden
          accept="image/*,video/*,.pdf"
        >
      `;
    },

    attachEvents(screen) {
      if (screen.dataset.inboxEvents === "true") {
        return;
      }

      screen.dataset.inboxEvents = "true";

      screen.addEventListener("input", (event) => {
        if (event.target.id !== "inbox-search") {
          return;
        }

        this.searchQuery = event.target.value;
        this.render();

        const input = document.getElementById("inbox-search");

        if (input) {
          input.focus();
          input.setSelectionRange(
            this.searchQuery.length,
            this.searchQuery.length
          );
        }
      });

      screen.addEventListener("click", (event) => {
        const conversationButton = event.target.closest(
          "[data-open-conversation]"
        );

        if (conversationButton) {
          this.openConversation(
            conversationButton.dataset.openConversation
          );
          return;
        }

        const reactionButton = event.target.closest(
          "[data-react-message]"
        );

        if (reactionButton) {
          this.reactToMessage(
            reactionButton.dataset.reactMessage
          );
          return;
        }

        if (event.target.closest("[data-inbox-attachment]")) {
          const fileInput = document.getElementById(
            "inbox-file-input"
          );

          if (fileInput) {
            fileInput.click();
          }

          return;
        }

        if (event.target.closest("[data-inbox-voice]")) {
          alert(
            "Voice messaging is a planned feature. Recording and delivery are not connected yet."
          );
        }
      });

      screen.addEventListener("submit", (event) => {
        if (event.target.id !== "inbox-message-form") {
          return;
        }

        event.preventDefault();

        const input = document.getElementById(
          "inbox-message-input"
        );

        if (!input) {
          return;
        }

        this.sendMessage(input.value);
      });

      screen.addEventListener("change", (event) => {
        if (event.target.id !== "inbox-file-input") {
          return;
        }

        const file = event.target.files[0];

        if (file) {
          alert(
            `${file.name} selected. Secure file upload will be connected later.`
          );

          event.target.value = "";
        }
      });
    },

    openConversation(conversationId) {
      const conversation = this.conversations.find(
        (item) => item.id === conversationId
      );

      if (!conversation) {
        return;
      }

      this.activeConversation = conversationId;
      conversation.unread = 0;

      this.render();
    },

    sendMessage(text) {
      const messageText = text.trim();

      if (!messageText || !this.activeConversation) {
        return;
      }

      const conversation = this.conversations.find(
        (item) => item.id === this.activeConversation
      );

      if (!conversation) {
        return;
      }

      conversation.messages.push({
        id: `local-${Date.now()}`,
        sender: "me",
        text: messageText,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }),
        reactions: []
      });

      this.render();

      const messages = document.getElementById("inbox-messages");

      if (messages) {
        messages.scrollTop = messages.scrollHeight;
      }
    },

    reactToMessage(messageId) {
      const conversation = this.conversations.find(
        (item) => item.id === this.activeConversation
      );

      if (!conversation) {
        return;
      }

      const message = conversation.messages.find(
        (item) => item.id === messageId
      );

      if (!message) {
        return;
      }

      if (message.reactions.includes("❤️")) {
        message.reactions = message.reactions.filter(
          (reaction) => reaction !== "❤️"
        );
      } else {
        message.reactions.push("❤️");
      }

      this.render();
    }
  };

  window.RockyXInbox = RockyXInbox;

  if (
    window.RockyX &&
    typeof window.RockyX.registerModule === "function"
  ) {
    window.RockyX.registerModule("inbox", RockyXInbox);
  }

})();