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

  console.log('=== GET USER LEAGUES API CALLED ===');
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

    // Try to get user profile and memberships
    try {
      // Get user profile
      const userProfile = await FirestoreServerService.getUserProfile(user.uid);
      
      // Get all user league memberships
      const memberships = await FirestoreServerService.getUserLeagueMemberships(user.uid);
      
      if (memberships.length === 0) {
        // User has no memberships - they need to create or join a league
        console.log('No user memberships found - user needs to create or join a league');
        return res.status(404).json({ 
          error: 'No leagues found',
          message: 'User has no league memberships'
        });
      }

      // Get league information for each membership
      const leagues = await Promise.all(
        memberships.map(async (membership) => {
          const league = await FirestoreServerService.getLeague(membership.leagueId);
          return league;
        })
      );

      // Filter out any null leagues (shouldn't happen, but safety check)
      const validLeagues = leagues.filter(league => league !== null);
      
      // Determine current league (from profile default or most recently accessed)
      const currentLeagueId = userProfile?.defaultLeagueId || memberships[0]?.leagueId;
      const currentLeague = validLeagues.find(league => league?.id === currentLeagueId);
      const currentMembership = memberships.find(membership => membership.leagueId === currentLeagueId);

      // Enrich memberships with league names
      const enrichedMemberships = memberships.map(membership => {
        const league = validLeagues.find(l => l?.id === membership.leagueId);
        return {
          ...membership,
          leagueName: league?.name || 'Unknown League',
          leagueCode: league?.leagueCode || '',
        };
      });

      return res.status(200).json({
        userProfile: userProfile ? {
          id: userProfile.id,
          userId: userProfile.userId,
          userEmail: userProfile.userEmail,
          displayName: userProfile.displayName,
          defaultLeagueId: userProfile.defaultLeagueId,
          preferences: userProfile.preferences,
          createdAt: userProfile.createdAt.toDate().toISOString(),
          updatedAt: userProfile.updatedAt.toDate().toISOString(),
        } : null,
        memberships: enrichedMemberships.map(membership => ({
          id: membership.id,
          userId: membership.userId,
          userEmail: membership.userEmail,
          leagueId: membership.leagueId,
          leagueName: membership.leagueName,
          leagueCode: membership.leagueCode,
          role: membership.role,
          joinedAt: membership.joinedAt.toDate().toISOString(),
          lastAccessedAt: membership.lastAccessedAt.toDate().toISOString(),
          displayName: membership.displayName,
          isPremium: membership.isPremium || false,
          isActive: membership.isActive,
        })),
        leagues: validLeagues.map(league => ({
          id: league!.id,
          name: league!.name,
          leagueCode: league!.leagueCode,
          adminEmail: league!.adminEmail,
          createdAt: league!.createdAt.toDate().toISOString(),
          isActive: league!.isActive,
          adminUserId: league!.adminUserId,
          memberCount: league!.memberCount,
          // Payment fields for per-league one-time payment
          isPaid: league!.isPaid || false,
          paidAt: league!.paidAt ? league!.paidAt.toDate().toISOString() : undefined,
          paymentId: league!.paymentId,
        })),
        currentLeague: currentLeague ? {
          id: currentLeague.id,
          name: currentLeague.name,
          leagueCode: currentLeague.leagueCode,
          adminEmail: currentLeague.adminEmail,
          createdAt: currentLeague.createdAt.toDate().toISOString(),
          isActive: currentLeague.isActive,
          adminUserId: currentLeague.adminUserId,
          memberCount: currentLeague.memberCount,
          // Payment fields for per-league one-time payment
          isPaid: currentLeague.isPaid || false,
          paidAt: currentLeague.paidAt ? currentLeague.paidAt.toDate().toISOString() : undefined,
          paymentId: currentLeague.paymentId,
        } : null,
        currentMembership: currentMembership ? {
          id: currentMembership.id,
          userId: currentMembership.userId,
          userEmail: currentMembership.userEmail,
          leagueId: currentMembership.leagueId,
          role: currentMembership.role,
          joinedAt: currentMembership.joinedAt.toDate().toISOString(),
          lastAccessedAt: currentMembership.lastAccessedAt.toDate().toISOString(),
          displayName: currentMembership.displayName,
          isPremium: currentMembership.isPremium || false,
          isActive: currentMembership.isActive,
        } : null,
        source: 'firestore'
      });

    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      return res.status(500).json({ 
        error: 'Database error',
        details: firestoreError instanceof Error ? firestoreError.message : 'Unknown database error'
      });
    }

  } catch (error) {
    console.error('Error in getUserLeagues:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 