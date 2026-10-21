/* ==========================================
   ROCKYX MODULE REGISTRY
   Version 1.0
   ========================================== */

(function (window) {
  "use strict";

  const modules = Object.create(null);
  const loading = Object.create(null);

  function register(name, module) {
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("RockyX: Module name is required.");
    }

    if (!module || typeof module !== "object") {
      throw new Error("RockyX: A module object is required.");
    }

    if (modules[name]) {
      console.warn(
        "RockyX: Replacing registered module:",
        name
      );
    }

    modules[name] = module;

    window.dispatchEvent(
      new CustomEvent("rockyx:module-registered", {
        detail: { name: name }
      })
    );

    return module;
  }

  function get(name) {
    return modules[name] || null;
  }

  function has(name) {
    return Object.prototype.hasOwnProperty.call(
      modules,
      name
    );
  }

  function list() {
    return Object.keys(modules);
  }

  function init(name, options) {
    const module = get(name);

    if (!module) {
      console.warn(
        "RockyX: Module is not registered:",
        name
      );

      return false;
    }

    if (typeof module.init !== "function") {
      console.warn(
        "RockyX: Module has no init() method:",
        name
      );

      return false;
    }

    return module.init(options || {});
  }

  function destroy(name) {
    const module = get(name);

    if (!module) return false;

    if (typeof module.destroy === "function") {
      module.destroy();
    }

    return true;
  }

  function loadScript(name, src) {
    if (has(name)) {
      return Promise.resolve(get(name));
    }

    if (loading[name]) {
      return loading[name];
    }

    loading[name] = new Promise(function (resolve, reject) {
      const existing = document.querySelector(
        'script[data-rockyx-module="' + name + '"]'
      );

      const script = existing || document.createElement("script");

      function cleanup() {
        script.removeEventListener("load", onLoad);
        script.removeEventListener("error", onError);
      }

      function onLoad() {
        cleanup();

        const module = get(name);

        if (module) {
          resolve(module);
        } else {
          delete loading[name];

          reject(
            new Error(
              "RockyX: Script loaded but did not register module: " +
              name
            )
          );
        }
      }

      function onError() {
        cleanup();
        delete loading[name];

        reject(
          new Error(
            "RockyX: Could not load module script: " + src
          )
        );
      }

      script.addEventListener("load", onLoad);
      script.addEventListener("error", onError);

      if (!existing) {
        script.src = src;
        script.async = true;
        script.dataset.rockyxModule = name;
        document.head.appendChild(script);
      }
    });

    return loading[name];
  }

  window.RockyXModules = {
    register: register,
    get: get,
    has: has,
    list: list,
    init: init,
    destroy: destroy,
    loadScript: loadScript
  };

})(window);