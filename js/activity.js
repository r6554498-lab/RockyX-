/* =========================================================
   ROCKYX — ACTIVITY CENTRE
   Version: 1.0.0
   Status: Front-end foundation with demo notifications
   ========================================================= */

(function () {
  "use strict";

  const RockyXActivity = {
    name: "activity",
    version: "1.0.0",

    activeCategory: "All",

    categories: [
      "All",
      "Social",
      "Comments",
      "Followers",
      "Messages",
      "Marketplace",
      "System"
    ],

    // Demonstration notifications only.
    notifications: [
      {
        id: "activity-001",
        type: "Social",
        title: "New like",
        message: "Alex Morgan liked your video.",
        time: "5 minutes ago",
        read: false,
        icon: "♥"
      },
      {
        id: "activity-002",
        type: "Comments",
        title: "New comment",
        message: "Jordan Lee commented on your post.",
        time: "20 minutes ago",
        read: false,
        icon: "💬"
      },
      {
        id: "activity-003",
        type: "Followers",
        title: "New follower",
        message: "Taylor followed your profile.",
        time: "1 hour ago",
        read: false,
        icon: "＋"
      },
      {
        id: "activity-004",
        type: "Messages",
        title: "New message",
        message: "You have a new demonstration message.",
        time: "2 hours ago",
        read: true,
        icon: "✉"
      },
      {
        id: "activity-005",
        type: "Marketplace",
        title: "Marketplace update",
        message: "Your demonstration listing received activity.",
        time: "Yesterday",
        read: true,
        icon: "◇"
      },
      {
        id: "activity-006",
        type: "System",
        title: "Welcome to RockyX",
        message: "Your RockyX experience starts here.",
        time: "Yesterday",
        read: true,
        icon: "◆"
      }
    ],

    initialize() {
      console.log("RockyX Activity Centre initialized.");
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

    getUnreadCount() {
      return this.notifications.filter(
        (notification) => !notification.read
      ).length;
    },

    getFilteredNotifications() {
      if (this.activeCategory === "All") {
        return this.notifications;
      }

      return this.notifications.filter(
        (notification) =>
          notification.type === this.activeCategory
      );
    },

    render() {
      const screen = document.getElementById("app-screen");

      if (!screen) {
        console.error("RockyX Activity: app-screen not found.");
        return;
      }

      const filtered = this.getFilteredNotifications();

      screen.innerHTML = `
        <section class="activity-page">

          <header class="activity-heading">

            <div>
              <span class="activity-eyebrow">
                YOUR ROCKYX UPDATES
              </span>

              <h1>Activity Centre</h1>

              <p>
                Keep track of what's happening across RockyX.
              </p>
            </div>

            <div class="activity-unread-count">
              <strong>${this.getUnreadCount()}</strong>
              <span>Unread</span>
            </div>

          </header>

          <div class="activity-demo-notice">
            Demonstration notifications. Real-time updates
            will be connected to the backend later.
          </div>

          <div class="activity-toolbar">

            <h2>Notifications</h2>

            <button
              type="button"
              class="activity-mark-all"
              data-mark-all-read
            >
              Mark all as read
            </button>

          </div>

          <div class="activity-categories">

            ${this.categories.map((category) => `
              <button
                type="button"
                class="activity-category ${
                  this.activeCategory === category ? "active" : ""
                }"
                data-activity-category="${this.escapeHTML(category)}"
              >
                ${this.escapeHTML(category)}
              </button>
            `).join("")}

          </div>

          <div class="activity-list">

            ${
              filtered.length
                ? filtered.map((notification) => `
                  <article
                    class="activity-item ${
                      notification.read ? "read" : "unread"
                    }"
                    data-notification-id="${this.escapeHTML(notification.id)}"
                  >

                    <div class="activity-icon">
                      ${this.escapeHTML(notification.icon)}
                    </div>

                    <div class="activity-content">

                      <div class="activity-title-row">
                        <h3>
                          ${this.escapeHTML(notification.title)}
                        </h3>

                        ${
                          !notification.read
                            ? '<span class="activity-unread-dot"></span>'
                            : ""
                        }
                      </div>

                      <p>
                        ${this.escapeHTML(notification.message)}
                      </p>

                      <span class="activity-time">
                        ${this.escapeHTML(notification.time)}
                      </span>

                    </div>

                    <div class="activity-actions">

                      ${
                        !notification.read
                          ? `
                            <button
                              type="button"
                              data-mark-read="${this.escapeHTML(notification.id)}"
                            >
                              Mark read
                            </button>
                          `
                          : `
                            <span class="activity-read-label">
                              Read
                            </span>
                          `
                      }

                    </div>

                  </article>
                `).join("")
                : `
                  <div class="activity-empty">
                    <div class="activity-empty-icon">◇</div>
                    <h3>No notifications here</h3>
                    <p>
                      Updates in this category will appear here.
                    </p>
                  </div>
                `
            }

          </div>

        </section>
      `;

      this.attachEvents(screen);
    },

    attachEvents(screen) {
      if (screen.dataset.activityEvents === "true") {
        return;
      }

      screen.dataset.activityEvents = "true";

      screen.addEventListener("click", (event) => {

        const categoryButton = event.target.closest(
          "[data-activity-category]"
        );

        if (categoryButton) {
          this.activeCategory =
            categoryButton.dataset.activityCategory;

          this.render();
          return;
        }

        const markReadButton = event.target.closest(
          "[data-mark-read]"
        );

        if (markReadButton) {
          this.markAsRead(
            markReadButton.dataset.markRead
          );

          this.render();
          return;
        }

        if (event.target.closest("[data-mark-all-read]")) {
          this.markAllAsRead();
          this.render();
        }

      });
    },

    markAsRead(notificationId) {
      const notification = this.notifications.find(
        (item) => item.id === notificationId
      );

      if (notification) {
        notification.read = true;
      }
    },

    markAllAsRead() {
      this.notifications.forEach((notification) => {
        notification.read = true;
      });
    },

    addNotification(data) {
      if (!data || !data.title || !data.message) {
        console.error("Invalid notification data.");
        return;
      }

      const notification = {
        id: `activity-${Date.now()}`,
        type: this.categories.includes(data.type)
          ? data.type
          : "System",
        title: String(data.title),
        message: String(data.message),
        time: "Just now",
        read: false,
        icon: data.icon || "◆"
      };

      this.notifications.unshift(notification);

      return notification;
    }
  };

  window.RockyXActivity = RockyXActivity;

  if (
    window.RockyX &&
    typeof window.RockyX.registerModule === "function"
  ) {
    window.RockyX.registerModule(
      "activity",
      RockyXActivity
    );
  }

})();