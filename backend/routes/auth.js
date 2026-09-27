const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const { parser } = require("../config/cloudinary");

// Register
router.post("/register", authController.register);

// Login (Only registration number required)
router.post("/login", authController.login);

// Get Profile
router.get("/me", authMiddleware, authController.getProfile);

// Update Profile (Including Photo)
router.patch(
  "/me",
  authMiddleware,
  parser.single("profilePhoto"),
  authController.updateProfile,
);

// Update FCM Token
router.post("/fcm-token", authMiddleware, authController.updateFcmToken);

module.exports = router;
