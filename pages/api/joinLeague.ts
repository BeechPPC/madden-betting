import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper headers to ensure JSON response
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== JOIN LEAGUE API CALLED ===');
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

    const { leagueCode, userEmail, userId, displayName } = req.body;
    console.log('Request body:', { leagueCode, userEmail, userId, displayName });

    if (!leagueCode || !userEmail || !userId || !displayName) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'leagueCode, userEmail, userId, and displayName are required'
      });
    }

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

    // For now, return a simple success response to test the flow
    console.log('All checks passed, returning success response');
    
    // Generate a simple league code for testing
    const testLeagueCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    res.status(200).json({
      success: true,
      message: 'League join test successful - Firebase is working',
      league: {
        id: `test-league-${Date.now()}`,
        name: 'Test League',
        leagueCode: testLeagueCode,
        createdAt: new Date().toISOString(),
        isActive: true,
        adminUserId: 'test-admin-id',
        adminEmail: 'test-admin@example.com',
      },
      userRole: {
        id: `test-role-${Date.now()}`,
        userId: userId,
        userEmail: userEmail,
        leagueId: `test-league-${Date.now()}`,
        role: 'user',
        joinedAt: new Date().toISOString(),
        displayName: displayName,
      },
    });

  } catch (error) {
    console.error('Error in joinLeague API:', error);
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