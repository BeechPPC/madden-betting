import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const health = {
    status: 'healthy',
    services: {
      firebase: false,
      googleSheets: false,
      firestore: false,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasGoogleSheetId: !!process.env.GOOGLE_SHEET_ID,
    },
    timestamp: new Date().toISOString(),
    errors: [] as string[]
  };

  try {
    // Test Firebase Admin SDK initialization
    const admin = require('firebase-admin');
    
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
    
    health.services.firebase = true;
    
    // Test Firestore
    try {
      const db = admin.firestore();
      await db.collection('test').limit(1).get();
      health.services.firestore = true;
    } catch (firestoreError) {
      health.errors.push(`Firestore error: ${firestoreError instanceof Error ? firestoreError.message : 'Unknown error'}`);
    }
    
  } catch (firebaseError) {
    health.errors.push(`Firebase error: ${firebaseError instanceof Error ? firebaseError.message : 'Unknown error'}`);
  }

  try {
    // Test Google Sheets
    const { GoogleSheetsService } = require('../../utils/googleSheets');
    await GoogleSheetsService.readLeagues();
    health.services.googleSheets = true;
  } catch (sheetsError) {
    health.errors.push(`Google Sheets error: ${sheetsError instanceof Error ? sheetsError.message : 'Unknown error'}`);
  }

  // Determine overall health status
  if (health.errors.length > 0) {
    health.status = 'degraded';
  }
  
  if (!health.services.firebase && !health.services.googleSheets) {
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(health);
} 