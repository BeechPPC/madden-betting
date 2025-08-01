# Firebase Permissions Fix Guide

## Problem
The application is experiencing 500 Internal Server Error due to Firebase Firestore permissions. The error message is:
```
Error: 7 PERMISSION_DENIED: Missing or insufficient permissions.
```

## Root Cause
The Firebase service account `madden-betting@madden-betting.iam.gserviceaccount.com` doesn't have the necessary IAM permissions to read/write to Firestore.

## Solution Steps

### 1. Fix Environment Variables (Already Done ✅)
The `.env.local` file has been updated with the missing `GOOGLE_PRIVATE_KEY` variable.

### 2. Fix Firebase IAM Permissions

#### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `madden-betting-7e668`

#### Step 2: Navigate to IAM & Admin
1. Go to **IAM & Admin** > **IAM**
2. Find the service account: `madden-betting@madden-betting.iam.gserviceaccount.com`
3. Click the **edit (pencil) icon**

#### Step 3: Add Required Roles
Add these roles to the service account:

1. **Cloud Datastore User** - For Firestore read/write access
2. **Firebase Admin** - For full Firebase access
3. **Service Account Token Creator** - For authentication
4. **Firebase Authentication Admin** - For user management

#### Step 4: Save Changes
Click **Save** to apply the permissions.

### 3. Alternative: Temporary Google Sheets Fallback (Already Implemented ✅)

While you fix the IAM permissions, the application now has a fallback system:

- **Primary**: Tries Firestore first
- **Fallback**: Uses Google Sheets if Firestore fails
- **Error Handling**: Graceful degradation with clear error messages

### 4. Test the Fix

#### Test 1: Check Environment Variables
```bash
curl http://localhost:3000/api/testEnv
```

#### Test 2: Test User Role API
```bash
# This should work with the fallback system
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/getUserRole
```

#### Test 3: Test League Creation
```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"leagueName":"Test League","adminEmail":"test@example.com","adminUserId":"test123","displayName":"Test User"}' \
  http://localhost:3000/api/createLeague
```

## Expected Results

### Before Fix
- 500 Internal Server Error
- Permission denied errors in logs
- App fails to load user data

### After Fix
- Successful API responses
- Data stored in Firestore (or Google Sheets as fallback)
- App loads normally

## Verification

1. **Check Firebase Console**: Go to [Firebase Console](https://console.firebase.google.com/) > Your Project > Firestore Database
2. **Check Google Cloud Console**: Verify IAM permissions are applied
3. **Check Application Logs**: Look for successful operations instead of permission errors

## Troubleshooting

### If permissions still don't work:
1. **Wait 5-10 minutes** - IAM changes can take time to propagate
2. **Check service account key**: Ensure the private key in `.env.local` is correct
3. **Verify project ID**: Make sure `FIREBASE_PROJECT_ID` matches your Firebase project
4. **Check Firestore rules**: Ensure rules allow Admin SDK access

### If Google Sheets fallback fails:
1. **Check Google Sheets API**: Ensure the service account has access to the spreadsheet
2. **Verify spreadsheet ID**: Check `GOOGLE_SHEET_ID` in `.env.local`
3. **Check sheet structure**: Ensure the required sheets exist (UserRoles, Leagues, etc.)

## Long-term Solution

Once IAM permissions are fixed:
1. **Remove fallback code** (optional) - The app will work with just Firestore
2. **Monitor logs** - Ensure no more permission errors
3. **Test all features** - Verify league creation, user roles, etc. work properly

## Support

If you continue to have issues:
1. Check the browser console for client-side errors
2. Check the server logs for detailed error messages
3. Verify all environment variables are set correctly
4. Ensure the Firebase project is properly configured 