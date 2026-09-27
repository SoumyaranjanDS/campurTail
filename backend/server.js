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

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  return res.json({
    message: "server running on port 5000",
  });
});

// Database connection
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
