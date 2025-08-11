import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { verifyAuth } from '../../utils/authMiddleware';

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL,
    private_key: (process.env.GOOGLE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
  ],
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

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

    console.log('Creating new Google Sheet for league:', leagueName);

    // Step 1: Create a new Google Sheet
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `ClutchPicks - ${leagueName} (${leagueCode})`,
        },
        sheets: [
          {
            properties: {
              title: 'Matchups',
              gridProperties: {
                rowCount: 1000,
                columnCount: 5
              }
            }
          },
          {
            properties: {
              title: 'Bets',
              gridProperties: {
                rowCount: 1000,
                columnCount: 5
              }
            }
          },
          {
            properties: {
              title: 'Leaderboard',
              gridProperties: {
                rowCount: 1000,
                columnCount: 4
              }
            }
          },
          {
            properties: {
              title: 'Results',
              gridProperties: {
                rowCount: 1000,
                columnCount: 6
              }
            }
          },
          {
            properties: {
              title: 'Leagues',
              gridProperties: {
                rowCount: 1000,
                columnCount: 7
              }
            }
          },
          {
            properties: {
              title: 'UserRoles',
              gridProperties: {
                rowCount: 1000,
                columnCount: 7
              }
            }
          }
        ]
      }
    });

    const sheetId = createResponse.data.spreadsheetId;
    if (!sheetId) {
      throw new Error('Failed to create Google Sheet');
    }

    console.log('Created new sheet with ID:', sheetId);

    // Step 2: Set up the sheet structure with headers
    const batchUpdateRequests = [
      // Matchups sheet headers
      {
        range: 'Matchups!A1:E1',
        values: [['Week', 'Team 1', 'Team 1 Record', 'Team 2', 'Team 2 Record']]
      },
      // Bets sheet headers
      {
        range: 'Bets!A1:E1',
        values: [['Timestamp', 'User Name', 'Matchup ID', 'Selected Team', 'Created At']]
      },
      // Leaderboard sheet headers
      {
        range: 'Leaderboard!A1:D1',
        values: [['User Name', 'Wins', 'Losses', 'Points']]
      },
      // Results sheet headers
      {
        range: 'Results!A1:F1',
        values: [['Timestamp', 'Matchup ID', 'Winning Team', 'Correct Picks', 'Incorrect Picks', 'Total Picks']]
      },
      // Leagues sheet headers
      {
        range: 'Leagues!A1:G1',
        values: [['Timestamp', 'League ID', 'League Name', 'Admin Email', 'Created At', 'Member Count', 'Status']]
      },
      // UserRoles sheet headers
      {
        range: 'UserRoles!A1:G1',
        values: [['Timestamp', 'User ID', 'User Email', 'Display Name', 'League ID', 'Role', 'Joined At']]
      }
    ];

    // Apply all the headers in one batch update
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: batchUpdateRequests
      }
    });

    console.log('Sheet structure set up successfully');

    // Step 3: Format headers (make them bold and add background color)
    const formatRequests = [
      {
        repeatCell: {
          range: {
            sheetId: 0, // Matchups sheet
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 5
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.4 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      },
      {
        repeatCell: {
          range: {
            sheetId: 1, // Bets sheet
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 5
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.4 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      },
      {
        repeatCell: {
          range: {
            sheetId: 2, // Leaderboard sheet
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 4
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.4 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      },
      {
        repeatCell: {
          range: {
            sheetId: 3, // Results sheet
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 6
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.4 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      },
      {
        repeatCell: {
          range: {
            sheetId: 4, // Leagues sheet
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 7
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.4 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      },
      {
        repeatCell: {
          range: {
            sheetId: 5, // UserRoles sheet
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 7
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.4 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      }
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: formatRequests
      }
    });

    console.log('Sheet formatting applied successfully');

    // Step 4: Set sharing permissions (make it accessible to the service account)
    await drive.permissions.create({
      fileId: sheetId,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL,
      },
    });

    console.log('Sheet sharing permissions set successfully');

    return res.status(200).json({
      success: true,
      message: 'Google Sheet created successfully',
      sheetId: sheetId,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
      leagueName: leagueName,
      leagueCode: leagueCode
    });

  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    return res.status(500).json({
      error: 'Failed to create Google Sheet',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 