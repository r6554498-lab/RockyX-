/* =========================================================
   ROCKYX — WALLET & EARNINGS MODULE
   Version: 1.0.0
   Status: Front-end foundation with demonstration data
   ========================================================= */

(function () {
  "use strict";

  const RockyXWallet = {
    name: "wallet",
    version: "1.0.0",

    currency: "GHS",

    // Demonstration balances only.
    // These are NOT real funds.
    balance: 2450.00,
    pendingEarnings: 680.00,
    totalEarnings: 8750.00,

    activeFilter: "All",

    transactions: [
      {
        id: "transaction-001",
        title: "Video creator earnings",
        category: "Earnings",
        amount: 350.00,
        date: "Today",
        status: "Completed"
      },
      {
        id: "transaction-002",
        title: "Marketplace sale",
        category: "Earnings",
        amount: 220.00,
        date: "Yesterday",
        status: "Completed"
      },
      {
        id: "transaction-003",
        title: "Promotion expense",
        category: "Expenses",
        amount: -85.00,
        date: "Yesterday",
        status: "Completed"
      },
      {
        id: "transaction-004",
        title: "Creator subscription",
        category: "Earnings",
        amount: 150.00,
        date: "Monday",
        status: "Completed"
      },
      {
        id: "transaction-005",
        title: "Pending creator earnings",
        category: "Earnings",
        amount: 680.00,
        date: "Processing",
        status: "Pending"
      },
      {
        id: "transaction-006",
        title: "Marketplace purchase",
        category: "Expenses",
        amount: -120.00,
        date: "Last week",
        status: "Completed"
      }
    ],

    initialize() {
      console.log("RockyX Wallet initialized.");
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

    formatMoney(amount) {
      return new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: this.currency,
        minimumFractionDigits: 2
      }).format(amount);
    },

    getFilteredTransactions() {
      if (this.activeFilter === "All") {
        return this.transactions;
      }

      return this.transactions.filter(
        (transaction) =>
          transaction.category === this.activeFilter
      );
    },

    render() {
      const screen = document.getElementById("app-screen");

      if (!screen) {
        console.error("RockyX Wallet: app-screen not found.");
        return;
      }

      const transactions = this.getFilteredTransactions();

      screen.innerHTML = `
        <section class="wallet-page">

          <header class="wallet-heading">
            <div>
              <span class="wallet-eyebrow">
                YOUR FINANCES
              </span>

              <h1>Wallet & Earnings</h1>

              <p>
                Manage your demonstration earnings and transactions.
              </p>
            </div>
          </header>

          <div class="wallet-demo-notice">
            <strong>DEMO WALLET</strong>
            <p>
              All balances and transactions displayed here are fictional.
              No real money is stored or transferred.
            </p>
          </div>

          <section class="wallet-balance-card">

            <div class="wallet-balance-top">
              <span>Available balance</span>
              <span class="wallet-demo-badge">DEMO</span>
            </div>

            <h2>${this.formatMoney(this.balance)}</h2>

            <div class="wallet-balance-footer">
              <span>RockyX Wallet</span>
              <span>•••• 2048</span>
            </div>

          </section>

          <div class="wallet-summary-grid">

            <article class="wallet-summary-card">
              <span>Pending earnings</span>
              <strong>${this.formatMoney(this.pendingEarnings)}</strong>
              <small>Awaiting processing</small>
            </article>

            <article class="wallet-summary-card">
              <span>Total earnings</span>
              <strong>${this.formatMoney(this.totalEarnings)}</strong>
              <small>Lifetime demo earnings</small>
            </article>

          </div>

          <section class="wallet-actions">

            <h2>Wallet actions</h2>

            <div class="wallet-action-grid">

              <button
                type="button"
                class="wallet-action-button"
                data-wallet-action="deposit"
              >
                <span>＋</span>
                Deposit
              </button>

              <button
                type="button"
                class="wallet-action-button"
                data-wallet-action="withdraw"
              >
                <span>↗</span>
                Withdraw
              </button>

              <button
                type="button"
                class="wallet-action-button"
                data-wallet-action="transfer"
              >
                <span>⇄</span>
                Transfer
              </button>

              <button
                type="button"
                class="wallet-action-button"
                data-wallet-action="methods"
              >
                <span>▤</span>
                Payment methods
              </button>

            </div>

          </section>

          <section class="wallet-transactions">

            <div class="wallet-section-heading">
              <h2>Transaction history</h2>
              <span>${transactions.length} records</span>
            </div>

            <div class="wallet-filters">

              ${["All", "Earnings", "Expenses"].map((filter) => `
                <button
                  type="button"
                  class="wallet-filter ${
                    this.activeFilter === filter ? "active" : ""
                  }"
                  data-wallet-filter="${filter}"
                >
                  ${filter}
                </button>
              `).join("")}

            </div>

            ${
              transactions.length
                ? `
                  <div class="wallet-transaction-list">

                    ${transactions.map((transaction) => `
                      <article class="wallet-transaction">

                        <div class="wallet-transaction-icon ${
                          transaction.category === "Earnings"
                            ? "income"
                            : "expense"
                        }">
                          ${
                            transaction.category === "Earnings"
                              ? "↙"
                              : "↗"
                          }
                        </div>

                        <div class="wallet-transaction-info">

                          <strong>
                            ${this.escapeHTML(transaction.title)}
                          </strong>

                          <span>
                            ${this.escapeHTML(transaction.date)}
                          </span>

                        </div>

                        <div class="wallet-transaction-amount">

                          <strong class="${
                            transaction.amount >= 0
                              ? "positive"
                              : "negative"
                          }">
                            ${transaction.amount >= 0 ? "+" : ""}
                            ${this.formatMoney(transaction.amount)}
                          </strong>

                          <span class="wallet-status ${
                            transaction.status.toLowerCase()
                          }">
                            ${this.escapeHTML(transaction.status)}
                          </span>

                        </div>

                      </article>
                    `).join("")}

                  </div>
                `
                : `
                  <div class="wallet-empty">
                    No transactions found.
                  </div>
                `
            }

          </section>

          <div id="wallet-overlay"></div>

        </section>
      `;

      this.attachEvents(screen);
    },

    attachEvents(screen) {
      if (screen.dataset.walletEvents === "true") {
        return;
      }

      screen.dataset.walletEvents = "true";

      screen.addEventListener("click", (event) => {

        const filterButton = event.target.closest(
          "[data-wallet-filter]"
        );

        if (filterButton) {
          this.activeFilter =
            filterButton.dataset.walletFilter;

          this.render();
          return;
        }

        const actionButton = event.target.closest(
          "[data-wallet-action]"
        );

        if (actionButton) {
          this.handleAction(
            actionButton.dataset.walletAction
          );
        }

        if (event.target.closest("[data-wallet-close]")) {
          this.closeOverlay();
        }

      });

      screen.addEventListener("submit", (event) => {
        if (event.target.id !== "wallet-withdraw-form") {
          return;
        }

        event.preventDefault();

        alert(
          "Withdrawal is a demonstration only. No real withdrawal has been made."
        );

        this.closeOverlay();
      });
    },

    handleAction(action) {
      const messages = {
        deposit:
          "Deposits will be connected to a supported payment provider later.",

        transfer:
          "Wallet transfers will require secure account verification and backend processing.",

        methods:
          "Payment method management will be connected securely later."
      };

      if (action === "withdraw") {
        this.showWithdrawalForm();
        return;
      }

      if (messages[action]) {
        alert(messages[action]);
      }
    },

    showWithdrawalForm() {
      const overlay = document.getElementById("wallet-overlay");

      if (!overlay) {
        return;
      }

      overlay.innerHTML = `
        <div
          class="wallet-modal-backdrop"
          data-wallet-close
        >

          <section
            class="wallet-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Withdrawal demonstration"
          >

            <button
              type="button"
              class="wallet-modal-close"
              data-wallet-close
              aria-label="Close"
            >
              ×
            </button>

            <span class="wallet-eyebrow">
              WALLET
            </span>

            <h2>Withdraw funds</h2>

            <div class="wallet-modal-notice">
              Demonstration only. This form cannot transfer money.
            </div>

            <p>
              Available demo balance:
              <strong>${this.formatMoney(this.balance)}</strong>
            </p>

            <form id="wallet-withdraw-form">

              <label for="wallet-withdraw-amount">
                Amount
              </label>

              <input
                type="number"
                id="wallet-withdraw-amount"
                min="1"
                max="${this.balance}"
                step="0.01"
                placeholder="Enter amount"
                required
              >

              <label for="wallet-withdraw-method">
                Withdrawal method
              </label>

              <select
                id="wallet-withdraw-method"
                required
              >
                <option value="">Choose a method</option>
                <option value="mobile-money">Mobile Money</option>
                <option value="bank">Bank transfer</option>
              </select>

              <button
                type="submit"
                class="wallet-confirm-button"
              >
                Preview withdrawal
              </button>

            </form>

          </section>
        </div>
      `;
    },

    closeOverlay() {
      const overlay = document.getElementById("wallet-overlay");

      if (overlay) {
        overlay.innerHTML = "";
      }
    }
  };

  window.RockyXWallet = RockyXWallet;

  if (
    window.RockyX &&
    typeof window.RockyX.registerModule === "function"
  ) {
    window.RockyX.registerModule("wallet", RockyXWallet);
  }

})();