const Incident = require("../models/Incident");
const IncidentUpdate = require("../models/IncidentUpdate");
const Comment = require("../models/Comment");
const User = require("../models/User");
const Notification = require("../models/Notification");
const admin = require("../config/firebase");

// Create a new incident
exports.createIncident = async (req, res) => {
  try {
    
    const {
      title,
      description,
      category,
      location,
      latitude,
      longitude,
      priority,
      landmarkText
    } = req.body;

    const photoFile = req.files && req.files['photo'] ? req.files['photo'][0] : req.file;
    if (!photoFile || !photoFile.path) {
      return res
        .status(400)
        .json({ message: "Photo is required to report an issue." });
    }

    const landmarkImages = [];
    if (req.files && req.files['landmarkImages']) {
      req.files['landmarkImages'].forEach(file => {
        if (file.path) landmarkImages.push(file.path);
      });
    }


    // Determine the staff member to auto-assign
    let assignedTo = null;
    if (category) {
      // Find all staff in this department
      const staffMembers = await User.find({ role: 'staff', department: category });
      
      if (staffMembers.length > 0) {
        // Calculate workload (Pending + In Progress) for each staff member
        let leastLoadedStaff = null;
        let minLoad = Infinity;
        
        for (const staff of staffMembers) {
          const load = await Incident.countDocuments({
            assignedTo: staff._id,
            status: { $in: ['Pending', 'In Progress'] }
          });
          
          if (load < minLoad) {
            minLoad = load;
            leastLoadedStaff = staff;
          }
        }
        
        if (leastLoadedStaff) {
          assignedTo = leastLoadedStaff._id;
        }
      }
    }

    let geoLocation = undefined;
    if (
      latitude !== undefined &&
      longitude !== undefined &&
      parseFloat(latitude) >= -90 && parseFloat(latitude) <= 90 &&
      parseFloat(longitude) >= -180 && parseFloat(longitude) <= 180 &&
      (parseFloat(latitude) !== 0 || parseFloat(longitude) !== 0)
    ) {
      geoLocation = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    const newIncident = new Incident({
      title,
      description,
      category,
      location,
      gpsLocation: {
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      },
      geoLocation,
      photo: photoFile.path, // Cloudinary URL
      reportedBy: req.user.userId,
      priority: priority || "Medium",
      landmarkText: landmarkText || '',
      landmarkImages,
      assignedTo,
      lastActivityAt: new Date()
    });

    await newIncident.save();

    // Populate the user info before returning
    await newIncident.populate([
      { path: "reportedBy", select: "name branch profilePhoto registrationNumber" },
      { path: "assignedTo", select: "name registrationNumber department fcmToken" }
    ]);

    // Nearby Detection - Post submission notification
    if (geoLocation) {
      try {
        const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        // Find nearby issues excluding this one, unresolved
        const nearbyIssues = await Incident.find({
          _id: { $ne: newIncident._id },
          status: { $ne: 'Resolved' },
          geoLocation: {
            $near: {
              $geometry: geoLocation,
              $maxDistance: 200 // Default 200m
            }
          }
        });

        if (nearbyIssues.length > 0) {
          // Sort by severity manually
          nearbyIssues.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
          const highestSeverityIssue = nearbyIssues[0];
          
          if (highestSeverityIssue.priority === 'High' || highestSeverityIssue.priority === 'Critical') {
            const reporter = await User.findById(req.user.userId);
            if (reporter && reporter.fcmToken) {
              await admin.messaging().send({
                token: reporter.fcmToken,
                notification: {
                  title: `${highestSeverityIssue.priority}-priority issue nearby`,
                  body: `An active issue was reported within 200 m of your report location.`
                },
                data: { incidentId: highestSeverityIssue._id.toString() }
              });
            }
          }
        }
      } catch (err) {
        console.error('Nearby notification error:', err);
      }
    }

    // --- Firebase Push Notifications ---
    try {
      if (newIncident.assignedTo) {
        const assignedUser = await User.findById(newIncident.assignedTo);
        if (assignedUser) {
          if (assignedUser.fcmToken) {
            await admin.messaging().send({
              token: assignedUser.fcmToken,
              notification: {
                title: 'New Job Assigned',
                body: `${newIncident.title} - ${newIncident.priority} Priority`
              },
              data: { incidentId: newIncident._id.toString() }
            });
          }
          
          // Create in-app notification for staff
          await Notification.create({
            userId: assignedUser._id,
            referenceId: newIncident._id,
            type: 'assigned',
            title: 'New Job Assigned',
            body: `${newIncident.title} - ${newIncident.priority} Priority`,
            isRead: false
          });

          // Emit socket event to staff
          if (global.io) {
            global.io.to(assignedUser._id.toString()).emit('notification', {
              incidentId: newIncident._id,
              type: 'assigned',
              title: 'New Job Assigned',
              message: `${newIncident.title} - ${newIncident.priority} Priority`
            });
          }
        }
      }

      if (newIncident.priority === 'High' || newIncident.priority === 'Extreme') {
        await admin.messaging().send({
          topic: 'campus_alerts',
          notification: {
            title: `⚠️ ${newIncident.priority} Alert: ${newIncident.category}`,
            body: newIncident.title
          },
          data: { incidentId: newIncident._id.toString() }
        });
      }
    } catch (fcmError) {
      console.error("FCM Error:", fcmError);
    }

    res.status(201).json(newIncident);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server Error: Could not create incident" });
  }
};

// Get all incidents (Feed)
exports.getAllIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find()
      .populate("reportedBy", "name branch profilePhoto")
      .populate("assignedTo", "name department profilePhoto")
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json(incidents);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server Error: Could not fetch incidents" });
  }
};

