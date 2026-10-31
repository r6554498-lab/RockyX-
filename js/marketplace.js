/* =========================================================
   ROCKYX — MARKETPLACE MODULE
   Version: 1.0.0
   Status: Front-end foundation with demo products
   ========================================================= */

(function () {
  "use strict";

  const RockyXMarketplace = {
    name: "marketplace",
    version: "1.0.0",

    activeCategory: "All",
    searchQuery: "",
    selectedProduct: null,

    favourites: new Set(),
    cart: new Map(),

    categories: [
      "All",
      "Electronics",
      "Fashion",
      "Home",
      "Beauty",
      "Digital",
      "Services"
    ],

    // Demonstration listings. No real products or sellers.
    products: [
      {
        id: "product-001",
        name: "Wireless Headphones",
        description: "Wireless audio accessory for everyday listening.",
        price: 450,
        currency: "GHS",
        category: "Electronics",
        seller: "RockyX Demo Store",
        condition: "New",
        color: "#59468f"
      },
      {
        id: "product-002",
        name: "Classic Sneakers",
        description: "Casual footwear for everyday outfits.",
        price: 380,
        currency: "GHS",
        category: "Fashion",
        seller: "RockyX Demo Fashion",
        condition: "New",
        color: "#86536f"
      },
      {
        id: "product-003",
        name: "Modern Desk Lamp",
        description: "A simple lighting accessory for your workspace.",
        price: 220,
        currency: "GHS",
        category: "Home",
        seller: "RockyX Demo Living",
        condition: "New",
        color: "#a06b43"
      },
      {
        id: "product-004",
        name: "Digital Design Pack",
        description: "A demonstration digital design product listing.",
        price: 90,
        currency: "GHS",
        category: "Digital",
        seller: "RockyX Demo Creator",
        condition: "Digital",
        color: "#426f82"
      },
      {
        id: "product-005",
        name: "Skincare Set",
        description: "A demonstration beauty product listing.",
        price: 160,
        currency: "GHS",
        category: "Beauty",
        seller: "RockyX Demo Beauty",
        condition: "New",
        color: "#a05270"
      },
      {
        id: "product-006",
        name: "Graphic Design Service",
        description: "A demonstration listing for a creative service.",
        price: 250,
        currency: "GHS",
        category: "Services",
        seller: "RockyX Demo Studio",
        condition: "Service",
        color: "#5c4b9c"
      }
    ],

    initialize() {
      console.log("RockyX Marketplace initialized.");
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

    formatPrice(product) {
      return new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: product.currency
      }).format(product.price);
    },

    getFilteredProducts() {
      return this.products.filter((product) => {
        const matchesCategory =
          this.activeCategory === "All" ||
          product.category === this.activeCategory;

        const search = this.searchQuery.toLowerCase();

        const matchesSearch =
          product.name.toLowerCase().includes(search) ||
          product.description.toLowerCase().includes(search) ||
          product.category.toLowerCase().includes(search) ||
          product.seller.toLowerCase().includes(search);

        return matchesCategory && matchesSearch;
      });
    },

    getCartCount() {
      let count = 0;

      this.cart.forEach((quantity) => {
        count += quantity;
      });

      return count;
    },

    getCartTotal() {
      let total = 0;

      this.cart.forEach((quantity, productId) => {
        const product = this.products.find(
          (item) => item.id === productId
        );

        if (product) {
          total += product.price * quantity;
        }
      });

      return total;
    },

    render() {
      const screen = document.getElementById("app-screen");

      if (!screen) {
        console.error("RockyX Marketplace: app-screen not found.");
        return;
      }

      const filteredProducts = this.getFilteredProducts();

      screen.innerHTML = `
        <section class="marketplace-page">

          <header class="marketplace-heading">
            <div>
              <span class="marketplace-eyebrow">
                DISCOVER SOMETHING NEW
              </span>

              <h1>Marketplace</h1>

              <p>
                Discover products, digital goods and services.
              </p>
            </div>

            <button
              type="button"
              class="marketplace-cart-button"
              data-marketplace-cart
            >
              Cart (${this.getCartCount()})
            </button>
          </header>

          <div class="marketplace-notice">
            <strong>Demonstration marketplace</strong>
            <p>
              Listings, prices and sellers shown here are sample data.
              Purchases and payments are not real.
            </p>
          </div>

          <div class="marketplace-search">
            <input
              type="search"
              id="marketplace-search"
              placeholder="Search products and services..."
              value="${this.escapeHTML(this.searchQuery)}"
              aria-label="Search marketplace"
            >
          </div>

          <div class="marketplace-categories">
            ${this.categories.map((category) => `
              <button
                type="button"
                class="marketplace-category ${
                  this.activeCategory === category ? "active" : ""
                }"
                data-marketplace-category="${this.escapeHTML(category)}"
              >
                ${this.escapeHTML(category)}
              </button>
            `).join("")}
          </div>

          <div class="marketplace-section-heading">
            <h2>Explore listings</h2>
            <span>${filteredProducts.length} listings</span>
          </div>

          ${
            filteredProducts.length
              ? `
                <div class="marketplace-grid">

                  ${filteredProducts.map((product) => `
                    <article class="marketplace-card">

                      <div
                        class="marketplace-product-art"
                        style="--product-color: ${product.color}"
                      >
                        <span>ROCKYX</span>

                        <button
                          type="button"
                          class="marketplace-favourite ${
                            this.favourites.has(product.id)
                              ? "active"
                              : ""
                          }"
                          data-marketplace-favourite="${this.escapeHTML(product.id)}"
                          aria-label="Toggle favourite"
                          aria-pressed="${this.favourites.has(product.id)}"
                        >
                          ${this.favourites.has(product.id) ? "♥" : "♡"}
                        </button>
                      </div>

                      <div class="marketplace-product-info">

                        <span class="marketplace-product-category">
                          ${this.escapeHTML(product.category)}
                        </span>

                        <h3>
                          ${this.escapeHTML(product.name)}
                        </h3>

                        <p>
                          ${this.escapeHTML(product.description)}
                        </p>

                        <strong class="marketplace-price">
                          ${this.formatPrice(product)}
                        </strong>

                        <span class="marketplace-seller">
                          ${this.escapeHTML(product.seller)}
                        </span>

                        <div class="marketplace-product-actions">

                          <button
                            type="button"
                            class="marketplace-details-button"
                            data-marketplace-details="${this.escapeHTML(product.id)}"
                          >
                            Details
                          </button>

                          <button
                            type="button"
                            class="marketplace-add-button"
                            data-marketplace-add="${this.escapeHTML(product.id)}"
                          >
                            Add to cart
                          </button>

                        </div>

                      </div>
                    </article>
                  `).join("")}

                </div>
              `
              : `
                <div class="marketplace-empty">
                  <h3>No listings found</h3>
                  <p>Try another search or category.</p>
                </div>
              `
          }

          <div id="marketplace-overlay"></div>

        </section>
      `;

      this.attachEvents(screen);
    },

    attachEvents(screen) {
      if (screen.dataset.marketplaceEvents === "true") {
        return;
      }

      screen.dataset.marketplaceEvents = "true";

      screen.addEventListener("input", (event) => {
        if (event.target.id !== "marketplace-search") {
          return;
        }

        this.searchQuery = event.target.value;

        this.render();

        const input = document.getElementById(
          "marketplace-search"
        );

        if (input) {
          input.focus();

          input.setSelectionRange(
            this.searchQuery.length,
            this.searchQuery.length
          );
        }
      });

      screen.addEventListener("click", (event) => {
        const categoryButton = event.target.closest(
          "[data-marketplace-category]"
        );

        if (categoryButton) {
          this.activeCategory =
            categoryButton.dataset.marketplaceCategory;

          this.render();
          return;
        }

        const favouriteButton = event.target.closest(
          "[data-marketplace-favourite]"
        );

        if (favouriteButton) {
          this.toggleFavourite(
            favouriteButton.dataset.marketplaceFavourite
          );

          this.render();
          return;
        }

        const addButton = event.target.closest(
          "[data-marketplace-add]"
        );

        if (addButton) {
          this.addToCart(
            addButton.dataset.marketplaceAdd
          );

          return;
        }

        const detailsButton = event.target.closest(
          "[data-marketplace-details]"
        );

        if (detailsButton) {
          this.showProductDetails(
            detailsButton.dataset.marketplaceDetails
          );

          return;
        }

        if (event.target.closest("[data-marketplace-cart]")) {
          this.showCart();
          return;
        }

        if (event.target.closest("[data-marketplace-close]")) {
          this.closeOverlay();
          return;
        }

        if (event.target.closest("[data-marketplace-remove]")) {
          this.removeFromCart(
            event.target.closest("[data-marketplace-remove]")
              .dataset.marketplaceRemove
          );

          this.showCart();
        }
      });
    },

    toggleFavourite(productId) {
      if (this.favourites.has(productId)) {
        this.favourites.delete(productId);
      } else {
        this.favourites.add(productId);
      }
    },

    addToCart(productId) {
      const product = this.products.find(
        (item) => item.id === productId
      );

      if (!product) {
        console.error("Marketplace product not found.");
        return;
      }

      const quantity = this.cart.get(productId) || 0;

      this.cart.set(productId, quantity + 1);

      const cartButton = document.querySelector(
        "[data-marketplace-cart]"
      );

      if (cartButton) {
        cartButton.textContent =
          `Cart (${this.getCartCount()})`;
      }

      alert(`${product.name} added to your demo cart.`);
    },

    removeFromCart(productId) {
      this.cart.delete(productId);
    },

    showProductDetails(productId) {
      const product = this.products.find(
        (item) => item.id === productId
      );

      if (!product) {
        return;
      }

      this.selectedProduct = product;

      const overlay = document.getElementById(
        "marketplace-overlay"
      );

      if (!overlay) {
        return;
      }

      overlay.innerHTML = `
        <div class="marketplace-modal-backdrop"
             data-marketplace-close>

          <section
            class="marketplace-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Product details"
          >

            <button
              type="button"
              class="marketplace-modal-close"
              data-marketplace-close
              aria-label="Close"
            >
              ×
            </button>

            <h2>${this.escapeHTML(product.name)}</h2>

            <p>${this.escapeHTML(product.description)}</p>

            <strong>${this.formatPrice(product)}</strong>

            <p>
              Seller: ${this.escapeHTML(product.seller)}
            </p>

            <p>
              Listing type: ${this.escapeHTML(product.condition)}
            </p>

            <button
              type="button"
              class="marketplace-add-button"
              data-marketplace-add="${this.escapeHTML(product.id)}"
            >
              Add to cart
            </button>

          </section>
        </div>
      `;
    },

    showCart() {
      const overlay = document.getElementById(
        "marketplace-overlay"
      );

      if (!overlay) {
        return;
      }

      const items = [];

      this.cart.forEach((quantity, productId) => {
        const product = this.products.find(
          (item) => item.id === productId
        );

        if (product) {
          items.push({ product, quantity });
        }
      });

      overlay.innerHTML = `
        <div class="marketplace-modal-backdrop"
             data-marketplace-close>

          <section
            class="marketplace-modal marketplace-cart-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >

            <button
              type="button"
              class="marketplace-modal-close"
              data-marketplace-close
              aria-label="Close"
            >
              ×
            </button>

            <h2>Your cart</h2>

            ${
              items.length
                ? items.map(({ product, quantity }) => `
                    <div class="marketplace-cart-item">

                      <div>
                        <strong>
                          ${this.escapeHTML(product.name)}
                        </strong>

                        <p>
                          ${quantity} × ${this.formatPrice(product)}
                        </p>
                      </div>

                      <button
                        type="button"
                        data-marketplace-remove="${this.escapeHTML(product.id)}"
                      >
                        Remove
                      </button>

                    </div>
                  `).join("")
                : "<p>Your cart is empty.</p>"
            }

            <div class="marketplace-cart-total">
              <strong>Demo total</strong>
              <strong>
                ${new Intl.NumberFormat("en-GH", {
                  style: "currency",
                  currency: "GHS"
                }).format(this.getCartTotal())}
              </strong>
            </div>

            <p class="marketplace-demo-warning">
              Checkout and payment are not connected.
            </p>

          </section>
        </div>
      `;
    },

    closeOverlay() {
      const overlay = document.getElementById(
        "marketplace-overlay"
      );

      if (overlay) {
        overlay.innerHTML = "";
      }
    }
  };

  window.RockyXMarketplace = RockyXMarketplace;

  if (
    window.RockyX &&
    typeof window.RockyX.registerModule === "function"
  ) {
    window.RockyX.registerModule(
      "marketplace",
      RockyXMarketplace
    );
  }

})();