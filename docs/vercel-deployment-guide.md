# Vercel Deployment Guide

## Problem
The app is failing to create leagues on Vercel with the error: "Failed to create league in both Firestore and Google Sheets"

## Root Cause
Environment variables are not properly configured on Vercel, causing both Firebase and Google Sheets to fail.

## Solution

### Step 1: Set Up Environment Variables on Vercel

1. **Go to Vercel Dashboard**
   - Visit [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your `madden-betting` project

2. **Navigate to Settings**
   - Click on your project
   - Go to **Settings** tab
   - Click **Environment Variables**

3. **Add the following environment variables:**

#### Firebase Admin SDK Variables
```
FIREBASE_PROJECT_ID = madden-betting-7e668
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@madden-betting-7e668.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDpPXLHSu3ojbMg\nv7c9kzJjrnQsGDiFd0sXkzGut45VekyXNLMR5or3br+A/4lrX42SVKfUxZeGhx4N\nVGzCzryBhsh/EwSZ3e1QKRAMiscyqcJA5Vh21p7SFMVolpFLa9iWkgvdMH9ssrnb\nKwslZTbbiwzlry8dzZVqmXcuuE3ccoIpmb134H8ICpiYvw8wz6VdXeO8iBROD4nl\njuO6gVvQsDzzYXdzNsjmVvhF5YT/XGfxsR6NKteP/91zcM7AcDXVN+FM7e9bWwiC\nbKe2aD4N+zjuhcufB/u8oR5yRa83huXz+5nc4Yo4SdV+BcOtH6xXjSj7aI6WgUqR\ne45A5PhfAgMBAAECggEABaMPQC/+tV7TV1vHm6ZDX5n3dpqODYyECC/t0Y/f60K9\nt7vPOVDULZKDvPDjSwqJdK6bsPtAV1p/O4nXG3nJ0x5esx+F19gl8TvrOa2S9RXN\nB/d8no0L7ctEHoWt2xMVexIdiLBKEoAnsltrqHEC4eYOHwqPiqdaajPT594OPhRX\nx97OZZY2r2XpLInVd7iwVE20klwPpJbEwEBqCneYCZuhVcjY2O/x0sRRmEoyQ2Gj\nOXeptMqZ67mH0zK/D0McOXjfz8AgFZqqdQ8yJaWQ/J12n4t/VPUOajh1BrM8FTlV\njFjlTi6m74ga5Py/6qf0pN24kgSeaMqXuZbp5CtfHQKBgQD7X2k1G/mVX2SdlTQ0\nwv9lWNtZgxnglimyEOEiu9oZ/smYkcaoa9PRHOZTzmsC9AaswFRc0niJzYV4E13G\nEu4aic00e8/UNCddocpk3fiKSJwyjQB01umErEIuBy3cTDGt4U7z6rD+rGjeRDrO\njnE24Gr1K6DcxaoZ31rThhmtgwKBgQDtiJZpOxs4NRHrS7k06iS9eSZquqEZBpeD\nMy/x9FHegA7+RoTe73eZCiX+UDyxiKCk4zfQL6HIl22/r/ywEqSJAmkHc/NA1vI7\nMIiHdxIIyhlG5p3o8qDvNF6bu6dqXq7QIlAPZQgzRMn2SiBHiD6AEIXOi+HwM7Dh\n0zTfBHxO9QKBgQDgma6KSpWltpdTCeacogLKzisnfrFXbzSQKu7ONyS4B2SfUtk6\n0SVwea7/ALey6tEv96UpTtFu51izIjKucWmYArp8g4f95h+qVI5fs8mH3TrbHAtl\nWkVKSxPSxo1egiH9aAxAetlspCYLOtGEj9dunfRTXYkc2eyTs3MW/oHg+wKBgQC7\nAldRIAzNEtM5ydNVuqYUWmaJjse4mTz+OXWc63rtTyr+vGxtzGD/p0LEV02BhIzd\nZFqT2HxqHfZ0/UxXH0ZU7AXerUYtnUz2lr5W0MLtEpgV/wkB1swnp7Z4q6QiFctR\n6EHZ7PQo0RakhjWlu7lhQCDova6zWy7+jDdLAhAQZQKBgBOCPY2R+P5aRmc3Coom\nrmPB0KFHhzb3Cy8OEQkgXgsxIto5LKjgHZ309rRZLyV1bI3SJQgrHhxRlk3VaHSD\nrjyzuo0cq1Z4X86P7jzXn0nwzciuyLCBZ79otIiHC04hD8oaigS9+R7/WcqL6qG8\nPbd1v5aoNw+50dBSQ5LJWXkr\n-----END PRIVATE KEY-----\n"
```

#### Google Sheets Variables
```
GOOGLE_SHEET_ID = 1jy8t7tKvsbAGMnWUoXN1Oji5F00Ewb6Qi62OwTitlnw
```

#### Client-Side Firebase Variables
```
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyC-LRGeHIgBbbf3ByKe36ieb49W_N6_FUU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = madden-betting-7e668.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = madden-betting-7e668
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = madden-betting-7e668.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 200222023772
NEXT_PUBLIC_FIREBASE_APP_ID = 1:200222023772:web:9ab07082ae86adfeb34699
```

### Step 2: Important Notes

#### FIREBASE_PRIVATE_KEY Format
- **Must include the full private key** with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- **Must include `\n` characters** for newlines (not actual newlines)
- **Must be wrapped in quotes** in Vercel

#### Environment Selection
- Set all variables for **Production**, **Preview**, and **Development** environments
- Click **Save** after adding each variable

### Step 3: Test the Configuration

1. **Deploy the changes** to Vercel
2. **Visit the test endpoint**: `https://your-app.vercel.app/api/testVercelEnv`
3. **Check the response** to see if all environment variables are properly set

### Step 4: Verify Firebase Permissions

1. **Go to Google Cloud Console**
2. **Navigate to IAM & Admin > IAM**
3. **Find the service account**: `firebase-adminsdk-fbsvc@madden-betting-7e668.iam.gserviceaccount.com`
4. **Ensure it has these roles**:
   - `Cloud Datastore User`
   - `Firebase Admin`
   - `Service Account Token Creator`

### Step 5: Verify Google Sheets Access

1. **Open your Google Sheet**: `1jy8t7tKvsbAGMnWUoXN1Oji5F00Ewb6Qi62OwTitlnw`
2. **Click Share** (top right)
3. **Add the service account**: `firebase-adminsdk-fbsvc@madden-betting-7e668.iam.gserviceaccount.com`
4. **Give it Editor permissions**

## Troubleshooting

### If the test endpoint shows missing variables:
1. Double-check the variable names (case-sensitive)
2. Ensure all variables are saved for the correct environments
3. Redeploy the app after adding variables

### If Firebase test fails:
1. Verify the private key format
2. Check IAM permissions
3. Ensure the service account exists

### If Google Sheets test fails:
1. Verify the spreadsheet ID
2. Check sharing permissions
3. Ensure Google Sheets API is enabled

## Test Commands

After deployment, test these endpoints:

```bash
# Test environment variables
curl https://your-app.vercel.app/api/testVercelEnv

# Test Firebase connection
curl https://your-app.vercel.app/api/testFirebase

# Test Google Sheets connection
curl https://your-app.vercel.app/api/testGoogleSheets
```

## Expected Results

After proper configuration:
- ✅ All environment variables should show as "SET"
- ✅ Firebase test should show "success: true"
- ✅ Google Sheets test should show "success: true"
- ✅ League creation should work without errors 