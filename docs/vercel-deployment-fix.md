# Vercel Deployment Fix Guide

## Critical Issue: Authentication Failures

The 500 error in `/api/createLeague` is caused by two critical authentication failures:

1. **Firestore Authentication Error**: Service account lacks proper Firestore permissions
2. **Google Sheets Authentication Error**: Service account lacks proper Google Sheets API access

## Immediate Fixes Required

### 1. Fix Firestore Permissions

**Problem**: Service account getting "UNAUTHENTICATED" errors when accessing Firestore.

**Solution**: Set Firestore to test mode temporarily:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Firestore Database" > "Rules"
4. Replace the rules with this test mode configuration:

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

5. Click "Publish"

**Alternative Solution**: Add proper IAM roles to service account:

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

### 2. Fix Google Sheets API Access

**Problem**: Service account getting "Invalid JWT Signature" errors when accessing Google Sheets.

**Solution**: Enable Google Sheets API and grant proper permissions:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "APIs & Services" > "Library"
4. Search for "Google Sheets API"
5. Click on it and click "Enable"
6. Go to "APIs & Services" > "Credentials"
7. Find your service account (same one used for Firebase)
8. Click on the service account email
9. Go to "Keys" tab
10. If no key exists, click "Add Key" > "Create new key" > "JSON"
11. Download the JSON file and extract the private key
12. Update your Vercel environment variable `FIREBASE_PRIVATE_KEY` with this new private key

**Alternative Solution**: Create a separate service account for Google Sheets:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "IAM & Admin" > "Service Accounts"
4. Click "Create Service Account"
5. Name it "google-sheets-service"
6. Grant it the "Editor" role
7. Create a new key (JSON format)
8. Download the JSON file
9. Add these environment variables to Vercel:
   - `GOOGLE_SHEETS_CLIENT_EMAIL` (from the JSON)
   - `GOOGLE_SHEETS_PRIVATE_KEY` (from the JSON)

### 3. Share Google Sheet with Service Account

**Problem**: Service account doesn't have access to the Google Sheet.

**Solution**: Share the Google Sheet with the service account:

1. Open your Google Sheet
2. Click "Share" button
3. Add the service account email (ends with `@your-project-id.iam.gserviceaccount.com`)
4. Give it "Editor" permissions
5. Click "Send" (no need to send notification)

### 4. Verify Environment Variables in Vercel

Ensure these environment variables are set in your Vercel deployment:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Google Sheets
GOOGLE_SHEET_ID=your-google-sheet-id

# Client-side Firebase (if not already set)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

### 5. Test the Fixes

After implementing the fixes, test the endpoints:

```bash
# Test environment variables
curl https://your-vercel-url.vercel.app/api/testVercelEnv

# Test Firebase
curl https://your-vercel-url.vercel.app/api/testFirebase

# Test Google Sheets
curl https://your-vercel-url.vercel.app/api/testGoogleSheets
```

## Prevention Measures

### 1. Add Health Check Endpoint

Create a health check endpoint to monitor service status:

```typescript
// pages/api/health.ts
export default async function handler(req, res) {
  const health = {
    firebase: false,
    googleSheets: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Test Firebase
    const admin = require('firebase-admin');
    const db = admin.firestore();
    await db.collection('test').limit(1).get();
    health.firebase = true;
  } catch (error) {
    console.error('Firebase health check failed:', error);
  }
  
  try {
    // Test Google Sheets
    const { GoogleSheetsService } = require('../../utils/googleSheets');
    await GoogleSheetsService.readLeagues();
    health.googleSheets = true;
  } catch (error) {
    console.error('Google Sheets health check failed:', error);
  }
  
  res.status(200).json(health);
}
```

### 2. Add Circuit Breaker Pattern

Implement circuit breaker pattern to gracefully handle service failures:

```typescript
// utils/circuitBreaker.ts
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private isOpen(): boolean {
    return this.failures >= this.threshold && 
           Date.now() - this.lastFailureTime < this.timeout;
  }
  
  private onSuccess(): void {
    this.failures = 0;
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}
```

### 3. Add Monitoring and Alerting

Set up monitoring for:
- API response times
- Error rates
- Service availability
- Environment variable status

## Emergency Rollback Plan

If the fixes don't work immediately:

1. **Temporary Workaround**: Use Google Sheets only (disable Firestore)
2. **Fallback Mode**: Implement local storage for development
3. **Graceful Degradation**: Show user-friendly error messages

## Long-term Solutions

1. **Separate Service Accounts**: Use different service accounts for different services
2. **Proper IAM Roles**: Implement least-privilege access
3. **Service Mesh**: Consider using a service mesh for better service communication
4. **Multi-region Deployment**: Deploy to multiple regions for better availability

## Support Contacts

If issues persist:
1. Check Vercel deployment logs
2. Review Firebase Console logs
3. Check Google Cloud Console logs
4. Contact support with specific error messages 