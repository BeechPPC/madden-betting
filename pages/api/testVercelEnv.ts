import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check all critical environment variables
    const envCheck = {
      // Firebase Admin SDK variables
      FIREBASE_PROJECT_ID: {
        exists: !!process.env.FIREBASE_PROJECT_ID,
        value: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET',
        length: process.env.FIREBASE_PROJECT_ID?.length || 0
      },
      FIREBASE_CLIENT_EMAIL: {
        exists: !!process.env.FIREBASE_CLIENT_EMAIL,
        value: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'NOT SET',
        length: process.env.FIREBASE_CLIENT_EMAIL?.length || 0
      },
      FIREBASE_PRIVATE_KEY: {
        exists: !!process.env.FIREBASE_PRIVATE_KEY,
        value: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'NOT SET',
        length: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
        hasNewlines: process.env.FIREBASE_PRIVATE_KEY?.includes('\n') || false,
        hasEscapedNewlines: process.env.FIREBASE_PRIVATE_KEY?.includes('\\n') || false
      },
      
      // Google Sheets variables
      GOOGLE_SHEET_ID: {
        exists: !!process.env.GOOGLE_SHEET_ID,
        value: process.env.GOOGLE_SHEET_ID ? 'SET' : 'NOT SET',
        length: process.env.GOOGLE_SHEET_ID?.length || 0
      },
      
      // Client-side Firebase variables
      NEXT_PUBLIC_FIREBASE_API_KEY: {
        exists: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        value: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT SET'
      },
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: {
        exists: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET'
      },
      
      // Environment info
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL
    };

    // Test Firebase Admin SDK initialization
    let firebaseTest = { success: false, error: null };
    try {
      const admin = require('firebase-admin');
      
      // Check if already initialized
      if (admin.apps.length === 0) {
        // Try to initialize
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
        });
      }
      
      firebaseTest = { success: true, error: null };
    } catch (firebaseError) {
      firebaseTest = { 
        success: false, 
        error: firebaseError instanceof Error ? firebaseError.message : 'Unknown Firebase error' 
      };
    }

    // Test Google Sheets API
    let googleSheetsTest = { success: false, error: null };
    try {
      const { google } = require('googleapis');
      
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      
      const sheets = google.sheets({ version: 'v4', auth });
      
      // Try to access the spreadsheet (just check if we can connect)
      await sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
      });
      
      googleSheetsTest = { success: true, error: null };
    } catch (sheetsError) {
      googleSheetsTest = { 
        success: false, 
        error: sheetsError instanceof Error ? sheetsError.message : 'Unknown Google Sheets error' 
      };
    }

    res.status(200).json({
      success: true,
      environment: envCheck,
      firebaseTest,
      googleSheetsTest,
      timestamp: new Date().toISOString(),
      recommendations: {
        ifFirebaseFails: [
          'Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Vercel environment variables',
          'Ensure FIREBASE_PRIVATE_KEY includes the full private key with proper formatting',
          'Verify the service account has proper IAM permissions'
        ],
        ifGoogleSheetsFails: [
          'Check GOOGLE_SHEET_ID in Vercel environment variables',
          'Ensure the service account has access to the Google Sheet',
          'Verify the Google Sheets API is enabled'
        ]
      }
    });

  } catch (error) {
    console.error('Error in testVercelEnv:', error);
    res.status(500).json({ 
      error: 'Failed to test environment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 