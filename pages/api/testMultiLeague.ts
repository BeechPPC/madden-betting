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

  console.log('=== TEST MULTI LEAGUE API CALLED ===');

  try {
    // Verify user authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Testing multi-league functionality for user:', user.email);

    try {
      // Test 1: Check if user has a profile
      const userProfile = await FirestoreServerService.getUserProfile(user.uid);
      console.log('User profile exists:', !!userProfile);

      // Test 2: Check if user has memberships
      const memberships = await FirestoreServerService.getUserLeagueMemberships(user.uid);
      console.log('User memberships count:', memberships.length);

      // Test 3: Check legacy user role
      const legacyRole = await FirestoreServerService.getUserRole(user.uid);
      console.log('Legacy user role exists:', !!legacyRole);

      // Test 4: Get all leagues for user
      const leagues = await Promise.all(
        memberships.map(async (membership) => {
          const league = await FirestoreServerService.getLeague(membership.leagueId);
          return league;
        })
      );

      const validLeagues = leagues.filter(league => league !== null);

      return res.status(200).json({
        success: true,
        message: 'Multi-league test completed',
        data: {
          userId: user.uid,
          userEmail: user.email,
          hasProfile: !!userProfile,
          hasMemberships: memberships.length > 0,
          hasLegacyRole: !!legacyRole,
          membershipsCount: memberships.length,
          leaguesCount: validLeagues.length,
          memberships: memberships.map(membership => ({
            id: membership.id,
            leagueId: membership.leagueId,
            role: membership.role,
            isActive: membership.isActive,
            joinedAt: membership.joinedAt.toDate().toISOString(),
            lastAccessedAt: membership.lastAccessedAt.toDate().toISOString(),
          })),
          leagues: validLeagues.map(league => ({
            id: league!.id,
            name: league!.name,
            leagueCode: league!.leagueCode,
            isActive: league!.isActive,
          })),
          userProfile: userProfile ? {
            id: userProfile.id,
            defaultLeagueId: userProfile.defaultLeagueId,
            preferences: userProfile.preferences,
            createdAt: userProfile.createdAt.toDate().toISOString(),
            updatedAt: userProfile.updatedAt.toDate().toISOString(),
          } : null,
          legacyRole: legacyRole ? {
            id: legacyRole.id,
            leagueId: legacyRole.leagueId,
            role: legacyRole.role,
            joinedAt: legacyRole.joinedAt.toDate().toISOString(),
          } : null,
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
    console.error('Error in testMultiLeague:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 