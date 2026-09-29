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
      default: '',
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
    landmarkImages: [{ type: String }],
    landmarkText: { type: String, default: '' },
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
    geoLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: false
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: false
      }
    },
    lastActivityAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

IncidentSchema.index({ geoLocation: "2dsphere" });

module.exports = mongoose.model("Incident", IncidentSchema);
