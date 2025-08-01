import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';
import { GoogleSheetsService } from '../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('=== CREATE LEAGUE API CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', req.headers);

  try {
    console.log('Starting authentication verification...');
    const user = await verifyAuth(req);
    if (!user) {
      console.log('Authentication failed - no user returned');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Authentication successful for user:', user.email);
    console.log('User UID:', user.uid);

    const { leagueName, adminEmail, adminUserId, displayName } = req.body;
    console.log('Request body:', req.body);

    if (!leagueName || !adminEmail || !adminUserId || !displayName) {
      console.log('Missing required fields:', { leagueName, adminEmail, adminUserId, displayName });
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['leagueName', 'adminEmail', 'adminUserId', 'displayName'],
        received: { leagueName, adminEmail, adminUserId, displayName }
      });
    }

    // Generate a unique league code
    const generateLeagueCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 12; i++) {
        if (i > 0 && i % 3 === 0) result += '-';
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let leagueCode = generateLeagueCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Check if league code exists (try Firestore first, then Google Sheets)
    while (attempts < maxAttempts) {
      try {
        const exists = await FirestoreServerService.checkLeagueCodeExists(leagueCode);
        if (!exists) break;
      } catch (firestoreError) {
        console.log('Firestore check failed, trying Google Sheets:', firestoreError);
        try {
          const leagues = await GoogleSheetsService.readLeagues();
          const exists = leagues.some(league => league.id === leagueCode);
          if (!exists) break;
        } catch (sheetsError) {
          console.error('Both Firestore and Google Sheets failed:', sheetsError);
          // Continue anyway, assume code is unique
          break;
        }
      }
      
      leagueCode = generateLeagueCode();
      attempts++;
    }

    console.log('Generated unique league code:', leagueCode);

    // Try to create league in Firestore first
    try {
      console.log('Attempting to create league in Firestore...');
      const league = await FirestoreServerService.createLeague({
        name: leagueName,
        adminUserId: adminUserId,
        adminEmail: adminEmail,
        isActive: true,
        leagueCode: leagueCode,
      });

      console.log('League created in Firestore successfully:', league.id);

      // Create user role for admin
      console.log('Creating user role in Firestore...');
      const userRole = await FirestoreServerService.createUserRole({
        userId: adminUserId,
        userEmail: adminEmail,
        displayName: displayName,
        leagueId: league.id,
        role: 'admin',
        isActive: true,
      });

      console.log('User role created in Firestore successfully:', userRole.id);

      return res.status(201).json({
        success: true,
        league: {
          id: league.id,
          name: league.name,
          leagueCode: league.leagueCode,
          adminEmail: league.adminEmail,
          createdAt: league.createdAt,
        },
        userRole: {
          id: userRole.id,
          userId: userRole.userId,
          userEmail: userRole.userEmail,
          leagueId: userRole.leagueId,
          role: userRole.role,
          joinedAt: userRole.joinedAt,
          displayName: userRole.displayName,
        },
        source: 'firestore'
      });

    } catch (firestoreError) {
      console.error('Firestore creation failed:', firestoreError);
      console.error('Firestore error details:', {
        message: firestoreError instanceof Error ? firestoreError.message : 'Unknown error',
        stack: firestoreError instanceof Error ? firestoreError.stack : undefined,
        name: firestoreError instanceof Error ? firestoreError.name : 'Unknown'
      });
      
      // Fallback to Google Sheets
      try {
        console.log('Attempting fallback to Google Sheets...');
        const leagueData = {
          id: leagueCode,
          name: leagueName,
          adminEmail: adminEmail,
          createdAt: new Date().toISOString(),
          memberCount: 1,
          isActive: true,
        };

        await GoogleSheetsService.writeLeague(leagueData);
        console.log('League written to Google Sheets successfully');

        const userRoleData = {
          userId: adminUserId,
          userEmail: adminEmail,
          displayName: displayName,
          leagueId: leagueCode,
          role: 'admin',
          joinedAt: new Date().toISOString(),
        };

        await GoogleSheetsService.writeUserRole(userRoleData);
        console.log('User role written to Google Sheets successfully');

        return res.status(201).json({
          success: true,
          league: {
            id: leagueCode,
            name: leagueName,
            leagueCode: leagueCode,
            adminEmail: adminEmail,
            createdAt: leagueData.createdAt,
          },
          userRole: {
            id: `role-${adminUserId}-${leagueCode}`,
            userId: adminUserId,
            userEmail: adminEmail,
            leagueId: leagueCode,
            role: 'admin',
            joinedAt: userRoleData.joinedAt,
            displayName: displayName,
          },
          source: 'google-sheets'
        });

      } catch (sheetsError) {
        console.error('Google Sheets fallback also failed:', sheetsError);
        console.error('Google Sheets error details:', {
          message: sheetsError instanceof Error ? sheetsError.message : 'Unknown error',
          stack: sheetsError instanceof Error ? sheetsError.stack : undefined,
          name: sheetsError instanceof Error ? sheetsError.name : 'Unknown'
        });
        
        // Return a more specific error response instead of throwing
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          details: 'Both Firestore and Google Sheets are currently unavailable',
          firestoreError: firestoreError instanceof Error ? firestoreError.message : 'Unknown Firestore error',
          sheetsError: sheetsError instanceof Error ? sheetsError.message : 'Unknown Google Sheets error',
          recommendation: 'Please try again later or contact support if the issue persists'
        });
      }
    }

  } catch (error) {
    console.error('Unexpected error in createLeague:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      recommendation: 'Please try again later or contact support if the issue persists'
    });
  }
} 