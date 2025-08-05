import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== TEST USER ROLE API CALLED ===');
    
    // Verify user authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Authentication successful for user:', user.email);

    // Get the user's current league membership
    const userRole = await FirestoreServerService.getUserRole(user.uid);
    if (!userRole) {
      return res.status(404).json({ error: 'User not found in any league' });
    }

    console.log('Raw user role data:', userRole);

    return res.status(200).json({
      success: true,
      userRole: {
        userId: userRole.userId,
        userEmail: userRole.userEmail,
        leagueId: userRole.leagueId,
        role: userRole.role,
        roleType: typeof userRole.role,
        isAdmin: userRole.role === 'admin',
        joinedAt: userRole.joinedAt,
        displayName: userRole.displayName,
        isActive: userRole.isActive,
        isPremium: userRole.isPremium
      },
      user: {
        uid: user.uid,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error testing user role:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 