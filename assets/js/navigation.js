/* =========================================
   ROCKYX — NAVIGATION MODULE
   Handles navigation between platform sections.
   ========================================= */
"use strict";
window.RockyXNavigation = (() => {
  const sections = [
    "home",
    "explore",
    "create",
    "inbox",
    "profile"
  ];
  let currentSection = "home";
  function getCurrentSection() {
    return currentSection;
  }
  function navigate(section) {
    if (!sections.includes(section)) {
      console.warn("RockyX: Unknown navigation section:", section);
      return false;
    }
    currentSection = section;
    document.dispatchEvent(
      new CustomEvent("rockyx:section-change", {
        detail: {
          section: currentSection
        }
      })
    );
    window.dispatchEvent(
      new CustomEvent("rockyx:navigate", {
        detail: {
          page: currentSection
        }
      })
    );
    return true;
  }
  function init() {
    document.querySelectorAll("[data-rx-page]").forEach((element) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        const section = element.dataset.rxPage;
        if (navigate(section)) {
          document.querySelectorAll("[data-rx-page]").forEach((item) => {
            const active = item.dataset.rxPage === section;
            item.classList.toggle("is-active", active);
            if (active) {
              item.setAttribute("aria-current", "page");
            } else {
              item.removeAttribute("aria-current");
            }
          });
          if (section !== "home") {
            const message =
              section.charAt(0).toUpperCase() + section.slice(1);
            if (window.RockyX?.notify) {
              window.RockyX.notify(`${message} section is being prepared.`);
            }
          }
        }
      });
    });
    console.info("RockyX Navigation initialized.");
  }
  return {
    init,
    navigate,
    getCurrentSection,
    sections: [...sections]
  };
})();