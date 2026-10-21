(function (window, document) {
  "use strict";
  const manifest = window.RockyXModuleManifest || [];
  const modules = new Map();
  const loading = new Map();
  const errors = new Map();
  let started = false;
  function getDefinition(name) {
    return manifest.find(function (item) {
      return item.name === name;
    });
  }
  function getModule(name) {
    const definition = getDefinition(name);
    if (!definition) {
      throw new Error("Unknown RockyX module: " + name);
    }
    return modules.get(name) ||
      (definition.global ? window[definition.global] : null) ||
      null;
  }
  function load(name) {
    const definition = getDefinition(name);
    if (!definition) {
      return Promise.reject(
        new Error("Module not registered: " + name)
      );
    }
    const existing = getModule(name);
    if (existing) {
      modules.set(name, existing);
      return Promise.resolve(existing);
    }
    if (loading.has(name)) {
      return loading.get(name);
    }
    const promise = new Promise(function (resolve, reject) {
      const script = document.createElement("script");
      script.src = definition.src;
      script.async = true;
      script.dataset.rockyxModule = name;
      script.onload = function () {
        const module = getModule(name);
        if (!module) {
          const error = new Error(
            "Module loaded but did not export: " +
            definition.global
          );
          errors.set(name, error);
          loading.delete(name);
          reject(error);
          return;
        }
        modules.set(name, module);
        errors.delete(name);
        loading.delete(name);
        resolve(module);
      };
      script.onerror = function () {
        const error = new Error(
          "Could not load " + definition.src
        );
        errors.set(name, error);
        loading.delete(name);
        script.remove();
        reject(error);
      };
      document.head.appendChild(script);
    });
    loading.set(name, promise);
    return promise;
  }
  function loadAll(names) {
    const selected = names || manifest.map(function (item) {
      return item.name;
    });
    return Promise.all(
      selected.map(function (name) {
        return load(name).then(function (module) {
          return {
            name: name,
            success: true,
            module: module
          };
        }).catch(function (error) {
          return {
            name: name,
            success: false,
            error: error
          };
        });
      })
    );
  }
  function initialize(name, options) {
    return load(name).then(function (module) {
      if (typeof module.init === "function") {
        return Promise.resolve(module.init(options || {}))
          .then(function () {
            return module;
          });
      }
      return module;
    });
  }
  function initializeAll(optionsByName) {
    return loadAll().then(function (results) {
      return Promise.all(results.map(function (result) {
        if (!result.success) {
          return result;
        }
        const definition = getDefinition(result.name);
        if (!definition.autoLoad) {
          return result;
        }
        return initialize(
          result.name,
          (optionsByName || {})[result.name] || {}
        ).then(function () {
          return result;
        }).catch(function (error) {
          errors.set(result.name, error);
          return {
            name: result.name,
            success: false,
            error: error
          };
        });
      }));
    });
  }
  function getStatus() {
    return manifest.map(function (definition) {
      return {
        name: definition.name,
        src: definition.src,
        loaded: modules.has(definition.name) ||
          Boolean(
            definition.global &&
            window[definition.global]
          ),
        loading: loading.has(definition.name),
        error: errors.has(definition.name)
          ? String(errors.get(definition.name).message)
          : null
      };
    });
  }
  function retry(name) {
    loading.delete(name);
    errors.delete(name);
    modules.delete(name);
    return load(name);
  }
  function register(name, module) {
    if (!getDefinition(name)) {
      throw new Error(
        "Register the module in module-manifest.js first: " +
        name
      );
    }
    if (!module || typeof module !== "object") {
      throw new Error("Invalid module: " + name);
    }
    modules.set(name, module);
    return module;
  }
  window.RockyXModules = {
    load: load,
    loadAll: loadAll,
    initialize: initialize,
    initializeAll: initializeAll,
    get: getModule,
    getStatus: getStatus,
    retry: retry,
    register: register
  };
  window.RockyXModuleRegistryReady = true;
  document.dispatchEvent(
    new CustomEvent("rockyx:registry-ready")
  );
})(window, document);