// Get single incident with timeline updates and comments
exports.getIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate("reportedBy", "name branch profilePhoto")
      .populate("assignedTo", "name department profilePhoto");

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    const updates = await IncidentUpdate.find({ incident: incident._id })
      .populate("updatedBy", "name role profilePhoto")
      .sort({ createdAt: 1 });

    const comments = await Comment.find({ incident: incident._id })
      .populate("user", "name role profilePhoto")
      .sort({ createdAt: 1 }); // Oldest comments first (top-down read)

    res.status(200).json({ incident, updates, comments });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server Error: Could not fetch incident details" });
  }
};

// Add an update / change status (Staff only)
exports.updateIncidentStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    const previousStatus = incident.status;
    incident.status = status;
    incident.lastActivityAt = new Date();
    await incident.save();

    const newUpdate = new IncidentUpdate({
      incident: incident._id,
      updatedBy: req.user.userId,
      previousStatus,
      newStatus: status,
      note,
      photo: req.file ? req.file.path : undefined,
    });

    await newUpdate.save();

    await newUpdate.populate("updatedBy", "name role profilePhoto");

    // Notifications for reporter
    try {
      const reporter = await User.findById(incident.reportedBy);
      if (reporter && reporter._id.toString() !== req.user.userId) {
        const title = status === 'Resolved' ? "Issue Resolved 🎉" : "Issue Status Updated";
        const body = `Your issue "${incident.title}" is now ${status}.`;
        
        await Notification.create({
          userId: reporter._id,
          title,
          body,
          type: "status_update",
          referenceId: incident._id
        });

        if (reporter.fcmToken) {
          await admin.messaging().send({
            token: reporter.fcmToken,
            notification: { title, body },
            data: { incidentId: incident._id.toString(), type: "status_update" }
          });
        }
      }
    } catch (notifErr) {
      console.error("Error sending status notification:", notifErr);
    }

    res.status(201).json({ incident, newUpdate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error: Could not add update" });
  }
};

