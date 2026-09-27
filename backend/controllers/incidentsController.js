const Incident = require("../models/Incident");
const IncidentUpdate = require("../models/IncidentUpdate");
const Comment = require("../models/Comment");
const User = require("../models/User");
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
    } = req.body;

    if (!req.file || !req.file.path) {
      return res
        .status(400)
        .json({ message: "Photo is required to report an issue." });
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

    const newIncident = new Incident({
      title,
      description,
      category,
      location,
      gpsLocation: {
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      },
      photo: req.file.path, // Cloudinary URL
      reportedBy: req.user.userId,
      priority: priority || "Medium",
      assignedTo,
    });

    await newIncident.save();

    // Populate the user info before returning
    await newIncident.populate([
      { path: "reportedBy", select: "name branch profilePhoto registrationNumber" },
      { path: "assignedTo", select: "name registrationNumber department fcmToken" }
    ]);

    // --- Firebase Push Notifications ---
    try {
      if (newIncident.assignedTo && newIncident.assignedTo.fcmToken) {
        await admin.messaging().send({
          token: newIncident.assignedTo.fcmToken,
          notification: {
            title: 'New Job Assigned',
            body: `${newIncident.title} - ${newIncident.priority} Priority`
          },
          data: { incidentId: newIncident._id.toString() }
        });
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
