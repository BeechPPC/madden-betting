import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';
import { GoogleSheetsService } from '../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('=== GET USER ROLE API CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  try {
    // Verify user authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Authentication successful for user:', user.email);
    console.log('User UID:', user.uid);

    // Try Firestore first
    try {
      const userRole = await FirestoreServerService.getUserRole(user.uid);
      if (userRole) {
        // Fetch the league information
        const league = await FirestoreServerService.getLeague(userRole.leagueId);
        if (league) {
          return res.status(200).json({
            userRole: {
              id: userRole.id,
              userId: userRole.userId,
              userEmail: userRole.userEmail,
              leagueId: userRole.leagueId,
              role: userRole.role,
              joinedAt: userRole.joinedAt.toDate().toISOString(),
              displayName: userRole.displayName,
            },
            league: {
              id: league.id,
              name: league.name,
              leagueCode: league.leagueCode,
              adminEmail: league.adminEmail,
              createdAt: league.createdAt.toDate().toISOString(),
              isActive: league.isActive,
              adminUserId: league.adminUserId,
            },
            source: 'firestore'
          });
        }
      }
    } catch (firestoreError) {
      console.log('Firestore failed, trying Google Sheets fallback:', firestoreError);
      
      // Fallback to Google Sheets
      try {
        const userRoles = await GoogleSheetsService.readUserRoles();
        const userRole = userRoles.find(role => role.userId === user.uid && (role.isActive !== false));
        
        if (userRole) {
          // Fetch league information from Google Sheets
          const leagues = await GoogleSheetsService.readLeagues();
          const league = leagues.find(l => l.id === userRole.leagueId);
          
          if (league) {
            return res.status(200).json({
              userRole: {
                id: `role-${userRole.userId}-${userRole.leagueId}`,
                userId: userRole.userId,
                userEmail: userRole.userEmail,
                leagueId: userRole.leagueId,
                role: userRole.role,
                joinedAt: userRole.joinedAt,
                displayName: userRole.displayName,
              },
              league: {
                id: league.id,
                name: league.name,
                leagueCode: league.id, // In Google Sheets, the ID is the league code
                adminEmail: league.adminEmail,
                createdAt: league.createdAt,
                isActive: league.isActive,
                adminUserId: '', // Google Sheets doesn't store adminUserId
              },
              source: 'google-sheets'
            });
          }
        }
      } catch (sheetsError) {
        console.error('Google Sheets fallback also failed:', sheetsError);
      }
    }

    // No role found
    return res.status(404).json({ 
      error: 'User role not found',
      message: 'Please join a league or contact the administrator.'
    });

  } catch (error) {
    console.error('Error in getUserRole API:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    res.status(500).json({ 
      error: 'Failed to get user role',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 