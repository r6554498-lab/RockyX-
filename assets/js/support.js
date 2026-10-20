/* =========================================
   ROCKYX CUSTOMER SUPPORT
   Tickets, replies, priorities, and status
   ========================================= */

(function () {
  "use strict";

  const TICKETS_KEY = "rockyx_support_tickets";
  const MESSAGES_KEY = "rockyx_support_messages";

  const CATEGORIES = [
    "account",
    "security",
    "payments",
    "subscriptions",
    "creator",
    "templates",
    "music",
    "marketplace",
    "advertising",
    "livestream",
    "technical",
    "other"
  ];

  const PRIORITIES = [
    "low",
    "normal",
    "high",
    "urgent"
  ];

  const STATUSES = [
    "open",
    "in_progress",
    "waiting_for_user",
    "waiting_for_support",
    "resolved",
    "closed"
  ];

  function load(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function createId(prefix) {
    return prefix + "_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 9);
  }

  function getCurrentUser() {
    if (window.RockyXUserAccounts) {
      return window.RockyXUserAccounts.getCurrentUser();
    }

    return null;
  }

  function resolveUserId(userId) {
    if (userId) {
      return String(userId);
    }

    const user = getCurrentUser();

    return user && user.id ? String(user.id) : null;
  }

  function createTicket(options) {
    options = options || {};

    const userId = resolveUserId(options.userId);
    const subject = String(options.subject || "").trim();
    const description = String(options.description || "").trim();
    const category = String(options.category || "other");
    const priority = String(options.priority || "normal");

    if (!userId) {
      return {
        success: false,
        message: "A user profile is required."
      };
    }

    if (!subject || subject.length > 150) {
      return {
        success: false,
        message: "Enter a subject of 1–150 characters."
      };
    }

    if (!description || description.length > 5000) {
      return {
        success: false,
        message: "Enter a description of up to 5,000 characters."
      };
    }

    if (!CATEGORIES.includes(category)) {
      return {
        success: false,
        message: "Choose a supported support category."
      };
    }

    if (!PRIORITIES.includes(priority)) {
      return {
        success: false,
        message: "Choose a supported priority."
      };
    }

    const ticket = {
      id: createId("ticket"),
      ticketNumber: "RX-" + Date.now(),
      userId: userId,
      subject: subject,
      description: description,
      category: category,
      priority: priority,
      status: "open",
      assignedTo: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
      closedAt: null
    };

    const tickets = load(TICKETS_KEY);
    tickets.push(ticket);
    save(TICKETS_KEY, tickets);

    // Save the opening message in the ticket conversation.
    const messages = load(MESSAGES_KEY);

    messages.push({
      id: createId("support_message"),
      ticketId: ticket.id,
      senderId: userId,
      senderType: "user",
      message: description,
      createdAt: new Date().toISOString()
    });

    save(MESSAGES_KEY, messages);

    return {
      success: true,
      ticket: ticket,
      message: "Support ticket saved in this browser."
    };
  }

  function getTicket(ticketId, userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return null;
    }

    return load(TICKETS_KEY).find(function (ticket) {
      return (
        ticket.id === ticketId &&
        ticket.userId === userId
      );
    }) || null;
  }

  function getUserTickets(userId, options) {
    userId = resolveUserId(userId);
    options = options || {};

    if (!userId) {
      return [];
    }

    let tickets = load(TICKETS_KEY).filter(function (ticket) {
      return ticket.userId === userId;
    });

    if (options.status) {
      tickets = tickets.filter(function (ticket) {
        return ticket.status === options.status;
      });
    }

    if (options.category) {
      tickets = tickets.filter(function (ticket) {
        return ticket.category === options.category;
      });
    }

    return tickets.sort(function (a, b) {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }

  function getSupportQueue(options) {
    options = options || {};

    let tickets = load(TICKETS_KEY);

    if (options.status) {
      tickets = tickets.filter(function (ticket) {
        return ticket.status === options.status;
      });
    }

    if (options.priority) {
      tickets = tickets.filter(function (ticket) {
        return ticket.priority === options.priority;
      });
    }

    if (options.category) {
      tickets = tickets.filter(function (ticket) {
        return ticket.category === options.category;
      });
    }

    return tickets.sort(function (a, b) {
      const priorityOrder = {
        urgent: 0,
        high: 1,
        normal: 2,
        low: 3
      };

      const priorityDifference =
        priorityOrder[a.priority] - priorityOrder[b.priority];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  }

  function addReply(ticketId, message, options) {
    options = options || {};

    const senderId = resolveUserId(options.senderId);
    const senderType = String(options.senderType || "user");
    message = String(message || "").trim();

    if (!senderId) {
      return {
        success: false,
        message: "A user profile is required."
      };
    }

    if (!message || message.length > 5000) {
      return {
        success: false,
        message: "Reply must contain 1–5,000 characters."
      };
    }

    if (!["user", "support"].includes(senderType)) {
      return {
        success: false,
        message: "Unsupported sender type."
      };
    }

    const tickets = load(TICKETS_KEY);

    const ticket = tickets.find(function (item) {
      return item.id === ticketId;
    });

    if (!ticket) {
      return {
        success: false,
        message: "Ticket not found."
      };
    }

    if (senderType === "user" && ticket.userId !== senderId) {
      return {
        success: false,
        message: "You cannot reply to another user's ticket."
      };
    }

    if (["resolved", "closed"].includes(ticket.status)) {
      return {
        success: false,
        message: "This ticket is closed. Reopen it before replying."
      };
    }

    const messages = load(MESSAGES_KEY);

    const reply = {
      id: createId("support_message"),
      ticketId: ticketId,
      senderId: senderId,
      senderType: senderType,
      message: message,
      createdAt: new Date().toISOString()
    };

    messages.push(reply);
    save(MESSAGES_KEY, messages);

    ticket.status = senderType === "support"
      ? "waiting_for_user"
      : "waiting_for_support";

    ticket.updatedAt = new Date().toISOString();

    save(TICKETS_KEY, tickets);

    return {
      success: true,
      reply: reply
    };
  }

  function getConversation(ticketId, userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return [];
    }

    const ticket = load(TICKETS_KEY).find(function (item) {
      return (
        item.id === ticketId &&
        item.userId === userId
      );
    });

    if (!ticket) {
      return [];
    }

    return load(MESSAGES_KEY)
      .filter(function (message) {
        return message.ticketId === ticketId;
      })
      .sort(function (a, b) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  }

  function updateTicketStatus(ticketId, status, assignedTo) {
    if (!STATUSES.includes(status)) {
      return {
        success: false,
        message: "Invalid ticket status."
      };
    }

    const tickets = load(TICKETS_KEY);

    const ticket = tickets.find(function (item) {
      return item.id === ticketId;
    });

    if (!ticket) {
      return {
        success: false,
        message: "Ticket not found."
      };
    }

    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();

    if (assignedTo !== undefined) {
      ticket.assignedTo = assignedTo
        ? String(assignedTo)
        : null;
    }

    if (status === "resolved") {
      ticket.resolvedAt = new Date().toISOString();
    }

    if (status === "closed") {
      ticket.closedAt = new Date().toISOString();
    }

    save(TICKETS_KEY, tickets);

    return {
      success: true,
      ticket: ticket
    };
  }

  function reopenTicket(ticketId, userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return {
        success: false,
        message: "A user profile is required."
      };
    }

    const tickets = load(TICKETS_KEY);

    const ticket = tickets.find(function (item) {
      return (
        item.id === ticketId &&
        item.userId === userId
      );
    });

    if (!ticket) {
      return {
        success: false,
        message: "Ticket not found."
      };
    }

    if (!["resolved", "closed"].includes(ticket.status)) {
      return {
        success: false,
        message: "This ticket does not need reopening."
      };
    }

    ticket.status = "open";
    ticket.resolvedAt = null;
    ticket.closedAt = null;
    ticket.updatedAt = new Date().toISOString();

    save(TICKETS_KEY, tickets);

    return {
      success: true,
      ticket: ticket
    };
  }

  function getSummary() {
    const tickets = load(TICKETS_KEY);

    const summary = {
      total: tickets.length,
      open: 0,
      in_progress: 0,
      waiting_for_user: 0,
      waiting_for_support: 0,
      resolved: 0,
      closed: 0,
      urgent: 0
    };

    tickets.forEach(function (ticket) {
      if (Object.prototype.hasOwnProperty.call(summary, ticket.status)) {
        summary[ticket.status]++;
      }

      if (
        ticket.priority === "urgent" &&
        !["resolved", "closed"].includes(ticket.status)
      ) {
        summary.urgent++;
      }
    });

    return summary;
  }

  window.RockyXSupport = {
    createTicket: createTicket,
    getTicket: getTicket,
    getUserTickets: getUserTickets,
    getSupportQueue: getSupportQueue,
    addReply: addReply,
    getConversation: getConversation,
    updateTicketStatus: updateTicketStatus,
    reopenTicket: reopenTicket,
    getSummary: getSummary,
    getCategories: function () {
      return CATEGORIES.slice();
    },
    getPriorities: function () {
      return PRIORITIES.slice();
    },
    getStatuses: function () {
      return STATUSES.slice();
    }
  };

})();