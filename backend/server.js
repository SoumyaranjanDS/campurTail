require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use("/api/v1/auth", require("./routes/auth"));
app.use("/api/v1/incidents", require("./routes/incidents"));
app.use("/api/v1/admin", require("./routes/admin"));
app.use("/api/v1/staff", require("./routes/staffRoutes"));
app.use("/api/v1/notifications", require("./routes/notifications"));

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  return res.json({
    message: "server running on port 5000",
  });
});

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Expose io globally so controllers can use it
global.io = io;

io.use((socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    jwt.verify(socket.handshake.query.token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error("Authentication error"));
      socket.user = decoded;
      next();
    });
  } else {
    next(new Error("Authentication error"));
  }
}).on("connection", (socket) => {
  console.log("Client connected via Socket.io:", socket.user.userId);
  
  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`User ${socket.user.userId} joined conversation_${conversationId}`);
  });

  socket.on("leave_conversation", (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.user.userId);
  });
});

// Database connection
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("MongoDB Connected");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
