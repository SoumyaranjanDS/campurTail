const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Can be null if system event
    },
    type: {
      type: String,
      enum: ["text", "image", "system"],
      default: "text",
    },
    text: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      default: null,
    },
    clientMessageId: {
      type: String, // Used for safe retries
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying and preventing duplicate client messages
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index(
  { senderId: 1, clientMessageId: 1, conversationId: 1 },
  { unique: true, partialFilterExpression: { clientMessageId: { $exists: true, $ne: null } } }
);

module.exports = mongoose.model("Message", MessageSchema);
