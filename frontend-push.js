// frontend-push.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Request permission and get device push token
async function requestNotificationPermission(userId) {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, { 
        vapidKey: 'YOUR_PUBLIC_VAPID_KEY' 
      });
      
      if (currentToken) {
        // Send this token to your backend to link it with the user
        await saveTokenToBackend(userId, currentToken);
        console.log("Push token registered successfully.");
      }
    } else {
      console.log('Notification permission denied.');
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
}

// Listen for foreground messages when the app is open
onMessage(messaging, (payload) => {
  console.log('Message received in foreground: ', payload);
  alert(`⚠️ ${payload.notification.title}: ${payload.notification.body}`);
});
