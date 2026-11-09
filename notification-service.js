// notification-service.js (Node.js Backend)
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function sendEscalationPush(fcmToken, attemptNumber) {
  const message = {
    token: fcmToken,
    notification: {
      title: `URGENT: Sugar Check Overdue! (Alert #${attemptNumber})`,
      body: "You have not uploaded your blood sugar reading yet. Please check and log your results immediately."
    },
    webpush: {
      fcmOptions: {
        link: 'https://your-glucocare-app.com/dashboard'
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent escalation push notification:', response);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

module.exports = { sendEscalationPush };
