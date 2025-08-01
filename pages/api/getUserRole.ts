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
        return res.status(200).json({
          role: userRole.role,
          leagueId: userRole.leagueId,
          displayName: userRole.displayName,
          source: 'firestore'
        });
      }
    } catch (firestoreError) {
      console.log('Firestore failed, trying Google Sheets fallback:', firestoreError);
      
             // Fallback to Google Sheets
       try {
         const userRoles = await GoogleSheetsService.readUserRoles();
         const userRole = userRoles.find(role => role.userId === user.uid && (role.isActive !== false));
         
         if (userRole) {
           return res.status(200).json({
             role: userRole.role,
             leagueId: userRole.leagueId,
             displayName: userRole.displayName,
             source: 'google-sheets'
           });
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