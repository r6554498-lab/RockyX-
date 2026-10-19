/* =========================================
   ROCKYX — ONE WORLD. ONE PLATFORM.
   Application foundation
   ========================================= */
"use strict";
const RockyX = (() => {
  const config = {
    name: "RockyX",
    slogan: "One World. One Platform.",
    version: "0.1.0"
  };
  const state = {
    initialized: false,
    activePage: "home"
  };
  /**
   * Find an element safely.
   */
  function find(selector, parent = document) {
    return parent.querySelector(selector);
  }
  /**
   * Find multiple elements safely.
   */
  function findAll(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  }
  /**
   * Display a message without inserting HTML.
   */
  function notify(message) {
    let notice = find("#rx-notice");
    if (!notice) {
      notice = document.createElement("div");
      notice.id = "rx-notice";
      notice.setAttribute("role", "status");
      notice.setAttribute("aria-live", "polite");
      Object.assign(notice.style, {
        position: "fixed",
        top: "76px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: "9999",
        maxWidth: "90%",
        padding: "12px 18px",
        borderRadius: "10px",
        background: "#f5c542",
        color: "#111",
        fontWeight: "700",
        textAlign: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,.35)"
      });
      document.body.appendChild(notice);
    }
    notice.textContent = message;
    notice.hidden = false;
    window.clearTimeout(notice.hideTimer);
    notice.hideTimer = window.setTimeout(() => {
      notice.hidden = true;
    }, 2800);
  }
  /**
   * Change the active navigation item.
   */
  function setActivePage(page) {
    state.activePage = page;
    findAll("[data-rx-page]").forEach((item) => {
      const active = item.dataset.rxPage === page;
      item.classList.toggle("is-active", active);
      if (active) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    });
    window.dispatchEvent(
      new CustomEvent("rockyx:navigate", {
        detail: { page }
      })
    );
  }
  /**
   * Initialize navigation buttons.
   */
  function initNavigation() {
    findAll("[data-rx-page]").forEach((item) => {
      item.addEventListener("click", () => {
        const page = item.dataset.rxPage;
        if (!page) return;
        setActivePage(page);
        // Until separate pages are connected, avoid
        // pretending that every section is implemented.
        if (page !== "home") {
          notify(`${page.charAt(0).toUpperCase()}${page.slice(1)} is coming soon.`);
        }
      });
    });
  }
  /**
   * Start the application once the page is ready.
   */
  function init() {
    if (state.initialized) return;
    state.initialized = true;
    initNavigation();
    document.documentElement.dataset.rockyx = "ready";
    console.info(
      `${config.name} ${config.version} initialized.`
    );
  }
  return {
    config,
    state,
    find,
    findAll,
    notify,
    setActivePage,
    init
  };
})();
document.addEventListener("DOMContentLoaded", RockyX.init);