# Troubleshooting League Creation Error

## Error: "Failed to create league in database"

This error occurs when the league creation process fails at the database level. Here's how to diagnose and fix the issue.

## Step-by-Step Diagnosis

### 1. Check Environment Variables

First, ensure all required environment variables are set in your `.env.local` file:

```bash
# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Sheets (Optional - for backup)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_sheet_id
```

### 2. Test Firebase Configuration

Run the test endpoint to check each component:

```bash
curl -X POST http://localhost:3000/api/testCreateLeague \
  -H "Content-Type: application/json" \
  -d '{"leagueName":"Test","adminEmail":"test@example.com","adminUserId":"test","displayName":"Test"}'
```

This will test:
- ✅ Authentication
- ✅ Request body parsing
- ✅ Firebase Admin SDK
- ✅ League code generation
- ✅ Firestore import
- ✅ Google Sheets import

### 3. Check Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Ensure Firestore is created and in **test mode** or has proper security rules

### 4. Firestore Security Rules

If Firestore is not in test mode, update the security rules to allow write operations:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Test mode - allow all operations
    }
  }
}
```

**⚠️ Warning**: This is for testing only. For production, use proper security rules.

### 5. Check Server Logs

Look at the server console output when creating a league. The logs will show:

```
=== CREATE LEAGUE API CALLED ===
Authentication successful for user: user@example.com
Generated unique league code: ABC-123-DEF4
League and user role created successfully
League and user role data written to Google Sheets
```

If you see errors, they will help identify the specific issue.

### 6. Common Issues and Solutions

#### Issue: "Firebase configuration error"
**Solution**: Check that all Firebase environment variables are set correctly.

#### Issue: "Firestore permission denied"
**Solution**: 
1. Set Firestore to test mode in Firebase Console
2. Or update security rules to allow write operations

#### Issue: "Google Sheets error"
**Solution**: 
1. Check Google Sheets environment variables
2. Ensure the service account has access to the spreadsheet
3. Run `/api/setupSheets` to create required sheets

#### Issue: "League code generation failed"
**Solution**: This is rare but could happen if the random generation fails. The code includes retry logic.

### 7. Manual Testing

Test each component individually:

#### Test Firebase Admin SDK:
```bash
curl http://localhost:3000/api/testFirebase
```

#### Test Google Sheets:
```bash
curl http://localhost:3000/api/testGoogleSheets
```

#### Setup Google Sheets:
```bash
curl -X POST http://localhost:3000/api/setupSheets
```

### 8. Browser Console Debugging

1. Open browser developer tools (F12)
2. Go to the **Console** tab
3. Try to create a league
4. Look for detailed error messages

The error should show:
- The API request being made
- The response status
- Any error details from the server

### 9. Network Tab Debugging

1. Open browser developer tools (F12)
2. Go to the **Network** tab
3. Try to create a league
4. Look for the `/api/createLeague` request
5. Check the request payload and response

### 10. Server-Side Debugging

The server logs will show detailed information about:
- Authentication status
- Request body validation
- Firebase operations
- Google Sheets operations
- Any errors that occur

## Quick Fix Checklist

- [ ] All environment variables set in `.env.local`
- [ ] Firebase project created and configured
- [ ] Firestore database created
- [ ] Firestore in test mode or proper security rules
- [ ] Google Sheets service account configured (optional)
- [ ] Development server restarted after env changes
- [ ] Browser cache cleared

## Still Having Issues?

If the problem persists:

1. **Check the server logs** for specific error messages
2. **Test each component** using the test endpoints
3. **Verify Firebase configuration** in the Firebase Console
4. **Check network requests** in browser developer tools
5. **Ensure all dependencies** are installed: `npm install`

## Support

If you continue to have issues, please provide:
1. The complete error message from browser console
2. The server logs when the error occurs
3. The result of running the test endpoints
4. Your Firebase project configuration (without sensitive data) 