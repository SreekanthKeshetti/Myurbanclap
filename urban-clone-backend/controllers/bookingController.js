const Booking = require("../models/Booking");
const User = require("../models/User");
const Transaction = require("../models/Transaction"); // Import Transaction Model
const Service = require("../models/Service");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");
// --- NEW: HELPER FUNCTION FOR NOTIFICATIONS ---
const sendNotification = async (req, userId, title, message, bookingId) => {
  try {
    // 1. Save to Database (Persistence)
    const notif = await Notification.create({
      user: userId,
      title,
      message,
    });

    // 2. Emit via Socket (Real-time) - We send the whole DB document so frontend gets the ID
    if (req.io) {
      req.io.to(userId.toString()).emit("booking_update", notif);
    }
  } catch (error) {
    console.error("Notification Error:", error);
  }
};

// Above is csr code below is ssr:
// @desc    Create new single booking
// @route   POST /api/bookings
// @access  Private (Must be logged in)
const createBooking = async (req, res) => {
  try {
    const {
      serviceId,
      date,
      timeSlot,
      address,
      paymentMethod,
      location,
      quantity,
    } = req.body;

    // const paymentStatus = paymentMethod === "cash" ? "pending" : "paid";
    // 🌟 SPRINT 9 V3 FIX: All orders start as 'pending' until Razorpay verifies them
    const paymentStatus = "pending";

    // 🔒 SECURITY FIX: Fetch price directly from DB
    const Service = require("../models/Service");
    const dbService = await Service.findById(serviceId);
    if (!dbService) {
      return res.status(404).json({ message: "Service not found" });
    }

    const finalQuantity = quantity || 1;
    const secureTotalPrice = dbService.price * finalQuantity;

    // 🌟 NEW: SUBSCRIPTION LOGIC 🌟
    const isSub = dbService.bookingType === "subscription";
    let subDetails = undefined;

    if (isSub) {
      const startDateObj = new Date(date);
      const endDateObj = new Date(date);
      endDateObj.setDate(startDateObj.getDate() + 30); // 30 days for MVP

      subDetails = {
        startDate: date,
        endDate: endDateObj.toISOString().split("T")[0],
        totalDeliveries: 30,
        deliveriesCompleted: 0,
      };
    }

    const bookingData = {
      user: req.user.id,
      service: serviceId,
      quantity: finalQuantity,
      totalPrice: secureTotalPrice,
      date,
      timeSlot: timeSlot || "10:00 AM",
      address,
      paymentMethod: paymentMethod || "cash",
      paymentStatus,
      status: "pending",

      // Append Subscription Data
      bookingType: dbService.bookingType || "one-time",
      ...(isSub && { subscriptionDetails: subDetails }),
    };

    if (location && location.coordinates && location.coordinates.length === 2) {
      bookingData.location = location;
    }

    const booking = await Booking.create(bookingData);
    res.status(201).json(booking);
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(400).json({ message: error.message });
  }
};
// @desc    Create multiple bookings from Cart
// @route   POST /api/bookings/bulk
// @access  Private
const createBulkBooking = async (req, res) => {
  try {
    const { cartItems, date, timeSlot, address, paymentMethod, location } =
      req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "No items in cart" });
    }

    // const paymentStatus = paymentMethod === "cash" ? "pending" : "paid";
    // 🌟 SPRINT 9 V3 FIX: All orders start as 'pending' until Razorpay verifies them
    const paymentStatus = "pending";
    const Service = require("../models/Service");

    const createdBookings = await Promise.all(
      cartItems.map(async (item) => {
        // Fetch fresh service from DB for security & to check bookingType
        const dbService = await Service.findById(item._id);
        if (!dbService) throw new Error(`Service ${item.name} not found`);

        const qty = item.qty || 1;
        const secureItemTotalPrice = dbService.price * qty;

        // 🌟 NEW: SUBSCRIPTION LOGIC 🌟
        const isSub = dbService.bookingType === "subscription";
        let subDetails = undefined;

        if (isSub) {
          // Calculate End Date (assuming 30 days for MVP)
          const startDateObj = new Date(date);
          const endDateObj = new Date(date);
          endDateObj.setDate(startDateObj.getDate() + 30);

          subDetails = {
            startDate: date,
            endDate: endDateObj.toISOString().split("T")[0],
            totalDeliveries: 30,
            deliveriesCompleted: 0,
          };
        }

        const bookingData = {
          user: req.user.id,
          service: item._id,
          quantity: qty,
          totalPrice: secureItemTotalPrice,
          date,
          timeSlot: timeSlot || "10:00 AM",
          address,
          paymentMethod: paymentMethod || "cash",
          paymentStatus,
          status: "pending",

          // Append Subscription Data
          bookingType: dbService.bookingType || "one-time",
          ...(isSub && { subscriptionDetails: subDetails }),
        };

        if (
          location &&
          location.coordinates &&
          location.coordinates.length === 2
        ) {
          bookingData.location = location;
        }

        return await Booking.create(bookingData);
      }),
    );

    res.status(201).json(createdBookings);
  } catch (error) {
    console.error("Bulk Booking Error:", error);
    res.status(400).json({ message: error.message });
  }
};
// @desc    Get logged in user's bookings
// @route   GET /api/bookings/mybookings
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("service")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ALL bookings (Admin only)
// @route   GET /api/bookings/admin/all
// @access  Private/Admin
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("user", "id name email")
      .populate("service")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status (Admin)
