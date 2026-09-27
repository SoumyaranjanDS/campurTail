require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ registrationNumber: '000000' });
    if (existing) {
      console.log('Admin already exists:', existing.name);
      process.exit(0);
    }

    const admin = new User({
      name: 'Campus Admin',
      registrationNumber: '000000',
      branch: 'Administration',
      role: 'admin',
    });

    await admin.save();
    console.log('✅ Admin seeded successfully');
    console.log('   Registration Number: 000000');
    console.log('   Role: admin');
    process.exit(0);
  } catch (err) {
    console.error('Seeder error:', err);
    process.exit(1);
  }
};

seed();
