import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleSheetsService } from '../../utils/googleSheets';
import { withAuth, AuthenticatedRequest } from '../../utils/authMiddleware';

// Use the GoogleSheetsService instead of duplicating setup
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

interface MarkWinnerRequest {
  matchup_id: string;
  winning_team: string;
}

interface Bet {
  user_name: string;
  matchup_id: string;
  selected_team: string;
  created_at: string;
}

interface UserStats {
  user_name: string;
  wins: number;
  losses: number;
  total_picks: number;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { matchup_id, winning_team }: MarkWinnerRequest = req.body;

    // Validate input
    if (!matchup_id || !winning_team) {
      return res.status(400).json({ error: 'Matchup ID and winning team are required' });
    }

    console.log(`Marking winner for matchup ${matchup_id}: ${winning_team}`);
    console.log('Authenticated user:', req.user);

    // 1. Get all bets for this matchup
    console.log('Fetching all bets...');
    const allBets = await GoogleSheetsService.readBets();
    console.log(`Total bets found: ${allBets.length}`);
    
    const matchupBets = allBets.filter(bet => bet.matchup_id === matchup_id);
    console.log(`Found ${matchupBets.length} bets for matchup ${matchup_id}`);

    // 2. Calculate which users got it right/wrong
    const userResults = matchupBets.map(bet => ({
      user_name: bet.user_name,
      selected_team: bet.selected_team,
      is_correct: bet.selected_team.toLowerCase() === winning_team.toLowerCase(),
    }));

    console.log('User results:', userResults);

    // 3. Get current leaderboard
    console.log('Fetching current leaderboard...');
    const currentLeaderboard = await GoogleSheetsService.readLeaderboard();
    console.log(`Current leaderboard entries: ${currentLeaderboard.length}`);
    const userStatsMap = new Map<string, UserStats>();

    // Initialize stats for all users who have made bets
    const allUsers = new Set([
      ...currentLeaderboard.map(entry => entry.user_name),
      ...userResults.map(result => result.user_name)
    ]);

    allUsers.forEach(userName => {
      const existingEntry = currentLeaderboard.find(entry => entry.user_name === userName);
      userStatsMap.set(userName, {
        user_name: userName,
        wins: existingEntry?.wins || 0,
        losses: existingEntry?.losses || 0,
        total_picks: (existingEntry?.wins || 0) + (existingEntry?.losses || 0),
      });
    });

    // 4. Update stats based on this matchup result
    userResults.forEach(result => {
      const stats = userStatsMap.get(result.user_name);
      if (stats) {
        if (result.is_correct) {
          stats.wins += 1;
        } else {
          stats.losses += 1;
        }
        stats.total_picks += 1;
      }
    });

    // 5. Convert to leaderboard format and sort
    const updatedLeaderboard = Array.from(userStatsMap.values())
      .map(stats => ({
        user_name: stats.user_name,
        wins: stats.wins,
        losses: stats.losses,
        points: stats.total_picks > 0 ? Math.round((stats.wins / stats.total_picks) * 100) : 0,
      }))
      .sort((a, b) => {
        // Sort by win percentage (descending), then by total picks (descending)
        if (a.points !== b.points) {
          return b.points - a.points;
        }
        return (b.wins + b.losses) - (a.wins + a.losses);
      });

    // 6. Update the leaderboard in Google Sheets
    console.log('Updating leaderboard in Google Sheets...');
    await GoogleSheetsService.updateLeaderboard(updatedLeaderboard);
    console.log('Leaderboard updated successfully');

    // 7. Add the result to a Results sheet for tracking
    console.log('Adding result to tracking sheet...');
    await addResultToSheet(matchup_id, winning_team, userResults);
    console.log('Result tracking completed');

    console.log('Leaderboard updated successfully');

    res.status(200).json({
      message: 'Winner marked and leaderboard updated successfully',
      matchup_id,
      winning_team,
      totalBets: matchupBets.length,
      correctPicks: userResults.filter(r => r.is_correct).length,
      incorrectPicks: userResults.filter(r => !r.is_correct).length,
      updatedLeaderboard: updatedLeaderboard.slice(0, 10), // Return top 10
    });

  } catch (error) {
    console.error('Error marking winner:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(handler);

async function addResultToSheet(matchup_id: string, winning_team: string, userResults: any[]) {
  try {
    // Import googleapis to initialize sheets
    const { google } = require('googleapis');
    
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const values = [
      [
        new Date().toISOString(),
        matchup_id,
        winning_team,
        userResults.filter(r => r.is_correct).length,
        userResults.filter(r => !r.is_correct).length,
        userResults.length,
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Results!A:F', // Assuming you have a Results sheet
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  } catch (error) {
    console.error('Error adding result to sheet:', error);
    // Don't throw here - this is optional tracking
  }
} 