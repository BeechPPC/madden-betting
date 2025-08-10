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
    console.log('=== DEBUG LEAGUE CODES API CALLED ===');
    
    // Verify user authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Authentication successful for user:', user.email);

    // Get user role
    const userRole = await FirestoreServerService.getUserRole(user.uid);
    console.log('User role:', userRole);

    // Get all leagues
    const allLeagues = await FirestoreServerService.getAllLeagues();
    console.log('All leagues:', allLeagues);

    // Get user's league memberships
    const userMemberships = await FirestoreServerService.getUserLeagueMemberships(user.uid);
    console.log('User memberships:', userMemberships);

    return res.status(200).json({
      success: true,
      userRole,
      allLeagues: allLeagues.map(l => ({
        id: l.id,
        name: l.name,
        code: l.leagueCode,
        isActive: l.isActive,
        adminUserId: l.adminUserId
      })),
      userMemberships: userMemberships.map(m => ({
        id: m.id,
        leagueId: m.leagueId,
        role: m.role,
        isActive: m.isActive
      }))
    });

  } catch (error) {
    console.error('Error in debug league codes:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 