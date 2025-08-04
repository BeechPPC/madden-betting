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

export interface LeagueData {
  id: string;
  name: string;
  adminEmail: string;
  createdAt: string;
  memberCount: number;
  isActive: boolean;
}

export interface UserRoleData {
  userId: string;
  userEmail: string;
  displayName: string;
  leagueId: string;
  role: string;
  joinedAt: string;
  isActive?: boolean;
  isPremium?: boolean;
}

// Initialize Google Sheets API with better error handling
let auth: any = null;
let sheets: any = null;
let isInitialized = false;

function initializeGoogleSheets() {
  if (isInitialized && auth && sheets) {
    return { auth, sheets };
  }

  try {
    console.log('=== INITIALIZING GOOGLE SHEETS API ===');
    
    // Check environment variables
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    console.log('Environment check:', {
      clientEmail: !!clientEmail,
      privateKey: !!privateKey,
      spreadsheetId: !!spreadsheetId
    });
    
    if (!clientEmail || !privateKey || !spreadsheetId) {
      throw new Error('Missing required environment variables for Google Sheets API');
    }
    
    // Fix private key formatting
    let formattedPrivateKey = privateKey;
    
    // Remove quotes if present
    if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
      formattedPrivateKey = formattedPrivateKey.slice(1, -1);
    }
    
    // Replace \n with actual newlines
    formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
    
    // Ensure proper PEM format
    if (!formattedPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Private key does not have proper PEM format');
    }
    
    console.log('Creating Google Auth instance...');
    auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: formattedPrivateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    console.log('Creating Google Sheets instance...');
    sheets = google.sheets({ version: 'v4', auth });
    
    isInitialized = true;
    console.log('Google Sheets API initialized successfully');
    
    return { auth, sheets };
  } catch (error) {
    console.error('Failed to initialize Google Sheets API:', error);
    throw error;
  }
}

// Validate environment variables
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('FIREBASE_CLIENT_EMAIL environment variable is not set');
}

if (!process.env.FIREBASE_PRIVATE_KEY) {
  console.error('FIREBASE_PRIVATE_KEY environment variable is not set');
}

if (!process.env.GOOGLE_SHEET_ID) {
  console.error('GOOGLE_SHEET_ID environment variable is not set');
}

export class GoogleSheetsService {
  static async writeBet(betData: BetData): Promise<void> {
    try {
      const { sheets } = initializeGoogleSheets();
      const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
      
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
      const { sheets } = initializeGoogleSheets();
      const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
      
      if (!SPREADSHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID environment variable is not set');
      }
      
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
      const { sheets } = initializeGoogleSheets();
      const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
      
      if (!SPREADSHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID environment variable is not set');
      }
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Matchups!A:E',
      });

      const rows = response.data.values || [];
      return rows.slice(1).map((row: any[], index: number) => ({
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
      const { sheets } = initializeGoogleSheets();
      const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
      
      if (!SPREADSHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID environment variable is not set');
      }
      
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
      const { sheets } = initializeGoogleSheets();
      const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
      
      if (!SPREADSHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID environment variable is not set');
      }
      
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

  // League operations
  static async writeLeague(leagueData: LeagueData): Promise<void> {
    try {
      const { sheets } = initializeGoogleSheets();
      const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
      
      if (!SPREADSHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID environment variable is not set');
      }

      const values = [
        [
          new Date().toISOString(),
          leagueData.id,
          leagueData.name,
          leagueData.adminEmail,
          leagueData.createdAt,
          leagueData.memberCount,
          leagueData.isActive ? 'Active' : 'Inactive'
        ]
      ];

      console.log('Writing league to Google Sheets:', {
        spreadsheetId: SPREADSHEET_ID,
        range: 'Leagues!A:G',
        values: values[0]
      });

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Leagues!A:G',
        valueInputOption: 'RAW',
        requestBody: { values },
      });

      console.log('Google Sheets response:', response.data);
    } catch (error) {
      console.error('Error writing league to Google Sheets:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to write league to Google Sheets: ${error.message}`);
      }
      throw new Error('Failed to write league to Google Sheets');
    }
  }

  static async writeUserRole(userRoleData: UserRoleData): Promise<void> {
    try {
      const { sheets } = initializeGoogleSheets();
      const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
      
      if (!SPREADSHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID environment variable is not set');
      }

      const values = [
        [
          new Date().toISOString(),
          userRoleData.userId,
          userRoleData.userEmail,
          userRoleData.displayName,
          userRoleData.leagueId,
          userRoleData.role,
          userRoleData.joinedAt,
          userRoleData.isPremium || false
        ]
      ];

      console.log('Writing user role to Google Sheets:', {
        spreadsheetId: SPREADSHEET_ID,
        range: 'UserRoles!A:H',
        values: values[0]
      });

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'UserRoles!A:H',
        valueInputOption: 'RAW',
        requestBody: { values },
      });

      console.log('Google Sheets response:', response.data);
    } catch (error) {
      console.error('Error writing user role to Google Sheets:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to write user role to Google Sheets: ${error.message}`);
      }
      throw new Error('Failed to write user role to Google Sheets');
    }
  }

  static async readLeagues(): Promise<LeagueData[]> {
    try {
      const { sheets } = initializeGoogleSheets();
      const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
      
      if (!SPREADSHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID environment variable is not set');
      }
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Leagues!A:G',
      });

      const rows = response.data.values || [];
      return rows.slice(1).map((row: any[]) => ({
        id: row[1] || '',
        name: row[2] || '',
        adminEmail: row[3] || '',
        createdAt: row[4] || '',
        memberCount: parseInt(row[5]) || 0,
        isActive: row[6] === 'Active',
      }));
    } catch (error) {
      console.error('Error reading leagues from Google Sheets:', error);
      throw new Error('Failed to read leagues from Google Sheets');
    }
  }

  static async readUserRoles(): Promise<UserRoleData[]> {
    try {
      const { sheets } = initializeGoogleSheets();
      const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
      
      if (!SPREADSHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID environment variable is not set');
      }
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'UserRoles!A:H',
      });

      const rows = response.data.values || [];
      return rows.slice(1).map((row: any[]) => ({
        userId: row[1] || '',
        userEmail: row[2] || '',
        displayName: row[3] || '',
        leagueId: row[4] || '',
        role: row[5] || '',
        joinedAt: row[6] || '',
        isPremium: row[7] === 'true' || false,
      }));
    } catch (error) {
      console.error('Error reading user roles from Google Sheets:', error);
      throw new Error('Failed to read user roles from Google Sheets');
    }
  }

  static async readBets(): Promise<BetData[]> {
    try {
      const { sheets } = initializeGoogleSheets();
      const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
      
      if (!SPREADSHEET_ID) {
        throw new Error('GOOGLE_SHEET_ID environment variable is not set');
      }
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
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
      throw new Error('Failed to read bets from Google Sheets');
    }
  }
} 