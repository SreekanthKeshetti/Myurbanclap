const SupportTicket = require("../models/SupportTicket");
const SupportMessage = require("../models/SupportMessage");

// @desc    Get ALL tickets for the logged-in customer
// @route   GET /api/support/my-tickets
// @access  Private
const getUserTickets = async (req, res) => {
  try {
    // Fetch all tickets, newest first
    const tickets = await SupportTicket.find({ user: req.user.id }).sort({
      updatedAt: -1,
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a NEW Support Ticket
// @route   POST /api/support/create
// @access  Private
const createTicket = async (req, res) => {
  try {
    const { subject } = req.body;
    const newTicket = await SupportTicket.create({
      user: req.user.id,
      subject: subject || "General Support Inquiry",
    });
    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all messages for a specific ticket
// @route   GET /api/support/:ticketId/messages
// @access  Private
const getTicketMessages = async (req, res) => {
  try {
    const messages = await SupportMessage.find({ ticket: req.params.ticketId })
      .populate("sender", "name role")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin gets all active tickets
// @route   GET /api/support/admin/tickets
// @access  Private/Admin
const getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ status: { $ne: "resolved" } })
      .populate("user", "name email phone")
      .sort({ lastMessageAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin marks a ticket as resolved
// @route   PUT /api/support/admin/:ticketId/resolve
// @access  Private/Admin
const resolveTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = "resolved";
    await ticket.save();

    res.json({ message: "Ticket Resolved", ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserTickets,
  createTicket,
  getTicketMessages,
  getAllTickets,
  resolveTicket,
};
