/* ==========================================
   ROCKYX MODULE MANIFEST
   Version 1.0
   ========================================== */

(function (window) {
  "use strict";

  window.RockyXModuleManifest = [
    {
      name: "explore",
      src: "assets/js/explore.js",
      global: "RockyXExplore",
      screen: "Explore",
      autoLoad: true
    },
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
    {
      name: "appRouter",
      src: "assets/js/app-router.js",
      global: "RockyXAppRouter",
      autoLoad: true
    },
    {
      name: "studioEditor",
      src: "assets/js/studio-editor.js",
      global: "RockyXStudioEditor",
      screen: "Studio",
      autoLoad: true
    },
    {
      name: "create",
      src: "assets/js/create.js",
      global: "RockyXCreate",
      screen: "Studio",
      autoLoad: false
    },
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
    {
      name: "profileMenu",
      src: "assets/js/profile-menu.js",
      global: "RockyXProfileMenu",
      autoLoad: false
    }
  ];

})(window);