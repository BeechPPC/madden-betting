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

## 4. Fix Firestore Permissions (CRITICAL)

The most common issue is "PERMISSION_DENIED: Missing or insufficient permissions." Here's how to fix it:

### Option A: Use Test Mode (Quick Fix)
1. Go to "Firestore Database" in Firebase Console
2. Click on the "Rules" tab
3. Replace the rules with this temporary test mode:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. Click "Publish"

### Option B: Proper Security Rules (Recommended)
1. Go to "Firestore Database" in Firebase Console
2. Click on the "Rules" tab
3. Replace the rules with this secure configuration:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read and write league data
    match /leagues/{leagueId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read and write user roles
    match /userRoles/{roleId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read and write bets
    match /bets/{betId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read and write matchups
    match /matchups/{matchupId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Click "Publish"

### Option C: Service Account Permissions (For Admin SDK)
If you're still getting permission errors with the Admin SDK:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "IAM & Admin" > "IAM"
4. Find your Firebase Admin SDK service account (ends with `@your-project-id.iam.gserviceaccount.com`)
5. Click the edit (pencil) icon
6. Add these roles:
   - "Cloud Datastore User"
   - "Firebase Admin"
   - "Service Account Token Creator"
7. Click "Save"

## 5. Get Firebase Configuration

1. In your Firebase project, click the gear icon next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>) to add a web app
5. Register your app with a nickname (e.g., "madden-betting-web")
6. Copy the configuration object

## 6. Set Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

Replace the values with the actual configuration from your Firebase project.

## 7. Test the Setup

1. Run your development server: `npm run dev`
2. Navigate to your app
3. You should see a login page
4. Click "Sign in with Google"
5. After authentication, you should see the main betting interface

## 8. Troubleshooting

### "PERMISSION_DENIED: Missing or insufficient permissions"
**Solution**: Follow the Firestore Permissions section above (Step 4)

### "Firebase configuration error"
**Solution**: 
1. Check that all environment variables are set correctly
2. Restart your development server after adding `.env.local`
3. Verify the service account private key is properly formatted

### "Authentication not working"
**Solution**: 
1. Make sure Google provider is enabled in Firebase Console
2. Check that your domain is in authorized domains
3. Verify the client-side Firebase config is correct

### "Environment variables not loading"
**Solution**: 
1. Restart your development server after adding `.env.local`
2. Check that the file is in the project root
3. Verify there are no typos in variable names

### "CORS errors"
**Solution**: Add your domain to authorized domains in Firebase Authentication settings

## 9. Next Steps

Once the basic setup is working:

1. **Implement Real Firestore Operations**: Replace the test responses in API endpoints with actual Firestore operations
2. **Add Data Validation**: Implement proper data validation for league creation and joining
3. **Add Error Handling**: Implement comprehensive error handling for all Firestore operations
4. **Security**: Review and tighten security rules for production use 