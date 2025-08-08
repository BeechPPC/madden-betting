import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleSheetsService } from '../../utils/googleSheets';
import { FirestoreServerService } from '../../lib/firestore-server';
import { verifyAuth } from '../../utils/authMiddleware';

interface BetSubmission {
  user_name: string;
  user_id?: string; // Optional Firebase user ID
  picks: Record<string, string>; // matchup_id -> selected_team
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { user_name, user_id, picks }: BetSubmission = req.body;

    // Validate input
    if (!user_name || !user_name.trim()) {
      return res.status(400).json({ error: 'User name is required' });
    }

    if (!picks || Object.keys(picks).length === 0) {
      return res.status(400).json({ error: 'At least one pick is required' });
    }

    // Get user's current league to find the Google Sheet ID
    const userRole = await FirestoreServerService.getUserRole(user.uid);
    if (!userRole) {
      return res.status(404).json({ error: 'User not found in any league' });
    }

    // Get the league to access its Google Sheet ID
    const league = await FirestoreServerService.getLeague(userRole.leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    // Check if league has a Google Sheet ID configured
    const sheetId = league.settings?.googleSheetId;
    if (!sheetId) {
      return res.status(404).json({ error: 'League does not have a Google Sheet configured' });
    }

    // Get current week matchups to validate picks
    const matchupsData = await GoogleSheetsService.readMatchupsRawFromSheet(sheetId);
    if (!matchupsData || matchupsData.length === 0) {
      return res.status(400).json({ error: 'No matchups found' });
    }

    // Transform matchups data
    const allMatchups = matchupsData.map((row, index) => {
      const [week, team1, team1_record, team2, team2_record] = row;
      return {
        id: `matchup-${week}-${index}`,
        week: parseInt(week) || 1,
        team1: team1 || 'TBD',
        team2: team2 || 'TBD',
      };
    });

    // Get current week (highest week number in the data)
    const allWeeks = Array.from(new Set(allMatchups.map(m => m.week))).sort((a, b) => a - b);
    const currentWeek = allWeeks.length > 0 ? Math.max(...allWeeks) : 1;
    const currentWeekMatchups = allMatchups.filter(matchup => matchup.week === currentWeek);
    const currentWeekMatchupIds = currentWeekMatchups.map(matchup => matchup.id);

    // Validate that all picks are for current week matchups
    const invalidPicks = Object.keys(picks).filter(matchupId => !currentWeekMatchupIds.includes(matchupId));
    if (invalidPicks.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot submit picks for previous weeks. Please only select current week matchups.',
        invalidMatchups: invalidPicks,
        currentWeek,
        availableMatchups: currentWeekMatchupIds
      });
    }

    // Prepare bets for insertion into Google Sheets
    const betsToInsert = Object.entries(picks).map(([matchup_id, selected_team]) => ({
      user_name: user_name.trim(),
      user_id: user_id || null, // Store Firebase user ID if available
      matchup_id,
      selected_team,
      created_at: new Date().toISOString(),
    }));

    // Write each bet to Google Sheets
    for (const bet of betsToInsert) {
      try {
        await GoogleSheetsService.writeBetToSheet({
          user_name: bet.user_name,
          matchup_id: bet.matchup_id,
          selected_team: bet.selected_team,
          created_at: bet.created_at,
        }, sheetId);
      } catch (error) {
        console.error('Error writing bet to Google Sheets:', error);
        throw new Error(`Failed to write bet to Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    res.status(200).json({
      message: 'Bets submitted successfully',
      betsSubmitted: betsToInsert.length,
      currentWeek,
    });

  } catch (error) {
    console.error('Error submitting bets:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 