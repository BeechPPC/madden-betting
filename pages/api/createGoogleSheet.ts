import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { verifyAuth } from '../../utils/authMiddleware';

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
  ],
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

// Template sheet ID - this should be a template sheet that admins can copy
const TEMPLATE_SHEET_ID = process.env.GOOGLE_SHEET_TEMPLATE_ID;

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

    const { leagueName, leagueCode } = req.body;

    if (!leagueName || !leagueCode) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['leagueName', 'leagueCode']
      });
    }

    if (!TEMPLATE_SHEET_ID) {
      return res.status(500).json({ 
        error: 'Template sheet not configured',
        details: 'GOOGLE_SHEET_TEMPLATE_ID environment variable is not set'
      });
    }

    console.log('Creating Google Sheet copy for league:', leagueName);

    // Step 1: Copy the template sheet
    const copyResponse = await drive.files.copy({
      fileId: TEMPLATE_SHEET_ID,
      requestBody: {
        name: `ClutchPicks - ${leagueName} (${leagueCode})`,
        description: `Google Sheet for ClutchPicks league: ${leagueName} (${leagueCode})`,
      },
    });

    const newSheetId = copyResponse.data.id;
    if (!newSheetId) {
      throw new Error('Failed to get new sheet ID from copy operation');
    }

    console.log('Created new sheet with ID:', newSheetId);

    // Step 2: Set up the sheet structure with headers
    const sheetStructure = [
      {
        sheetName: 'Matchups',
        headers: ['Week', 'Team 1', 'Team 1 Record', 'Team 2', 'Team 2 Record']
      },
      {
        sheetName: 'Bets',
        headers: ['Timestamp', 'User Name', 'Matchup ID', 'Selected Team', 'Created At']
      },
      {
        sheetName: 'Leaderboard',
        headers: ['User Name', 'Wins', 'Losses', 'Points']
      },
      {
        sheetName: 'Results',
        headers: ['Timestamp', 'Matchup ID', 'Winning Team', 'Correct Picks', 'Incorrect Picks', 'Total Picks']
      }
    ];

    // Step 3: Add headers to each sheet
    for (const sheet of sheetStructure) {
      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId: newSheetId,
          range: `${sheet.sheetName}!A1:${String.fromCharCode(65 + sheet.headers.length - 1)}1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [sheet.headers],
          },
        });
        console.log(`Added headers to ${sheet.sheetName} sheet`);
      } catch (error) {
        console.error(`Error adding headers to ${sheet.sheetName}:`, error);
        // Continue with other sheets even if one fails
      }
    }

    // Step 4: Add some sample data to help admins understand the format
    const sampleMatchups = [
      ['1', 'Cowboys', '0-0', 'Giants', '0-0'],
      ['1', 'Eagles', '0-0', 'Commanders', '0-0'],
      ['2', 'Cowboys', '1-0', 'Eagles', '1-0'],
      ['2', 'Giants', '0-1', 'Commanders', '0-1']
    ];

    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId: newSheetId,
        range: 'Matchups!A2:D5',
        valueInputOption: 'RAW',
        requestBody: {
          values: sampleMatchups,
        },
      });
      console.log('Added sample matchups data');
    } catch (error) {
      console.error('Error adding sample data:', error);
      // This is not critical, so we continue
    }

    // Step 5: Set permissions to allow the service account to edit
    try {
      await drive.permissions.create({
        fileId: newSheetId,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: process.env.FIREBASE_CLIENT_EMAIL,
        },
      });
      console.log('Set permissions for service account');
    } catch (error) {
      console.error('Error setting permissions:', error);
      // This might fail if permissions are already set, which is okay
    }

    res.status(200).json({
      success: true,
      sheetId: newSheetId,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${newSheetId}/edit`,
      message: 'Google Sheet created successfully',
      leagueName,
      leagueCode
    });

  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    res.status(500).json({ 
      error: 'Failed to create Google Sheet',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 