/* =========================================================
   ROCKYX — QR CODE MODULE
   Version: 1.0.0
   Status: Front-end foundation with QR generation
   ========================================================= */

(function () {
  "use strict";

  const RockyXQR = {
    name: "qr",
    version: "1.0.0",

    profile: {
      username: "rockyx_user",
      displayName: "RockyX User",
      url: "https://rockyx.example/profile/rockyx_user"
    },

    activeType: "profile",
    qrInstance: null,

    initialize() {
      console.log("RockyX QR module initialized.");
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

    getQRContent() {
      const base = this.profile.url;

      const content = {
        profile: base,
        creator: `${base}?section=creator`,
        marketplace: `${base}?section=marketplace`
      };

      return content[this.activeType] || base;
    },

    render() {
      const screen = document.getElementById("app-screen");

      if (!screen) {
        console.error("RockyX QR: app-screen not found.");
        return;
      }

      screen.innerHTML = `
        <section class="qr-page">

          <header class="qr-heading">
            <span class="qr-eyebrow">CONNECT INSTANTLY</span>
            <h1>RockyX QR Code</h1>
            <p>Share your RockyX presence with a scan.</p>
          </header>

          <div class="qr-demo-notice">
            <strong>Demo profile</strong>
            <p>
              This QR code represents a demonstration profile.
              Replace the sample profile address with your real
              RockyX profile address when the platform is connected.
            </p>
          </div>

          <section class="qr-profile-card">

            <div class="qr-avatar">RX</div>

            <h2>${this.escapeHTML(this.profile.displayName)}</h2>

            <p>
              @${this.escapeHTML(this.profile.username)}
            </p>

            <span class="qr-profile-label">ROCKYX PROFILE</span>

          </section>

          <section class="qr-generator">

            <h2>Your QR code</h2>

            <p>
              Choose what people should open when they scan.
            </p>

            <div class="qr-types">

              <button
                type="button"
                data-qr-type="profile"
                class="${this.activeType === "profile" ? "active" : ""}"
              >
                Profile
              </button>

              <button
                type="button"
                data-qr-type="creator"
                class="${this.activeType === "creator" ? "active" : ""}"
              >
                Creator page
              </button>

              <button
                type="button"
                data-qr-type="marketplace"
                class="${this.activeType === "marketplace" ? "active" : ""}"
              >
                Marketplace
              </button>

            </div>

            <div class="qr-code-container">
              <div id="rockyx-qr-output">
                <p>Generating QR code...</p>
              </div>
            </div>

            <p class="qr-address" id="rockyx-qr-address">
              ${this.escapeHTML(this.getQRContent())}
            </p>

            <div class="qr-actions">

              <button
                type="button"
                data-qr-download
                class="qr-primary-button"
              >
                Download QR
              </button>

              <button
                type="button"
                data-qr-copy
                class="qr-secondary-button"
              >
                Copy link
              </button>

              <button
                type="button"
                data-qr-share
                class="qr-secondary-button"
              >
                Share
              </button>

            </div>

          </section>

          <section class="qr-scanner-section">

            <h2>Scan a QR code</h2>

            <p>
              Camera scanning will be connected in the next
              development stage.
            </p>

            <button
              type="button"
              data-qr-scan
              class="qr-secondary-button"
            >
              Open scanner
            </button>

          </section>

          <div id="rockyx-qr-message"></div>

        </section>
      `;

      this.attachEvents(screen);
      this.generateQR();
    },

    generateQR() {
      const output = document.getElementById(
        "rockyx-qr-output"
      );

      if (!output) {
        return;
      }

      output.innerHTML = "";

      if (
        typeof window.QRCode !== "function"
      ) {
        output.innerHTML = `
          <div class="qr-library-missing">
            <strong>QR library not connected</strong>
            <p>
              The QR generator will work after the QR library
              is added to the project.
            </p>
          </div>
        `;

        return;
      }

      this.qrInstance = new window.QRCode(output, {
        text: this.getQRContent(),
        width: 220,
        height: 220,
        colorDark: "#17131f",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel
          ? window.QRCode.CorrectLevel.H
          : undefined
      });
    },

    attachEvents(screen) {
      if (screen.dataset.qrEvents === "true") {
        return;
      }

      screen.dataset.qrEvents = "true";

      screen.addEventListener("click", async (event) => {

        const typeButton = event.target.closest(
          "[data-qr-type]"
        );

        if (typeButton) {
          this.activeType = typeButton.dataset.qrType;
          this.render();
          return;
        }

        if (event.target.closest("[data-qr-download]")) {
          this.downloadQR();
          return;
        }

        if (event.target.closest("[data-qr-copy]")) {
          await this.copyLink();
          return;
        }

        if (event.target.closest("[data-qr-share]")) {
          await this.shareProfile();
          return;
        }

        if (event.target.closest("[data-qr-scan]")) {
          alert(
            "QR camera scanning is planned but is not connected yet."
          );
        }

      });
    },

    getQRImage() {
      const output = document.getElementById(
        "rockyx-qr-output"
      );

      if (!output) {
        return null;
      }

      const canvas = output.querySelector("canvas");

      if (canvas) {
        return canvas.toDataURL("image/png");
      }

      const image = output.querySelector("img");

      return image ? image.src : null;
    },

    downloadQR() {
      const image = this.getQRImage();

      if (!image) {
        alert("QR code is not available yet.");
        return;
      }

      const link = document.createElement("a");

      link.href = image;
      link.download = `rockyx-${this.activeType}-qr.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();
    },

    async copyLink() {
      const url = this.getQRContent();

      try {
        await navigator.clipboard.writeText(url);
        alert("Profile link copied.");
      } catch (error) {
        alert(
          "Clipboard access is unavailable in this browser."
        );
      }
    },

    async shareProfile() {
      const url = this.getQRContent();

      if (navigator.share) {
        try {
          await navigator.share({
            title: "Find me on RockyX",
            text: "Connect with me on RockyX.",
            url
          });
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error("Sharing failed:", error);
          }
        }

        return;
      }

      await this.copyLink();
    }
  };

  window.RockyXQR = RockyXQR;

  if (
    window.RockyX &&
    typeof window.RockyX.registerModule === "function"
  ) {
    window.RockyX.registerModule("qr", RockyXQR);
  }

})();