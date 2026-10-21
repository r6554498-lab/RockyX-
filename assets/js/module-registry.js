(function (window, document) {
  "use strict";

  const modules = {};
  const loading = {};

  const api = {
    register: function (name, module) {
      modules[name] = module;
      return module;
    },

    get: function (name) {
      if (modules[name]) {
        return modules[name];
      }

      const manifest = window.RockyXModuleManifest || [];
      const entry = manifest.find(function (item) {
        return item.name === name;
      });

      if (entry && entry.global && window[entry.global]) {
        modules[name] = window[entry.global];
        return modules[name];
      }

      return null;
    },

    has: function (name) {
      return !!this.get(name);
    },

    list: function () {
      return Object.keys(modules);
    },

    loadManifest: function (entries) {
      window.RockyXModuleManifest = entries || [];
      return window.RockyXModuleManifest;
    },

    loadScript: function (name, src) {
      const existingModule = this.get(name);

      if (existingModule) {
        return Promise.resolve(existingModule);
      }

      if (loading[name]) {
        return loading[name];
      }

      loading[name] = new Promise(function (resolve, reject) {
        let script = document.querySelector(
          'script[data-rockyx-module="' + name + '"]'
        );

        if (script && script.dataset.rockyxLoaded === "true") {
          const loadedModule = api.get(name);

          if (loadedModule) {
            resolve(loadedModule);
          } else {
            reject(new Error("Module did not register: " + name));
          }

          return;
        }

        function onLoad() {
          script.dataset.rockyxLoaded = "true";

          const loadedModule = api.get(name);

          if (loadedModule) {
            resolve(loadedModule);
          } else {
            reject(new Error("Module did not register: " + name));
          }
        }

        function onError() {
          delete loading[name];
          reject(new Error("Could not load module: " + name));
        }

        if (!script) {
          script = document.createElement("script");
          script.src = src;
          script.dataset.rockyxModule = name;
          script.onload = onLoad;
          script.onerror = onError;
          document.body.appendChild(script);
          return;
        }

        script.addEventListener("load", onLoad, { once: true });
        script.addEventListener("error", onError, { once: true });
      }).catch(function (error) {
        delete loading[name];
        throw error;
      });

      return loading[name];
    },

    load: function (name) {
      const existingModule = this.get(name);

      if (existingModule) {
        return Promise.resolve(existingModule);
      }

      const manifest = window.RockyXModuleManifest || [];
      const entry = manifest.find(function (item) {
        return item.name === name;
      });

      if (!entry) {
        return Promise.reject(
          new Error("Module not found in manifest: " + name)
        );
      }

      return this.loadScript(name, entry.src);
    },

    init: function (name, options) {
      return this.load(name).then(function (module) {
        if (typeof module.init === "function") {
          return module.init(options || {});
        }

        return module;
      });
    },

    destroy: function (name) {
      const module = this.get(name);

      if (module && typeof module.destroy === "function") {
        module.destroy();
      }

      return true;
    },

    loadAutoModules: function () {
      const manifest = window.RockyXModuleManifest || [];

      return Promise.all(
        manifest
          .filter(function (entry) {
            return entry.autoLoad === true;
          })
          .map(function (entry) {
            return api.load(entry.name).catch(function (error) {
              console.error(error);
              return null;
            });
          })
      );
    }
  };

  window.RockyXModules = api;
})(window, document);