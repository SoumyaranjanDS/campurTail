const mongoose = require('mongoose');
const User = require('./models/User');
const admin = require('./config/firebase');
require('dotenv').config();

async function testPush() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Get the most recently updated user with an fcmToken
    const user = await User.findOne({ fcmToken: { $exists: true, $ne: null } }).sort({ updatedAt: -1 });

    if (!user) {
      console.log('No user found with an fcmToken in the database.');
      process.exit(0);
    }

    console.log(`Sending push to user: ${user.name}`);
    console.log(`FCM Token: ${user.fcmToken}`);

    const response = await admin.messaging().send({
      token: user.fcmToken,
      notification: {
        title: `Test Notification for ${user.name} 🚀`,
        body: 'If you see this, push notifications are working perfectly!',
      },
    });

    console.log('Successfully sent message:', response);
  } catch (error) {
    console.log('Error sending message:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

testPush();
