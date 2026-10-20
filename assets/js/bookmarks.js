/* =========================================
   ROCKYX BOOKMARKS
   Saved content and collections foundation
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_bookmarks";

  const ALLOWED_TYPES = [
    "video",
    "song",
    "artist",
    "album",
    "playlist",
    "template",
    "product",
    "seller",
    "place",
    "livestream",
    "user"
  ];

  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return "bookmark-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 10);
  }

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return {
          items: [],
          collections: [
            {
              id: "watch-later",
              name: "Watch Later",
              createdAt: new Date().toISOString()
            },
            {
              id: "favorites",
              name: "Favorites",
              createdAt: new Date().toISOString()
            }
          ]
        };
      }

      const data = JSON.parse(saved);

      return {
        items: Array.isArray(data.items) ? data.items : [],
        collections: Array.isArray(data.collections)
          ? data.collections
          : []
      };
    } catch (error) {
      console.error("RockyX bookmarks could not be loaded:", error);

      return {
        items: [],
        collections: []
      };
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      window.dispatchEvent(
        new CustomEvent("rockyx:bookmarks-updated", {
          detail: {
            itemCount: data.items.length,
            collectionCount: data.collections.length
          }
        })
      );

      return true;
    } catch (error) {
      console.error("RockyX bookmarks could not be saved:", error);
      return false;
    }
  }

  function normalizeType(type) {
    if (typeof type !== "string") return null;

    const value = type.trim().toLowerCase();

    return ALLOWED_TYPES.includes(value) ? value : null;
  }

  function normalizeId(id) {
    if (typeof id !== "string" && typeof id !== "number") {
      return null;
    }

    const value = String(id).trim();

    return value ? value : null;
  }

  function findItem(data, type, contentId) {
    return data.items.find(
      item => item.type === type && item.contentId === contentId
    );
  }

  function add(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        error: "Bookmark details are required."
      };
    }

    const type = normalizeType(details.type);
    const contentId = normalizeId(details.contentId);

    if (!type || !contentId) {
      return {
        success: false,
        error: "A supported content type and valid content ID are required."
      };
    }

    const data = loadData();
    const existing = findItem(data, type, contentId);

    if (existing) {
      return {
        success: true,
        alreadySaved: true,
        bookmark: { ...existing }
      };
    }

    const collectionId = details.collectionId
      ? String(details.collectionId)
      : null;

    if (
      collectionId &&
      !data.collections.some(
        collection => collection.id === collectionId
      )
    ) {
      return {
        success: false,
        error: "The selected collection does not exist."
      };
    }

    const bookmark = {
      id: createId(),
      type,
      contentId,
      title: typeof details.title === "string"
        ? details.title.trim().slice(0, 200)
        : "",
      description: typeof details.description === "string"
        ? details.description.trim().slice(0, 1000)
        : "",
      image: typeof details.image === "string"
        ? details.image
        : "",
      collectionId,
      savedAt: new Date().toISOString()
    };

    data.items.unshift(bookmark);

    if (!saveData(data)) {
      return {
        success: false,
        error: "The bookmark could not be saved."
      };
    }

    return {
      success: true,
      alreadySaved: false,
      bookmark: { ...bookmark }
    };
  }

  function remove(type, contentId) {
    const normalizedType = normalizeType(type);
    const normalizedId = normalizeId(contentId);

    if (!normalizedType || !normalizedId) {
      return false;
    }

    const data = loadData();
    const originalLength = data.items.length;

    data.items = data.items.filter(
      item => !(
        item.type === normalizedType &&
        item.contentId === normalizedId
      )
    );

    if (data.items.length === originalLength) {
      return false;
    }

    return saveData(data);
  }

  function isSaved(type, contentId) {
    const normalizedType = normalizeType(type);
    const normalizedId = normalizeId(contentId);

    if (!normalizedType || !normalizedId) {
      return false;
    }

    const data = loadData();

    return Boolean(
      findItem(data, normalizedType, normalizedId)
    );
  }

  function getAll(options) {
    const settings = options || {};
    const data = loadData();

    let items = data.items.slice();

    if (settings.type) {
      const type = normalizeType(settings.type);

      if (!type) return [];

      items = items.filter(item => item.type === type);
    }

    if (settings.collectionId) {
      items = items.filter(
        item => item.collectionId === String(settings.collectionId)
      );
    }

    return items.map(item => ({ ...item }));
  }

  function getById(bookmarkId) {
    const id = normalizeId(bookmarkId);
    if (!id) return null;

    const item = loadData().items.find(
      bookmark => bookmark.id === id
    );

    return item ? { ...item } : null;
  }

  function createCollection(name) {
    if (typeof name !== "string" || !name.trim()) {
      return {
        success: false,
        error: "A collection name is required."
      };
    }

    const cleanName = name.trim().slice(0, 60);
    const data = loadData();

    const duplicate = data.collections.some(
      collection =>
        collection.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (duplicate) {
      return {
        success: false,
        error: "A collection with that name already exists."
      };
    }

    const collection = {
      id: createId(),
      name: cleanName,
      createdAt: new Date().toISOString()
    };

    data.collections.push(collection);

    if (!saveData(data)) {
      return {
        success: false,
        error: "The collection could not be saved."
      };
    }

    return {
      success: true,
      collection: { ...collection }
    };
  }

  function getCollections() {
    return loadData().collections.map(collection => ({
      ...collection
    }));
  }

  function renameCollection(collectionId, newName) {
    const id = normalizeId(collectionId);

    if (!id || typeof newName !== "string" || !newName.trim()) {
      return false;
    }

    const data = loadData();
    const collection = data.collections.find(
      item => item.id === id
    );

    if (!collection) return false;

    const cleanName = newName.trim().slice(0, 60);

    const duplicate = data.collections.some(
      item =>
        item.id !== id &&
        item.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (duplicate) return false;

    collection.name = cleanName;

    return saveData(data);
  }

  function deleteCollection(collectionId) {
    const id = normalizeId(collectionId);

    if (!id) return false;

    const data = loadData();

    const collection = data.collections.find(
      item => item.id === id
    );

    if (!collection) return false;

    // Keep bookmarks but remove their collection assignment.
    data.items = data.items.map(item => {
      if (item.collectionId === id) {
        return {
          ...item,
          collectionId: null
        };
      }

      return item;
    });

    data.collections = data.collections.filter(
      item => item.id !== id
    );

    return saveData(data);
  }

  function moveToCollection(type, contentId, collectionId) {
    const normalizedType = normalizeType(type);
    const normalizedId = normalizeId(contentId);

    if (!normalizedType || !normalizedId) return false;

    const data = loadData();

    const bookmark = findItem(
      data,
      normalizedType,
      normalizedId
    );

    if (!bookmark) return false;

    if (collectionId !== null && collectionId !== undefined) {
      const id = String(collectionId);

      if (
        !data.collections.some(collection => collection.id === id)
      ) {
        return false;
      }

      bookmark.collectionId = id;
    } else {
      bookmark.collectionId = null;
    }

    return saveData(data);
  }

  function clearAll() {
    const data = loadData();

    data.items = [];

    return saveData(data);
  }

  function getCount(type) {
    const items = getAll({ type });

    return items.length;
  }

  window.RockyXBookmarks = {
    add,
    remove,
    isSaved,
    getAll,
    getById,
    createCollection,
    getCollections,
    renameCollection,
    deleteCollection,
    moveToCollection,
    clearAll,
    getCount,
    getSupportedTypes: () => [...ALLOWED_TYPES]
  };

})();