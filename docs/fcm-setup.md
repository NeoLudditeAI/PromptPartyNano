# 🔔 Firebase Cloud Messaging Setup Guide

This guide walks through setting up Firebase Cloud Messaging (FCM) for Prompt Party push notifications.

## 📋 Prerequisites

- Firebase project with Realtime Database enabled
- Firebase CLI installed (`npm install -g firebase-tools`)
- Environment variables configured

## 🔥 Firebase Console Setup

### 1. Enable Cloud Messaging

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your Prompt Party project
3. Navigate to **Project Settings** > **Cloud Messaging**
4. If not already enabled, click **Enable** on Cloud Messaging API

### 2. Generate VAPID Key

1. In **Cloud Messaging** settings, scroll to **Web configuration**
2. If no web app exists, click **Add app** and register your web app
3. Find **Web push certificates** section
4. Click **Generate key pair** if no VAPID key exists
5. Copy the **Key pair** value

### 3. Get Configuration Values

From **Project Settings** > **General**, copy these values:
- `apiKey`
- `authDomain` 
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`
- `databaseURL` (from Realtime Database settings)

## 🔧 Environment Configuration

### 1. Update Your `.env.local` File

```bash
# Google Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com/

# Firebase Cloud Messaging
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_from_step_2
```

### 2. Update Service Worker Configuration

Edit `public/firebase-messaging-sw.js` and replace the placeholder config:

```javascript
const firebaseConfig = {
  apiKey: "your_actual_api_key",
  authDomain: "your_project.firebaseapp.com", 
  projectId: "your_actual_project_id",
  storageBucket: "your_project.firebasestorage.app",
  messagingSenderId: "your_actual_sender_id",
  appId: "your_actual_app_id"
};
```

## 🚀 Firebase Functions Deployment

### 1. Install Firebase CLI & Login

```bash
npm install -g firebase-tools
firebase login
```

### 2. Initialize Firebase Project

```bash
firebase use your_project_id
```

### 3. Deploy Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## ✅ Testing

### 1. Test Notification Permissions

1. Open your app in a browser
2. Look for notification permission prompt
3. Grant permission
4. Check browser console for FCM token

### 2. Test Push Notifications

The app includes a test function you can call:

```javascript
// In browser console
const testNotification = firebase.functions().httpsCallable('sendTestNotification');
testNotification({ 
  fcmToken: 'your_fcm_token_from_console',
  title: 'Test!',
  body: 'Push notifications working!'
});
```

### 3. Test Game Notifications

1. Create a new game
2. Add a player on another device/browser
3. Take turns - notifications should appear
4. React to images - reaction notifications should appear

## 🔍 Troubleshooting

### Common Issues

**"FCM not supported"**
- Check if running on localhost with HTTPS or deployed with SSL
- Verify browser supports service workers and push notifications

**"No FCM token"**
- Check VAPID key is correct in environment variables
- Ensure notification permissions are granted
- Check browser console for detailed error messages

**"Function not found"** 
- Verify Firebase Functions are deployed successfully
- Check function names match in client code
- Review Firebase Functions logs: `firebase functions:log`

**iOS Safari Issues**
- iOS 16.4+ required for web push
- Must be installed as PWA (Add to Home Screen)
- Check iOS Settings > Notifications > Safari for permissions

### Debug Commands

```bash
# Check function deployment status
firebase functions:list

# View function logs
firebase functions:log

# Test functions locally
cd functions && npm run serve
```

## 📱 Platform Support

| Platform | Support | Notes |
|----------|---------|-------|
| **Android Chrome** | ✅ Full | All notification features |
| **Desktop Chrome** | ✅ Full | All notification features |
| **Desktop Firefox** | ✅ Full | All notification features |
| **iOS Safari 16.4+** | ✅ Limited | PWA install required |
| **iOS Safari < 16.4** | ❌ None | No web push support |
| **Desktop Safari** | ❌ None | No web push support |

## 🎯 Next Steps

Once FCM is working:

1. **Monitor Usage**: Set up Firebase Analytics for notification metrics
2. **Optimize Timing**: Add smart notification scheduling
3. **Rich Notifications**: Add action buttons and rich media
4. **User Preferences**: Allow users to customize notification types
5. **Native Apps**: FCM tokens work seamlessly with React Native/Capacitor

## 📚 Resources

- [Firebase Cloud Messaging Web Guide](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [PWA Notification Best Practices](https://web.dev/notification-best-practices/)
