import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== GET CURRENT USER LEAGUES API CALLED ===');
    
    // Verify user authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Authentication successful for user:', user.email);

    // Get user's profile to find their current active league
    const userProfile = await FirestoreServerService.getUserProfile(user.uid);
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get user's league memberships
    const userMemberships = await FirestoreServerService.getUserLeagueMemberships(user.uid);
    
    // Get league details for each membership
    const leaguesWithDetails = await Promise.all(
      userMemberships.map(async (membership) => {
        const league = await FirestoreServerService.getLeague(membership.leagueId);
        return {
          ...membership,
          league: league ? {
            id: league.id,
            name: league.name,
            leagueCode: league.leagueCode,
            adminUserId: league.adminUserId,
            adminEmail: league.adminEmail,
            isActive: league.isActive,
            isPaid: league.isPaid,
            settings: league.settings,
            createdAt: league.createdAt
          } : null,
          isCurrentLeague: league?.id === userProfile.defaultLeagueId
        };
      })
    );

    return res.status(200).json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      },
      userProfile: {
        id: userProfile.id,
        userId: userProfile.userId,
        userEmail: userProfile.userEmail,
        displayName: userProfile.displayName,
        defaultLeagueId: userProfile.defaultLeagueId,
        preferences: userProfile.preferences
      },
      leagues: leaguesWithDetails,
      currentLeagueId: userProfile.defaultLeagueId
    });

  } catch (error) {
    console.error('Error getting current user leagues:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 