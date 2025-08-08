import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleSheetsService } from '../../utils/googleSheets';
import { FirestoreServerService } from '../../lib/firestore-server';
import { verifyAuth } from '../../utils/authMiddleware';
import { google } from 'googleapis';

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

interface LeaderboardEntry {
  user_name: string;
  correct_picks: number;
  total_picks: number;
  win_percentage: number;
  rank: number;
}

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

    // Get all bets and results to calculate real-time leaderboard
    const [allBets, results] = await Promise.all([
      getAllBets(sheetId),
      getResults(sheetId)
    ]);

    // Calculate user statistics based on actual bet results
    const userStats = new Map<string, { wins: number; losses: number; total_picks: number }>();

    // Process each bet against results
    allBets.forEach(bet => {
      const result = results.find(r => r.matchup_id === bet.matchup_id);
      if (result) {
        const isCorrect = bet.selected_team.toLowerCase() === result.winning_team.toLowerCase();
        const currentStats = userStats.get(bet.user_name) || { wins: 0, losses: 0, total_picks: 0 };
        
        if (isCorrect) {
          currentStats.wins += 1;
        } else {
          currentStats.losses += 1;
        }
        currentStats.total_picks += 1;
        
        userStats.set(bet.user_name, currentStats);
      }
    });

    // Convert to leaderboard entries
    const leaderboard: LeaderboardEntry[] = Array.from(userStats.entries())
      .map(([userName, stats]) => ({
        user_name: userName,
        correct_picks: stats.wins,
        total_picks: stats.total_picks,
        win_percentage: stats.total_picks > 0 ? Math.round((stats.wins / stats.total_picks) * 100) : 0,
        rank: 0, // Will be set after sorting
      }))
      .sort((a, b) => {
        // Sort by win percentage (descending), then by total picks (descending)
        if (a.win_percentage !== b.win_percentage) {
          return b.win_percentage - a.win_percentage;
        }
        return b.total_picks - a.total_picks;
      });

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    res.status(200).json({
      leaderboard,
      totalUsers: leaderboard.length,
    });

  } catch (error) {
    console.error('Error computing leaderboard:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getAllBets(sheetId: string): Promise<any[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Bets!A:E',
    });

    const rows = response.data.values || [];
    return rows.slice(1).map((row: any[]) => ({
      user_name: row[1] || '',
      matchup_id: row[2] || '',
      selected_team: row[3] || '',
      created_at: row[4] || '',
    }));
  } catch (error) {
    console.error('Error reading bets from Google Sheets:', error);
    return [];
  }
}

async function getResults(sheetId: string): Promise<any[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Results!A:F',
    });

    const rows = response.data.values || [];
    return rows.slice(1).map((row: any[]) => ({
      timestamp: row[0] || '',
      matchup_id: row[1] || '',
      winning_team: row[2] || '',
      correct_picks: parseInt(row[3]) || 0,
      incorrect_picks: parseInt(row[4]) || 0,
      total_picks: parseInt(row[5]) || 0,
    }));
  } catch (error) {
    console.error('Error reading results from Google Sheets:', error);
    return [];
  }
} 