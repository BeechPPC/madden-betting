import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';

// Helper function to generate a league code
function generateLeagueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += '-';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += '-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== UPDATE LEAGUE SETTINGS V2 API CALLED ===');
    
    // Verify user authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Authentication successful for user:', user.email);

    const { sheetId } = req.body;

    if (!sheetId) {
      return res.status(400).json({ error: 'Sheet ID is required' });
    }

    // Clean the sheet ID (remove any URL parts)
    const cleanSheetId = sheetId.replace(/^https:\/\/docs\.google\.com\/spreadsheets\/d\//, '').replace(/\/.*$/, '');

    console.log('Updating league settings with sheet ID:', cleanSheetId);

    // Get the user's current league membership
    const userRole = await FirestoreServerService.getUserRole(user.uid);
    if (!userRole) {
      console.log('No user role found for user:', user.uid);
      return res.status(404).json({ error: 'User not found in any league' });
    }

    console.log('User role found:', {
      userId: userRole.userId,
      leagueId: userRole.leagueId,
      role: userRole.role,
      isActive: userRole.isActive
    });

    // Get the league
    console.log('Attempting to get league with ID:', userRole.leagueId);
    let league = await FirestoreServerService.getLeague(userRole.leagueId);
    console.log('League lookup result:', league ? 'League found' : 'League not found');
    console.log('League ID being searched:', userRole.leagueId);
    
    if (!league) {
      console.log('League not found in database. User role leagueId:', userRole.leagueId);
      
      // Try to get all leagues to see what's available
      try {
        const allLeagues = await FirestoreServerService.getAllLeagues();
        console.log('Available leagues in database:', allLeagues.map(l => ({ id: l.id, name: l.name, code: l.leagueCode })));
        
        // If there are leagues, try to find one that matches the user's role
        if (allLeagues.length > 0) {
          const matchingLeague = allLeagues.find(l => l.adminUserId === user.uid);
          if (matchingLeague) {
            console.log('Found matching league by admin user ID:', matchingLeague.id);
            league = matchingLeague;
          }
        }
      } catch (error) {
        console.log('Error getting all leagues:', error);
      }
    }
    
    if (!league) {
      // Check if this is a new user who needs to create a league first
      if (userRole.role === 'admin') {
        // Try to create a league if it doesn't exist
        try {
          console.log('Attempting to create missing league for admin user');
          const newLeague = await FirestoreServerService.createLeague({
            name: `League for ${user.displayName || user.email}`,
            adminUserId: user.uid,
            adminEmail: user.email || '',
            isActive: true,
            leagueCode: generateLeagueCode(),
            isPaid: false
          });
          
          console.log('Created new league:', newLeague.id);
          league = newLeague;
          
          // Update the user role to point to the new league
          await FirestoreServerService.getDb().collection('userRoles').doc(userRole.id).update({
            leagueId: newLeague.id
          });
          
        } catch (error) {
          console.error('Error creating league:', error);
          return res.status(404).json({ 
            error: 'League not found',
            details: `League ID ${userRole.leagueId} not found in database. This may be because the league was never created properly.`,
            userLeagueId: userRole.leagueId,
            suggestion: 'Please try creating a new league or contact support if this is an existing league.'
          });
        }
      } else {
        return res.status(404).json({ 
          error: 'League not found',
          details: `League ID ${userRole.leagueId} not found in database.`,
          userLeagueId: userRole.leagueId,
          suggestion: 'Please ask your league admin to check the league settings.'
        });
      }
    }

    // Check if user is admin of the league OR if they are the league creator
    const isAdmin = userRole.role === 'admin';
    const isLeagueCreator = league.adminUserId === user.uid;
    
    console.log('Permission check:', {
      userRole: userRole.role,
      isAdmin,
      isLeagueCreator,
      leagueAdminUserId: league.adminUserId,
      currentUserId: user.uid
    });

    if (!isAdmin && !isLeagueCreator) {
      console.log('User is not admin and not league creator');
      return res.status(403).json({ error: 'Only league admins can update league settings' });
    }

    // Update the league with the sheet ID
    const leagueRef = FirestoreServerService.getDb().collection('leagues').doc(league.id);
    
    await leagueRef.update({
      settings: {
        googleSheetId: cleanSheetId,
        updatedAt: new Date(),
        updatedBy: user.uid
      }
    });

    console.log('League settings updated successfully');

    return res.status(200).json({
      success: true,
      message: 'League settings updated successfully',
      leagueId: league.id,
      sheetId: cleanSheetId
    });

  } catch (error) {
    console.error('Error updating league settings:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 