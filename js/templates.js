/* =========================================================
   ROCKYX — TEMPLATES MODULE
   Version: 1.0.0
   Status: Front-end foundation with demo template data
   ========================================================= */

(function () {
  "use strict";

  const RockyXTemplates = {
    name: "templates",
    version: "1.0.0",

    templates: [
      {
        id: "template-001",
        title: "Cinematic Intro",
        category: "Cinematic",
        description: "Create a dramatic opening for your videos.",
        duration: "15 sec",
        format: "9:16",
        price: "Free",
        featured: true,
        color: "#7548c8"
      },
      {
        id: "template-002",
        title: "Travel Memories",
        category: "Travel",
        description: "Turn your travel moments into a story.",
        duration: "30 sec",
        format: "9:16",
        price: "Free",
        featured: true,
        color: "#385f9d"
      },
      {
        id: "template-003",
        title: "Product Showcase",
        category: "Business",
        description: "Present products with a clean design.",
        duration: "20 sec",
        format: "1:1",
        price: "Premium",
        featured: false,
        color: "#a05b43"
      },
      {
        id: "template-004",
        title: "Music Visualizer",
        category: "Music",
        description: "Create engaging music content.",
        duration: "30 sec",
        format: "9:16",
        price: "Free",
        featured: false,
        color: "#6840a0"
      },
      {
        id: "template-005",
        title: "Fashion Story",
        category: "Lifestyle",
        description: "Showcase fashion and lifestyle content.",
        duration: "15 sec",
        format: "9:16",
        price: "Premium",
        featured: true,
        color: "#98516e"
      },
      {
        id: "template-006",
        title: "Daily Moments",
        category: "Lifestyle",
        description: "A simple layout for everyday memories.",
        duration: "15 sec",
        format: "9:16",
        price: "Free",
        featured: false,
        color: "#497d73"
      }
    ],

    activeCategory: "All",
    searchQuery: "",

    categories: [
      "All",
      "Cinematic",
      "Travel",
      "Business",
      "Music",
      "Lifestyle"
    ],

    initialize() {
      console.log("RockyX Templates initialized.");
    },

    escapeHTML(value) {
      return String(value).replace(/[&<>"']/g, function (character) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[character];
      });
    },

    getFilteredTemplates() {
      return this.templates.filter((template) => {
        const matchesCategory =
          this.activeCategory === "All" ||
          template.category === this.activeCategory;

        const search = this.searchQuery.toLowerCase();

        const matchesSearch =
          template.title.toLowerCase().includes(search) ||
          template.description.toLowerCase().includes(search) ||
          template.category.toLowerCase().includes(search);

        return matchesCategory && matchesSearch;
      });
    },

    render() {
      const screen = document.getElementById("app-screen");

      if (!screen) {
        console.error("RockyX Templates: app-screen not found.");
        return;
      }

      const filteredTemplates = this.getFilteredTemplates();

      screen.innerHTML = `
        <section class="templates-page">

          <div class="templates-heading">
            <div>
              <span class="templates-eyebrow">ROCKYX STUDIO</span>
              <h1>Templates</h1>
              <p>Find a starting point for your next creation.</p>
            </div>
          </div>

          <div class="templates-search">
            <input
              type="search"
              id="template-search"
              placeholder="Search templates..."
              value="${this.escapeHTML(this.searchQuery)}"
              aria-label="Search templates"
            >
          </div>

          <div class="template-categories">
            ${this.categories.map((category) => `
              <button
                class="template-category ${
                  this.activeCategory === category ? "active" : ""
                }"
                data-category="${this.escapeHTML(category)}"
                type="button"
              >
                ${this.escapeHTML(category)}
              </button>
            `).join("")}
          </div>

          <div class="templates-section-heading">
            <h2>Explore templates</h2>
            <span>${filteredTemplates.length} templates</span>
          </div>

          ${
            filteredTemplates.length
              ? `
                <div class="templates-grid">
                  ${filteredTemplates.map((template) => `
                    <article class="template-card">

                      <div
                        class="template-preview"
                        style="--template-color: ${template.color}"
                      >
                        <span class="template-preview-label">
                          ROCKYX
                        </span>

                        <span class="template-preview-title">
                          ${this.escapeHTML(template.title)}
                        </span>

                        <span class="template-duration">
                          ${this.escapeHTML(template.duration)}
                        </span>

                        ${
                          template.featured
                            ? `<span class="template-featured">FEATURED</span>`
                            : ""
                        }
                      </div>

                      <div class="template-card-content">
                        <div class="template-card-top">
                          <h3>${this.escapeHTML(template.title)}</h3>

                          <span class="template-price ${
                            template.price === "Premium"
                              ? "premium"
                              : ""
                          }">
                            ${this.escapeHTML(template.price)}
                          </span>
                        </div>

                        <p>
                          ${this.escapeHTML(template.description)}
                        </p>

                        <div class="template-card-footer">
                          <span>
                            ${this.escapeHTML(template.category)}
                            ·
                            ${this.escapeHTML(template.format)}
                          </span>

                          <button
                            class="template-use-button"
                            data-template-id="${this.escapeHTML(template.id)}"
                            type="button"
                          >
                            Use template
                          </button>
                        </div>
                      </div>

                    </article>
                  `).join("")}
                </div>
              `
              : `
                <div class="templates-empty">
                  <h3>No templates found</h3>
                  <p>Try another search or category.</p>
                </div>
              `
          }

        </section>
      `;

      this.attachEvents(screen);
    },

    attachEvents(screen) {
      if (screen.dataset.templatesEvents === "true") {
        return;
      }

      screen.dataset.templatesEvents = "true";

      screen.addEventListener("input", (event) => {
        if (event.target.id === "template-search") {
          this.searchQuery = event.target.value;
          this.render();
          
          const searchInput = document.getElementById("template-search");

          if (searchInput) {
            searchInput.focus();
            searchInput.setSelectionRange(
              this.searchQuery.length,
              this.searchQuery.length
            );
          }
        }
      });

      screen.addEventListener("click", (event) => {
        const categoryButton = event.target.closest(
          "[data-category]"
        );

        if (categoryButton) {
          this.activeCategory = categoryButton.dataset.category;
          this.render();
          return;
        }

        const useButton = event.target.closest(
          "[data-template-id]"
        );

        if (useButton) {
          this.useTemplate(useButton.dataset.templateId);
        }
      });
    },

    useTemplate(templateId) {
      const template = this.templates.find(
        (item) => item.id === templateId
      );

      if (!template) {
        console.error("Template not found:", templateId);
        return;
      }

      if (template.price === "Premium") {
        alert(
          "This is a premium demo template. Premium access will be connected later."
        );
        return;
      }

      window.dispatchEvent(
        new CustomEvent("rockyx:template-selected", {
          detail: {
            templateId: template.id,
            title: template.title,
            category: template.category,
            duration: template.duration,
            format: template.format
          }
        })
      );

      alert(
        `"${template.title}" selected. Template-to-editor integration will be connected later.`
      );
    }
  };

  window.RockyXTemplates = RockyXTemplates;

  if (window.RockyX && typeof window.RockyX.registerModule === "function") {
    window.RockyX.registerModule("templates", RockyXTemplates);
  }

})();