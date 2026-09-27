const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const serviceAccount = require('../firebase-service-account.json');

const app = initializeApp({
  credential: cert(serviceAccount)
});

const messaging = getMessaging(app);

// Export an object that mimics the old admin.messaging() API
module.exports = {
  messaging: () => messaging
};
