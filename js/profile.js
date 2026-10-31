/* ==========================================
   ROCKYX USER PROFILE MODULE
   Version 1.0.0
========================================== */

"use strict";

const RockyXProfile = (() => {

    const state = {
        initialized: false,

        profile: {
            displayName: "RockyX User",
            username: "@rockyxuser",
            bio: "Discover. Create. Connect.",
            avatar: "",
            followers: 1250,
            following: 340,
            posts: 24,
            verified: false,

            capabilities: [
                "Creator",
                "Artist",
                "Seller",
                "Business"
            ]
        },

        activeTab: "posts"
    };


    /* INITIALIZATION */

    function initialize() {

        if (state.initialized) return;

        state.initialized = true;

        console.info("[RockyX] Profile module initialized.");

    }


    /* RENDER PROFILE */

    function render() {

        const screen = document.getElementById("app-screen");

        if (!screen) {
            console.error("Profile screen unavailable.");
            return;
        }

        const profile = state.profile;

        screen.innerHTML = `

            <section class="profile-page">

                <header class="profile-header">

                    <div class="profile-cover">

                        <span>ROCKYX</span>

                    </div>

                    <div class="profile-avatar">

                        ${profile.avatar
                            ? `<img src="${escapeHTML(profile.avatar)}" alt="Profile picture">`
                            : `<span>${escapeHTML(profile.displayName.charAt(0))}</span>`
                        }

                    </div>

                    <div class="profile-identity">

                        <h1>
                            ${escapeHTML(profile.displayName)}
                            ${profile.verified ? " ✓" : ""}
                        </h1>

                        <p>${escapeHTML(profile.username)}</p>

                        <p class="profile-bio">
                            ${escapeHTML(profile.bio)}
                        </p>

                    </div>

                    <div class="profile-actions">

                        <button type="button"
                            class="primary-button"
                            data-action="edit">
                            Edit Profile
                        </button>

                        <button type="button"
                            data-action="share">
                            Share Profile
                        </button>

                    </div>

                </header>


                <section class="profile-statistics">

                    <div>
                        <strong>${profile.posts}</strong>
                        <span>Posts</span>
                    </div>

                    <div>
                        <strong>${profile.followers}</strong>
                        <span>Followers</span>
                    </div>

                    <div>
                        <strong>${profile.following}</strong>
                        <span>Following</span>
                    </div>

                </section>


                <section class="profile-capabilities">

                    <h2>My Capabilities</h2>

                    <div class="capability-list">

                        ${profile.capabilities.map(capability => `
                            <span class="capability-item">
                                ${escapeHTML(capability)}
                            </span>
                        `).join("")}

                    </div>

                </section>


                <nav class="profile-tabs"
                    aria-label="Profile content">

                    <button data-tab="posts"
                        class="${state.activeTab === "posts" ? "active" : ""}">
                        Posts
                    </button>

                    <button data-tab="music"
                        class="${state.activeTab === "music" ? "active" : ""}">
                        Music
                    </button>

                    <button data-tab="shop"
                        class="${state.activeTab === "shop" ? "active" : ""}">
                        Shop
                    </button>

                    <button data-tab="services"
                        class="${state.activeTab === "services" ? "active" : ""}">
                        Services
                    </button>

                </nav>


                <div class="profile-content">

                    <div class="profile-empty-state">

                        <h3>${getTabTitle()}</h3>

                        <p>
                            Demonstration content.
                            Your real profile content will appear here
                            when the backend is connected.
                        </p>

                    </div>

                </div>

            </section>

        `;

        attachEvents(screen);

    }


    /* SAFE HTML OUTPUT */

    function escapeHTML(value) {

        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);

    }


    /* TAB TITLES */

    function getTabTitle() {

        const titles = {
            posts: "Your Posts",
            music: "Your Music",
            shop: "Your Shop",
            services: "Your Services"
        };

        return titles[state.activeTab];

    }


    /* EVENT HANDLING */

    function attachEvents(screen) {

        screen.addEventListener("click", handleClick);

    }


    function handleClick(event) {

        const button = event.target.closest("button");

        if (!button) return;

        const action = button.dataset.action;
        const tab = button.dataset.tab;

        if (tab) {

            state.activeTab = tab;

            render();

            return;

        }

        if (action === "edit") {

            console.info("Profile editor will be developed separately.");

        }

        if (action === "share") {

            shareProfile();

        }

    }


    /* SHARE PROFILE */

    async function shareProfile() {

        const shareData = {
            title: "RockyX Profile",
            text: `Visit ${state.profile.username} on RockyX.`
        };

        try {

            if (navigator.share) {

                await navigator.share(shareData);

            } else if (navigator.clipboard) {

                await navigator.clipboard.writeText(
                    shareData.text
                );

                console.info("Profile sharing text copied.");

            }

        } catch (error) {

            if (error.name !== "AbortError") {
                console.error("Profile sharing failed:", error);
            }

        }

    }


    /* PUBLIC API */

    return Object.freeze({

        initialize,
        render,

        getProfile() {
            return { ...state.profile };
        }

    });

})();


/* REGISTER MODULE */

window.RockyX.registerModule(
    "profile",
    RockyXProfile
);