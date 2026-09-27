const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
  },
  branch: {
    type: String,
    required: true,
  },
  profilePhoto: {
    type: String, // Cloudinary URL
    default: '',
  },
  role: {
    type: String,
    enum: ['student', 'staff', 'admin'],
    default: 'student',
  },
  department: {
    type: String,
    enum: ["Infrastructure", "Academics", "Hostel", "Cleanliness", "Security", "Other"],
    required: function() { return this.role === 'staff'; }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
