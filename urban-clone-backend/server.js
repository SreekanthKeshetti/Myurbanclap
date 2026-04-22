const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const http = require("http"); // Import HTTP
const { Server } = require("socket.io"); // Import Socket.io
const connectDB = require("./config/db");
const Message = require("./models/Message"); // Import Message Model for Chat
const promoRoutes = require("./routes/promoRoutes");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const paymentRoutes = require("./routes/paymentRoutes"); // Import
const uploadRoutes = require("./routes/uploadRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const supportRoutes = require("./routes/supportRoutes");
const initCronJobs = require("./cron/autoReassign");
const payoutRoutes = require("./routes/payoutRoutes");
const configRoutes = require("./routes/configRoutes");

// Load config
connectDB();

const app = express();

// Middleware
// app.use(express.json());
// app.use(cors());
// Market readiness...
// 🌟 NEW: Import the Global Limiter
const { globalLimiter } = require("./middleware/rateLimiter");

// Middleware
app.use(express.json());

// 🛡️ SECURITY: CORS Lockdown (The VIP Guest List)
const allowedOrigins = [
  "http://localhost:5173", // For your local development
  "https://myurbanclap.vercel.app", // REPLACE THIS later when you deploy the frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, postman, or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Blocked by CORS Policy 🛑"));
      }
    },
    credentials: true,
  }),
);

// 🛡️ SECURITY: Apply Global Rate Limiting to ALL /api routes
app.use("/api", globalLimiter);
// Market readiness^.

// --- SOCKET.IO SETUP ---
const server = http.createServer(app); // Wrap Express with HTTP
// const io = new Server(server, {
//   cors: {
//     // origin: "http://localhost:5173", // Allow Frontend to connect
//     origin: "*", // 🌟 Allows Vercel to connect
//     methods: ["GET", "POST", "PUT", "DELETE"],
//   },
// });
// Market readiness...
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // ✅ SAFE! Uses our VIP list
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});
// Market readiness^

// --- MIDDLEWARE TO PASS SOCKET TO CONTROLLERS ---
// This allows us to send notifications from inside bookingController.js
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/promo", promoRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/payouts", payoutRoutes);
app.use("/api/config", configRoutes);

// --- CHAT ROUTE: GET MESSAGES ---
// (Fetching chat history for a specific booking)
app.get("/api/messages/:bookingId", async (req, res) => {
  try {
    const messages = await Message.find({ booking: req.params.bookingId })
      .populate("sender", "name role") // Get sender details
      .sort({ createdAt: 1 }); // Oldest first
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- REAL TIME SOCKET LOGIC ---
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // -----------------------------------------------------
  // 1. PROVIDER-CUSTOMER CHAT (Existing Logic - Do Not Delete)
  // -----------------------------------------------------
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      await Message.create({
        booking: data.bookingId,
        sender: data.senderId,
        text: data.text,
      });
      io.to(data.bookingId).emit("receive_message", data);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("join_booking", (bookingId) => {
    socket.join(bookingId);
  });

  socket.on("send_location", (data) => {
    socket.to(data.bookingId).emit("receive_location", data);
  });

  // -----------------------------------------------------
  // 2. GLOBAL SUPPORT CHAT (NEW ZENDESK-STYLE LOGIC)
  // -----------------------------------------------------

  // A customer or admin joins a specific Support Ticket room
  socket.on("join_support_ticket", (ticketId) => {
    socket.join(`support_${ticketId}`);
    console.log(`User joined Support Ticket: support_${ticketId}`);
  });

  // Handle a new support message
  socket.on("send_support_message", async (data) => {
    // data = { ticketId, senderId, text, isAdmin }
    try {
      const SupportMessage = require("./models/SupportMessage");
      const SupportTicket = require("./models/SupportTicket");

      // Save message to DB
      const newMsg = await SupportMessage.create({
        ticket: data.ticketId,
        sender: data.senderId,
        text: data.text,
        isAdmin: data.isAdmin,
      });

      // Update the Ticket's 'lastMessageAt' so it jumps to the top of the Admin's inbox
      await SupportTicket.findByIdAndUpdate(data.ticketId, {
        status: "in_progress",
        lastMessageAt: Date.now(),
      });

      // Broadcast the message back to the Customer and Admin who are in this room
      io.to(`support_${data.ticketId}`).emit("receive_support_message", newMsg);

      // Optional: You can emit a global alert to all Admins here that a new message arrived
      // io.emit("admin_alert", { message: "New Support Message Received" });
    } catch (error) {
      console.error("Error saving support message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

initCronJobs(io);

const PORT = process.env.PORT || 5000;

// IMPORTANT: Listen using 'server', not 'app'
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
