/* ==========================================
   ROCKYX EXPLORE
   Category pages, nearby maps and directions
   ========================================== */

(function () {
  "use strict";

  const RockyXExplore = {
    map: null,
    markers: [],
    userLocation: null,
    currentCategory: "all",
    places: [],
    initialized: false,

    categories: {
      all: {
        title: "Explore Nearby",
        icon: "📍",
        filters: {}
      },
      transport: {
        title: "Transport",
        icon: "🚗",
        filters: {
          amenity: ["bus_station", "taxi"],
          public_transport: ["station", "platform", "stop_position"],
          railway: ["station", "halt"],
          highway: ["bus_stop"]
        }
      },
      food: {
        title: "Food & Restaurants",
        icon: "🍔",
        filters: {
          amenity: [
            "restaurant",
            "cafe",
            "fast_food",
            "food_court",
            "ice_cream"
          ]
        }
      },
      fuel: {
        title: "Fuel Stations",
        icon: "⛽",
        filters: {
          amenity: ["fuel"]
        }
      },
      healthcare: {
        title: "Healthcare",
        icon: "🏥",
        filters: {
          amenity: [
            "hospital",
            "clinic",
            "doctors",
            "pharmacy",
            "dentist"
          ]
        }
      },
      businesses: {
        title: "Businesses",
        icon: "🏪",
        filters: {
          shop: ["supermarket", "convenience", "mall"],
          office: ["company", "commercial"]
        }
      },
      shopping: {
        title: "Shopping",
        icon: "🛍️",
        filters: {
          shop: [
            "clothes",
            "shoes",
            "electronics",
            "department_store",
            "supermarket",
            "mall"
          ]
        }
      },
      hotels: {
        title: "Hotels & Accommodation",
        icon: "🏨",
        filters: {
          tourism: ["hotel", "motel", "guest_house", "hostel"]
        }
      },
      services: {
        title: "Services",
        icon: "🔧",
        filters: {
          craft: ["electrician", "plumber", "carpenter"],
          office: ["lawyer", "accountant", "company"]
        }
      }
    },

    init: function (options) {
      options = options || {};

      this.container =
        document.querySelector(options.container || "#rockyx-explore");

      if (!this.container) {
        console.warn(
          "RockyX Explore: Add an element with id='rockyx-explore' to the page."
        );
        return false;
      }

      this.render();
      this.initialized = true;

      return true;
    },

    render: function () {
      const categoryButtons = Object.keys(this.categories)
        .map((key) => {
          const category = this.categories[key];

          return `
            <button
              type="button"
              class="rockyx-explore-category"
              data-category="${key}"
            >
              <span>${category.icon}</span>
              <span>${category.title}</span>
            </button>
          `;
        })
        .join("");

      this.container.innerHTML = `
        <section class="rockyx-explore-app">
          <header class="rockyx-explore-header">
            <h2>RockyX Explore</h2>
            <p>Discover places and services near you.</p>
          </header>

          <nav class="rockyx-explore-categories">
            ${categoryButtons}
          </nav>

          <div class="rockyx-explore-search">
            <input
              id="rockyx-place-search"
              type="search"
              placeholder="Search nearby places..."
              aria-label="Search nearby places"
            />

            <button id="rockyx-search-button" type="button">
              Search
            </button>
          </div>

          <div class="rockyx-explore-actions">
            <button id="rockyx-use-location" type="button">
              📍 Use my location
            </button>

            <button id="rockyx-show-nearby" type="button">
              Find nearby places
            </button>
          </div>

          <div
            id="rockyx-explore-map"
            class="rockyx-explore-map"
            role="application"
            aria-label="Map showing nearby places"
          ></div>

          <p id="rockyx-explore-status" role="status">
            Choose a category and allow location access to find nearby places.
          </p>

          <section class="rockyx-explore-results">
            <h3 id="rockyx-results-heading">Nearby places</h3>
            <div id="rockyx-place-results"></div>
          </section>
        </section>
      `;

      this.addStyles();
      this.bindEvents();
      this.loadMap();
    },

    addStyles: function () {
      if (document.getElementById("rockyx-explore-styles")) return;

      const style = document.createElement("style");
      style.id = "rockyx-explore-styles";

      style.textContent = `
        .rockyx-explore-app {
          font-family: Arial, sans-serif;
          color: #172033;
          max-width: 1000px;
          margin: auto;
          padding: 16px;
        }

        .rockyx-explore-header h2 {
          margin-bottom: 6px;
        }

        .rockyx-explore-categories {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin: 18px 0;
        }

        .rockyx-explore-category {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px;
          border: 1px solid #d9e0ea;
          border-radius: 12px;
          background: white;
          text-align: left;
          cursor: pointer;
        }

        .rockyx-explore-category span:first-child {
          font-size: 22px;
        }

        .rockyx-explore-category.active {
          border: 2px solid #2563eb;
          background: #eff6ff;
        }

        .rockyx-explore-search {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .rockyx-explore-search input {
          min-width: 0;
          flex: 1;
          padding: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
        }

        .rockyx-explore-app button {
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
        }

        .rockyx-explore-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .rockyx-explore-map {
          height: 350px;
          width: 100%;
          background: #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }

        .rockyx-explore-results {
          margin-top: 20px;
        }

        .rockyx-place-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 13px;
          margin: 10px 0;
          background: white;
        }

        .rockyx-place-card h4 {
          margin: 0 0 7px;
        }

        .rockyx-place-card p {
          margin: 5px 0;
        }

        .rockyx-place-card a {
          display: inline-block;
          margin-top: 8px;
          color: #1d4ed8;
        }

        @media (min-width: 700px) {
          .rockyx-explore-categories {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .rockyx-explore-map {
            height: 480px;
          }
        }
      `;

      document.head.appendChild(style);
    },

    bindEvents: function () {
      this.container
        .querySelectorAll("[data-category]")
        .forEach((button) => {
          button.addEventListener("click", () => {
            this.openCategory(button.dataset.category);
          });
        });

      this.container
        .querySelector("#rockyx-use-location")
        .addEventListener("click", () => this.requestLocation());

      this.container
        .querySelector("#rockyx-show-nearby")
        .addEventListener("click", () => this.findNearby());

      this.container
        .querySelector("#rockyx-search-button")
        .addEventListener("click", () => this.searchPlaces());

      this.container
        .querySelector("#rockyx-place-search")
        .addEventListener("keydown", (event) => {
          if (event.key === "Enter") this.searchPlaces();
        });
    },

    loadMap: function () {
      if (window.L) {
        this.createMap();
        return;
      }

      if (document.getElementById("rockyx-leaflet-css")) {
        this.setStatus("Loading map library...");
        return;
      }

      const css = document.createElement("link");
      css.id = "rockyx-leaflet-css";
      css.rel = "stylesheet";
      css.href =
        "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

      document.head.appendChild(css);

      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

      script.onload = () => this.createMap();

      script.onerror = () => {
        this.setStatus(
          "The map could not load. Check your internet connection."
        );
      };

      document.head.appendChild(script);
    },

    createMap: function () {
      if (!window.L || this.map) return;

      const mapElement = this.container.querySelector(
        "#rockyx-explore-map"
      );

      this.map = L.map(mapElement).setView([5.6037, -0.1870], 12);

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19
        }
      ).addTo(this.map);

      setTimeout(() => this.map.invalidateSize(), 100);
    },

    openCategory: function (categoryKey) {
      if (!this.categories[categoryKey]) return;

      this.currentCategory = categoryKey;

      this.container
        .querySelectorAll("[data-category]")
        .forEach((button) => {
          button.classList.toggle(
            "active",
            button.dataset.category === categoryKey
          );
        });

      const category = this.categories[categoryKey];

      this.container.querySelector(
        "#rockyx-results-heading"
      ).textContent = category.title + " Near You";

      this.setStatus(
        category.title +
        " selected. Find your location to load nearby results."
      );

      if (this.userLocation) {
        this.findNearby();
      }
    },

    requestLocation: function () {
      if (!navigator.geolocation) {
        this.setStatus("Your browser does not support location access.");
        return;
      }

      this.setStatus("Requesting your location...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };

          if (this.map) {
            this.map.setView(
              [this.userLocation.lat, this.userLocation.lon],
              14
            );

            L.marker([
              this.userLocation.lat,
              this.userLocation.lon
            ])
              .addTo(this.map)
              .bindPopup("Your location")
              .openPopup();
          }

          this.setStatus("Location found. Loading nearby places...");
          this.findNearby();
        },
        () => {
          this.setStatus(
            "Location access was not granted. Allow it in your browser settings or search for a place."
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      );
    },

    buildQuery: function (category, lat, lon) {
      const filters = category.filters;
      const radius = 5000;
      const parts = [];

      Object.keys(filters).forEach((key) => {
        filters[key].forEach((value) => {
          const selector = `["${key}"="${value}"]`;

          parts.push(
            `node${selector}(around:${radius},${lat},${lon});`
          );

          parts.push(
            `way${selector}(around:${radius},${lat},${lon});`
          );

          parts.push(
            `relation${selector}(around:${radius},${lat},${lon});`
          );
        });
      });

      return `[out:json][timeout:20];(${parts.join("")});out center tags;`;
    },

    findNearby: async function () {
      if (!this.userLocation) {
        this.setStatus("Tap 'Use my location' to find nearby places.");
        return;
      }

      if (!this.map) {
        this.setStatus("Please wait for the map to finish loading.");
        return;
      }

      const category = this.categories[this.currentCategory];

      this.setStatus("Searching nearby places...");
      this.clearMarkers();

      if (this.currentCategory === "all") {
        this.setStatus(
          "Choose a category to search for nearby places."
        );
        return;
      }

      const query = this.buildQuery(
        category,
        this.userLocation.lat,
        this.userLocation.lon
      );

      try {
        const response = await fetch(
          "https://overpass-api.de/api/interpreter",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "data=" + encodeURIComponent(query)
          }
        );

        if (!response.ok) {
          throw new Error("Nearby places service unavailable.");
        }

        const data = await response.json();

        this.places = (data.elements || []).map((item) => {
          const lat = item.lat || (item.center && item.center.lat);
          const lon = item.lon || (item.center && item.center.lon);

          return {
            id: item.type + "/" + item.id,
            name:
              (item.tags && item.tags.name) ||
              category.title + " location",
            lat: lat,
            lon: lon,
            tags: item.tags || {}
          };
        }).filter((place) =>
          Number.isFinite(place.lat) && Number.isFinite(place.lon)
        );

        this.displayPlaces(this.places);
        this.setStatus(
          this.places.length +
          " nearby places found. Map data may be incomplete."
        );
      } catch (error) {
        console.error("RockyX Explore:", error);
        this.setStatus(
          "We couldn't load nearby places. Please try again later."
        );
      }
    },

    displayPlaces: function (places) {
      this.clearMarkers();

      const results = this.container.querySelector(
        "#rockyx-place-results"
      );

      if (!places.length) {
        results.innerHTML = "<p>No matching places were found nearby.</p>";
        return;
      }

      results.innerHTML = places.map((place, index) => {
        const destination = place.lat + "," + place.lon;

        return `
          <article class="rockyx-place-card">
            <h4>${this.escapeHTML(place.name)}</h4>
            <p>${this.escapeHTML(
              place.tags.amenity ||
              place.tags.shop ||
              place.tags.tourism ||
              this.categories[this.currentCategory].title
            )}</p>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}"
              target="_blank"
              rel="noopener noreferrer"
            >Get directions</a>
            <button type="button" data-show-place="${index}">
              Show on map
            </button>
          </article>
        `;
      }).join("");

      places.forEach((place) => {
        const marker = L.marker([place.lat, place.lon])
          .addTo(this.map)
          .bindPopup(this.escapeHTML(place.name));

        this.markers.push(marker);
      });

      results.querySelectorAll("[data-show-place]").forEach((button) => {
        button.addEventListener("click", () => {
          const place = places[Number(button.dataset.showPlace)];

          this.map.setView([place.lat, place.lon], 16);

          const marker = this.markers[Number(button.dataset.showPlace)];

          if (marker) marker.openPopup();
        });
      });
    },

    searchPlaces: async function () {
      const input = this.container.querySelector("#rockyx-place-search");
      const searchText = input.value.trim();

      if (!searchText) {
        this.setStatus("Enter a place or address to search.");
        return;
      }

      this.setStatus("Searching for " + searchText + "...");

      try {
        const url =
          "https://nominatim.openstreetmap.org/search?format=json&limit=5&q=" +
          encodeURIComponent(searchText);

        const response = await fetch(url);

        if (!response.ok) throw new Error("Search failed.");

        const results = await response.json();

        if (!results.length) {
          this.setStatus("No matching locations found.");
          return;
        }

        const result = results[0];

        this.userLocation = {
          lat: Number(result.lat),
          lon: Number(result.lon)
        };

        if (this.map) {
          this.map.setView(
            [this.userLocation.lat, this.userLocation.lon],
            14
          );
        }

        this.setStatus("Location selected. Searching nearby places...");
        this.findNearby();
      } catch (error) {
        this.setStatus(
          "Location search failed. Please try again later."
        );
      }
    },

    clearMarkers: function () {
      this.markers.forEach((marker) => marker.remove());
      this.markers = [];

      const results = this.container.querySelector(
        "#rockyx-place-results"
      );

      if (results) results.innerHTML = "";
    },

    setStatus: function (message) {
      const status = this.container &&
        this.container.querySelector("#rockyx-explore-status");

      if (status) status.textContent = message;
    },

    escapeHTML: function (value) {
      return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]);
    }
  };

  window.RockyXExplore = RockyXExplore;
})();