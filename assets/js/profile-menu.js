/* =====================================================
   ROCKYX PROFILE MENU
   One World. One Platform.
   ===================================================== */

(function () {
  "use strict";

  const RockyXProfileMenu = {
    initialized: false,

    items: [
      {
        section: "Assets",
        items: [
          {
            icon: "💰",
            title: "Balance",
            subtitle: "Your wallet and transactions",
            screen: "Wallet"
          },
          {
            icon: "🎁",
            title: "Rewards",
            subtitle: "Your creator rewards",
            screen: "Rewards"
          }
        ]
      },

      {
        section: "Personal tools",
        items: [
          {
            icon: "📊",
            title: "Activity Centre",
            subtitle: "Your activity and history",
            screen: "Activity"
          },
          {
            icon: "📥",
            title: "Offline Videos",
            subtitle: "Your saved videos",
            screen: "Offline"
          },
          {
            icon: "▦",
            title: "My QR Code",
            subtitle: "Share your RockyX profile",
            screen: "QRCode"
          }
        ]
      },

      {
        section: "Creation & business tools",
        items: [
          {
            icon: "🎬",
            title: "RockyX Studio",
            subtitle: "Create and manage videos",
            screen: "Studio"
          },
          {
            icon: "📈",
            title: "Creator Dashboard",
            subtitle: "Analytics, content and earnings",
            screen: "CreatorDashboard",
            featured: true
          },
          {
            icon: "✨",
            title: "Template Creator Centre",
            subtitle: "Create and manage templates",
            screen: "TemplateCreator"
          },
          {
            icon: "📣",
            title: "Promote",
            subtitle: "Promote your content",
            screen: "Promote"
          },
          {
            icon: "🛍️",
            title: "Seller Centre",
            subtitle: "Manage your marketplace business",
            screen: "SellerCentre"
          }
        ]
      },

      {
        section: "Settings and support",
        items: [
          {
            icon: "⚙️",
            title: "Settings and privacy",
            subtitle: "Manage your account",
            screen: "Settings"
          },
          {
            icon: "🔐",
            title: "Security",
            subtitle: "Protect your account",
            screen: "Security"
          },
          {
            icon: "🔔",
            title: "Notifications",
            subtitle: "Manage notifications",
            screen: "NotificationSettings"
          },
          {
            icon: "🛡️",
            title: "Privacy and safety",
            subtitle: "Control your privacy",
            screen: "Privacy"
          },
          {
            icon: "❓",
            title: "Help and support",
            subtitle: "Get help with RockyX",
            screen: "Help"
          }
        ]
      }
    ],

    styles: `
      .rx-profile-menu {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: none;
        font-family: Arial, sans-serif;
      }

      .rx-profile-menu.rx-open {
        display: block;
      }

      .rx-profile-menu-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, .68);
      }

      .rx-profile-menu-panel {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(390px, 88vw);
        overflow-y: auto;
        background: #111116;
        color: #fff;
        padding: 20px 16px 35px;
        box-sizing: border-box;
        box-shadow: -8px 0 35px rgba(0, 0, 0, .35);
        animation: rxMenuSlide .22s ease-out;
      }

      @keyframes rxMenuSlide {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }

      .rx-menu-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 18px;
        border-bottom: 1px solid #292932;
      }

      .rx-menu-brand {
        font-size: 23px;
        font-weight: 900;
        letter-spacing: 1px;
      }

      .rx-menu-brand span {
        color: #a855f7;
      }

      .rx-menu-close {
        border: 0;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        background: #25252e;
        color: white;
        font-size: 25px;
        cursor: pointer;
      }

      .rx-menu-section {
        margin-top: 23px;
      }

      .rx-menu-section-title {
        margin: 0 0 9px;
        color: #a7a7b4;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .8px;
      }

      .rx-menu-item {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 13px 10px;
        margin: 3px 0;
        border: 0;
        border-radius: 12px;
        background: transparent;
        color: white;
        text-align: left;
        cursor: pointer;
      }

      .rx-menu-item:active {
        background: #292432;
      }

      .rx-menu-item.rx-featured {
        background: linear-gradient(
          110deg,
          rgba(168, 85, 247, .22),
          rgba(124, 58, 237, .08)
        );
        border: 1px solid rgba(168, 85, 247, .35);
      }

      .rx-menu-icon {
        width: 38px;
        height: 38px;
        flex-shrink: 0;
        display: grid;
        place-items: center;
        border-radius: 11px;
        background: #24232d;
        font-size: 19px;
      }

      .rx-featured .rx-menu-icon {
        background: #7136bd;
      }

      .rx-menu-copy {
        flex: 1;
        min-width: 0;
      }

      .rx-menu-name {
        display: block;
        font-size: 14px;
        font-weight: 700;
      }

      .rx-menu-description {
        display: block;
        margin-top: 4px;
        color: #9999a8;
        font-size: 11px;
        line-height: 1.4;
      }

      .rx-menu-arrow {
        color: #777785;
        font-size: 22px;
      }

      .rx-menu-footer {
        margin-top: 28px;
        padding-top: 18px;
        border-top: 1px solid #292932;
        color: #858594;
        font-size: 11px;
        text-align: center;
      }

      body.rx-menu-locked {
        overflow: hidden;
      }
    `,

    installStyles() {
      if (document.getElementById("rx-profile-menu-styles")) return;

      const style = document.createElement("style");
      style.id = "rx-profile-menu-styles";
      style.textContent = this.styles;
      document.head.appendChild(style);
    },

    createMenu() {
      if (document.getElementById("rx-profile-menu")) return;

      const menu = document.createElement("div");
      menu.id = "rx-profile-menu";
      menu.className = "rx-profile-menu";

      menu.innerHTML = `
        <div class="rx-profile-menu-backdrop"
             data-rx-menu-close></div>

        <aside class="rx-profile-menu-panel"
               role="dialog"
               aria-modal="true"
               aria-label="RockyX menu">

          <header class="rx-menu-header">
            <div class="rx-menu-brand">
              ROCKY<span>X</span>
            </div>

            <button class="rx-menu-close"
                    type="button"
                    data-rx-menu-close
                    aria-label="Close menu">×</button>
          </header>

          <div class="rx-menu-content"></div>

          <footer class="rx-menu-footer">
            RockyX · One World. One Platform.
          </footer>
        </aside>
      `;

      document.body.appendChild(menu);

      const content = menu.querySelector(".rx-menu-content");

      this.items.forEach((section) => {
        const sectionElement = document.createElement("section");
        sectionElement.className = "rx-menu-section";

        const heading = document.createElement("h2");
        heading.className = "rx-menu-section-title";
        heading.textContent = section.section;

        sectionElement.appendChild(heading);

        section.items.forEach((item) => {
          const button = document.createElement("button");

          button.type = "button";
          button.className =
            "rx-menu-item" +
            (item.featured ? " rx-featured" : "");

          button.dataset.rxMenuScreen = item.screen;

          const icon = document.createElement("span");
          icon.className = "rx-menu-icon";
          icon.textContent = item.icon;

          const copy = document.createElement("span");
          copy.className = "rx-menu-copy";

          const title = document.createElement("span");
          title.className = "rx-menu-name";
          title.textContent = item.title;

          const subtitle = document.createElement("span");
          subtitle.className = "rx-menu-description";
          subtitle.textContent = item.subtitle;

          copy.append(title, subtitle);

          const arrow = document.createElement("span");
          arrow.className = "rx-menu-arrow";
          arrow.textContent = "›";

          button.append(icon, copy, arrow);
          sectionElement.appendChild(button);
        });

        content.appendChild(sectionElement);
      });
    },

    open() {
      const menu = document.getElementById("rx-profile-menu");
      if (!menu) return;

      menu.classList.add("rx-open");
      document.body.classList.add("rx-menu-locked");

      const closeButton = menu.querySelector(".rx-menu-close");
      if (closeButton) closeButton.focus();
    },

    close() {
      const menu = document.getElementById("rx-profile-menu");
      if (!menu) return;

      menu.classList.remove("rx-open");
      document.body.classList.remove("rx-menu-locked");
    },

    navigate(screen) {
      this.close();

      // Existing app screens
      const existingScreens = {
        Home: "page-Home",
        Explore: "page-Explore",
        Studio: "page-Studio",
        Inbox: "page-Inbox",
        Profile: "page-Profile",
        Music: "page-Music",
        Marketplace: "page-Marketplace",
        Wallet: "page-Wallet"
      };

      if (existingScreens[screen]) {
        if (
          window.RockyXAppRouter &&
          typeof window.RockyXAppRouter.showScreen === "function"
        ) {
          window.RockyXAppRouter.showScreen(screen);
        } else {
          document.querySelectorAll(
            '[id^="page-"], [data-page], .app-page'
          ).forEach((page) => {
            page.hidden = true;
          });

          const page = document.getElementById(existingScreens[screen]);

          if (page) {
            page.hidden = false;
            page.style.display = "";
          }
        }

        return;
      }

      // Other destinations are opened only if another module
      // registers a handler for them.
      const handled = window.dispatchEvent(
        new CustomEvent("rockyx:menu-navigation", {
          detail: { screen: screen }
        })
      );

      if (handled) {
        console.info("RockyX navigation requested:", screen);
      } else {
        console.info(
          "RockyX screen needs integration:",
          screen
        );

        window.dispatchEvent(
          new CustomEvent("rockyx:feature-requested", {
            detail: { screen: screen }
          })
        );
      }
    },

    init() {
      if (this.initialized) return;

      this.installStyles();
      this.createMenu();

      const menu = document.getElementById("rx-profile-menu");

      menu.addEventListener("click", (event) => {
        const closeTarget = event.target.closest(
          "[data-rx-menu-close]"
        );

        if (closeTarget) {
          this.close();
          return;
        }

        const item = event.target.closest(
          "[data-rx-menu-screen]"
        );

        if (item) {
          this.navigate(item.dataset.rxMenuScreen);
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") this.close();
      });

      document.addEventListener("click", (event) => {
        const trigger = event.target.closest(
          "[data-open-profile-menu]"
        );

        if (trigger) {
          event.preventDefault();
          this.open();
        }
      });

      this.initialized = true;
    }
  };

  window.RockyXProfileMenu = RockyXProfileMenu;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      RockyXProfileMenu.init();
    });
  } else {
    RockyXProfileMenu.init();
  }
})();