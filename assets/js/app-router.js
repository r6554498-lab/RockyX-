/* =========================================================
   ROCKYX APP ROUTER
   Navigation, app screens, and individual Explore categories.
   ========================================================= */

(function () {
  "use strict";

  if (window.RockyXAppRouter) return;

  const SCREEN_NAMES = [
    "Home",
    "Explore",
    "Studio",
    "Inbox",
    "Profile",
    "Music",
    "Marketplace",
    "Wallet"
  ];

  const CATEGORIES = [
    { id: "transport", name: "Transport", icon: "🚗" },
    { id: "food", name: "Food", icon: "🍔" },
    { id: "fuel", name: "Fuel", icon: "⛽" },
    { id: "healthcare", name: "Healthcare", icon: "🏥" },
    { id: "businesses", name: "Businesses", icon: "🏢" },
    { id: "shopping", name: "Shopping", icon: "🛍️" },
    { id: "hotels", name: "Hotels", icon: "🏨" },
    { id: "services", name: "Services", icon: "🛠️" },
    { id: "entertainment", name: "Entertainment", icon: "🎭" },
    { id: "education", name: "Education", icon: "🎓" },
    { id: "beauty", name: "Beauty", icon: "💇" },
    { id: "emergency", name: "Emergency", icon: "🚨" }
  ];

  let currentScreen = "Home";
  let currentCategory = null;
  let routerRoot = null;
  let categoryPage = null;

  function normalizeName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function emit(name, detail = {}) {
    document.dispatchEvent(
      new CustomEvent("rockyx:" + name, { detail })
    );
  }

  function findScreen(name) {
    const wanted = normalizeName(name);

    return Array.from(
      document.querySelectorAll(
        "[id^='page-'], [data-page], .app-page"
      )
    ).find((element) => {
      const id = element.id.replace(/^page-/i, "");
      const dataPage = element.dataset.page || "";

      return (
        normalizeName(id) === wanted ||
        normalizeName(dataPage) === wanted
      );
    }) || null;
  }

  function setActiveNavigation(name) {
    document.querySelectorAll("[data-nav], .nav-item, .nav-link")
      .forEach((button) => {
        const target =
          button.dataset.nav ||
          button.dataset.page ||
          button.dataset.screen ||
          button.textContent;

        const active = normalizeName(target) === normalizeName(name);

        button.classList.toggle("active", active);

        if (active) {
          button.setAttribute("aria-current", "page");
        } else {
          button.removeAttribute("aria-current");
        }
      });
  }

  function showScreen(name, options = {}) {
    const screenName = SCREEN_NAMES.find(
      (item) => normalizeName(item) === normalizeName(name)
    );

    if (!screenName) {
      console.warn("[RockyX Router] Unknown screen:", name);
      return false;
    }

    // Close an open category page when navigating elsewhere.
    if (categoryPage) {
      categoryPage.hidden = true;
    }

    let target = findScreen(screenName);

    // A screen may not exist in the current HTML yet.
    // In that case, create a clearly labelled placeholder.
    if (!target && routerRoot) {
      target = createPlaceholderScreen(screenName);
    }

    if (!target) {
      console.warn(
        "[RockyX Router] Could not find or create screen:",
        screenName
      );
      return false;
    }

    document.querySelectorAll(
      "[id^='page-'], [data-page], .app-page"
    ).forEach((screen) => {
      screen.hidden = screen !== target;

      if (screen !== target) {
        screen.classList.remove("is-active");
      }
    });

    target.hidden = false;
    target.classList.add("is-active");

    currentScreen = screenName;
    currentCategory = null;

    setActiveNavigation(screenName);

    if (!options.keepScroll) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    emit("screen-changed", {
      screen: screenName,
      element: target
    });

    return true;
  }

  function createPlaceholderScreen(name) {
    if (!routerRoot) return null;

    const page = document.createElement("section");
    page.id = "page-" + name;
    page.className = "app-page rockyx-router-page";
    page.hidden = true;

    const descriptions = {
      Home: "Discover videos and creators on RockyX.",
      Explore: "Explore nearby places, music, businesses and services.",
      Studio: "Create videos and explore templates.",
      Inbox: "Your messages and notifications will appear here.",
      Profile: "Your profile, posts and account settings.",
      Music: "Discover music and artists.",
      Marketplace: "Discover products and sellers.",
      Wallet: "Manage your RockyX earnings and transactions."
    };

    page.innerHTML = `
      <div class="rockyx-router-placeholder">
        <h1>${name}</h1>
        <p>${descriptions[name] || "Explore RockyX."}</p>
      </div>
    `;

    routerRoot.appendChild(page);

    return page;
  }

  function getCategoryById(value) {
    const key = normalizeName(value);

    return CATEGORIES.find((category) => {
      return (
        normalizeName(category.id) === key ||
        normalizeName(category.name) === key
      );
    }) || null;
  }

  function ensureCategoryStyles() {
    if (document.getElementById("rockyx-router-styles")) return;

    const style = document.createElement("style");
    style.id = "rockyx-router-styles";

    style.textContent = `
      .rockyx-router-page {
        box-sizing: border-box;
        min-height: 70vh;
        padding: 20px 14px 100px;
        color: #fff;
        background: #111;
      }

      .rockyx-router-page[hidden] {
        display: none !important;
      }

      .rockyx-category-page {
        box-sizing: border-box;
        min-height: 100vh;
        padding: 16px 14px 100px;
        color: #fff;
        background: #111;
      }

      .rockyx-category-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }

      .rockyx-category-back {
        width: 42px;
        height: 42px;
        border: 1px solid #333;
        border-radius: 50%;
        background: #202020;
        color: #fff;
        font-size: 22px;
        cursor: pointer;
      }

      .rockyx-category-header h1 {
        margin: 0;
        font-size: 23px;
      }

      .rockyx-category-header p {
        margin: 4px 0 0;
        color: #aaa;
        font-size: 12px;
      }

      .rockyx-category-search {
        box-sizing: border-box;
        width: 100%;
        padding: 13px;
        margin-bottom: 16px;
        border: 1px solid #333;
        border-radius: 12px;
        background: #202020;
        color: #fff;
        font-size: 15px;
      }

      .rockyx-category-map {
        width: 100%;
        height: 300px;
        margin-bottom: 20px;
        border: 1px solid #333;
        border-radius: 14px;
        overflow: hidden;
        background: #242424;
      }

      .rockyx-category-map-placeholder {
        display: grid;
        place-items: center;
        height: 100%;
        padding: 20px;
        text-align: center;
        color: #ccc;
      }

      .rockyx-category-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 22px;
      }

      .rockyx-category-actions button {
        padding: 11px 14px;
        border: 1px solid #444;
        border-radius: 10px;
        color: #fff;
        background: #242424;
        cursor: pointer;
      }

      .rockyx-category-actions .primary {
        border-color: #7544c8;
        background: #7544c8;
      }

      .rockyx-category-results {
        display: grid;
        gap: 12px;
      }

      .rockyx-category-result {
        padding: 15px;
        border: 1px solid #333;
        border-radius: 12px;
        background: #1b1b1b;
      }

      .rockyx-category-result h3 {
        margin: 0 0 7px;
        font-size: 16px;
      }

      .rockyx-category-result p {
        margin: 0;
        color: #aaa;
        font-size: 13px;
      }

      .rockyx-router-placeholder {
        max-width: 600px;
        margin: 40px auto;
        text-align: center;
      }

      .rockyx-router-placeholder p {
        color: #aaa;
        line-height: 1.6;
      }
    `;

    document.head.appendChild(style);
  }

  function createCategoryPage() {
    if (categoryPage) return categoryPage;

    categoryPage = document.createElement("section");
    categoryPage.id = "rockyx-category-page";
    categoryPage.className = "rockyx-category-page";
    categoryPage.hidden = true;

    categoryPage.innerHTML = `
      <header class="rockyx-category-header">
        <button type="button"
          class="rockyx-category-back"
          aria-label="Back to Explore">‹</button>

        <div>
          <h1 class="rockyx-category-title">Explore</h1>
          <p class="rockyx-category-subtitle">
            Discover places around you
          </p>
        </div>
      </header>

      <input
        class="rockyx-category-search"
        type="search"
        placeholder="Search nearby..."
        aria-label="Search this category">

      <div class="rockyx-category-actions">
        <button type="button" class="primary rockyx-use-location">
          📍 Use my location
        </button>
        <button type="button" class="rockyx-open-maps">
          Open Maps
        </button>
      </div>

      <div class="rockyx-category-map">
        <div class="rockyx-category-map-placeholder">
          <div>
            <div style="font-size:36px">🗺️</div>
            <p>The map will load when the map service is connected.</p>
          </div>
        </div>
      </div>

      <h2>Nearby results</h2>
      <div class="rockyx-category-results">
        <div class="rockyx-category-result">
          <h3>Find nearby places</h3>
          <p>Allow location access or search for a place.</p>
        </div>
      </div>
    `;

    (routerRoot || document.body).appendChild(categoryPage);

    categoryPage.querySelector(".rockyx-category-back")
      .addEventListener("click", () => {
        showScreen("Explore");
      });

    categoryPage.querySelector(".rockyx-use-location")
      .addEventListener("click", () => {
        emit("category-location-request", {
          category: currentCategory
        });
      });

    categoryPage.querySelector(".rockyx-open-maps")
      .addEventListener("click", () => {
        emit("category-open-maps", {
          category: currentCategory
        });
      });

    categoryPage.querySelector(".rockyx-category-search")
      .addEventListener("input", (event) => {
        emit("category-search", {
          category: currentCategory,
          query: event.target.value
        });
      });

    return categoryPage;
  }

  function openCategory(categoryValue) {
    const category = getCategoryById(categoryValue);

    if (!category) {
      console.warn("[RockyX Router] Unknown category:", categoryValue);
      return false;
    }

    ensureCategoryStyles();

    const page = createCategoryPage();

    document.querySelectorAll(
      "[id^='page-'], [data-page], .app-page"
    ).forEach((screen) => {
      screen.hidden = true;
      screen.classList.remove("is-active");
    });

    page.hidden = false;

    page.querySelector(".rockyx-category-title").textContent =
      category.icon + " " + category.name;

    page.querySelector(".rockyx-category-subtitle").textContent =
      "Discover nearby " + category.name.toLowerCase() + " places";

    const input = page.querySelector(".rockyx-category-search");
    input.placeholder = "Search " + category.name.toLowerCase() + "...";
    input.value = "";

    currentScreen = "Explore";
    currentCategory = category;

    setActiveNavigation("Explore");

    window.scrollTo({ top: 0, behavior: "auto" });

    emit("category-opened", {
      category: { ...category },
      element: page
    });

    return true;
  }

  function renderCategoryButtons(container) {
    if (!container) return;

    container.replaceChildren();

    CATEGORIES.forEach((category) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "rockyx-category-button";
      button.dataset.rockyxCategory = category.id;
      button.textContent = category.icon + " " + category.name;

      button.addEventListener("click", () => {
        openCategory(category.id);
      });

      container.appendChild(button);
    });
  }

  function init(options = {}) {
    routerRoot =
      typeof options.root === "string"
        ? document.querySelector(options.root)
        : options.root || document.querySelector("main") || document.body;

    ensureCategoryStyles();

    if (document.documentElement.dataset.rockyxRouterInitialized === "true") {
      return;
    }

    document.documentElement.dataset.rockyxRouterInitialized = "true";

    document.addEventListener("click", (event) => {
      const nav = event.target.closest(
        "[data-nav], [data-page-target], [data-screen]"
      );

      if (nav) {
        const destination =
          nav.dataset.nav ||
          nav.dataset.pageTarget ||
          nav.dataset.screen;

        if (destination && SCREEN_NAMES.some(
          (screen) => normalizeName(screen) === normalizeName(destination)
        )) {
          event.preventDefault();
          showScreen(destination);
          return;
        }
      }

      const categoryButton = event.target.closest(
        "[data-rockyx-category], [data-category]"
      );

      if (categoryButton) {
        const category =
          categoryButton.dataset.rockyxCategory ||
          categoryButton.dataset.category;

        if (getCategoryById(category)) {
          event.preventDefault();
          openCategory(category);
        }
      }
    });

    document.addEventListener("rockyx:open-studio", () => {
      showScreen("Studio");
    });

    document.addEventListener("rockyx:open-category", (event) => {
      openCategory(event.detail?.category);
    });
  }

  window.RockyXAppRouter = {
    init,
    showScreen,
    openCategory,
    renderCategoryButtons,
    getCategories: () => CATEGORIES.map((item) => ({ ...item })),
    getCurrentScreen: () => currentScreen,
    getCurrentCategory: () =>
      currentCategory ? { ...currentCategory } : null
  };
})();