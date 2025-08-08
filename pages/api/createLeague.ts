import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';
import { GoogleSheetsService } from '../../utils/googleSheets';
import { generateLeagueId } from '../../lib/utils';

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

    // Generate a unique league code using the utility function
    const generateLeagueCode = () => generateLeagueId();

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

      // Create user profile for admin (if doesn't exist)
      console.log('Creating/updating user profile in Firestore...');
      let userProfile = await FirestoreServerService.getUserProfile(adminUserId);
      if (!userProfile) {
        userProfile = await FirestoreServerService.createUserProfile({
          userId: adminUserId,
          userEmail: adminEmail,
          displayName: displayName,
          defaultLeagueId: league.id,
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        });
        console.log('User profile created in Firestore successfully:', userProfile.id);
      } else {
        // Update default league if user doesn't have one
        if (!userProfile.defaultLeagueId) {
          await FirestoreServerService.updateUserProfile(adminUserId, { defaultLeagueId: league.id });
        }
      }

      // Create user league membership for admin
      console.log('Creating user league membership in Firestore...');
      const userMembership = await FirestoreServerService.createUserLeagueMembership({
        userId: adminUserId,
        userEmail: adminEmail,
        displayName: displayName,
        leagueId: league.id,
        role: 'admin',
        isActive: true,
      });

      console.log('User league membership created in Firestore successfully:', userMembership.id);

      // Also create legacy user role for backward compatibility
      console.log('Creating legacy user role in Firestore...');
      const userRole = await FirestoreServerService.createUserRole({
        userId: adminUserId,
        userEmail: adminEmail,
        displayName: displayName,
        leagueId: league.id,
        role: 'admin',
        isActive: true,
      });

      console.log('Legacy user role created in Firestore successfully:', userRole.id);

      // Create Google Sheet copy for the new league
      try {
        console.log('Creating Google Sheet copy for new league...');
        const sheetResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/createGoogleSheet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization || '',
          },
          body: JSON.stringify({
            leagueName: leagueName,
            leagueCode: leagueCode,
          }),
        });

        if (sheetResponse.ok) {
          const sheetData = await sheetResponse.json();
          console.log('Google Sheet created successfully:', sheetData.sheetId);
          
          // Update the league with the Google Sheet ID
          await FirestoreServerService.updateLeagueGoogleSheetId(
            league.id, 
            sheetData.sheetId, 
            adminEmail
          );
          console.log('League updated with Google Sheet ID');
        } else {
          console.error('Failed to create Google Sheet:', sheetResponse.status, sheetResponse.statusText);
          // Don't fail the league creation if sheet creation fails
        }
      } catch (sheetError) {
        console.error('Error creating Google Sheet:', sheetError);
        // Don't fail the league creation if sheet creation fails
      }

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
        userMembership: {
          id: userMembership.id,
          userId: userMembership.userId,
          userEmail: userMembership.userEmail,
          leagueId: userMembership.leagueId,
          role: userMembership.role,
          joinedAt: userMembership.joinedAt,
          lastAccessedAt: userMembership.lastAccessedAt,
          displayName: userMembership.displayName,
          isActive: userMembership.isActive,
        },
        userProfile: userProfile ? {
          id: userProfile.id,
          userId: userProfile.userId,
          userEmail: userProfile.userEmail,
          displayName: userProfile.displayName,
          defaultLeagueId: userProfile.defaultLeagueId,
          preferences: userProfile.preferences,
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt,
        } : null,
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