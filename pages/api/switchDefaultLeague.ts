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

  try {
    console.log('=== SWITCH DEFAULT LEAGUE API CALLED ===');
    
    // Verify user authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Authentication successful for user:', user.email);

    const { leagueId } = req.body;

    if (!leagueId) {
      return res.status(400).json({ error: 'League ID is required' });
    }

    console.log('Switching default league to:', leagueId);

    // Update the user profile to set the new default league
    await FirestoreServerService.updateUserProfile(user.uid, {
      defaultLeagueId: leagueId
    });

    console.log('Default league updated successfully');

    return res.status(200).json({
      success: true,
      message: 'Default league switched successfully',
      newDefaultLeagueId: leagueId
    });

  } catch (error) {
    console.error('Error switching default league:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 