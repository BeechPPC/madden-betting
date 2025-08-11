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
    console.log('=== DEBUG LEAGUE SETTINGS API CALLED ===');
    
    // Verify user authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Authentication successful for user:', user.email);

    // Get the user's current league membership
    const userRole = await FirestoreServerService.getUserRole(user.uid);
    if (!userRole) {
      console.log('No user role found for user:', user.uid);
      return res.status(404).json({ error: 'User not found in any league' });
    }

    console.log('User role found:', {
      userId: userRole.userId,
      leagueId: userRole.leagueId,
      role: userRole.role,
      isActive: userRole.isActive
    });

    // Get the league
    console.log('Attempting to get league with ID:', userRole.leagueId);
    let league = await FirestoreServerService.getLeague(userRole.leagueId);
    console.log('League lookup result:', league ? 'League found' : 'League not found');
    
    if (!league) {
      console.log('League not found in database. User role leagueId:', userRole.leagueId);
      
      // Try to get all leagues to see what's available
      try {
        const allLeagues = await FirestoreServerService.getAllLeagues();
        console.log('Available leagues in database:', allLeagues.map(l => ({ id: l.id, name: l.name, code: l.leagueCode })));
        
        // If there are leagues, try to find one that matches the user's role
        if (allLeagues.length > 0) {
          const matchingLeague = allLeagues.find(l => l.adminUserId === user.uid);
          if (matchingLeague) {
            console.log('Found matching league by admin user ID:', matchingLeague.id);
            league = matchingLeague;
          }
        }
      } catch (error) {
        console.log('Error getting all leagues:', error);
      }
    }

    // Get user memberships
    const userMemberships = await FirestoreServerService.getUserLeagueMemberships(user.uid);
    
    // Get user profile
    const userProfile = await FirestoreServerService.getUserProfile(user.uid);

    return res.status(200).json({
      success: true,
      debug: {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        },
        userRole: userRole ? {
          id: userRole.id,
          userId: userRole.userId,
          leagueId: userRole.leagueId,
          role: userRole.role,
          isActive: userRole.isActive,
          joinedAt: userRole.joinedAt
        } : null,
        userMemberships: userMemberships.map(m => ({
          id: m.id,
          userId: m.userId,
          leagueId: m.leagueId,
          role: m.role,
          isActive: m.isActive,
          lastAccessedAt: m.lastAccessedAt
        })),
        userProfile: userProfile ? {
          id: userProfile.id,
          userId: userProfile.userId,
          defaultLeagueId: userProfile.defaultLeagueId,
          displayName: userProfile.displayName
        } : null,
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
        allLeagues: await FirestoreServerService.getAllLeagues().then(leagues => 
          leagues.map(l => ({
            id: l.id,
            name: l.name,
            leagueCode: l.leagueCode,
            adminUserId: l.adminUserId,
            adminEmail: l.adminEmail,
            settings: l.settings
          }))
        )
      }
    });

  } catch (error) {
    console.error('Error in debugLeagueSettings:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 