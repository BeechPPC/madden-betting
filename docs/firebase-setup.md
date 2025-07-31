# Firebase Setup Guide

This guide will help you set up Firebase Authentication and Firestore for the Madden CFM Betting app.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "madden-cfm-betting")
4. Follow the setup wizard (you can disable Google Analytics if not needed)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Google" provider
5. Enable it and configure:
   - Project support email: Your email
   - Authorized domains: Add your domain (for local development, you can skip this)
6. Click "Save"

## 3. Set up Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (you can add security rules later)
4. Select a location close to your users
5. Click "Done"

## 4. Get Firebase Configuration

1. In your Firebase project, click the gear icon next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>) to add a web app
5. Register your app with a nickname (e.g., "madden-betting-web")
6. Copy the configuration object

## 5. Set Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Replace the values with the actual configuration from your Firebase project.

## 6. Firestore Security Rules (Optional)

For production, you should set up proper security rules. Here's a basic example:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own bets
    match /bets/{betId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.user_id;
    }
    
    // Allow authenticated users to read matchups
    match /matchups/{matchupId} {
      allow read: if request.auth != null;
    }
  }
}
```

## 7. Update API Endpoints

The existing API endpoints (`/api/submitBet`, `/api/getMatchups`, etc.) will need to be updated to work with Firestore instead of Google Sheets. You can either:

1. Keep using Google Sheets for now and just add user authentication
2. Migrate to Firestore for data storage

## 8. Test the Setup

1. Run your development server: `npm run dev`
2. Navigate to your app
3. You should see a login page
4. Click "Sign in with Google"
5. After authentication, you should see the main betting interface

## Troubleshooting

- **Authentication not working**: Make sure Google provider is enabled in Firebase Console
- **Environment variables not loading**: Restart your development server after adding `.env.local`
- **CORS errors**: Add your domain to authorized domains in Firebase Authentication settings 