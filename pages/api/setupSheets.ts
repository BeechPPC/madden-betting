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
    // Get spreadsheet metadata to see available sheets
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const sheetNames = metadata.data.sheets?.map(sheet => sheet.properties?.title) || [];
    console.log('Available sheets:', sheetNames);

    const requiredSheets = ['Matchups', 'Bets', 'Leaderboard', 'Results'];
    const missingSheets = requiredSheets.filter(sheet => !sheetNames.includes(sheet));

    if (missingSheets.length === 0) {
      return res.status(200).json({
        message: 'All required sheets exist',
        availableSheets: sheetNames,
      });
    }

    // Create missing sheets
    const requests = missingSheets.map(sheetName => ({
      addSheet: {
        properties: {
          title: sheetName,
        },
      },
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests,
      },
    });

    // Add headers to new sheets
    for (const sheetName of missingSheets) {
      let headers: string[] = [];
      
      switch (sheetName) {
        case 'Results':
          headers = ['Timestamp', 'Matchup ID', 'Winning Team', 'Correct Picks', 'Incorrect Picks', 'Total Picks'];
          break;
        case 'Leaderboard':
          headers = ['User Name', 'Wins', 'Losses', 'Points'];
          break;
        case 'Bets':
          headers = ['Timestamp', 'User Name', 'Matchup ID', 'Selected Team', 'Created At'];
          break;
        case 'Matchups':
          headers = ['Week', 'Team 1', 'Team 1 Record', 'Team 2', 'Team 2 Record'];
          break;
      }

      if (headers.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers],
          },
        });
      }
    }

    res.status(200).json({
      message: 'Missing sheets created successfully',
      createdSheets: missingSheets,
      availableSheets: [...sheetNames, ...missingSheets],
    });

  } catch (error) {
    console.error('Error setting up sheets:', error);
    res.status(500).json({ 
      error: 'Failed to set up sheets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 