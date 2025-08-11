import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('=== TEST AUTH API CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', {
    authorization: req.headers.authorization ? 'Present' : 'Missing',
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent'],
  });

  try {
    // Test 1: Check if we can access environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    };

    console.log('Environment check:', envCheck);

    // Test 2: Try to verify authentication
    const user = await verifyAuth(req);
    console.log('Auth verification result:', user ? 'Success' : 'Failed');

    // Test 3: Check if we can access Firebase Admin SDK
    let firebaseAdminStatus = 'Not tested';
    try {
      const admin = require('firebase-admin');
      firebaseAdminStatus = `Available - ${admin.apps.length} apps`;
      console.log('Firebase Admin SDK status:', firebaseAdminStatus);
    } catch (error) {
      firebaseAdminStatus = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('Firebase Admin SDK error:', error);
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      authentication: {
        hasUser: !!user,
        userEmail: user?.email || null,
        userId: user?.uid || null,
      },
      firebaseAdmin: firebaseAdminStatus,
      request: {
        method: req.method,
        url: req.url,
        hasAuthHeader: !!req.headers.authorization,
        authHeaderType: req.headers.authorization ? req.headers.authorization.split(' ')[0] : null,
        authHeaderLength: req.headers.authorization ? req.headers.authorization.length : 0,
      }
    });

  } catch (error) {
    console.error('Test Auth API error:', error);
    return res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
} 