/* ==========================================
   ROCKYX CREATE MODULE
   Version 1.0.0
   One World. One Platform.
========================================== */

"use strict";

const RockyXCreate = (() => {

    const state = {
        initialized: false,
        selectedMedia: [],
        activeCamera: null,
        facingMode: "environment",
        cameraStream: null
    };


    /* INITIALIZATION */

    function initialize() {

        if (state.initialized) return;

        state.initialized = true;

        console.info("[RockyX] Create module initialized.");

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


    /* RENDER CREATE SCREEN */

    function render() {

        const screen = document.getElementById("app-screen");

        if (!screen) return;

        screen.innerHTML = `

            <section class="create-page">

                <header class="create-header">

                    <h1>Create</h1>

                    <p>
                        Bring your ideas to life with RockyX.
                    </p>

                </header>


                <section class="create-options">

                    <button
                        type="button"
                        class="rockyx-card"
                        data-action="camera">

                        <span>📷</span>

                        <h2>Camera</h2>

                        <p>Record something new.</p>

                    </button>


                    <button
                        type="button"
                        class="rockyx-card"
                        data-action="media">

                        <span>🎬</span>

                        <h2>Upload Media</h2>

                        <p>Select photos and videos.</p>

                    </button>


                    <button
                        type="button"
                        class="rockyx-card"
                        data-action="templates">

                        <span>✨</span>

                        <h2>Templates</h2>

                        <p>Create using a template.</p>

                    </button>

                </section>


                <input
                    type="file"
                    id="rockyx-media-picker"
                    accept="image/*,video/*"
                    multiple
                    hidden
                >


                <section id="create-camera-area"
                    class="create-camera-area"
                    hidden>

                    <video
                        id="rockyx-camera-preview"
                        autoplay
                        muted
                        playsinline>
                    </video>

                    <div class="camera-controls">

                        <button
                            type="button"
                            data-action="switch-camera">
                            Switch Camera
                        </button>

                        <button
                            type="button"
                            data-action="stop-camera">
                            Close Camera
                        </button>

                    </div>

                </section>


                <section class="selected-media-section">

                    <h2>Selected Media</h2>

                    <div id="selected-media-list">

                        <p>No media selected yet.</p>

                    </div>

                </section>


                <button
                    type="button"
                    class="primary-button"
                    data-action="continue-editor">

                    Continue to Studio Editor

                </button>


                <p class="demo-notice">
                    Media processing, uploads and publishing
                    will be connected in later development stages.
                </p>

            </section>

        `;

        attachEvents(screen);

    }


    /* EVENT HANDLING */

    function attachEvents(screen) {

        if (screen.dataset.createEvents === "attached") {
            return;
        }

        screen.addEventListener("click", handleClick);

        screen.addEventListener("change", handleChange);

        screen.dataset.createEvents = "attached";

    }


    async function handleClick(event) {

        const button = event.target.closest("button");

        if (!button) return;

        const action = button.dataset.action;

        switch (action) {

            case "camera":

                await startCamera();

                break;

            case "media":

                document.getElementById(
                    "rockyx-media-picker"
                ).click();

                break;

            case "switch-camera":

                state.facingMode =
                    state.facingMode === "environment"
                    ? "user"
                    : "environment";

                await startCamera();

                break;

            case "stop-camera":

                stopCamera();

                break;

            case "continue-editor":

                if (state.selectedMedia.length === 0) {

                    alert("Please select media first.");

                    return;

                }

                window.dispatchEvent(
                    new CustomEvent("rockyx:editor-request", {
                        detail: {
                            mediaCount: state.selectedMedia.length
                        }
                    })
                );

                console.info(
                    "Studio Editor integration is pending."
                );

                break;

            case "templates":

                window.RockyX.navigate("templates");

                break;

        }

    }


    /* MEDIA SELECTION */

    function handleChange(event) {

        if (event.target.id !== "rockyx-media-picker") {
            return;
        }

        const files = Array.from(event.target.files || []);

        const validFiles = files.filter(file => {

            return (
                file.type.startsWith("image/") ||
                file.type.startsWith("video/")
            );

        });

        state.selectedMedia = validFiles;

        renderSelectedMedia();

        event.target.value = "";

    }


    /* DISPLAY SELECTED MEDIA */

    function renderSelectedMedia() {

        const container = document.getElementById(
            "selected-media-list"
        );

        if (!container) return;

        if (state.selectedMedia.length === 0) {

            container.innerHTML = `
                <p>No media selected yet.</p>
            `;

            return;

        }

        container.innerHTML = state.selectedMedia.map(
            (file, index) => `

                <article class="rockyx-card">

                    <h3>${escapeHTML(file.name)}</h3>

                    <p>
                        ${escapeHTML(file.type)}
                    </p>

                    <p>
                        ${(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    <span>Media ${index + 1}</span>

                </article>

            `
        ).join("");

    }


    /* CAMERA ACCESS */

    async function startCamera() {

        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia) {

            alert(
                "Camera access is unavailable in this browser or context."
            );

            return;

        }

        stopCamera();

        try {

            const stream =
                await navigator.mediaDevices.getUserMedia({

                    video: {
                        facingMode: state.facingMode
                    },

                    audio: true

                });

            state.cameraStream = stream;

            const cameraArea = document.getElementById(
                "create-camera-area"
            );

            const preview = document.getElementById(
                "rockyx-camera-preview"
            );

            cameraArea.hidden = false;

            preview.srcObject = stream;

        } catch (error) {

            console.error(
                "[RockyX] Camera access failed:",
                error
            );

            alert(
                "Unable to access the camera. Check browser permissions."
            );

        }

    }


    /* STOP CAMERA */

    function stopCamera() {

        if (state.cameraStream) {

            state.cameraStream.getTracks().forEach(track => {
                track.stop();
            });

            state.cameraStream = null;

        }

        const preview = document.getElementById(
            "rockyx-camera-preview"
        );

        if (preview) {
            preview.srcObject = null;
        }

        const cameraArea = document.getElementById(
            "create-camera-area"
        );

        if (cameraArea) {
            cameraArea.hidden = true;
        }

    }


    /* PUBLIC API */

    return Object.freeze({

        initialize,

        render,

        stopCamera,

        getState() {

            return {
                initialized: state.initialized,
                selectedMediaCount: state.selectedMedia.length,
                cameraActive: Boolean(state.cameraStream)
            };

        }

    });

})();


/* REGISTER MODULE */

window.RockyX.registerModule(
    "create",
    RockyXCreate
);