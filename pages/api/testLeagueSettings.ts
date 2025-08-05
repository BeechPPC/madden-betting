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
    console.log('=== TEST LEAGUE SETTINGS API CALLED ===');
    
    // Verify user authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Authentication successful for user:', user.email);

    // Get the user's current league membership
    const userRole = await FirestoreServerService.getUserRole(user.uid);
    if (!userRole) {
      return res.status(404).json({ error: 'User not found in any league' });
    }

    // Get the league
    const league = await FirestoreServerService.getLeague(userRole.leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    console.log('League data:', league);

    return res.status(200).json({
      success: true,
      league: {
        id: league.id,
        name: league.name,
        settings: league.settings || null,
        hasSettings: !!league.settings,
        settingsKeys: league.settings ? Object.keys(league.settings) : []
      },
      userRole: userRole.role
    });

  } catch (error) {
    console.error('Error testing league settings:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 