// Upvote an incident
exports.upvoteIncident = async (req, res) => {
  try {
    const incidentId = req.params.id;
    const userId = req.user.userId;

    const incident = await Incident.findById(incidentId);
    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    // Check if already upvoted
    const hasUpvoted = incident.upvotes.includes(userId);

    if (hasUpvoted) {
      // Remove upvote
      incident.upvotes = incident.upvotes.filter(
        (id) => id.toString() !== userId,
      );
    } else {
      // Add upvote
      incident.upvotes.push(userId);
    }

    await incident.save();
    res.status(200).json(incident);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error: Could not process upvote" });
  }
};

// Add a comment to an incident
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const newComment = new Comment({
      incident: req.params.id,
      user: req.user.userId,
      text,
    });

    await newComment.save();
    await newComment.populate("user", "name role profilePhoto");

    res.status(201).json(newComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error: Could not add comment" });
  }
};
// Auto-fill from AI Vision (Groq - llama-3.2-11b-vision)
const Groq = require("groq-sdk");

exports.analyzeImage = async (req, res) => {
  try {
    const { base64Image } = req.body;

    if (!base64Image) {
      return res.status(400).json({ message: "No base64 image provided" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res
        .status(500)
        .json({ message: "Groq API key is not configured on the server." });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an AI assistant for a campus maintenance app. Analyze this image and identify the campus issue.
              Respond with ONLY a raw JSON object (no markdown, no code fences). Example:
              {"title":"Broken projector","category":"Infrastructure","description":"The projector in classroom is damaged.","priority":"Medium"}
              category must be one of: Infrastructure, Academics, Hostel, Cleanliness, Security, Other
              priority must be one of: Low, Medium, High, Critical`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 512,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "{}";

    // Robustly extract JSON even if the model wraps it in markdown
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Groq returned non-JSON:", responseText);
      return res
        .status(500)
        .json({ message: "AI returned an unexpected response format." });
    }
    const parsed = JSON.parse(jsonMatch[0]);

    res.status(200).json(parsed);
  } catch (error) {
    console.error("Groq AI Error:", error?.message || error);
    res
      .status(500)
      .json({ message: error?.message || "Failed to analyze image with AI" });
  }
};

// ===== MODULE 2: NEARBY ISSUES =====
exports.getNearbyIncidents = async (req, res) => {
  try {
    const { longitude, latitude } = req.query;
    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ message: "Longitude and latitude required." });
    }

    const priorityOrder = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
    const radius = 200; // 200 metres

    const incidents = await Incident.find({
      status: { $ne: "Resolved" },
      reportedBy: { $ne: req.user.userId },
      geoLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius
        }
      }
    })
    .select("title category priority status geoLocation createdAt lastActivityAt gpsLocation")
    .lean();

    // Sort: severity desc, then distance implicitly handled by $near, then lastActivityAt desc
    incidents.sort((a, b) => {
      const pDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (pDiff !== 0) return pDiff;
      // $near returns sorted by distance, so stable sort on distance is preserved if pDiff === 0
      return new Date(b.lastActivityAt || b.createdAt) - new Date(a.lastActivityAt || a.createdAt);
    });

    res.status(200).json(incidents);
  } catch (error) {
    console.error("Error getting nearby incidents:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ===== MODULE 1: CHAT =====
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// Helper to check chat permission
const checkChatPermission = async (incident, userId, role) => {
  if (role === "admin") return true;
  
  const reportedById = incident.reportedBy?._id ? incident.reportedBy._id.toString() : incident.reportedBy?.toString();
  if (reportedById === userId) return true;
  
  const assignedToId = incident.assignedTo?._id ? incident.assignedTo._id.toString() : incident.assignedTo?.toString();
  if (assignedToId === userId) return true;
  
  return false;
};

exports.getConversation = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });

    const hasPermission = await checkChatPermission(incident, req.user.userId, req.user.role);
    if (!hasPermission) return res.status(403).json({ message: "Not authorized for this conversation" });

    let conversation = await Conversation.findOne({ incidentId: incident._id });
    if (!conversation) {
      conversation = new Conversation({ incidentId: incident._id });
      await conversation.save();
    }

    res.status(200).json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });

    const hasPermission = await checkChatPermission(incident, req.user.userId, req.user.role);
    if (!hasPermission) return res.status(403).json({ message: "Not authorized for this conversation" });

    const conversation = await Conversation.findOne({ incidentId: incident._id });
    if (!conversation) return res.status(200).json([]);

    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before; // date cursor

    const query = { conversationId: conversation._id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // newest first
      .limit(limit)
      .populate("senderId", "name profilePhoto role");

    res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { text, clientMessageId } = req.body;
    
    if (!text && !req.file) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const incident = await Incident.findById(req.params.id).populate("reportedBy assignedTo");
    if (!incident) return res.status(404).json({ message: "Incident not found" });

    if (incident.status === "Resolved" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Conversation is read-only" });
    }

    const hasPermission = await checkChatPermission(incident, req.user.userId, req.user.role);
    if (!hasPermission) return res.status(403).json({ message: "Not authorized" });

    let conversation = await Conversation.findOne({ incidentId: incident._id });
    if (!conversation) {
      conversation = new Conversation({ incidentId: incident._id });
      await conversation.save();
    }

    // Check for duplicate clientMessageId
    if (clientMessageId) {
      const existing = await Message.findOne({ clientMessageId, senderId: req.user.userId });
      if (existing) return res.status(200).json(existing);
    }

    const newMessage = new Message({
      conversationId: conversation._id,
      incidentId: incident._id,
      senderId: req.user.userId,
      text: text || "",
      photo: req.file ? req.file.path : null, // Private chat photo
      type: req.file ? "image" : "text",
      clientMessageId
    });

    await newMessage.save();

    conversation.lastMessageAt = newMessage.createdAt;
    conversation.lastMessagePreview = text ? text.substring(0, 50) : "Image";
    await conversation.save();

    await newMessage.populate("senderId", "name profilePhoto role");

    let isRecipientInRoom = false;
    // Socket.IO emission (if setup in server)
    if (global.io) {
      global.io.to(`conversation_${conversation._id}`).emit("new_message", newMessage);
      
      const room = global.io.sockets.adapter.rooms.get(`conversation_${conversation._id}`);
      // If room size > 1, assume both users are actively in the chat.
      if (room && room.size > 1) {
        isRecipientInRoom = true;
      }
    }

    // Notifications (only if recipient is not active in the chat screen)
    if (!isRecipientInRoom) {
      let recipientId = null;
      if (incident.reportedBy._id.toString() === req.user.userId && incident.assignedTo) {
        recipientId = incident.assignedTo._id;
      } else if (incident.assignedTo && incident.assignedTo._id.toString() === req.user.userId) {
        recipientId = incident.reportedBy._id;
      } else if (req.user.role === "admin") {
        recipientId = incident.reportedBy._id;
      }

      if (recipientId) {
        const title = "New message about your issue";
        const body = `You have a new message regarding: ${incident.title}`;
        
        await Notification.create({
          userId: recipientId,
          title,
          body,
          type: "chat",
          referenceId: incident._id
        });

        if (global.io) {
          global.io.to(recipientId.toString()).emit('notification', {
            title,
            body,
            type: "chat",
            referenceId: incident._id
          });
        }

        const recipient = await User.findById(recipientId);
        if (recipient && recipient.fcmToken) {
          await admin.messaging().send({
            token: recipient.fcmToken,
            notification: { title, body },
            data: { incidentId: incident._id.toString(), type: "chat" }
          }).catch(err => console.log("FCM error on chat:", err));
        }
      }
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markConversationRead = async (req, res) => {
  // Simple endpoint, currently we dont have a ReadReceipt model, but we could add one later.
  res.status(200).json({ success: true });
};

// ===== MODULE 3: NOTIFICATIONS =====

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.notifId, userId: req.user.userId },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: "Not found" });
    res.status(200).json(notif);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.userId, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

