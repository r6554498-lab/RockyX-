/* =========================================
   ROCKYX — TEMPLATE SYSTEM
   Templates, access checks, and editor events.
   ========================================= */

"use strict";

window.RockyXTemplates = (() => {
  let initialized = false;

  const state = {
    selectedTemplate: null
  };

  /**
   * Find a template card using its ID.
   */
  function getTemplate(templateId) {
    if (!templateId) return null;

    const cards = document.querySelectorAll("[data-rx-template]");

    return Array.from(cards).find(
      (card) => card.dataset.templateId === templateId
    ) || null;
  }

  /**
   * Read template information from a card.
   */
  function getTemplateDetails(card) {
    if (!card) return null;

    return {
      id: card.dataset.templateId || "",
      title: card.dataset.title || "Untitled Template",
      creatorId: card.dataset.creatorId || "",
      access: card.dataset.access || "free",
      category: card.dataset.category || "general"
    };
  }

  /**
   * Ask the application to open a template.
   *
   * This does not render or export a video.
   * The editor will be integrated separately.
   */
  function useTemplate(templateId) {
    const card = getTemplate(templateId);

    if (!card) {
      console.warn("RockyX: Template not found.");
      return false;
    }

    const template = getTemplateDetails(card);

    if (!template.id) {
      console.warn("RockyX: Template ID is required.");
      return false;
    }

    // Pro access must eventually be verified by
    // the RockyX backend, not trusted from HTML.
    if (
      template.access === "pro" &&
      card.dataset.accessGranted !== "true"
    ) {
      document.dispatchEvent(
        new CustomEvent("rockyx:template-access-required", {
          detail: {
            templateId: template.id,
            access: template.access
          }
        })
      );

      if (window.RockyX?.notify) {
        window.RockyX.notify(
          "This is a Pro template. Access verification is not connected yet."
        );
      }

      return false;
    }

    state.selectedTemplate = template;

    document.dispatchEvent(
      new CustomEvent("rockyx:template-use-requested", {
        detail: { ...template }
      })
    );

    if (window.RockyX?.notify) {
      window.RockyX.notify(
        "Template selected. RockyX Studio integration comes next."
      );
    }

    return true;
  }

  /**
   * Handle clicks on template buttons.
   */
  function handleClick(event) {
    const button = event.target.closest("[data-rx-use-template]");

    if (!button) return;

    event.preventDefault();

    const card = button.closest("[data-rx-template]");

    if (!card) {
      console.warn(
        "RockyX: The Use Template button needs a template card."
      );
      return;
    }

    useTemplate(card.dataset.templateId);
  }

  /**
   * Initialize the module once.
   */
  function init() {
    if (initialized) return;

    initialized = true;

    document.addEventListener("click", handleClick);

    console.info("RockyX Template System initialized.");
  }

  return {
    init,
    getTemplate,
    getTemplateDetails,
    useTemplate,
    getSelectedTemplate: () => state.selectedTemplate
  };
})();