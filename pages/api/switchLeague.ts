import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('=== SWITCH LEAGUE API CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  try {
    // Verify user authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Authentication successful for user:', user.email);
    console.log('User UID:', user.uid);

    const { leagueId } = req.body;
    console.log('Request body:', { leagueId });

    if (!leagueId) {
      return res.status(400).json({ 
        error: 'Missing required field',
        details: 'leagueId is required'
      });
    }

    try {
      // Verify user has access to this league
      const membership = await FirestoreServerService.getUserLeagueMembership(user.uid, leagueId);
      if (!membership) {
        console.log('User does not have access to league:', leagueId);
        return res.status(403).json({ 
          error: 'Access denied',
          details: 'User does not have access to this league'
        });
      }

      // Verify the league exists and is active
      const league = await FirestoreServerService.getLeague(leagueId);
      if (!league || !league.isActive) {
        console.log('League not found or inactive:', leagueId);
        return res.status(404).json({ 
          error: 'League not found',
          details: 'League does not exist or is inactive'
        });
      }

      // Get or create user profile
      let userProfile = await FirestoreServerService.getUserProfile(user.uid);
      if (!userProfile) {
        // Create user profile if it doesn't exist
        userProfile = await FirestoreServerService.createUserProfile({
          userId: user.uid,
          userEmail: user.email || '',
          displayName: user.displayName || user.email || 'Unknown User',
          defaultLeagueId: leagueId,
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        });
      } else {
        // Update user profile with new default league
        await FirestoreServerService.updateUserProfile(user.uid, { 
          defaultLeagueId: leagueId 
        });
      }

      // Update last accessed timestamp for the membership
      await FirestoreServerService.updateMembershipAccess(user.uid, leagueId);

      console.log('Successfully switched to league:', leagueId);

      return res.status(200).json({
        success: true,
        message: 'League switched successfully',
        data: {
          leagueId,
          leagueName: league.name,
          role: membership.role,
          defaultLeagueId: leagueId,
        }
      });

    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      return res.status(500).json({ 
        error: 'Database error',
        details: firestoreError instanceof Error ? firestoreError.message : 'Unknown database error'
      });
    }

  } catch (error) {
    console.error('Error in switchLeague:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 