/* ==========================================
   ROCKYX APPLICATION CORE
   One World. One Platform.
========================================== */

"use strict";

const RockyX = (() => {

    /* APPLICATION CONFIGURATION */

    const config = Object.freeze({
        name: "RockyX",
        version: "1.0.0",
        environment: "development"
    });


    /* APPLICATION STATE */

    const state = {
        initialized: false,
        activePage: "home",
        modules: new Map(),
        errors: []
    };


    /* ERROR MANAGEMENT */

    function reportError(error, context = "Application") {

        const entry = {
            message: error.message || String(error),
            context,
            timestamp: new Date().toISOString()
        };

        state.errors.push(entry);

        console.error(`[RockyX: ${context}]`, error);
    }


    /* MODULE REGISTRATION */

    function registerModule(name, module) {

        if (!name || !module) {
            throw new Error("Invalid module registration.");
        }

        if (state.modules.has(name)) {
            throw new Error(`Module already registered: ${name}`);
        }

        state.modules.set(name, module);

        console.info(`[RockyX] Module registered: ${name}`);
    }


    /* MODULE INITIALIZATION */

    function initializeModules() {

        for (const [name, module] of state.modules) {

            try {

                if (typeof module.initialize === "function") {
                    module.initialize();
                }

            } catch (error) {

                reportError(error, `Module: ${name}`);

            }

        }

    }


    /* NAVIGATION */

    function navigate(page) {

        if (!page || typeof page !== "string") {
            return false;
        }

        state.activePage = page;

        window.dispatchEvent(
            new CustomEvent("rockyx:navigate", {
                detail: { page }
            })
        );

        return true;
    }


    /* GLOBAL ERROR LISTENERS */

    function setupErrorHandling() {

        window.addEventListener("error", event => {

            reportError(event.error || event.message, "JavaScript");

        });

        window.addEventListener("unhandledrejection", event => {

            reportError(event.reason, "Promise");

        });

    }


    /* APPLICATION INITIALIZATION */

    function initialize() {

        if (state.initialized) {
            return;
        }

        try {

            setupErrorHandling();

            initializeModules();

            state.initialized = true;

            console.info(
                `${config.name} v${config.version} initialized.`
            );

            window.dispatchEvent(
                new CustomEvent("rockyx:ready")
            );

        } catch (error) {

            reportError(error, "Startup");

        }

    }


    /* PUBLIC APPLICATION API */

    return Object.freeze({

        config,

        registerModule,

        initialize,

        navigate,

        getState() {

            return {
                initialized: state.initialized,
                activePage: state.activePage,
                registeredModules: [...state.modules.keys()],
                errorCount: state.errors.length
            };

        }

    });

})();


/* START APPLICATION */

document.addEventListener("DOMContentLoaded", () => {

    RockyX.initialize();

});


/* EXPOSE APPLICATION */

window.RockyX = RockyX;