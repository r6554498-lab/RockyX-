/* =========================================
   ROCKYX MAP & LOCATION SERVICES
   Location records, categories, and searches
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_map_locations";

  const CATEGORIES = [
    { id: "transport", name: "Transport", icon: "🚗" },
    { id: "fuel", name: "Fuel Stations", icon: "⛽" },
    { id: "food", name: "Food & Restaurants", icon: "🍔" },
    { id: "healthcare", name: "Healthcare", icon: "🏥" },
    { id: "business", name: "Businesses", icon: "🏪" },
    { id: "services", name: "Professional Services", icon: "🛠️" },
    { id: "shopping", name: "Shopping", icon: "🛍️" },
    { id: "accommodation", name: "Hotels & Accommodation", icon: "🏨" },
    { id: "entertainment", name: "Entertainment", icon: "🎭" },
    { id: "other", name: "Other Places", icon: "📍" }
  ];

  function loadLocations() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveLocations(locations) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  }

  function createId() {
    return "location_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 9);
  }

  function getCategories() {
    return CATEGORIES.map(function (category) {
      return Object.assign({}, category);
    });
  }

  function getCategory(categoryId) {
    return CATEGORIES.find(function (category) {
      return category.id === categoryId;
    }) || null;
  }

  function addLocation(options) {
    options = options || {};

    const name = String(options.name || "").trim();
    const category = String(options.category || "").trim();

    if (!name) {
      return {
        success: false,
        message: "Location name is required."
      };
    }

    if (!getCategory(category)) {
      return {
        success: false,
        message: "Please select a supported category."
      };
    }

    const latitude = Number(options.latitude);
    const longitude = Number(options.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return {
        success: false,
        message: "Valid latitude and longitude are required."
      };
    }

    const location = {
      id: createId(),
      name: name,
      category: category,
      description: String(options.description || "").trim(),
      address: String(options.address || "").trim(),
      city: String(options.city || "").trim(),
      country: String(options.country || "").trim(),
      latitude: latitude,
      longitude: longitude,
      phone: String(options.phone || "").trim(),
      website: String(options.website || "").trim(),
      openingHours: String(options.openingHours || "").trim(),
      verified: false,
      createdAt: new Date().toISOString()
    };

    const locations = loadLocations();
    locations.push(location);
    saveLocations(locations);

    return {
      success: true,
      location: location
    };
  }

  function getLocations(options) {
    options = options || {};

    let locations = loadLocations();

    if (options.category) {
      locations = locations.filter(function (location) {
        return location.category === options.category;
      });
    }

    if (options.city) {
      const city = String(options.city).toLowerCase();

      locations = locations.filter(function (location) {
        return location.city.toLowerCase() === city;
      });
    }

    if (options.country) {
      const country = String(options.country).toLowerCase();

      locations = locations.filter(function (location) {
        return location.country.toLowerCase() === country;
      });
    }

    if (options.verified === true) {
      locations = locations.filter(function (location) {
        return location.verified === true;
      });
    }

    return locations;
  }

  function getLocation(locationId) {
    return loadLocations().find(function (location) {
      return location.id === locationId;
    }) || null;
  }

  function searchLocations(query, options) {
    options = options || {};

    const term = String(query || "").trim().toLowerCase();

    if (!term) {
      return getLocations(options);
    }

    return getLocations(options).filter(function (location) {
      return [
        location.name,
        location.description,
        location.address,
        location.city,
        location.country
      ].some(function (value) {
        return String(value || "").toLowerCase().includes(term);
      });
    });
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const values = [lat1, lon1, lat2, lon2].map(Number);

    if (!values.every(Number.isFinite)) {
      return null;
    }

    if (
      Math.abs(values[0]) > 90 ||
      Math.abs(values[2]) > 90 ||
      Math.abs(values[1]) > 180 ||
      Math.abs(values[3]) > 180
    ) {
      return null;
    }

    const radians = function (degrees) {
      return degrees * Math.PI / 180;
    };

    const earthRadiusKm = 6371;

    const dLat = radians(values[2] - values[0]);
    const dLon = radians(values[3] - values[1]);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(radians(values[0])) *
      Math.cos(radians(values[2])) *
      Math.sin(dLon / 2) ** 2;

    const safeA = Math.min(1, Math.max(0, a));

    return earthRadiusKm * 2 *
      Math.atan2(Math.sqrt(safeA), Math.sqrt(1 - safeA));
  }

  function getNearby(latitude, longitude, options) {
    options = options || {};

    const radiusKm = Number(options.radiusKm || 10);

    if (!Number.isFinite(radiusKm) || radiusKm < 0) {
      return [];
    }

    return getLocations(options)
      .map(function (location) {
        return Object.assign({}, location, {
          distanceKm: calculateDistance(
            latitude,
            longitude,
            location.latitude,
            location.longitude
          )
        });
      })
      .filter(function (location) {
        return (
          location.distanceKm !== null &&
          location.distanceKm <= radiusKm
        );
      })
      .sort(function (a, b) {
        return a.distanceKm - b.distanceKm;
      });
  }

  function getMapLink(locationId) {
    const location = getLocation(locationId);

    if (!location) {
      return null;
    }

    const coordinates =
      location.latitude + "," + location.longitude;

    return "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(coordinates);
  }

  function getDirectionsLink(locationId) {
    const location = getLocation(locationId);

    if (!location) {
      return null;
    }

    const coordinates =
      location.latitude + "," + location.longitude;

    return "https://www.google.com/maps/dir/?api=1&destination=" +
      encodeURIComponent(coordinates);
  }

  function updateLocation(locationId, updates) {
    updates = updates || {};

    const locations = loadLocations();

    const index = locations.findIndex(function (location) {
      return location.id === locationId;
    });

    if (index === -1) {
      return {
        success: false,
        message: "Location not found."
      };
    }

    // Verification must eventually be handled by a secure backend.
    const allowedFields = [
      "name",
      "description",
      "address",
      "city",
      "country",
      "phone",
      "website",
      "openingHours"
    ];

    allowedFields.forEach(function (field) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        locations[index][field] =
          String(updates[field] || "").trim();
      }
    });

    saveLocations(locations);

    return {
      success: true,
      location: locations[index]
    };
  }

  function deleteLocation(locationId) {
    const locations = loadLocations();

    const updated = locations.filter(function (location) {
      return location.id !== locationId;
    });

    if (updated.length === locations.length) {
      return {
        success: false,
        message: "Location not found."
      };
    }

    saveLocations(updated);

    return {
      success: true,
      message: "Location removed from this browser."
    };
  }

  window.RockyXMapServices = {
    getCategories: getCategories,
    getCategory: getCategory,
    addLocation: addLocation,
    getLocations: getLocations,
    getLocation: getLocation,
    searchLocations: searchLocations,
    calculateDistance: calculateDistance,
    getNearby: getNearby,
    getMapLink: getMapLink,
    getDirectionsLink: getDirectionsLink,
    updateLocation: updateLocation,
    deleteLocation: deleteLocation
  };

})();