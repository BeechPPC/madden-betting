import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== TESTING ENVIRONMENT VARIABLES ===');
    
    // Check all environment variables
    const envCheck = {
      // Client-side Firebase config
      NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      
      // Server-side Firebase Admin SDK
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      
      // Other environment variables
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    };
    
    console.log('Environment check:', envCheck);
    
    // Check for missing critical variables
    const missingClientVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
    ].filter(varName => !process.env[varName]);
    
    const missingServerVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ].filter(varName => !process.env[varName]);
    
    const issues = [];
    
    if (missingClientVars.length > 0) {
      issues.push(`Missing client-side Firebase variables: ${missingClientVars.join(', ')}`);
    }
    
    if (missingServerVars.length > 0) {
      issues.push(`Missing server-side Firebase variables: ${missingServerVars.join(', ')}`);
    }
    
    // Test Firebase Admin SDK initialization
    let firebaseStatus = 'Not tested';
    try {
      const admin = require('firebase-admin');
      console.log('Firebase Admin SDK imported successfully');
      
      if (admin.apps.length > 0) {
        firebaseStatus = 'Already initialized';
      } else {
        firebaseStatus = 'Not initialized';
      }
    } catch (error) {
      firebaseStatus = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    
    res.status(200).json({
      success: true,
      message: 'Environment variables test completed',
      environment: envCheck,
      issues: issues,
      firebaseStatus: firebaseStatus,
      recommendations: {
        ifMissingClientVars: [
          'Go to Vercel Dashboard > Your Project > Settings > Environment Variables',
          'Add the missing NEXT_PUBLIC_* variables from your .env.local file'
        ],
        ifMissingServerVars: [
          'Go to Vercel Dashboard > Your Project > Settings > Environment Variables',
          'Add the missing FIREBASE_* variables from your .env.local file',
          'Make sure to include the full private key with proper formatting'
        ],
        ifFirebaseNotInitialized: [
          'Check that all FIREBASE_* environment variables are set correctly',
          'Verify the private key format includes proper newlines',
          'Check Vercel function logs for detailed error messages'
        ]
      }
    });
    
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 