import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper headers to ensure JSON response
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== GET USER ROLE API CALLED ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    const user = await verifyAuth(req);
    if (!user) {
      console.log('Authentication failed - no user found');
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'User authentication failed - no valid user found'
      });
    }

    console.log('Authentication successful for user:', user.email);
    console.log('User UID:', user.uid);

    // Test Firebase Admin SDK availability (without Firestore access)
    try {
      const admin = require('firebase-admin');
      console.log('Firebase Admin SDK imported successfully');
      console.log('Available apps:', admin.apps.length);
      
      // Test auth functionality instead of Firestore
      const auth = admin.auth();
      console.log('Firebase Auth instance obtained successfully');
      
    } catch (firebaseError) {
      console.error('Firebase Admin SDK error:', firebaseError);
      return res.status(500).json({ 
        error: 'Firebase configuration error',
        details: firebaseError instanceof Error ? firebaseError.message : 'Unknown Firebase error',
        suggestion: 'Please check your Firebase Admin SDK configuration and environment variables'
      });
    }

    // For now, return null for userRole and league to indicate user needs to create/join a league
    console.log('User has no role yet, returning null');
    
    res.status(200).json({
      userRole: null,
      league: null,
      message: 'User has no role yet - needs to create or join a league'
    });

  } catch (error) {
    console.error('Error in getUserRole API:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 