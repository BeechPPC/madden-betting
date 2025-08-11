#!/usr/bin/env node

// Check environment variables for the Madden Betting app
require('dotenv').config({ path: '.env.local' });

console.log('=== ENVIRONMENT VARIABLES CHECK ===\n');

const requiredVars = {
  // Client-side Firebase config
  'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  'NEXT_PUBLIC_FIREBASE_APP_ID': process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  
  // Server-side Firebase Admin SDK
  'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
  'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL,
  'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY,
  
  // Google Sheets (optional but recommended)
  'GOOGLE_SHEET_TEMPLATE_ID': process.env.GOOGLE_SHEET_TEMPLATE_ID,
  'GOOGLE_SHEET_ID': process.env.GOOGLE_SHEET_ID,
  
  // Google Sheets Service Account (REQUIRED for Google Sheets API)
  'GOOGLE_SERVICE_ACCOUNT_EMAIL': process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  'GOOGLE_PRIVATE_KEY': process.env.GOOGLE_PRIVATE_KEY,
};

console.log('Environment Variables Status:');
console.log('============================');

let missingVars = [];
let presentVars = [];

Object.entries(requiredVars).forEach(([key, value]) => {
  if (value) {
    presentVars.push(key);
    console.log(`✅ ${key}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
  } else {
    missingVars.push(key);
    console.log(`❌ ${key}: MISSING`);
  }
});

console.log('\nSummary:');
console.log('========');
console.log(`✅ Present: ${presentVars.length}`);
console.log(`❌ Missing: ${missingVars.length}`);

if (missingVars.length > 0) {
  console.log('\nMissing Variables:');
  console.log('==================');
  missingVars.forEach(varName => {
    console.log(`- ${varName}`);
  });
  
  console.log('\nTo fix the 400 error:');
  console.log('=====================');
  console.log('1. Create a .env.local file in your project root');
  console.log('2. Add the missing environment variables');
  console.log('3. Restart your development server');
  console.log('\nExample .env.local file:');
  console.log('========================');
  console.log('# Firebase Client Config');
  console.log('NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here');
  console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com');
  console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id');
  console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com');
  console.log('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id');
  console.log('NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id');
  console.log('');
  console.log('# Firebase Admin SDK');
  console.log('FIREBASE_PROJECT_ID=your_project_id');
  console.log('FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com');
  console.log('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n"');
  console.log('');
  console.log('# Google Sheets (optional)');
  console.log('GOOGLE_SHEET_TEMPLATE_ID=your_template_sheet_id');
  console.log('GOOGLE_SHEET_ID=your_legacy_sheet_id');
  console.log('');
  console.log('# Google Sheets Service Account (REQUIRED for Google Sheets API)');
  console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@your_project_id.iam.gserviceaccount.com');
  console.log('GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n"');
} else {
  console.log('\n🎉 All required environment variables are present!');
  console.log('The 400 error might be due to other issues. Check the browser console for more details.');
}

console.log('\nFor more help, see: docs/firebase-setup.md'); 