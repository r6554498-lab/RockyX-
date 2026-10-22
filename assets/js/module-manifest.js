(function (window) {
  "use strict";
  window.RockyXModuleManifest = [
    // ==========================================
    // SECTION 1: CORE PLATFORM
    // ==========================================
    {
      name: "appRouter",
      src: "assets/js/app-router.js",
      global: "RockyXAppRouter",
      autoLoad: true
    },
    // ==========================================
    // SECTION 2: HOME AND VIDEO FEED
    // ==========================================
    {
      name: "videoInteractions",
      src: "assets/js/video-interactions.js",
      global: "RockyXVideoInteractions",
      autoLoad: true
    },
    {
      name: "commentReactions",
      src: "assets/js/comment-reactions.js",
      global: "RockyXCommentReactions",
      autoLoad: true
    },
    {
      name: "feedTemplates",
      src: "assets/js/feed-templates.js",
      global: "RockyXFeedTemplates",
      autoLoad: true
    },
    // ==========================================
    // SECTION 3: EXPLORE AND DISCOVER
    // ==========================================
    {
      name: "explore",
      src: "assets/js/explore.js",
      global: "RockyXExplore",
      screen: "Explore",
      autoLoad: true
    },
    // Planned modules: create their files before
    // enabling or registering these entries.
    // {
    //   name: "businesses",
    //   src: "assets/js/discover/businesses.js",
    //   global: "RockyXBusinesses",
    //   autoLoad: false
    // },
    // {
    //   name: "transport",
    //   src: "assets/js/discover/transport.js",
    //   global: "RockyXTransport",
    //   autoLoad: false
    // },
    // {
    //   name: "food",
    //   src: "assets/js/discover/food.js",
    //   global: "RockyXFood",
    //   autoLoad: false
    // },
    // {
    //   name: "fuel",
    //   src: "assets/js/discover/fuel.js",
    //   global: "RockyXFuel",
    //   autoLoad: false
    // },
    // {
    //   name: "otherServices",
    //   src: "assets/js/discover/other-services.js",
    //   global: "RockyXOtherServices",
    //   autoLoad: false
    // },
    // ==========================================
    // SECTION 4: CREATE AND STUDIO
    // ==========================================
    {
      name: "create",
      src: "assets/js/create.js",
      global: "RockyXCreate",
      screen: "Studio",
      autoLoad: false
    },
    {
      name: "studioEditor",
      src: "assets/js/studio-editor.js",
      global: "RockyXStudioEditor",
      screen: "Studio",
      autoLoad: true
    },
    // ==========================================
    // SECTION 5: EFFECTS AND EDITING TOOLS
    // ==========================================
    {
      name: "effects",
      src: "assets/js/effects.js",
      global: "RockyXEffects",
      autoLoad: false
    },
    // ==========================================
    // SECTION 6: TEMPLATES AND CREATOR CENTRE
    // ==========================================
    {
      name: "templateEditor",
      src: "assets/js/template-editor.js",
      global: "RockyXTemplateEditor",
      autoLoad: false
    },
    {
      name: "templateCreatorCentre",
      src: "assets/js/template-creator-centre.js",
      global: "RockyXTemplateCreatorCentre",
      autoLoad: false
    },
    // ==========================================
    // SECTION 7: USER AND PROFILE
    // ==========================================
    {
      name: "profileMenu",
      src: "assets/js/profile-menu.js",
      global: "RockyXProfileMenu",
      autoLoad: false
    }
    // ==========================================
    // FUTURE SECTIONS
    // ==========================================
    // Stories and livestreams
    // Authentication and accounts
    // Supabase backend services
    // Notifications and messaging
    // Admin system
  ];
})(window);