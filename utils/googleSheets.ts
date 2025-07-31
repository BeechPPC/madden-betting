import { google } from 'googleapis';

// Types for Google Sheets data
export interface BetData {
  user_name: string;
  matchup_id: string;
  selected_team: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_name: string;
  wins: number;
  losses: number;
  points: number;
}

export interface MatchupData {
  id: string;
  team1: string;
  team2: string;
  date: string;
}

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

// Validate environment variables
if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
  console.error('GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable is not set');
}

if (!process.env.GOOGLE_PRIVATE_KEY) {
  console.error('GOOGLE_PRIVATE_KEY environment variable is not set');
}

if (!SPREADSHEET_ID) {
  console.error('GOOGLE_SHEET_ID environment variable is not set');
}

export class GoogleSheetsService {
  static async writeBet(betData: BetData): Promise<void> {
    try {
      if (!SPREADSHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID environment variable is not set');
      }

      const values = [
        [
          new Date().toISOString(),
          betData.user_name,
          betData.matchup_id,
          betData.selected_team,
          betData.created_at
        ]
      ];

      console.log('Writing bet to Google Sheets:', {
        spreadsheetId: SPREADSHEET_ID,
        range: 'Bets!A:E',
        values: values[0]
      });

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Bets!A:E',
        valueInputOption: 'RAW',
        requestBody: { values },
      });

      console.log('Google Sheets response:', response.data);
    } catch (error) {
      console.error('Error writing bet to Google Sheets:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to write bet to Google Sheets: ${error.message}`);
      }
      throw new Error('Failed to write bet to Google Sheets');
    }
  }

  static async readLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Leaderboard!A:C',
      });

      const rows = response.data.values || [];
      return rows.slice(1).map((row: any[]) => ({
        user_name: row[0] || '',
        wins: parseInt(row[1]) || 0,
        losses: parseInt(row[2]) || 0,
        points: parseInt(row[3]) || 0,
      }));
    } catch (error) {
      console.error('Error reading leaderboard from Google Sheets:', error);
      throw new Error('Failed to read leaderboard from Google Sheets');
    }
  }

  static async readMatchups(): Promise<MatchupData[]> {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Matchups!A:E',
      });

      const rows = response.data.values || [];
      return rows.slice(1).map((row: any[], index) => ({
        id: `matchup-${row[0] || 1}-${index}`,
        team1: row[1] || '',
        team2: row[3] || '', // team2 is in column D (index 3)
        date: row[4] || '', // date is in column E (index 4)
      }));
    } catch (error) {
      console.error('Error reading matchups from Google Sheets:', error);
      throw new Error('Failed to read matchups from Google Sheets');
    }
  }

  static async readMatchupsRaw(): Promise<any[][]> {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Matchups!A:E', // Include all columns for week, team1, team1_record, team2, team2_record
      });

      const rows = response.data.values || [];
      return rows.slice(1); // Skip header row
    } catch (error) {
      console.error('Error reading matchups from Google Sheets:', error);
      throw new Error('Failed to read matchups from Google Sheets');
    }
  }

  static async updateLeaderboard(leaderboard: LeaderboardEntry[]): Promise<void> {
    try {
      const values = leaderboard.map(entry => [
        entry.user_name,
        entry.wins,
        entry.losses,
        entry.points
      ]);

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Leaderboard!A2:D',
        valueInputOption: 'RAW',
        requestBody: { values },
      });
    } catch (error) {
      console.error('Error updating leaderboard in Google Sheets:', error);
      throw new Error('Failed to update leaderboard in Google Sheets');
    }
  }
} 