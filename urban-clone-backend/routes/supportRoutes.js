const express = require("express");
const router = express.Router();
const {
  getUserTickets,
  createTicket,
  getTicketMessages,
  getAllTickets,
  resolveTicket,
} = require("../controllers/supportController");
const { protect, admin } = require("../middleware/authMiddleware");

// Customer Routes (Updated)
router.get("/my-tickets", protect, getUserTickets); // <--- NEW
router.post("/create", protect, createTicket); // <--- NEW
router.get("/:ticketId/messages", protect, getTicketMessages);

// Admin Routes (Same)
router.get("/admin/tickets", protect, admin, getAllTickets);
router.put("/admin/:ticketId/resolve", protect, admin, resolveTicket);

module.exports = router;
