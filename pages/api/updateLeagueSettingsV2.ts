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
    console.log('=== UPDATE LEAGUE SETTINGS V2 API CALLED ===');
    
    // Verify user authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Authentication successful for user:', user.email);

    const { sheetId } = req.body;

    if (!sheetId) {
      return res.status(400).json({ error: 'Sheet ID is required' });
    }

    // Clean the sheet ID (remove any URL parts)
    const cleanSheetId = sheetId.replace(/^https:\/\/docs\.google\.com\/spreadsheets\/d\//, '').replace(/\/.*$/, '');

    console.log('Updating league settings with sheet ID:', cleanSheetId);

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

    // Check if user is admin of the league OR if they are the league creator
    const isAdmin = userRole.role === 'admin';
    const isLeagueCreator = league.adminUserId === user.uid;
    
    console.log('Permission check:', {
      userRole: userRole.role,
      isAdmin,
      isLeagueCreator,
      leagueAdminUserId: league.adminUserId,
      currentUserId: user.uid
    });

    if (!isAdmin && !isLeagueCreator) {
      console.log('User is not admin and not league creator');
      return res.status(403).json({ error: 'Only league admins can update league settings' });
    }

    // Update the league with the sheet ID
    const leagueRef = FirestoreServerService.getDb().collection('leagues').doc(league.id);
    
    await leagueRef.update({
      settings: {
        googleSheetId: cleanSheetId,
        updatedAt: new Date(),
        updatedBy: user.uid
      }
    });

    console.log('League settings updated successfully');

    return res.status(200).json({
      success: true,
      message: 'League settings updated successfully',
      leagueId: league.id,
      sheetId: cleanSheetId
    });

  } catch (error) {
    console.error('Error updating league settings:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 