import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== FIX USER ROLE API CALLED ===');
    
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

    console.log('Current user role:', userRole.role);

    // Update the user role to admin
    const userRoleRef = FirestoreServerService.getDb().collection('userRoles').doc(userRole.id);
    
    await userRoleRef.update({
      role: 'admin'
    });

    console.log('User role updated to admin successfully');

    return res.status(200).json({
      success: true,
      message: 'User role updated to admin successfully',
      previousRole: userRole.role,
      newRole: 'admin'
    });

  } catch (error) {
    console.error('Error fixing user role:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 