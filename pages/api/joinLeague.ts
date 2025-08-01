import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';
import { GoogleSheetsService } from '../../utils/googleSheets';

// Helper function to validate league code format
function isValidLeagueCode(code: string): boolean {
  // Check if the code matches the format xxx-xxx-xxxx
  const leagueCodePattern = /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{4}$/;
  return leagueCodePattern.test(code);
}

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

    // Validate league code format
    if (!isValidLeagueCode(leagueCode)) {
      console.log('Invalid league code format:', leagueCode);
      return res.status(400).json({
        error: 'Invalid league code format',
        details: 'League code must be in the format XXX-XXX-XXXX (letters and numbers)'
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

    // Find the league by code
    const league = await FirestoreServerService.getLeagueByCode(leagueCode);
    if (!league) {
      console.log('League not found with code:', leagueCode);
      return res.status(404).json({
        error: 'League not found',
        details: 'No active league found with the provided code'
      });
    }

    // Check if user is already a member of this league
    const existingUserRole = await FirestoreServerService.getUserRoleByLeague(userId, league.id);
    if (existingUserRole) {
      console.log('User already a member of this league:', userId);
      return res.status(400).json({
        error: 'Already a member',
        details: 'You are already a member of this league'
      });
    }

    try {
      // Create the user role for joining the league
      const userRole = await FirestoreServerService.createUserRole({
        userId: userId,
        userEmail: userEmail,
        leagueId: league.id,
        role: 'user',
        displayName: displayName,
        isActive: true,
      });

      // Update the league member count
      const leagueMembers = await FirestoreServerService.getLeagueMembers(league.id);
      await FirestoreServerService.updateLeagueMemberCount(league.id, leagueMembers.length);

      console.log('User successfully joined league:', league.id);
      
      // Write to Google Sheets as backup (non-blocking)
      try {
        await GoogleSheetsService.writeUserRole({
          userId: userRole.userId,
          userEmail: userRole.userEmail,
          displayName: userRole.displayName,
          leagueId: userRole.leagueId,
          role: userRole.role,
          joinedAt: userRole.joinedAt.toDate().toISOString(),
        });
        
        console.log('User role data written to Google Sheets');
      } catch (sheetsError) {
        console.error('Failed to write to Google Sheets (non-critical):', sheetsError);
        // Don't fail the request if Google Sheets fails
      }
      
      res.status(200).json({
        success: true,
        message: 'Successfully joined the league',
        league: {
          id: league.id,
          name: league.name,
          leagueCode: league.leagueCode,
          createdAt: league.createdAt.toDate().toISOString(),
          isActive: league.isActive,
          adminUserId: league.adminUserId,
          adminEmail: league.adminEmail,
        },
        userRole: {
          id: userRole.id,
          userId: userRole.userId,
          userEmail: userRole.userEmail,
          leagueId: userRole.leagueId,
          role: userRole.role,
          joinedAt: userRole.joinedAt.toDate().toISOString(),
          displayName: userRole.displayName,
        },
      });
    } catch (firestoreError) {
      console.error('Firestore error joining league:', firestoreError);
      return res.status(500).json({ 
        error: 'Failed to join league in database',
        details: firestoreError instanceof Error ? firestoreError.message : 'Unknown database error'
      });
    }

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