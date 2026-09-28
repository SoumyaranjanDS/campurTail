const express = require("express");
const router = express.Router();
const incidentsController = require("../controllers/incidentsController");
const authMiddleware = require("../middleware/auth");
const { parser } = require("../config/cloudinary");

// Create a new incident (requires auth and photo upload)
router.post(
  "/",
  authMiddleware,
  parser.fields([{ name: "photo", maxCount: 1 }, { name: "landmarkImages", maxCount: 2 }]),
  incidentsController.createIncident
);

// Get all incidents
router.get("/", authMiddleware, incidentsController.getAllIncidents);

// Analyze image with AI
router.post("/analyze-image", authMiddleware, incidentsController.analyzeImage);

// Get nearby incidents (must be before /:id)
router.get("/nearby", authMiddleware, incidentsController.getNearbyIncidents);

// Get single incident with updates
router.get("/:id", authMiddleware, incidentsController.getIncident);

// Chat Conversation Routes
router.get("/:id/conversation", authMiddleware, incidentsController.getConversation);
router.get("/:id/messages", authMiddleware, incidentsController.getMessages);
router.post("/:id/messages", authMiddleware, parser.single("photo"), incidentsController.sendMessage);
router.patch("/:id/conversation/read", authMiddleware, incidentsController.markConversationRead);

// Add update / change status (Requires photo upload optionally)
router.patch("/:id/status", authMiddleware, parser.single("photo"), incidentsController.updateIncidentStatus);

// Toggle upvote on an incident
router.patch("/:id/upvote", authMiddleware, incidentsController.upvoteIncident);

// Add a comment
router.post("/:id/comments", authMiddleware, incidentsController.addComment);

module.exports = router;
