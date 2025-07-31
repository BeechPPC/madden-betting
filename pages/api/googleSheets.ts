import { NextApiRequest, NextApiResponse } from 'next';
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;

    switch (action) {
      case 'write_bet':
        await writeBetToSheet(data);
        break;
      case 'read_leaderboard':
        const leaderboard = await readLeaderboardFromSheet();
        return res.status(200).json({ leaderboard });
      case 'read_matchups':
        const matchups = await readMatchupsFromSheet();
        return res.status(200).json({ matchups });
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(200).json({ message: 'Operation completed successfully' });
  } catch (error) {
    console.error('Google Sheets API error:', error);
    res.status(500).json({ 
      error: 'Failed to interact with Google Sheets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function writeBetToSheet(betData: any) {
  const values = [
    [
      new Date().toISOString(),
      betData.user_name,
      betData.matchup_id,
      betData.selected_team,
      betData.created_at
    ]
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Bets!A:E', // Assuming you have a "Bets" sheet
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  });
}

async function readLeaderboardFromSheet() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Leaderboard!A:C', // Assuming you have a "Leaderboard" sheet
  });

  return response.data.values || [];
}

async function readMatchupsFromSheet() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Matchups!A:D', // Assuming you have a "Matchups" sheet
  });

  return response.data.values || [];
} 