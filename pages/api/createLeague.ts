import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper headers to ensure JSON response
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== CREATE LEAGUE API CALLED ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', {
      authorization: req.headers.authorization ? 'Bearer [TOKEN]' : 'None',
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      host: req.headers.host,
    });
    
    // Test authentication first
    console.log('Starting authentication verification...');
    const user = await verifyAuth(req);
    
    if (!user) {
      console.log('Authentication failed - no user found');
      console.log('This means either:');
      console.log('1. No authorization header was sent');
      console.log('2. The token is invalid or expired');
      console.log('3. Firebase Admin SDK is not working properly');
      
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'User authentication failed - no valid user found',
        debug: {
          hasAuthHeader: !!req.headers.authorization,
          authHeaderStartsWithBearer: req.headers.authorization?.startsWith('Bearer ') || false,
          tokenLength: req.headers.authorization ? req.headers.authorization.split('Bearer ')[1]?.length || 0 : 0,
        }
      });
    }
    
    console.log('Authentication successful for user:', user.email);
    console.log('User UID:', user.uid);

    const { leagueName, adminEmail, adminUserId, displayName } = req.body;
    console.log('Request body:', { leagueName, adminEmail, adminUserId, displayName });

    if (!leagueName || !adminEmail || !adminUserId || !displayName) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'leagueName, adminEmail, adminUserId, and displayName are required'
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
    const leagueCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    res.status(200).json({
      success: true,
      message: 'League creation test successful - Firebase is working',
      league: {
        id: `test-league-${Date.now()}`,
        name: leagueName,
        leagueCode: leagueCode,
        createdAt: new Date().toISOString(),
        isActive: true,
        adminUserId: adminUserId,
        adminEmail: adminEmail,
      },
      userRole: {
        id: `test-role-${Date.now()}`,
        userId: adminUserId,
        userEmail: adminEmail,
        leagueId: `test-league-${Date.now()}`,
        role: 'admin',
        joinedAt: new Date().toISOString(),
        displayName: displayName,
      },
    });

  } catch (error) {
    console.error('Error in createLeague API:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    // Ensure we always return JSON, not HTML
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 