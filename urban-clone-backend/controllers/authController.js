const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper function to generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d", // Token valid for 30 days
  });
};

// @desc    Register a new user (Customer or Provider)
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, providerDetails } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Encrypt the password (Hash it)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "customer", // Default to customer if not specified
      providerDetails: role === "provider" ? providerDetails : undefined,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id), // Send token immediately
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check for user email
    const user = await User.findOne({ email });

    // 2. Check password
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.location = req.body.location || user.location;

      // --- EXISTING: Update Provider Category ---
      // --- 🌟 NEW: Update Dynamic Category & SubCategory ---
      if (
        req.body.category &&
        req.body.subCategory &&
        user.role === "provider"
      ) {
        user.providerDetails = {
          ...user.providerDetails,
          category: req.body.category,
          subCategory: req.body.subCategory,
        };
      }

      // --- 🌟 NEW: Update Provider Availability (Duty Toggle) ---
      if (req.body.isAvailable !== undefined && user.role === "provider") {
        user.providerDetails = {
          ...user.providerDetails,
          isAvailable: req.body.isAvailable,
        };
      }

      // --- EXISTING: Update Geo-Location ---
      if (req.body.geoLocation && req.body.geoLocation.coordinates) {
        user.geoLocation = {
          type: "Point",
          coordinates: req.body.geoLocation.coordinates,
        };
      }
      // --- 🌟 NEW: ADDRESS BOOK LOGIC (Step 3) ---
      if (req.body.newAddress) {
        user.savedAddresses.push(req.body.newAddress);
      }
      if (req.body.removeAddressId) {
        user.savedAddresses = user.savedAddresses.filter(
          (addr) => addr._id.toString() !== req.body.removeAddressId,
        );
      }
      // -------------------------------------------

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        location: updatedUser.location,
        role: updatedUser.role,
        providerDetails: updatedUser.providerDetails,
        geoLocation: updatedUser.geoLocation,
        isPlusMember: updatedUser.isPlusMember, // Security fix: pass plus membership back
        plusMembershipExpiry: updatedUser.plusMembershipExpiry,
        walletBalance: updatedUser.walletBalance,
        savedAddresses: updatedUser.savedAddresses, // Pass addresses back
        token: generateToken(updatedUser._id), // ensure token generator exists above
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send OTP (Simulated)
// @route   POST /api/auth/send-otp
const sendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone number required" });
  }

  // 1. In a real app, generate a random 4-6 digit number
  // const otp = Math.floor(1000 + Math.random() * 9000);

  // 2. FOR DEVELOPMENT: We use a fixed OTP '1234'
  const otp = 1234;

  // 3. In real app: await sendSms(phone, otp);
  console.log(`### OTP FOR ${phone} IS: ${otp} ###`);

  // We check if user exists, but we don't block them.
  // If they don't exist, we will create them during verification step.
  res.json({ message: "OTP Sent Successfully", success: true });
};

// @desc    Verify OTP and Login/Register
// @route   POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  const { phone, otp, name, role, category } = req.body; // Receive category

  // 1. Verify OTP
  if (String(otp).trim() !== "1234") {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  try {
    // 2. Check if user exists
    let user = await User.findOne({ phone });

    if (user) {
      // --- EXISTING USER LOGIC ---
      // Use the role and category ALREADY in the database.
      // We ignore what they sent in the body to prevent role-switching.

      return res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        // IMPORTANT: Send back the saved category
        providerDetails: user.providerDetails,
        token: generateToken(user.id),
      });
    }

    // --- NEW USER LOGIC ---
    else {
      if (!name)
        return res.status(400).json({ message: "New user requires a Name" });

      const newUser = await User.create({
        name,
        phone,
        role: role || "customer",
        email: `${phone}@urbanclone.com`,
        // SAVE CATEGORY PERMANENTLY HERE
        providerDetails:
          role === "provider"
            ? {
                isAvailable: true,
                isVerified: false, // Default to false for safety
              }
            : undefined,
      });

      res.json({
        _id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        providerDetails: newUser.providerDetails,
        token: generateToken(newUser.id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Provider Uploads KYC Document
// @route   POST /api/auth/upload-kyc
// @access  Private/Provider
const uploadKYC = async (req, res) => {
  try {
    const { imageUrl } = req.body; // In real app, this comes from Cloudinary/Multer

    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.providerDetails.documentImage = imageUrl;
    user.providerDetails.verificationStatus = "submitted"; // Changed from pending

    await user.save();
    res.json({
      message: "Documents submitted for verification",
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin Approves/Rejects Provider
// @route   PUT /api/auth/admin/verify-provider
// @access  Private/Admin
const verifyProvider = async (req, res) => {
  try {
    const { providerId, action } = req.body; // action = 'approve' or 'reject'

    const user = await User.findById(providerId);
    if (!user) return res.status(404).json({ message: "Provider not found" });

    if (action === "approve") {
      user.providerDetails.isVerified = true;
      user.providerDetails.verificationStatus = "approved";
    } else {
      user.providerDetails.isVerified = false;
      user.providerDetails.verificationStatus = "rejected";
    }

    await user.save();
    res.json({ message: `Provider ${action}d successfully`, success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Pending Providers
// @route   GET /api/auth/admin/pending-providers
const getPendingProviders = async (req, res) => {
  try {
    const providers = await User.find({
      role: "provider",
      "providerDetails.verificationStatus": "submitted",
    });
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get All Users (Admin)
// @route   GET /api/auth/admin/users
// @access  Private/Admin
// const getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find({}).sort({ createdAt: -1 });
//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// @desc    Get All Users (Admin)
// @route   GET /api/auth/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    // --- 🌟 SPRINT 9 V3: Populate Category Names ---
    const users = await User.find({})
      .populate("providerDetails.category", "name")
      .populate("providerDetails.subCategory", "name")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get Customer Wallet & Transactions
// @route   GET /api/auth/my-wallet
// @access  Private
const getUserWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const Transaction = require("../models/Transaction");
    const transactions = await Transaction.find({ user: req.user.id }).sort({
      date: -1,
    });

    res.json({
      balance: user.walletBalance || 0,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  registerUser,
  loginUser,
  updateUserProfile,
  sendOtp,
  verifyOtp,
  uploadKYC, // <--- New
  verifyProvider, // <--- New
  getPendingProviders, // <--- New
  getAllUsers,
  getUserWallet,
};
