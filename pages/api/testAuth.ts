import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== TESTING AUTHENTICATION FLOW ===');
    
    // Check if Firebase Admin SDK is available
    let firebaseStatus = 'Not tested';
    let authStatus = 'Not tested';
    let tokenInfo = 'No token';
    let initializationDetails = 'Not attempted';
    
    try {
      const admin = require('firebase-admin');
      console.log('Firebase Admin SDK imported successfully');
      
      // Check if initialized
      if (admin.apps.length === 0) {
        console.log('No Firebase apps found, attempting to initialize...');
        
        // Try to initialize Firebase Admin SDK
        try {
          // Check environment variables
          const envVars = {
            FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
            FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
            FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
          };
          
          console.log('Environment variables check:', {
            FIREBASE_PROJECT_ID: !!envVars.FIREBASE_PROJECT_ID,
            FIREBASE_CLIENT_EMAIL: !!envVars.FIREBASE_CLIENT_EMAIL,
            FIREBASE_PRIVATE_KEY: !!envVars.FIREBASE_PRIVATE_KEY,
          });
          
          if (!envVars.FIREBASE_PROJECT_ID || !envVars.FIREBASE_CLIENT_EMAIL || !envVars.FIREBASE_PRIVATE_KEY) {
            throw new Error('Missing required environment variables');
          }
          
          // Parse private key
          let privateKey = envVars.FIREBASE_PRIVATE_KEY;
          if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
          }
          privateKey = privateKey.replace(/\\n/g, '\n');
          
          console.log('Initializing Firebase Admin SDK...');
          const app = admin.initializeApp({
            credential: admin.credential.cert({
              projectId: envVars.FIREBASE_PROJECT_ID,
              clientEmail: envVars.FIREBASE_CLIENT_EMAIL,
              privateKey: privateKey,
            }),
          });
          
          console.log('Firebase Admin SDK initialized successfully:', app.name);
          initializationDetails = 'Successfully initialized';
          firebaseStatus = 'Success: Firebase Admin SDK initialized';
          
        } catch (initError: any) {
          console.error('Failed to initialize Firebase Admin SDK:', initError);
          initializationDetails = `Failed: ${initError.message}`;
          firebaseStatus = `Failed: ${initError.message}`;
        }
      } else {
        console.log('Firebase apps found:', admin.apps.length);
        firebaseStatus = `Success: ${admin.apps.length} Firebase app(s) already initialized`;
        initializationDetails = 'Already initialized';
      }
      
      // Test authentication if token is provided
      const authHeader = req.headers.authorization;
      console.log('Auth header present:', !!authHeader);
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1];
        tokenInfo = `Token length: ${token.length}, starts with: ${token.substring(0, 20)}...`;
        console.log('Token extracted:', tokenInfo);
        
        try {
          const auth = admin.auth();
          console.log('Firebase Auth instance obtained');
          
          const decodedToken = await auth.verifyIdToken(token);
          console.log('Token verified successfully');
          console.log('User email:', decodedToken.email);
          console.log('User UID:', decodedToken.uid);
          
          authStatus = `Success: Token verified for user ${decodedToken.email}`;
        } catch (authError: any) {
          console.error('Token verification failed:', authError);
          authStatus = `Failed: ${authError.message || 'Unknown error'}`;
          console.error('Auth error details:', {
            code: authError.code,
            message: authError.message,
            stack: authError.stack
          });
        }
      } else {
        authStatus = 'No token provided (expected for test)';
        console.log('No authorization header found');
      }
      
    } catch (firebaseError: any) {
      firebaseStatus = `Failed: ${firebaseError.message || 'Unknown error'}`;
      console.error('Firebase Admin SDK error:', firebaseError);
    }
    
    // Check environment variables
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
    };
    
    res.status(200).json({
      success: true,
      message: 'Authentication test completed',
      envCheck,
      firebaseStatus,
      authStatus,
      tokenInfo,
      initializationDetails,
      headers: {
        authorization: !!req.headers.authorization,
        'content-type': req.headers['content-type'],
      }
    });
    
  } catch (error) {
    console.error('Error in testAuth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test authentication',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 