const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Check if header has "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header (Remove 'Bearer ' string)
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token ID and attach to request
      // We exclude the password from the data we attach
      req.user = await User.findById(decoded.id).select("-password");
      // --- CRITICAL FIX: GHOST USER CHECK ---
      // If the token is valid but the user was deleted from the DB (e.g. by seeder)
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "User no longer exists. Please log in again." });
      }
      // --------------------------------------

      next(); // Move to the next step
    } catch (error) {
      console.log(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};
// 2. Admin: Verifies the user has role 'admin' (THIS WAS MISSING)
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as an admin" });
  }
};
// 3. Provider: Verifies the user has role 'provider'
const provider = (req, res, next) => {
  if (req.user && (req.user.role === "provider" || req.user.role === "admin")) {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as a provider" });
  }
};

module.exports = { protect, admin, provider };
