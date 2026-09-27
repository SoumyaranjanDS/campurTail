const mongoose = require("mongoose");

const IncidentUpdateSchema = new mongoose.Schema(
  {
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    previousStatus: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
    },
    newStatus: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      required: true,
    },
    note: {
      type: String, // E.g., "Plumber arrived", "Fixed the leak"
      required: true,
    },
    photo: {
      type: String, // Cloudinary URL for proof of repair
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("IncidentUpdate", IncidentUpdateSchema);
