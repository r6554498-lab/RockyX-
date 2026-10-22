(function (window, document) {
  "use strict";
  // ==========================================
  // SECTION 1: CORE REGISTRY
  // ==========================================
  const modules = new Map();
  const pending = new Map();
  const errors = new Map();
  let manifest = [];
  // ==========================================
  // SECTION 2: MANIFEST MANAGEMENT
  // ==========================================
  function configure(list) {
    if (!Array.isArray(list)) {
      throw new Error("RockyX manifest must be an array.");
    }
    const names = new Set();
    list.forEach(function (item) {
      if (!item.name || !item.src || !item.global) {
        throw new Error(
          "Every module needs name, src, and global."
        );
      }
      if (names.has(item.name)) {
        throw new Error(
          "Duplicate RockyX module: " + item.name
        );
      }
      names.add(item.name);
    });
    manifest = list.slice();
    return manifest;
  }
  function definition(name) {
    return manifest.find(function (item) {
      return item.name === name;
    });
  }
  // ==========================================
  // SECTION 3: MODULE ACCESS
  // ==========================================
  function get(name) {
    const item = definition(name);
    if (!item) {
      throw new Error(
        "RockyX module not registered: " + name
      );
    }
    return modules.get(name) ||
      (item.global && window[item.global]) ||
      null;
  }
  // ==========================================
  // SECTION 4: MODULE REGISTRATION
  // ==========================================
  function register(name, module) {
    if (!definition(name)) {
      throw new Error(
        "Register the module in module-manifest.js first: " +
        name
      );
    }
    if (!module || typeof module !== "object") {
      throw new Error("Invalid module: " + name);
    }
    modules.set(name, module);
    errors.delete(name);
    return module;
  }
  // ==========================================
  // SECTION 5: MODULE LOADING
  // ==========================================
  function load(name) {
    const item = definition(name);
    if (!item) {
      return Promise.reject(
        new Error("Unknown RockyX module: " + name)
      );
    }
    const existing = get(name);
    if (existing) {
      modules.set(name, existing);
      return Promise.resolve(existing);
    }
    if (pending.has(name)) {
      return pending.get(name);
    }
    const promise = new Promise(function (resolve, reject) {
      const script = document.createElement("script");
      script.src = item.src;
      script.async = true;
      script.dataset.rockyxModule = name;
      script.onload = function () {
        let module;
        try {
          module = get(name);
        } catch (error) {
          errors.set(name, error);
          pending.delete(name);
          reject(error);
          return;
        }
        if (!module) {
          const error = new Error(
            item.src + " did not export " + item.global
          );
          errors.set(name, error);
          pending.delete(name);
          reject(error);
          return;
        }
        modules.set(name, module);
        errors.delete(name);
        pending.delete(name);
        resolve(module);
      };
      script.onerror = function () {
        const error = new Error(
          "Could not load RockyX module: " + item.src
        );
        errors.set(name, error);
        pending.delete(name);
        script.remove();
        reject(error);
      };
      document.head.appendChild(script);
    });
    pending.set(name, promise);
    return promise;
  }
  // ==========================================
  // SECTION 6: BULK MODULE LOADING
  // ==========================================
  function loadManifest(list) {
    try {
      configure(list);
    } catch (error) {
      return Promise.reject(error);
    }
    return Promise.all(
      manifest.map(function (item) {
        if (!item.autoLoad) {
          return {
            name: item.name,
            loaded: false,
            skipped: true
          };
        }
        return load(item.name)
          .then(function () {
            return {
              name: item.name,
              loaded: true
            };
          })
          .catch(function (error) {
            console.error(
              "[RockyX] Failed to load " + item.name,
              error
            );
            return {
              name: item.name,
              loaded: false,
              error: error.message
            };
          });
      })
    );
  }
  // ==========================================
  // SECTION 7: MODULE INITIALIZATION
  // ==========================================
  function initialize(name, options) {
    return load(name).then(function (module) {
      if (typeof module.init !== "function") {
        return module;
      }
      return Promise.resolve(
        module.init(options || {})
      ).then(function () {
        return module;
      });
    }).catch(function (error) {
      errors.set(name, error);
      throw error;
    });
  }
  // ==========================================
  // SECTION 8: STATUS AND ERROR REPORTING
  // ==========================================
  function getStatus() {
    return manifest.map(function (item) {
      return {
        name: item.name,
        src: item.src,
        loaded: modules.has(item.name) ||
          Boolean(
            item.global &&
            window[item.global]
          ),
        loading: pending.has(item.name),
        error: errors.has(item.name)
          ? String(errors.get(item.name).message)
          : null
      };
    });
  }
  function retry(name) {
    if (pending.has(name)) {
      return pending.get(name);
    }
    modules.delete(name);
    errors.delete(name);
    return load(name);
  }
  // ==========================================
  // SECTION 9: PUBLIC REGISTRY API
  // ==========================================
  window.RockyXModules = {
    configure: configure,
    register: register,
    get: get,
    load: load,
    loadManifest: loadManifest,
    initialize: initialize,
    getStatus: getStatus,
    retry: retry
  };
  window.RockyXModuleRegistryReady = true;
  document.dispatchEvent(
    new CustomEvent("rockyx:registry-ready")
  );
})(window, document);