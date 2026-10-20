/* =========================================
   ROCKYX REVIEWS & RATINGS
   Local prototype
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_marketplace_reviews";
  const VOTES_KEY = "rockyx_marketplace_review_votes";

  function readReviews() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function saveReviews(reviews) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));

    window.dispatchEvent(
      new CustomEvent("rockyx:reviews-updated", {
        detail: { count: reviews.length }
      })
    );

    return reviews;
  }

  function readVotes() {
    try {
      const data = JSON.parse(
        localStorage.getItem(VOTES_KEY) || "{}"
      );
      return data && typeof data === "object" ? data : {};
    } catch (error) {
      return {};
    }
  }

  function saveVotes(votes) {
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
  }

  function createReview(data) {
    if (!data || typeof data !== "object") {
      return {
        success: false,
        message: "Review information is required."
      };
    }

    const productId = String(data.productId || "").trim();
    const customerId = String(data.customerId || "").trim();
    const rating = Number(data.rating);
    const text = String(data.text || "").trim();

    if (!productId || !customerId) {
      return {
        success: false,
        message: "Product ID and customer ID are required."
      };
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return {
        success: false,
        message: "Choose a rating from 1 to 5 stars."
      };
    }

    if (!text) {
      return {
        success: false,
        message: "Please write a review."
      };
    }

    const reviews = readReviews();

    const existing = reviews.find(review =>
      review.productId === productId &&
      review.customerId === customerId
    );

    if (existing) {
      return {
        success: false,
        message: "This customer already has a review for this product."
      };
    }

    const review = {
      id: "rxr_" + Date.now().toString(36) +
        "_" + Math.random().toString(36).slice(2, 8),

      productId,
      customerId,
      sellerId: String(data.sellerId || ""),
      rating,
      title: String(data.title || "").trim(),
      text,
      images: Array.isArray(data.images)
        ? data.images.slice(0, 5).map(String)
        : [],

      // These are claims only until verified by a backend.
      verifiedPurchase: false,
      status: "pending",
      helpfulCount: 0,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reviews.unshift(review);
    saveReviews(reviews);

    return {
      success: true,
      review,
      message: "Review submitted for moderation."
    };
  }

  function getProductReviews(productId, options) {
    options = options || {};

    let reviews = readReviews().filter(review =>
      review.productId === String(productId)
    );

    if (options.status) {
      reviews = reviews.filter(review =>
        review.status === String(options.status)
      );
    } else {
      reviews = reviews.filter(review =>
        review.status === "approved"
      );
    }

    if (options.sort === "oldest") {
      reviews.sort((a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt)
      );
    } else if (options.sort === "highest") {
      reviews.sort((a, b) => b.rating - a.rating);
    } else if (options.sort === "lowest") {
      reviews.sort((a, b) => a.rating - b.rating);
    } else {
      reviews.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    return reviews;
  }

  function getReview(reviewId) {
    return readReviews().find(review =>
      review.id === String(reviewId)
    ) || null;
  }

  function getProductRatingSummary(productId) {
    const reviews = readReviews().filter(review =>
      review.productId === String(productId) &&
      review.status === "approved"
    );

    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    reviews.forEach(review => {
      distribution[review.rating]++;
    });

    const total = reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    return {
      productId: String(productId),
      reviewCount: reviews.length,
      averageRating: reviews.length
        ? Number((total / reviews.length).toFixed(2))
        : 0,
      distribution
    };
  }

  function voteHelpful(reviewId, customerId) {
    if (!customerId) {
      return {
        success: false,
        message: "A customer ID is required."
      };
    }

    const reviews = readReviews();
    const review = reviews.find(item =>
      item.id === String(reviewId)
    );

    if (!review || review.status !== "approved") {
      return {
        success: false,
        message: "Approved review not found."
      };
    }

    const votes = readVotes();
    const voterKey = String(customerId);
    const reviewKey = String(reviewId);

    if (!votes[voterKey]) {
      votes[voterKey] = [];
    }

    if (votes[voterKey].includes(reviewKey)) {
      return {
        success: false,
        message: "You have already voted on this review."
      };
    }

    votes[voterKey].push(reviewKey);
    review.helpfulCount = (review.helpfulCount || 0) + 1;

    saveVotes(votes);
    saveReviews(reviews);

    return {
      success: true,
      helpfulCount: review.helpfulCount
    };
  }

  function moderateReview(reviewId, decision, note) {
    if (!["approved", "rejected"].includes(decision)) {
      return {
        success: false,
        message: "Choose approved or rejected."
      };
    }

    const reviews = readReviews();
    const review = reviews.find(item =>
      item.id === String(reviewId)
    );

    if (!review) {
      return {
        success: false,
        message: "Review not found."
      };
    }

    review.status = decision;
    review.moderationNote = String(note || "");
    review.updatedAt = new Date().toISOString();

    saveReviews(reviews);

    return {
      success: true,
      review
    };
  }

  function getSellerRatingSummary(sellerId) {
    const reviews = readReviews().filter(review =>
      review.sellerId === String(sellerId) &&
      review.status === "approved"
    );

    const total = reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    return {
      sellerId: String(sellerId),
      reviewCount: reviews.length,
      averageRating: reviews.length
        ? Number((total / reviews.length).toFixed(2))
        : 0
    };
  }

  window.RockyXReviews = {
    createReview,
    getProductReviews,
    getReview,
    getProductRatingSummary,
    voteHelpful,
    moderateReview,
    getSellerRatingSummary
  };

  console.log("RockyX Reviews loaded.");
})();