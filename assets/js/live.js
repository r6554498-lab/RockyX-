/* RockyX Live
   Frontend foundation for livestream rooms.
   Actual broadcasting requires a streaming provider and backend.
*/
(function () {
  "use strict";
  const STORAGE_KEY = "rockyx_live_rooms_v1";
  function loadRooms() {
    try {
      const rooms = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      return Array.isArray(rooms) ? rooms : [];
    } catch (error) {
      return [];
    }
  }
  function saveRooms(rooms) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(rooms)
    );
  }
  function createRoom(creatorId, title, category) {
    if (!creatorId || !title || !String(title).trim()) {
      return {
        success: false,
        message: "A creator ID and live title are required."
      };
    }
    const rooms = loadRooms();
    const room = {
      id: "rxlive-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 8),
      creatorId: String(creatorId),
      title: String(title).trim().slice(0, 120),
      category: String(category || "General"),
      status: "scheduled",
      viewerCount: 0,
      createdAt: new Date().toISOString(),
      endedAt: null
    };
    rooms.unshift(room);
    saveRooms(rooms);
    window.dispatchEvent(
      new CustomEvent("rockyx:live-room-created", {
        detail: room
      })
    );
    return {
      success: true,
      room: room
    };
  }
  function startRoom(roomId) {
    const rooms = loadRooms();
    const room = rooms.find(function (item) {
      return item.id === roomId;
    });
    if (!room) {
      return {
        success: false,
        message: "Live room not found."
      };
    }
    if (room.status !== "scheduled") {
      return {
        success: false,
        message: "This room cannot be started."
      };
    }
    room.status = "live";
    room.startedAt = new Date().toISOString();
    saveRooms(rooms);
    window.dispatchEvent(
      new CustomEvent("rockyx:live-room-started", {
        detail: room
      })
    );
    return {
      success: true,
      room: room
    };
  }
  function endRoom(roomId) {
    const rooms = loadRooms();
    const room = rooms.find(function (item) {
      return item.id === roomId;
    });
    if (!room || room.status !== "live") {
      return {
        success: false,
        message: "An active live room was not found."
      };
    }
    room.status = "ended";
    room.endedAt = new Date().toISOString();
    saveRooms(rooms);
    window.dispatchEvent(
      new CustomEvent("rockyx:live-room-ended", {
        detail: room
      })
    );
    return {
      success: true,
      room: room
    };
  }
  function getRooms(status) {
    const rooms = loadRooms();
    if (!status) {
      return rooms;
    }
    return rooms.filter(function (room) {
      return room.status === status;
    });
  }
  window.RockyXLive = {
    createRoom: createRoom,
    startRoom: startRoom,
    endRoom: endRoom,
    getRooms: getRooms
  };
})();