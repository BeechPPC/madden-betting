import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

// Initialize Google Sheets API using dedicated Google service account
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Helper function to properly format private key
function formatPrivateKey(privateKey: string | undefined): string {
  if (!privateKey) {
    throw new Error('Private key is required');
  }
  
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

const sheets = google.sheets({ version: 'v4', auth });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== VERIFY SHEET API CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sheetId } = req.body;

    if (!sheetId) {
      console.log('No sheetId provided in request body');
      return res.status(400).json({ error: 'Sheet ID is required' });
    }

    console.log('Sheet ID provided:', sheetId);

    // Clean the sheet ID (remove any URL parts)
    const cleanSheetId = sheetId.replace(/^https:\/\/docs\.google\.com\/spreadsheets\/d\//, '').replace(/\/.*$/, '');

    console.log('Verifying sheet ID:', cleanSheetId);
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
    
    console.log('Google Sheets credentials check:', {
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      clientEmailLength: clientEmail?.length || 0,
      privateKeyLength: privateKey?.length || 0,
      usingFirebaseFallback: !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && !!process.env.FIREBASE_CLIENT_EMAIL,
      serviceAccountEmail: clientEmail
    });

    // Test 1: Check if sheet exists and is accessible
    try {
      console.log('Attempting to access Google Sheet...');
      const metadata = await sheets.spreadsheets.get({
        spreadsheetId: cleanSheetId,
      });
      
      console.log('Sheet metadata retrieved successfully');
      console.log('Sheet title:', metadata.data.properties?.title);
      console.log('Sheet ID:', metadata.data.spreadsheetId);
    } catch (error) {
      console.error('Error accessing sheet:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        status: (error as any)?.status
      });
      
      // Try to add the service account as an editor if access is denied
      if ((error as any)?.code === 403 || (error as any)?.status === 403) {
        console.log('Access denied. Attempting to add service account as editor...');
        try {
          const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
          if (!serviceAccountEmail) {
            throw new Error('Service account email not configured');
          }
          
          // Import Google Drive API to add permissions
          const { google } = require('googleapis');
          const drive = google.drive({ version: 'v3', auth });
          
          await drive.permissions.create({
            fileId: cleanSheetId,
            requestBody: {
              role: 'writer',
              type: 'user',
              emailAddress: serviceAccountEmail,
            },
          });
          
          console.log('Successfully added service account as editor');
          
          // Try accessing the sheet again
          const metadata = await sheets.spreadsheets.get({
            spreadsheetId: cleanSheetId,
          });
          
          console.log('Sheet access successful after adding permissions');
          console.log('Sheet title:', metadata.data.properties?.title);
          console.log('Sheet ID:', metadata.data.spreadsheetId);
        } catch (permissionError) {
          console.error('Failed to add service account permissions:', permissionError);
          const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
          return res.status(400).json({ 
            error: 'Cannot access the Google Sheet. Please add the service account as an editor.',
            details: `Add this email as an editor to your Google Sheet: ${serviceAccountEmail}`,
            serviceAccountEmail: serviceAccountEmail,
            debug: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      } else {
        const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
        return res.status(400).json({ 
          error: 'Cannot access the Google Sheet. Please check the Sheet ID and sharing permissions.',
          details: 'Make sure the sheet is shared with "Anyone with the link can view" or add the service account as an editor',
          serviceAccountEmail: serviceAccountEmail,
          debug: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test 2: Check if required sheets exist
    const requiredSheets = ['Matchups', 'Bets', 'Leaderboard', 'Results', 'Leagues', 'UserRoles'];
    
    try {
      const metadata = await sheets.spreadsheets.get({
        spreadsheetId: cleanSheetId,
      });
      
      const sheetNames = metadata.data.sheets?.map(sheet => sheet.properties?.title) || [];
      console.log('Available sheets:', sheetNames);

      const missingSheets = requiredSheets.filter(sheet => !sheetNames.includes(sheet));
      
      if (missingSheets.length > 0) {
        return res.status(400).json({
          error: 'Missing required sheets',
          details: `The following sheets are missing: ${missingSheets.join(', ')}`,
          missingSheets
        });
      }
    } catch (error) {
      console.error('Error checking sheet structure:', error);
      return res.status(500).json({ error: 'Error checking sheet structure' });
    }

    // Test 3: Verify column headers for each sheet
    const expectedHeaders = {
      'Matchups': ['Week', 'Team 1', 'Team 1 Record', 'Team 2', 'Team 2 Record'],
      'Bets': ['Timestamp', 'User Name', 'Matchup ID', 'Selected Team', 'Created At'],
      'Leaderboard': ['User Name', 'Wins', 'Losses', 'Points'],
      'Results': ['Timestamp', 'Matchup ID', 'Winning Team', 'Correct Picks', 'Incorrect Picks', 'Total Picks'],
      'Leagues': ['Timestamp', 'League ID', 'League Name', 'Admin Email', 'Created At', 'Member Count', 'Status'],
      'UserRoles': ['Timestamp', 'User ID', 'User Email', 'Display Name', 'League ID', 'Role', 'Joined At']
    };

    const headerErrors: string[] = [];

    for (const [sheetName, expectedHeader] of Object.entries(expectedHeaders)) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: cleanSheetId,
          range: `${sheetName}!A1:${String.fromCharCode(65 + expectedHeader.length - 1)}1`,
        });

        const actualHeaders = response.data.values?.[0] || [];
        
        if (actualHeaders.length < expectedHeader.length) {
          headerErrors.push(`${sheetName}: Not enough columns (expected ${expectedHeader.length}, got ${actualHeaders.length})`);
          continue;
        }

        for (let i = 0; i < expectedHeader.length; i++) {
          if (actualHeaders[i] !== expectedHeader[i]) {
            headerErrors.push(`${sheetName}: Column ${i + 1} should be "${expectedHeader[i]}" but is "${actualHeaders[i]}"`);
          }
        }
      } catch (error) {
        console.error(`Error checking headers for ${sheetName}:`, error);
        headerErrors.push(`${sheetName}: Cannot read headers`);
      }
    }

    if (headerErrors.length > 0) {
      return res.status(400).json({
        error: 'Sheet structure is incorrect',
        details: 'The sheet does not have the expected column headers',
        headerErrors
      });
    }

    // Test 4: Test write permissions (optional - just try to read a cell)
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: cleanSheetId,
        range: 'Matchups!A1',
      });
    } catch (error) {
      console.error('Error testing read permissions:', error);
      return res.status(400).json({
        error: 'Cannot read from the sheet',
        details: 'Please check sharing permissions. The sheet should be shared with "Anyone with the link can view"'
      });
    }

    // All tests passed
    return res.status(200).json({
      success: true,
      message: 'Google Sheet verified successfully!',
      sheetId: cleanSheetId,
      verifiedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in verifySheet:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        type: typeof error,
        constructor: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      }
    });
  }
} 