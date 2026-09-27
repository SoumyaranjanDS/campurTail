const jwt = require("jsonwebtoken");
const User = require("../models/User");
const admin = require("../config/firebase");

// Register
exports.register = async (req, res) => {
  const { name, registrationNumber, branch } = req.body;
  try {
    let user = await User.findOne({ registrationNumber });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    user = new User({ name, registrationNumber, branch });
    await user.save();

    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Login
exports.login = async (req, res) => {
  const { registrationNumber } = req.body;
  try {
    const user = await User.findOne({ registrationNumber });
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  const { name, branch } = req.body;
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (branch) user.branch = branch;
    if (req.file && req.file.path) {
      user.profilePhoto = req.file.path; // Cloudinary URL
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.updateFcmToken = async (req, res) => {
  const { fcmToken, isLogin } = req.body;
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.fcmToken = fcmToken;
    await user.save();

    if (isLogin && fcmToken) {
      try {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: `Welcome back, ${user.name.split(' ')[0]}! 👋`,
            body: "You're connected to Campus Tails. Let's make our campus better together.",
          },
        });
      } catch (fcmError) {
        console.error("Error sending welcome notification:", fcmError);
      }
    }

    res.json({ message: "FCM token updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
