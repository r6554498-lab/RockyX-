(function (window, document) {
  "use strict";
  const modules = new Map();
  const pending = new Map();
  const errors = new Map();
  let manifest = [];
  function configure(list) {
    if (!Array.isArray(list)) {
      throw new Error("RockyX manifest must be an array.");
    }
    manifest = list.slice();
    return manifest;
  }
  function definition(name) {
    return manifest.find(function (item) {
      return item.name === name;
    });
  }
  function get(name) {
    const item = definition(name);
    if (!item) {
      throw new Error("RockyX module not registered: " + name);
    }
    return modules.get(name) ||
      (item.global && window[item.global]) ||
      null;
  }
  function register(name, module) {
    if (!definition(name)) {
      throw new Error(
        "Add " + name + " to module-manifest.js first."
      );
    }
    if (!module || typeof module !== "object") {
      throw new Error("Invalid module: " + name);
    }
    modules.set(name, module);
    errors.delete(name);
    return module;
  }
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
        const module = get(name);
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
          "Failed to load RockyX module: " + item.src
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
  function loadManifest(list) {
    configure(list);
    return Promise.all(
      manifest.map(function (item) {
        if (!item.autoLoad) {
          return Promise.resolve({
            name: item.name,
            skipped: true
          });
        }
        return load(item.name)
          .then(function (module) {
            return {
              name: item.name,
              loaded: true,
              module: module
            };
          })
          .catch(function (error) {
            console.error(
              "[RockyX] Module failed:",
              item.name,
              error
            );
            return {
              name: item.name,
              loaded: false,
              error: error
            };
          });
      })
    );
  }
  function initialize(name, options) {
    return load(name).then(function (module) {
      if (typeof module.init === "function") {
        return Promise.resolve(
          module.init(options || {})
        ).then(function () {
          return module;
        });
      }
      return module;
    });
  }
  function getStatus() {
    return manifest.map(function (item) {
      return {
        name: item.name,
        source: item.src,
        loaded: Boolean(
          modules.has(item.name) ||
          (item.global && window[item.global])
        ),
        loading: pending.has(item.name),
        error: errors.has(item.name)
          ? String(errors.get(item.name).message)
          : null
      };
    });
  }
  function retry(name) {
    pending.delete(name);
    modules.delete(name);
    errors.delete(name);
    return load(name);
  }
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