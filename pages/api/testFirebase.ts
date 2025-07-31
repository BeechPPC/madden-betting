import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== TESTING FIREBASE ADMIN SDK ===');
    
    // Check environment variables
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
    };
    
    console.log('Environment check:', envCheck);
    
    let firebaseStatus = 'Not tested';
    let authStatus = 'Not tested';
    let firestoreStatus = 'Not tested';
    
    // Test Firebase Admin SDK
    try {
      const admin = require('firebase-admin');
      
      // Check if already initialized
      if (admin.apps.length === 0) {
        console.log('Initializing Firebase Admin SDK...');
        
        // Parse private key properly
        let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
        
        // Remove quotes if present
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
        }
        
        // Replace \n with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');
        
        // Ensure proper PEM format
        if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----\n')) {
          privateKey = '-----BEGIN PRIVATE KEY-----\n' + privateKey;
        }
        if (!privateKey.endsWith('\n-----END PRIVATE KEY-----\n')) {
          privateKey = privateKey + '\n-----END PRIVATE KEY-----\n';
        }
        
        const app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
        });
        
        console.log('Firebase Admin SDK initialized successfully');
        firebaseStatus = 'Initialized successfully';
      } else {
        console.log('Firebase Admin SDK already initialized');
        firebaseStatus = 'Already initialized';
      }
      
      // Test Auth functionality
      try {
        const auth = admin.auth();
        console.log('Firebase Auth instance obtained successfully');
        authStatus = 'Working';
      } catch (authError: any) {
        console.error('Firebase Auth error:', authError);
        authStatus = `Error: ${authError.message}`;
      }
      
      // Test Firestore functionality (this is where the permission error usually occurs)
      try {
        const db = admin.firestore();
        console.log('Firestore instance obtained successfully');
        
        // Try a simple read operation
        const testQuery = db.collection('test').limit(1);
        await testQuery.get();
        console.log('Firestore read operation successful');
        firestoreStatus = 'Working';
      } catch (firestoreError: any) {
        console.error('Firestore error:', firestoreError);
        firestoreStatus = `Error: ${firestoreError.message}`;
        
        if (firestoreError.code === 'PERMISSION_DENIED') {
          console.error('PERMISSION_DENIED - This means:');
          console.error('1. Firestore security rules are too restrictive');
          console.error('2. Service account lacks proper permissions');
          console.error('3. Firestore is not in test mode');
          console.error('');
          console.error('SOLUTION: Go to Firebase Console > Firestore Database > Rules');
          console.error('And set rules to test mode temporarily:');
          console.error('rules_version = "2";');
          console.error('service cloud.firestore {');
          console.error('  match /databases/{database}/documents {');
          console.error('    match /{document=**} {');
          console.error('      allow read, write: if true;');
          console.error('    }');
          console.error('  }');
          console.error('}');
        }
      }
      
    } catch (error: any) {
      console.error('Firebase Admin SDK error:', error);
      firebaseStatus = `Error: ${error.message}`;
    }
    
    res.status(200).json({
      success: true,
      message: 'Firebase Admin SDK test completed',
      results: {
        environment: envCheck,
        firebase: firebaseStatus,
        auth: authStatus,
        firestore: firestoreStatus,
      },
      recommendations: {
        ifFirestoreFails: [
          'Go to Firebase Console > Firestore Database > Rules',
          'Set rules to test mode temporarily',
          'Or add proper IAM roles to service account',
          'See docs/firebase-setup.md for detailed instructions'
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