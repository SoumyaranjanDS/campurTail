const express = require("express");
const router = express.Router();
const incidentsController = require("../controllers/incidentsController");
const authMiddleware = require("../middleware/auth");

// Get all notifications for user
router.get("/", authMiddleware, incidentsController.getNotifications);

// Mark all as read
router.patch("/read-all", authMiddleware, incidentsController.markAllNotificationsRead);

// Mark single notification as read
router.patch("/:notifId/read", authMiddleware, incidentsController.markNotificationRead);

module.exports = router;