// @route   PUT /api/bookings/:id
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate("user");

    if (booking) {
      booking.status = status;
      const updatedBooking = await booking.save();

      if (req.io) {
        req.io.to(booking.user._id.toString()).emit("booking_update", {
          message: `Your booking status is now: ${status.toUpperCase()}`,
          bookingId: booking._id,
        });
      }

      res.json(updatedBooking);
    } else {
      res.status(404).json({ message: "Booking not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending jobs MATCHING Provider's Category AND Location
// @route   GET /api/bookings/provider/available
// @access  Private/Provider
const getAvailableJobs = async (req, res) => {
  try {
    const currentProvider = await User.findById(req.user.id);

    // 🔐 STEP 1: Block if provider not verified
    if (!currentProvider?.providerDetails?.isVerified) {
      return res.json({
        blocked: true,
        message: "Account not verified. Please upload documents.",
      });
    }

    // --- 🌟 NEW STEP 1.5: Block if provider is Offline (Duty Toggle) ---
    if (
      currentProvider.providerDetails &&
      currentProvider.providerDetails.isAvailable === false
    ) {
      return res.json({
        isOffline: true,
        message: "You are currently offline. Go online to receive jobs.",
      });
    }
    // --------------------------------------------------------------------

    // 🔍 STEP 2: Check Provider Category
    if (
      !currentProvider.providerDetails ||
      !currentProvider.providerDetails.subCategory
    ) {
      return res.json([]);
    }

    const mySubCategoryId =
      currentProvider.providerDetails.subCategory.toString();

    // 🌍 STEP 3: Setup Geo-Fencing Query
    let query = { status: "pending" };
    // --- 🌟 SPRINT 9 V3: Ghost Booking Filter ---
    // Prevent unpaid online orders (abandoned carts) from showing to Providers
    query.$or = [{ paymentMethod: "cash" }, { paymentStatus: "paid" }];
    // --------------------------------------------

    if (
      currentProvider.geoLocation &&
      currentProvider.geoLocation.coordinates &&
      currentProvider.geoLocation.coordinates.length === 2
    ) {
      query.location = {
        $near: {
          $geometry: currentProvider.geoLocation,
          $maxDistance: 20000, // 20 KM
        },
      };
    }

    // 🔍 STEP 4: Fetch Bookings
    const bookings = await Booking.find(query)
      .populate("user", "name address")
      .populate("service", "name category subCategory price");

    // 🔍 STEP 5: Filter by Category
    const filteredBookings = bookings.filter((booking) => {
      if (!booking.service || !booking.service.subCategory) return false;
      return booking.service.subCategory.toString() === mySubCategoryId;
    });

    res.json(filteredBookings);
  } catch (error) {
    console.error("Backend Error in getAvailableJobs:", error);
    res.status(500).json({ message: "Server Error fetching jobs" });
  }
};
// @desc    Get jobs accepted by this specific provider
// @route   GET /api/bookings/provider/myjobs
const getProviderHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({ provider: req.user.id })
      .populate("user", "name phone address")
      .populate("service")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Provider accepts a job
// @route   PUT /api/bookings/:id/accept
// @access  Private/Provider
const acceptJob = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("user");

    if (booking) {
      if (booking.status !== "pending") {
        return res
          .status(400)
          .json({ message: "Job already taken or cancelled" });
      }

      booking.status = "accepted";
      booking.provider = req.user.id;

      const updatedBooking = await booking.save();

      if (req.io) {
        req.io.to(booking.user._id.toString()).emit("booking_update", {
          message: `A Provider has accepted your booking!`,
          bookingId: booking._id,
        });
      }

      res.json(updatedBooking);
    } else {
      res.status(404).json({ message: "Booking not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Provider updates job status (The "Uber" Flow)
// @route   PUT /api/bookings/:id/status
// @access  Private/Provider
const updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.provider.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const validStatuses = ["ontheway", "arrived", "inprogress", "completed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    // Generate OTP when Arrived
    if (status === "arrived") {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      booking.startJobOtp = otp;
    }

    booking.status = status;
    const updatedBooking = await booking.save();

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP to Start Job
// @route   POST /api/bookings/:id/verify-start-otp
// @access  Private/Provider
const verifyStartOtp = async (req, res) => {
  try {
    const { otp, selfieUrl } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.startJobOtp !== otp) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Ask customer for the correct code." });
    }
    // 🔒 Security Check: Ensure they provided a selfie
    if (!selfieUrl) {
      return res.status(400).json({
        message: "Live selfie verification is required to start the job.",
      });
    }

    // --- NEW LOGIC: GENERATE END OTP ---
    const endOtp = Math.floor(1000 + Math.random() * 9000).toString();

    booking.status = "inprogress";
    booking.startJobOtp = undefined;
    booking.endJobOtp = endOtp;
    booking.startJobSelfie = selfieUrl; // <--- 🌟 NEW: Save to DB
    await booking.save();
    if (req.io && booking.user) {
      req.io.to(booking.user._id.toString()).emit("booking_update", {
        // message: `Job Started! 🛠️ Completion Code: ${endOtp}`,
        message: `Your professional has verified their identity and started the job. Completion Code: ${endOtp}`,
        bookingId: booking._id,
      });
    }

    res.json({ message: "OTP Verified! Job Started.", success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Provider marks job as completed AND Calculates Money
// @route   PUT /api/bookings/:id/complete
// @access  Private/Provider
const completeJob = async (req, res) => {
  try {
    const { otp } = req.body;

    // 1. Populate BOTH User (Notifications) and Service (Price)
    const booking = await Booking.findById(req.params.id)
      .populate("user")
      .populate("service");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.provider.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized to manage this job" });
    }

    // --- ROBUST OTP CHECK ---
    // We convert both to strings and remove any accidental spaces
    const dbOtp = String(booking.endJobOtp).trim();
    const userOtp = String(otp).trim();

    if (dbOtp !== userOtp) {
      return res
        .status(400)
        .json({ message: "Invalid Completion OTP. Please ask the customer." });
    }
    // ------------------------

    // Update Status
    booking.status = "completed";
    booking.endJobOtp = undefined;

    // --- FINANCIAL LOGIC START ---
    const provider = await User.findById(req.user.id);
    // const price = booking.totalPrice || booking.service.price;
    const price = booking.totalPrice || booking.service?.price || 0;
    const commissionRate = 0.2; // 20%
    const adminShare = price * commissionRate;
    const providerShare = price - adminShare;

    let transactionAmount = 0;
    let type = "";
    let description = "";

    if (booking.paymentMethod === "cash") {
      transactionAmount = -adminShare;
      type = "debit";
      description = `Commission deduction for Cash Order #${booking._id.toString().slice(-4)}`;
      booking.paymentStatus = "paid";
    } else {
      transactionAmount = providerShare;
      type = "credit";
      description = `Earnings from Online Order #${booking._id.toString().slice(-4)}`;
    }

    // Update Provider Wallet
    provider.walletBalance = (provider.walletBalance || 0) + transactionAmount;
    await provider.save();

    // Create Transaction Record for Provider
    await Transaction.create({
      user: provider._id,
      booking: booking._id,
      amount: transactionAmount,
      type,
      description,
    });

    // UPDATE ADMIN WALLET
    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser) {
      adminUser.walletBalance = (adminUser.walletBalance || 0) + adminShare;
      await adminUser.save();

      await Transaction.create({
        user: adminUser._id,
        booking: booking._id,
        amount: adminShare,
        type: "credit",
        description: `20% Commission from Booking #${booking._id.toString().slice(-4)}`,
      });
    }
    // --- FINANCIAL LOGIC END ---

    const updatedBooking = await booking.save();

    // --- REAL TIME NOTIFICATION ---
    if (req.io) {
      req.io.to(booking.user._id.toString()).emit("booking_update", {
        message: `Service Completed! Please check your email for the invoice.`,
        bookingId: booking._id,
      });
    }

    // ==========================================
    // --- NEW LOGIC: SEND AUTOMATED HTML INVOICE ---
    // ==========================================

    // Make sure the user has an email. (OTP users might have dummy emails, but let's try to send anyway)
    if (booking.user && booking.user.email) {
      // Calculate Math for Invoice
      const itemTotal = booking.totalPrice;
      const platformFee = 49;
      // In a real app, you would save taxes during checkout. For now, we simulate the display.
      const taxes = (itemTotal * 0.18).toFixed(2);
      const grandTotal = (itemTotal + platformFee).toFixed(2); // Simplified total for invoice display

      // Build the HTML Template
      const invoiceHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #6366f1;">
            <h1 style="color: #0f172a; margin: 0;">Urban<span style="color: #6366f1;">Clone</span></h1>
            <p style="color: #64748b; margin-top: 5px;">Payment Receipt</p>
          </div>
          
          <div style="padding: 20px 0;">
            <p>Hi <strong>${booking.user.name}</strong>,</p>
            <p>Thank you for using Urban Clone! Your service has been successfully completed. Here is your final receipt.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Order ID:</strong> #${booking._id.toString().toUpperCase().slice(-8)}</p>
              <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${booking.date} @ ${booking.timeSlot}</p>
              <p><strong>Service:</strong> ${booking.service?.name || "Deleted Service"} (Qty: ${booking.quantity || 1})</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px dashed #ccc; color: #64748b;">Item Total</td>
                <td style="padding: 10px 0; border-bottom: 1px dashed #ccc; text-align: right; font-weight: bold;">₹${itemTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px dashed #ccc; color: #64748b;">Taxes (18% GST)</td>
                <td style="padding: 10px 0; border-bottom: 1px dashed #ccc; text-align: right; font-weight: bold;">₹${taxes}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #64748b;">Platform Fee</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; text-align: right; font-weight: bold;">₹${platformFee.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 15px 0; font-size: 18px; font-weight: bold; color: #0f172a;">Grand Total Paid</td>
                <td style="padding: 15px 0; font-size: 18px; font-weight: bold; text-align: right; color: #6366f1;">₹${grandTotal}</td>
              </tr>
            </table>

            <p style="color: #64748b; font-size: 12px; text-align: center;">
              Paid via: <strong>${booking.paymentMethod.toUpperCase()}</strong>
            </p>
            
            // <div style="text-align: center; margin-top: 30px;">
            //   <a href="http://localhost:5173/bookings" style="background-color: #0f172a; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Rate Your Professional</a>
            // </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://myurbanclap.vercel.app/bookings" style="background-color: #0f172a; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Rate Your Professional</a>
            </div>
            <!-- 🌟 LEGAL COMPLIANCE FOOTER (NEW) -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.5;">
              <p style="margin: 0; font-weight: bold; color: #64748b;">UrbanClone Technologies Pvt. Ltd.</p>
              <p style="margin: 0;">123 Service Street, HITEC City, Hyderabad, Telangana 500081</p>
              <p style="margin: 0;"><strong>GSTIN:</strong> 36AABCU1234D1Z5</p>
              <p style="margin: 5px 0 0 0;">This is a computer-generated invoice and does not require a physical signature.</p>
            </div>
          </div>
        </div>
      `;

      // Call our utility function
      await sendEmail({
        email: booking.user.email,
        subject: `Urban Clone Invoice: ${booking.service.name}`,
        html: invoiceHTML,
      });
    }
    // ==========================================

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Provider Wallet & Transactions
// @route   GET /api/bookings/provider/wallet
const getProviderWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const transactions = await Transaction.find({ user: req.user.id }).sort({
      date: -1,
    });

    res.json({
      balance: user.walletBalance,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Check Slot Availability (Prevent Double Booking)
// @route   POST /api/bookings/check-availability
// @access  Public
const checkAvailability = async (req, res) => {
  try {
    const { date, serviceId } = req.body;

    // 1. Get Service Category (e.g., "Plumbing")
    const Service = require("../models/Service");
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const subCategory = service.subCategory; // 🌟 FIXED: Use SubCategory!
    // 2. Count Total Providers for this SubCategory
    // (How many people can possibly do this job?)
    const totalProviders = await User.countDocuments({
      role: "provider",
      "providerDetails.subCategory": subCategory,
      // 🌟 FIXED: Count by SubCategory
      "providerDetails.isAvailable": true,
    });

    if (totalProviders === 0) {
      return res.json({
        fullSlots: [],
        message: "No providers available at all for this category",
      });
    }

    // 3. Find Bookings for this Date & Category
    // We look for active bookings (not cancelled)
    const bookings = await Booking.find({
      date: date,
      status: { $ne: "cancelled" }, // Ignore cancelled jobs
    }).populate("service");

    // Filter for matching category only
    const categoryBookings = bookings.filter(
      (b) => b.service.subCategory.toString() === subCategory.toString(), // 🌟 FIXED
    );

    // 4. Calculate Frequency Map
    // e.g., { "10:00 AM": 2, "11:00 AM": 1 }
    const slotCounts = {};
    categoryBookings.forEach((b) => {
      const slot = b.timeSlot;
      slotCounts[slot] = (slotCounts[slot] || 0) + 1;
    });

    // 5. Determine Full Slots
    // If Bookings >= Total Providers, the slot is FULL
    const fullSlots = [];
    for (const [slot, count] of Object.entries(slotCounts)) {
      if (count >= totalProviders) {
        fullSlots.push(slot);
      }
    }

    res.json({
      totalProviders,
      fullSlots,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Cancel a booking (Customer, Provider, Admin)
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    // Populate user, provider, and service to access their data easily
    const booking = await Booking.findById(req.params.id).populate(
      "user provider service",
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const currentUser = req.user;

    // ==========================================
    // 1. CUSTOMER CANCELLATION LOGIC
    // ==========================================
    if (currentUser.role === "customer") {
      if (booking.user._id.toString() !== currentUser.id) {
        return res.status(401).json({ message: "Not authorized" });
      }

      if (!["pending", "accepted"].includes(booking.status)) {
        return res
          .status(400)
          .json({ message: "Job is already in progress. Cannot cancel." });
      }

      // Time Penalty Logic (2 Hours Rule)
      // let refundAmount = booking.totalPrice || booking.service.price;
      let refundAmount = booking.totalPrice || booking.service?.price || 0;
      let cancellationFee = 0;

      try {
        // Parse "10:00 AM" and "2023-10-25" into a real Date object
        const [time, modifier] = booking.timeSlot.split(" ");
        let [hours, minutes] = time.split(":");
        hours = parseInt(hours, 10);
        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;

        const jobDate = new Date(
          `${booking.date}T${hours.toString().padStart(2, "0")}:${minutes}:00`,
        );
        const hoursUntilJob = (jobDate - new Date()) / (1000 * 60 * 60);

        // If less than 2 hours left, apply a flat ₹100 fee
        if (hoursUntilJob < 2 && hoursUntilJob > 0) {
          cancellationFee = 100;
          refundAmount -= cancellationFee;
        }
      } catch (err) {
        console.log("Time parsing skipped for penalty.");
      }

      // Process Online Refund to Customer Wallet
      if (
        booking.paymentStatus === "paid" &&
        booking.paymentMethod !== "cash"
      ) {
        const customer = await User.findById(currentUser.id);
        customer.walletBalance =
          (customer.walletBalance || 0) + Math.max(0, refundAmount);
        await customer.save();

        await Transaction.create({
          user: customer._id,
          booking: booking._id,
          amount: Math.max(0, refundAmount),
          type: "credit",
          description:
            cancellationFee > 0
              ? `Refund (minus ₹${cancellationFee} fee) for Cancelled Order #${booking._id.toString().slice(-4)}`
              : `Full Refund for Cancelled Order #${booking._id.toString().slice(-4)}`,
        });

        // Credit Admin Wallet with the Cancellation Fee
        if (cancellationFee > 0) {
          const admin = await User.findOne({ role: "admin" });
          if (admin) {
            admin.walletBalance = (admin.walletBalance || 0) + cancellationFee;
            await admin.save();
            await Transaction.create({
              user: admin._id,
              booking: booking._id,
              amount: cancellationFee,
              type: "credit",
              description: `Customer Cancellation Fee from Order #${booking._id.toString().slice(-4)}`,
            });
          }
        }
      }

      booking.status = "cancelled";
      const updatedBooking = await booking.save();

      // Notify Provider instantly via Socket.io
      if (booking.provider && req.io) {
        req.io.to(booking.provider._id.toString()).emit("booking_update", {
          message: `Job Cancelled! Customer cancelled order #${booking._id.toString().slice(-4)}.`,
          bookingId: booking._id,
        });
      }

      return res.json({
        message: "Booking cancelled successfully",
        booking: updatedBooking,
      });
    }

    // ==========================================
    // 2. PROVIDER CANCELLATION (DROP JOB)
    // ==========================================
    else if (currentUser.role === "provider") {
      if (booking.provider?._id.toString() !== currentUser.id) {
        return res.status(401).json({ message: "Not authorized" });
      }

      if (booking.status !== "accepted") {
        return res.status(400).json({
          message: "You can only drop jobs that are accepted but not started.",
        });
      }

      // Deduct ₹50 Penalty from Provider Wallet to discourage dropping jobs
      const penalty = 50;
      const provider = await User.findById(currentUser.id);
      provider.walletBalance = (provider.walletBalance || 0) - penalty;
      await provider.save();

      await Transaction.create({
        user: provider._id,
        booking: booking._id,
        amount: -penalty,
        type: "debit",
        description: `Penalty for dropping Job #${booking._id.toString().slice(-4)}`,
      });

      // Send penalty money to Admin Wallet
      const admin = await User.findOne({ role: "admin" });
      if (admin) {
        admin.walletBalance = (admin.walletBalance || 0) + penalty;
        await admin.save();
        await Transaction.create({
          user: admin._id,
          booking: booking._id,
          amount: penalty,
          type: "credit",
          description: `Provider Drop Penalty from Job #${booking._id.toString().slice(-4)}`,
        });
      }

      // Return Booking to the "Pending" Pool so others can accept it
      booking.status = "pending";
      booking.provider = undefined; // Remove provider link
      const updatedBooking = await booking.save();

      // Notify Customer instantly via Socket.io
      if (req.io) {
        req.io.to(booking.user._id.toString()).emit("booking_update", {
          message: `Provider was reassigned. Searching for a new professional nearby!`,
          bookingId: booking._id,
        });
      }

      return res.json({
        message: `Job dropped. ₹${penalty} penalty applied.`,
        booking: updatedBooking,
      });
    }

    // ==========================================
    // 3. ADMIN CANCELLATION (Force Cancel)
    // ==========================================
    else if (currentUser.role === "admin") {
      booking.status = "cancelled";

      // Admin forces a full refund if paid online
      if (
        booking.paymentStatus === "paid" &&
        booking.paymentMethod !== "cash"
      ) {
        const customer = await User.findById(booking.user._id);
        const refundAmount = booking.totalPrice || booking.service.price;

        customer.walletBalance = (customer.walletBalance || 0) + refundAmount;
        await customer.save();

        await Transaction.create({
          user: customer._id,
          booking: booking._id,
          amount: refundAmount,
          type: "credit",
          description: `Admin Refund for Cancelled Order #${booking._id.toString().slice(-4)}`,
        });
      }

      const updatedBooking = await booking.save();

      // Notify both parties
      if (req.io) {
        req.io.to(booking.user._id.toString()).emit("booking_update", {
          message: `Your booking #${booking._id.toString().slice(-4)} was cancelled by Admin.`,
        });
        if (booking.provider) {
          req.io.to(booking.provider._id.toString()).emit("booking_update", {
            message: `Booking #${booking._id.toString().slice(-4)} was cancelled by Admin.`,
          });
        }
      }

      return res.json({
        message: "Admin forced cancellation",
        booking: updatedBooking,
      });
    }

    return res.status(403).json({ message: "Invalid role for cancellation" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get Analytics Data for Admin Dashboard (Aggregation Pipeline)
// @route   GET /api/bookings/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    // 1. REVENUE BY DATE (Area Chart)
    const revenueData = await Booking.aggregate([
      // Stage 1: Filter only completed jobs
      { $match: { status: "completed" } },

      // Stage 2: We need the Service price just in case 'totalPrice' is missing on older bookings
      {
        $lookup: {
          from: "services", // The name of the collection in MongoDB (lowercase, plural)
          localField: "service",
          foreignField: "_id",
          as: "serviceDoc",
        },
      },
      // Stage 3: $lookup returns an array, $unwind turns it back into an object
      { $unwind: "$serviceDoc" },

      // Stage 4: Group by the Date string, and Sum the money
      {
        $group: {
          _id: "$date",
          // If totalPrice exists, use it. Otherwise, fallback to the base service price.
          revenue: { $sum: { $ifNull: ["$totalPrice", "$serviceDoc.price"] } },
        },
      },
      // Stage 5: Sort by Date Ascending (Oldest to Newest)
      { $sort: { _id: 1 } },
      // Stage 6: Keep only the last 7 active days
      { $limit: 7 },
    ]);

    // Format the data for Recharts (Rename _id to date)
    const formattedRevenue = revenueData.map((item) => ({
      date: item._id,
      revenue: item.revenue,
    }));

    // 2. BOOKINGS BY CATEGORY (Pie Chart)
    // 2. BOOKINGS BY CATEGORY (Pie Chart)
    const categoryData = await Booking.aggregate([
      // Stage 1: Get Service Details
      {
        $lookup: {
          from: "services",
          localField: "service",
          foreignField: "_id",
          as: "serviceDoc",
        },
      },
      { $unwind: "$serviceDoc" },

      // 🌟 NEW: Stage 1.5 - Lookup the actual Category document using the category ID from the Service
      {
        $lookup: {
          from: "categories", // MongoDB collection names are lowercase and plural
          localField: "serviceDoc.category",
          foreignField: "_id",
          as: "categoryDoc",
        },
      },
      { $unwind: "$categoryDoc" },

      // Stage 2: Group by the ACTUAL Category Name, not the ID!
      {
        $group: {
          _id: "$categoryDoc.name", // 🌟 FIXED
          count: { $sum: 1 },
        },
      },
    ]);

    // Format for Recharts PieChart (name, value)
    const formattedCategory = categoryData.map((item) => ({
      name: item._id,
      value: item.count,
    }));

    // Send both datasets to the frontend
    res.json({
      revenueByDate: formattedRevenue,
      bookingsByCategory: formattedCategory,
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: error.message });
  }
};
// @desc    Reschedule a booking
// @route   PUT /api/bookings/:id/reschedule
// @access  Private (Customer)
const rescheduleBooking = async (req, res) => {
  try {
    const { date, timeSlot } = req.body;
    const booking = await Booking.findById(req.params.id).populate(
      "service provider user",
    );

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // 1. Security Check: Ensure user owns booking
    if (booking.user._id.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized to reschedule this booking." });
    }

    // 2. Ensure booking is in a state that CAN be rescheduled
    if (!["pending", "accepted"].includes(booking.status)) {
      return res
        .status(400)
        .json({ message: "Cannot reschedule an active or completed job." });
    }

    // 3. Check Slot Availability (Re-using our slot logic)
    const User = require("../models/User");
    const totalProviders = await User.countDocuments({
      role: "provider",
      "providerDetails.category": booking.service.category,
      "providerDetails.isAvailable": true,
    });

    const existingBookings = await Booking.find({
      date,
      timeSlot,
      status: { $ne: "cancelled" },
    }).populate("service");

    const categoryBookings = existingBookings.filter(
      (b) => b.service.category === booking.service.category,
    );

    if (categoryBookings.length >= totalProviders && totalProviders > 0) {
      return res.status(400).json({
        message: "This time slot is fully booked. Please choose another.",
      });
    }

    // 4. Execute Reschedule
    booking.date = date;
    booking.timeSlot = timeSlot;

    // 5. If a provider was already assigned, return it to the pending pool safely
    let providerToNotify = null;
    if (booking.status === "accepted") {
      providerToNotify = booking.provider;
      booking.status = "pending";
      booking.provider = undefined; // Drop provider without penalty
    }

    const updatedBooking = await booking.save();

    // 6. Real-time Notifications
    if (req.io) {
      req.io.to(booking.user._id.toString()).emit("booking_update", {
        message: `Booking successfully rescheduled to ${date} @ ${timeSlot}.`,
      });

      if (providerToNotify) {
        req.io.to(providerToNotify._id.toString()).emit("booking_update", {
          message: `Customer rescheduled Job #${booking._id.toString().slice(-4)}. It has been removed from your active list.`,
        });
      }
    }

    res.json({ message: "Rescheduled successfully", booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Provider logs a daily delivery for a subscription
// @route   PUT /api/bookings/:id/log-delivery
// @access  Private/Provider
const logDailyDelivery = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.provider.toString() !== req.user.id)
      return res.status(401).json({ message: "Not authorized" });
    if (booking.bookingType !== "subscription")
      return res.status(400).json({ message: "This is not a subscription" });

    // Increment delivery counter
    booking.subscriptionDetails.deliveriesCompleted += 1;

    // Check if the subscription is totally finished!
    if (
      booking.subscriptionDetails.deliveriesCompleted >=
      booking.subscriptionDetails.totalDeliveries
    ) {
      booking.status = "completed";

      // Pay the Provider their massive bulk amount!
      const provider = await User.findById(req.user.id);
      const commissionRate = 0.2;
      const providerShare = booking.totalPrice * (1 - commissionRate);

      provider.walletBalance = (provider.walletBalance || 0) + providerShare;
      await provider.save();

      const Transaction = require("../models/Transaction");
      await Transaction.create({
        user: provider._id,
        booking: booking._id,
        amount: providerShare,
        type: "credit",
        description: `Completed 30-Day Subscription for Order #${booking._id.toString().slice(-4)}`,
      });
    } else {
      // Just keep it active
      booking.status = "active_subscription";
    }

    await booking.save();

    // Notify Customer
    if (req.io) {
      req.io.to(booking.user._id.toString()).emit("booking_update", {
        title: "Delivery Complete! 🥛",
        message: `Your professional just delivered today's service! (${booking.subscriptionDetails.deliveriesCompleted}/${booking.subscriptionDetails.totalDeliveries} done)`,
      });
    }

    res.json({ message: "Delivery logged successfully!", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  createBulkBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  updateJobStatus,
  getAvailableJobs,
  getProviderHistory,
  acceptJob,
  verifyStartOtp, // Added in prev step
  completeJob, // Updated
  getProviderWallet, // New
  checkAvailability, // New
  cancelBooking,
  getAnalytics,
  sendNotification,
  rescheduleBooking,
  logDailyDelivery,
};
