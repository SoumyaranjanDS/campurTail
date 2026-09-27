const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Infrastructure", "Academics", "Hostel", "Cleanliness", "Security", "Other"],
      default: "Other",
    },
    location: {
      type: String,
      required: true,
    },
    gpsLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    photo: {
      type: String, // Cloudinary URL
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Incident", IncidentSchema);
