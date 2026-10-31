/* ==========================================
   ROCKYX DISCOVER MODULE
   Version 1.0.0
   One World. One Platform.
========================================== */

"use strict";

const RockyXDiscover = (() => {

    const state = {
        initialized: false,
        searchQuery: "",
        activeCategory: "all"
    };

    const categories = [
        "all",
        "businesses",
        "food",
        "transport",
        "fuel",
        "shopping",
        "services",
        "accommodation"
    ];

    // DEMONSTRATION DATA ONLY

    const demoListings = [
        {
            id: "place-001",
            name: "Example Restaurant",
            category: "food",
            description: "Demonstration restaurant listing.",
            sponsored: false
        },
        {
            id: "place-002",
            name: "Example Shopping Centre",
            category: "shopping",
            description: "Demonstration shopping listing.",
            sponsored: true
        },
        {
            id: "place-003",
            name: "Example Transport Service",
            category: "transport",
            description: "Demonstration transport listing.",
            sponsored: false
        },
        {
            id: "place-004",
            name: "Example Business",
            category: "businesses",
            description: "Demonstration business listing.",
            sponsored: false
        }
    ];


    /* INITIALIZATION */

    function initialize() {

        if (state.initialized) return;

        state.initialized = true;

        console.info(
            "[RockyX] Discover module initialized."
        );

    }


    /* SAFE HTML */

    function escapeHTML(value) {

        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);

    }


    /* FILTER LISTINGS */

    function getListings() {

        return demoListings.filter(listing => {

            const matchesCategory =
                state.activeCategory === "all" ||
                listing.category === state.activeCategory;

            const query = state.searchQuery.toLowerCase();

            const matchesSearch =
                listing.name.toLowerCase().includes(query) ||
                listing.description.toLowerCase().includes(query);

            return matchesCategory && matchesSearch;

        });

    }


    /* RENDER DISCOVER */

    function render() {

        const screen = document.getElementById("app-screen");

        if (!screen) return;

        const listings = getListings();

        screen.innerHTML = `

            <section class="discover-page">

                <header class="discover-header">

                    <h1>Discover</h1>

                    <p>
                        Explore businesses, places and services.
                    </p>

                </header>


                <div class="discover-search">

                    <label for="discover-search-input">
                        Search places
                    </label>

                    <input
                        id="discover-search-input"
                        type="search"
                        placeholder="Search businesses and places..."
                        value="${escapeHTML(state.searchQuery)}"
                    >

                </div>


                <nav class="discover-categories"
                    aria-label="Discover categories">

                    ${categories.map(category => `

                        <button
                            type="button"
                            data-category="${category}"
                            class="${
                                state.activeCategory === category
                                ? "active"
                                : ""
                            }"
                            aria-pressed="${
                                state.activeCategory === category
                            }">

                            ${category.charAt(0).toUpperCase() +
                            category.slice(1)}

                        </button>

                    `).join("")}

                </nav>


                <section class="discover-map">

                    <div class="map-placeholder">

                        <span>ROCKYX MAPS</span>

                        <p>
                            Interactive map integration pending.
                        </p>

                        <small>
                            No live locations are being displayed.
                        </small>

                    </div>

                </section>


                <section class="discover-listings">

                    <h2>Explore Places</h2>

                    ${
                        listings.length
                        ? listings.map(listing => `

                            <article
                                class="rockyx-card discover-card"
                                data-listing="${listing.id}">

                                <div class="listing-information">

                                    <h3>
                                        ${escapeHTML(listing.name)}
                                    </h3>

                                    <p>
                                        ${escapeHTML(listing.description)}
                                    </p>

                                    <span>
                                        ${escapeHTML(listing.category)}
                                    </span>

                                    ${
                                        listing.sponsored
                                        ? `<small>Sponsored demonstration placement</small>`
                                        : ""
                                    }

                                </div>

                                <button
                                    type="button"
                                    data-action="view"
                                    data-id="${listing.id}">

                                    View Details

                                </button>

                            </article>

                        `).join("")

                        : `
                            <div class="rockyx-card">

                                <h3>No results found</h3>

                                <p>
                                    Try another search or category.
                                </p>

                            </div>
                        `
                    }

                </section>

                <p class="demo-notice">
                    All listings are demonstration data.
                </p>

            </section>

        `;

        attachEvents(screen);

    }


    /* EVENT HANDLING */

    function attachEvents(screen) {

        if (screen.dataset.discoverEvents === "attached") {
            return;
        }

        screen.addEventListener("click", handleClick);

        screen.addEventListener("input", handleInput);

        screen.dataset.discoverEvents = "attached";

    }


    function handleClick(event) {

        const button = event.target.closest("button");

        if (!button) return;

        if (button.dataset.category) {

            state.activeCategory = button.dataset.category;

            render();

            return;

        }

        if (button.dataset.action === "view") {

            console.info(
                "Listing details are not connected yet:",
                button.dataset.id
            );

        }

    }


    function handleInput(event) {

        if (event.target.id !== "discover-search-input") {
            return;
        }

        const cursorPosition = event.target.selectionStart;

        state.searchQuery = event.target.value;

        render();

        const searchInput = document.getElementById(
            "discover-search-input"
        );

        if (searchInput) {

            searchInput.focus();

            searchInput.setSelectionRange(
                cursorPosition,
                cursorPosition
            );

        }

    }


    /* PUBLIC API */

    return Object.freeze({

        initialize,

        render,

        getState() {

            return {
                initialized: state.initialized,
                activeCategory: state.activeCategory,
                searchQuery: state.searchQuery
            };

        }

    });

})();


/* REGISTER MODULE */

window.RockyX.registerModule(
    "discover",
    RockyXDiscover
);