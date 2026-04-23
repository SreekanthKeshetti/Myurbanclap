const rateLimit = require("express-rate-limit");

// 1. Global Bouncer: Protects the whole app from DDoS attacks
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1500, // Limit each IP to 1500 requests per `window` (here, per 15 minutes)
  message: {
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// 2. Strict Bouncer: Specifically protects the OTP & Login routes from Hackers
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to exactly 20 OTP/Login requests per 15 mins
  message: {
    message:
      "Too many login attempts. Please wait 15 minutes before trying again. 🛡️",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter };
