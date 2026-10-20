/* =========================================
   ROCKYX COMMENTS
   Comments, replies, likes, and reports
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_comments";

  function loadComments() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
      console.error("RockyX Comments: Could not load comments.", error);
      return [];
    }
  }

  function saveComments(comments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  }

  function createId() {
    return "comment_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2, 9);
  }

  function getCurrentUser() {
    if (window.RockyXUserAccounts) {
      return window.RockyXUserAccounts.getCurrentUser();
    }

    return null;
  }

  function addComment(options) {
    options = options || {};

    const user = getCurrentUser();

    const authorId = options.authorId || (user && user.id);
    const authorName =
      options.authorName ||
      (user && (user.username || user.displayName)) ||
      "Guest";

    const text = String(options.text || "").trim();

    if (!options.contentType || !options.contentId) {
      return {
        success: false,
        message: "Content type and content ID are required."
      };
    }

    if (!text) {
      return {
        success: false,
        message: "Comment cannot be empty."
      };
    }

    if (text.length > 2000) {
      return {
        success: false,
        message: "Comments cannot exceed 2,000 characters."
      };
    }

    if (!authorId) {
      return {
        success: false,
        message: "A user profile is required to comment."
      };
    }

    const comments = loadComments();

    // Replies must belong to an existing comment
    if (options.parentId) {
      const parent = comments.find(function (comment) {
        return comment.id === options.parentId;
      });

      if (
        !parent ||
        parent.contentType !== options.contentType ||
        parent.contentId !== options.contentId ||
        parent.parentId
      ) {
        return {
          success: false,
          message: "A valid parent comment is required."
        };
      }
    }

    const comment = {
      id: createId(),
      contentType: String(options.contentType),
      contentId: String(options.contentId),
      parentId: options.parentId || null,
      authorId: String(authorId),
      authorName: String(authorName),
      text: text,
      likes: [],
      reports: [],
      status: "visible",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    comments.push(comment);
    saveComments(comments);

    return {
      success: true,
      comment: comment
    };
  }

  function getComments(contentType, contentId, options) {
    options = options || {};

    return loadComments()
      .filter(function (comment) {
        return (
          comment.contentType === String(contentType) &&
          comment.contentId === String(contentId) &&
          comment.parentId === null &&
          comment.status === "visible"
        );
      })
      .sort(function (a, b) {
        if (options.sort === "oldest") {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }

        if (options.sort === "popular") {
          return b.likes.length - a.likes.length;
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }

  function getReplies(parentId) {
    return loadComments()
      .filter(function (comment) {
        return (
          comment.parentId === parentId &&
          comment.status === "visible"
        );
      })
      .sort(function (a, b) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  }

  function toggleLike(commentId, userId) {
    const user = getCurrentUser();
    userId = userId || (user && user.id);

    if (!userId) {
      return {
        success: false,
        message: "A user profile is required to like comments."
      };
    }

    const comments = loadComments();

    const comment = comments.find(function (item) {
      return item.id === commentId;
    });

    if (!comment || comment.status !== "visible") {
      return {
        success: false,
        message: "Comment not found."
      };
    }

    const index = comment.likes.indexOf(String(userId));

    if (index === -1) {
      comment.likes.push(String(userId));
    } else {
      comment.likes.splice(index, 1);
    }

    comment.updatedAt = new Date().toISOString();
    saveComments(comments);

    return {
      success: true,
      liked: index === -1,
      likeCount: comment.likes.length
    };
  }

  function reportComment(commentId, reason, userId) {
    const user = getCurrentUser();
    userId = userId || (user && user.id);

    if (!userId) {
      return {
        success: false,
        message: "A user profile is required to report a comment."
      };
    }

    const allowedReasons = [
      "spam",
      "harassment",
      "hate",
      "misinformation",
      "inappropriate",
      "other"
    ];

    if (allowedReasons.indexOf(reason) === -1) {
      return {
        success: false,
        message: "Please select a valid report reason."
      };
    }

    const comments = loadComments();

    const comment = comments.find(function (item) {
      return item.id === commentId;
    });

    if (!comment || comment.status !== "visible") {
      return {
        success: false,
        message: "Comment not found."
      };
    }

    if (comment.authorId === String(userId)) {
      return {
        success: false,
        message: "You cannot report your own comment."
      };
    }

    const alreadyReported = comment.reports.some(function (report) {
      return report.userId === String(userId);
    });

    if (alreadyReported) {
      return {
        success: false,
        message: "You have already reported this comment."
      };
    }

    comment.reports.push({
      userId: String(userId),
      reason: reason,
      createdAt: new Date().toISOString()
    });

    saveComments(comments);

    return {
      success: true,
      message: "Report saved for the prototype."
    };
  }

  function editComment(commentId, newText, userId) {
    const user = getCurrentUser();
    userId = userId || (user && user.id);

    const text = String(newText || "").trim();

    if (!userId || !text || text.length > 2000) {
      return {
        success: false,
        message: "A valid user and comment text are required."
      };
    }

    const comments = loadComments();

    const comment = comments.find(function (item) {
      return item.id === commentId;
    });

    if (
      !comment ||
      comment.authorId !== String(userId) ||
      comment.status !== "visible"
    ) {
      return {
        success: false,
        message: "You cannot edit this comment."
      };
    }

    comment.text = text;
    comment.updatedAt = new Date().toISOString();

    saveComments(comments);

    return {
      success: true,
      comment: comment
    };
  }

  function deleteComment(commentId, userId) {
    const user = getCurrentUser();
    userId = userId || (user && user.id);

    if (!userId) {
      return {
        success: false,
        message: "A user profile is required."
      };
    }

    const comments = loadComments();

    const comment = comments.find(function (item) {
      return item.id === commentId;
    });

    if (!comment || comment.authorId !== String(userId)) {
      return {
        success: false,
        message: "You can only delete your own comments."
      };
    }

    // Remove the comment and its replies
    const idsToDelete = [commentId];

    comments.forEach(function (item) {
      if (item.parentId === commentId) {
        idsToDelete.push(item.id);
      }
    });

    saveComments(
      comments.filter(function (item) {
        return idsToDelete.indexOf(item.id) === -1;
      })
    );

    return {
      success: true,
      message: "Comment deleted."
    };
  }

  function getCount(contentType, contentId) {
    return loadComments().filter(function (comment) {
      return (
        comment.contentType === String(contentType) &&
        comment.contentId === String(contentId) &&
        comment.status === "visible"
      );
    }).length;
  }

  // Public RockyX Comments API
  window.RockyXComments = {
    addComment: addComment,
    getComments: getComments,
    getReplies: getReplies,
    toggleLike: toggleLike,
    reportComment: reportComment,
    editComment: editComment,
    deleteComment: deleteComment,
    getCount: getCount
  };

})();