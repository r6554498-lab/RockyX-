/* ==========================================
   ROCKYX MODULE REGISTRY
   Version 2.0
   ========================================== */

(function (window, document) {
  "use strict";

  const modules = Object.create(null);
  const loading = Object.create(null);
  const manifest = Object.create(null);

  let manifestLoaded = false;

  function getGlobal(path) {
    return path.split(".").reduce(function (value, key) {
      return value ? value[key] : undefined;
    }, window);
  }

  function register(name, module) {
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("RockyX: A module name is required.");
    }

    if (!module || typeof module !== "object") {
      throw new Error("RockyX: A valid module object is required.");
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
    if (modules[name]) {
      return modules[name];
    }

    const definition = manifest[name];

    if (definition && definition.global) {
      const globalModule = getGlobal(definition.global);

      if (globalModule) {
        modules[name] = globalModule;
        return globalModule;
      }
    }

    return null;
  }

  function has(name) {
    return Boolean(get(name));
  }

  function list() {
    return Array.from(
      new Set(
        Object.keys(manifest).concat(Object.keys(modules))
      )
    );
  }

  function loadManifest(entries) {
    if (!Array.isArray(entries)) {
      throw new Error(
        "RockyX: The module manifest must be an array."
      );
    }

    entries.forEach(function (entry) {
      if (!entry || !entry.name || !entry.src) {
        console.warn(
          "RockyX: Skipping an invalid manifest entry.",
          entry
        );

        return;
      }

      manifest[entry.name] = Object.assign(
        {},
        entry
      );
    });

    manifestLoaded = true;

    window.dispatchEvent(
      new CustomEvent("rockyx:manifest-loaded", {
        detail: { modules: list() }
      })
    );

    return list();
  }

  function loadScript(name, src) {
    const definition = manifest[name];

    if (!src && definition) {
      src = definition.src;
    }

    if (!src) {
      return Promise.reject(
        new Error("RockyX: No script path for " + name)
      );
    }

    const existingModule = get(name);

    if (existingModule) {
      return Promise.resolve(existingModule);
    }

    if (loading[name]) {
      return loading[name];
    }

    loading[name] = new Promise(function (resolve, reject) {
      const selector =
        'script[data-rockyx-module="' + name + '"]';

      let script = document.querySelector(selector);
      let created = false;

      function cleanup() {
        script.removeEventListener("load", onLoad);
        script.removeEventListener("error", onError);
      }

      function onLoad() {
        cleanup();

        const module = get(name);

        if (module) {
          resolve(module);
          return;
        }

        delete loading[name];

        reject(
          new Error(
            "RockyX: Script loaded, but module was not found: " +
            name
          )
        );
      }

      function onError() {
        cleanup();
        delete loading[name];

        reject(
          new Error(
            "RockyX: Failed to load " + name + " from " + src
          )
        );
      }

      if (!script) {
        script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.dataset.rockyxModule = name;
        created = true;
      }

      script.addEventListener("load", onLoad);
      script.addEventListener("error", onError);

      if (created) {
        document.head.appendChild(script);
      } else if (script.dataset.rockyxLoaded === "true") {
        cleanup();

        const module = get(name);

        if (module) {
          resolve(module);
        } else {
          delete loading[name];

          reject(
            new Error(
              "RockyX: Previously loaded module is unavailable: " +
              name
            )
          );
        }
      }
    });

    return loading[name];
  }

  function load(name) {
    const existingModule = get(name);

    if (existingModule) {
      return Promise.resolve(existingModule);
    }

    const definition = manifest[name];

    if (!definition) {
      return Promise.reject(
        new Error("RockyX: Unknown module: " + name)
      );
    }

    return loadScript(name, definition.src);
  }

  function init(name, options) {
    return load(name).then(function (module) {
      if (typeof module.init !== "function") {
        throw new Error(
          "RockyX: Module has no init() method: " + name
        );
      }

      return module.init(options || {});
    });
  }

  function destroy(name) {
    const module = get(name);

    if (!module) {
      return false;
    }

    if (typeof module.destroy === "function") {
      module.destroy();
    }

    return true;
  }

  function loadAutoModules() {
    if (!manifestLoaded) {
      return Promise.resolve([]);
    }

    const names = list().filter(function (name) {
      return manifest[name] &&
        manifest[name].autoLoad === true;
    });

    return Promise.all(
      names.map(function (name) {
        return load(name).catch(function (error) {
          console.error(error);
          return null;
        });
      })
    );
  }

  window.RockyXModules = {
    register: register,
    get: get,
    has: has,
    list: list,
    loadManifest: loadManifest,
    loadScript: loadScript,
    load: load,
    init: init,
    destroy: destroy,
    loadAutoModules: loadAutoModules
  };

})(window, document);