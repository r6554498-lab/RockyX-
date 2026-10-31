/* ==========================================
   ROCKYX HOME FEED
   Version 1.0.0
   One World. One Platform.
========================================== */

"use strict";

const RockyXHome = (() => {

    const state = {
        activeFeed: "for-you",
        videos: [],
        initialized: false
    };


    /* DEMONSTRATION CONTENT */

    const demoVideos = [
        {
            id: "video-001",
            creator: "RockyX Creator",
            username: "@rockyxcreator",
            description: "Welcome to the future of social discovery.",
            likes: 1240,
            comments: 86,
            music: "Original Sound",
            following: false
        },
        {
            id: "video-002",
            creator: "Creative Studio",
            username: "@creativestudio",
            description: "Discover something new every day.",
            likes: 850,
            comments: 42,
            music: "Original Sound",
            following: false
        }
    ];


    /* INITIALIZE */

    function initialize() {

        if (state.initialized) return;

        state.videos = demoVideos.map(video => ({
            ...video,
            liked: false,
            saved: false
        }));

        state.initialized = true;

        console.info("[RockyX] Home module initialized.");
    }


    /* RENDER HOME SCREEN */

    function render() {

        const screen = document.getElementById("app-screen");

        if (!screen) {
            console.error("[RockyX] Home screen container missing.");
            return;
        }

        screen.innerHTML = `
            <section class="home-feed">

                <header class="feed-header">

                    <h1>RockyX</h1>

                    <div class="feed-tabs">

                        <button
                            type="button"
                            data-feed="for-you"
                            class="${state.activeFeed === "for-you" ? "active" : ""}">
                            For You
                        </button>

                        <button
                            type="button"
                            data-feed="following"
                            class="${state.activeFeed === "following" ? "active" : ""}">
                            Following
                        </button>

                    </div>

                </header>

                <div class="video-feed">

                    ${state.videos.map(video => `
                        <article class="video-card" data-video-id="${video.id}">

                            <div class="video-placeholder">

                                <span>ROCKYX</span>

                                <p>Video preview</p>

                                <small>Demonstration content</small>

                            </div>

                            <div class="video-information">

                                <h3>${video.creator}</h3>

                                <p>${video.username}</p>

                                <p>${video.description}</p>

                                <p>♫ ${video.music}</p>

                            </div>

                            <div class="video-actions">

                                <button
                                    type="button"
                                    data-action="like"
                                    data-id="${video.id}"
                                    aria-pressed="${video.liked}">
                                    ${video.liked ? "♥" : "♡"}
                                    ${video.likes}
                                </button>

                                <button
                                    type="button"
                                    data-action="comment"
                                    data-id="${video.id}">
                                    Comments ${video.comments}
                                </button>

                                <button
                                    type="button"
                                    data-action="save"
                                    data-id="${video.id}"
                                    aria-pressed="${video.saved}">
                                    ${video.saved ? "Saved" : "Save"}
                                </button>

                                <button
                                    type="button"
                                    data-action="share"
                                    data-id="${video.id}">
                                    Share
                                </button>

                            </div>

                        </article>
                    `).join("")}

                </div>

                <p class="demo-notice">
                    Sample content is displayed for development.
                </p>

            </section>
        `;

        attachEvents();

    }


    /* EVENT HANDLING */

    function attachEvents() {

        const screen = document.getElementById("app-screen");

        screen.addEventListener("click", handleClick);

    }


    function handleClick(event) {

        const button = event.target.closest("button");

        if (!button) return;

        const feed = button.dataset.feed;

        if (feed) {

            state.activeFeed = feed;

            render();

            return;
        }

        const action = button.dataset.action;
        const id = button.dataset.id;

        const video = state.videos.find(item => item.id === id);

        if (!video) return;

        switch (action) {

            case "like":
                video.liked = !video.liked;
                video.likes += video.liked ? 1 : -1;
                render();
                break;

            case "save":
                video.saved = !video.saved;
                render();
                break;

            case "comment":
                console.info("Comments feature is not connected yet.");
                break;

            case "share":
                shareVideo(video);
                break;

        }

    }


    /* SHARE */

    async function shareVideo(video) {

        const shareData = {
            title: "RockyX",
            text: video.description
        };

        try {

            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                console.info("Native sharing is unavailable.");
            }

        } catch (error) {

            if (error.name !== "AbortError") {
                console.error("Sharing failed:", error);
            }

        }

    }


    /* PUBLIC API */

    return Object.freeze({

        initialize,
        render,

        getState() {
            return {
                activeFeed: state.activeFeed,
                videoCount: state.videos.length,
                initialized: state.initialized
            };
        }

    });

})();


/* REGISTER HOME MODULE */

window.RockyX.registerModule(
    "home",
    RockyXHome
);