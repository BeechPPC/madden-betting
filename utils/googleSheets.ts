import { google } from 'googleapis';

// Helper function to properly format private key
function formatPrivateKey(privateKey: string): string {
  let formattedKey = privateKey;
  
  // Remove quotes if present
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.slice(1, -1);
  }
  
  // Replace \n with actual newlines
  formattedKey = formattedKey.replace(/\\n/g, '\n');
  
  // Ensure proper PEM format
  if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Private key does not have proper PEM format');
  }
  
  return formattedKey;
}

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
    
    // Use dedicated Google service account
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    console.log('Environment check:', {
      clientEmail: !!clientEmail,
      privateKey: !!privateKey,
      spreadsheetId: !!spreadsheetId,
      usingGoogleServiceAccount: true
    });
    
    if (!clientEmail || !privateKey || !spreadsheetId) {
      throw new Error('Missing required environment variables for Google Sheets API. Need Google service account credentials.');
    }
    
    // Use simple private key formatting (confirmed working)
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    
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
  // Helper method to get the default sheet ID or throw error
  private static getDefaultSheetId(): string {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID environment variable is not set');
    }
    return sheetId;
  }

  // New method that accepts a specific sheet ID
  static async writeBetToSheet(betData: BetData, sheetId: string): Promise<void> {
    try {
      const { sheets } = initializeGoogleSheets();

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
        spreadsheetId: sheetId,
        range: 'Bets!A:E',
        values: values[0]
      });

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
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

  // Legacy method for backward compatibility
  static async writeBet(betData: BetData): Promise<void> {
    const sheetId = this.getDefaultSheetId();
    return this.writeBetToSheet(betData, sheetId);
  }

  static async readLeaderboardFromSheet(sheetId: string): Promise<LeaderboardEntry[]> {
    try {
      const { sheets } = initializeGoogleSheets();
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
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

  // Legacy method for backward compatibility
  static async readLeaderboard(): Promise<LeaderboardEntry[]> {
    const sheetId = this.getDefaultSheetId();
    return this.readLeaderboardFromSheet(sheetId);
  }

  static async readMatchupsFromSheet(sheetId: string): Promise<MatchupData[]> {
    try {
      const { sheets } = initializeGoogleSheets();
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
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

  // Legacy method for backward compatibility
  static async readMatchups(): Promise<MatchupData[]> {
    const sheetId = this.getDefaultSheetId();
    return this.readMatchupsFromSheet(sheetId);
  }

  static async readMatchupsRawFromSheet(sheetId: string): Promise<any[][]> {
    try {
      const { sheets } = initializeGoogleSheets();
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Matchups!A:E', // Include all columns for week, team1, team1_record, team2, team2_record
      });

      const rows = response.data.values || [];
      return rows.slice(1); // Skip header row
    } catch (error) {
      console.error('Error reading matchups from Google Sheets:', error);
      throw new Error('Failed to read matchups from Google Sheets');
    }
  }

  // Legacy method for backward compatibility
  static async readMatchupsRaw(): Promise<any[][]> {
    const sheetId = this.getDefaultSheetId();
    return this.readMatchupsRawFromSheet(sheetId);
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

  static async updateLeaderboardFromSheet(leaderboard: LeaderboardEntry[], sheetId: string): Promise<void> {
    try {
      const { sheets } = initializeGoogleSheets();
      
      if (!sheetId) {
        throw new Error('Sheet ID is required');
      }
      
      const values = leaderboard.map(entry => [
        entry.user_name,
        entry.wins,
        entry.losses,
        entry.points
      ]);

      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
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

  static async updateUserNameInSheet(oldUserName: string, newUserName: string, sheetId: string): Promise<void> {
    try {
      console.log(`Updating user name in sheet: ${oldUserName} -> ${newUserName}`);
      
      const { sheets } = initializeGoogleSheets();
      
      // Read all bets to find rows with the old user name
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Bets!A:E',
      });

      const rows = response.data.values || [];
      const updatedRows: any[][] = [];
      let hasChanges = false;

      // Process each row
      rows.forEach((row: any[], index: number) => {
        if (index === 0) {
          // Keep header row as is
          updatedRows.push(row);
          return;
        }

        const userName = row[1]; // user_name is in column B (index 1)
        if (userName === oldUserName) {
          // Update the user name
          const updatedRow = [...row];
          updatedRow[1] = newUserName;
          updatedRows.push(updatedRow);
          hasChanges = true;
          console.log(`Updated row ${index + 1}: ${oldUserName} -> ${newUserName}`);
        } else {
          // Keep row as is
          updatedRows.push(row);
        }
      });

      if (hasChanges) {
        // Write back all rows
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: 'Bets!A:E',
          valueInputOption: 'RAW',
          requestBody: {
            values: updatedRows,
          },
        });
        console.log(`Successfully updated user name from ${oldUserName} to ${newUserName} in ${sheetId}`);
      } else {
        console.log(`No rows found with user name ${oldUserName} in sheet ${sheetId}`);
      }
    } catch (error) {
      console.error('Error updating user name in Google Sheets:', error);
      throw new Error(`Failed to update user name in Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 