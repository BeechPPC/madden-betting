import { NextApiRequest, NextApiResponse } from 'next';
import { FirestoreServerService } from '../../lib/firestore-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== FIX BRAND NEW LEAGUE API CALLED ===');
    
    // Hardcode the league ID for the Brand New League
    const brandNewLeagueId = 'QwHsQbZzuL8vHoMcgxKI';
    const adminEmail = 'chris@beechppc.com';
    
    console.log('Creating Google Sheet for Brand New League...');
    
    // Create a Google Sheet for the Brand New League
    const sheetResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/createLeagueSheet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leagueName: 'Brand New League',
        leagueCode: 'VHE-Z80-7GY1',
      }),
    });

    if (sheetResponse.ok) {
      const sheetData = await sheetResponse.json();
      console.log('Google Sheet created successfully:', sheetData.sheetId);
      
      // Update the league with the Google Sheet ID
      await FirestoreServerService.updateLeagueGoogleSheetId(
        brandNewLeagueId, 
        sheetData.sheetId, 
        adminEmail
      );
      console.log('Brand New League updated with Google Sheet ID');

      return res.status(200).json({
        success: true,
        message: 'Brand New League now has its own Google Sheet!',
        sheetId: sheetData.sheetId,
        sheetUrl: sheetData.sheetUrl,
        note: 'You can now switch to this league and it will work independently from the NFL league'
      });
    } else {
      const errorData = await sheetResponse.json();
      console.error('Failed to create Google Sheet:', errorData);
      return res.status(500).json({
        error: 'Failed to create Google Sheet for Brand New League',
        details: errorData
      });
    }

  } catch (error) {
    console.error('Error fixing Brand New League:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 