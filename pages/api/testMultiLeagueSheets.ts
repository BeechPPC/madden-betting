import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';
import { GoogleSheetsService } from '../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Testing multi-league Google Sheets system for user:', user.email);

    // Get user's current league
    const userRole = await FirestoreServerService.getUserRole(user.uid);
    if (!userRole) {
      return res.status(404).json({ error: 'User not found in any league' });
    }

    console.log('User role found:', userRole);

    // Get the league
    const league = await FirestoreServerService.getLeague(userRole.leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    console.log('League found:', league);

    // Check if league has a Google Sheet ID
    const sheetId = league.settings?.googleSheetId;
    if (!sheetId) {
      return res.status(404).json({ 
        error: 'League does not have a Google Sheet configured',
        league: {
          id: league.id,
          name: league.name,
          leagueCode: league.leagueCode,
          hasSettings: !!league.settings,
          settings: league.settings
        }
      });
    }

    console.log('League has Google Sheet ID:', sheetId);

    // Test reading from the league's sheet
    try {
      const matchupsData = await GoogleSheetsService.readMatchupsRawFromSheet(sheetId);
      console.log('Successfully read matchups from league sheet');

      const leaderboardData = await GoogleSheetsService.readLeaderboardFromSheet(sheetId);
      console.log('Successfully read leaderboard from league sheet');

      res.status(200).json({
        success: true,
        message: 'Multi-league Google Sheets system is working correctly',
        league: {
          id: league.id,
          name: league.name,
          leagueCode: league.leagueCode,
          sheetId: sheetId,
          sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
        },
        data: {
          matchupsCount: matchupsData.length,
          leaderboardCount: leaderboardData.length,
          sampleMatchups: matchupsData.slice(0, 3), // First 3 matchups
          sampleLeaderboard: leaderboardData.slice(0, 3) // First 3 entries
        }
      });

    } catch (sheetError) {
      console.error('Error reading from league sheet:', sheetError);
      res.status(500).json({
        error: 'Failed to read from league Google Sheet',
        details: sheetError instanceof Error ? sheetError.message : 'Unknown error',
        league: {
          id: league.id,
          name: league.name,
          leagueCode: league.leagueCode,
          sheetId: sheetId
        }
      });
    }

  } catch (error) {
    console.error('Error testing multi-league sheets:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 