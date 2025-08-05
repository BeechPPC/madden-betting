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

  console.log('=== MIGRATE USER API CALLED ===');
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

    try {
      // Check if user already has a profile (already migrated)
      const existingProfile = await FirestoreServerService.getUserProfile(user.uid);
      if (existingProfile) {
        console.log('User already migrated:', user.uid);
        return res.status(200).json({
          success: true,
          message: 'User already migrated to multi-league system',
          data: {
            userId: user.uid,
            alreadyMigrated: true,
          }
        });
      }

      // Check if user has existing role (needs migration)
      const existingRole = await FirestoreServerService.getUserRole(user.uid);
      if (!existingRole) {
        console.log('No existing user role found for:', user.uid);
        return res.status(404).json({
          error: 'No existing data found',
          message: 'User has no existing league data to migrate'
        });
      }

      // Perform migration
      await FirestoreServerService.migrateUserToMultiLeague(user.uid);

      // Get the migrated data
      const userProfile = await FirestoreServerService.getUserProfile(user.uid);
      const memberships = await FirestoreServerService.getUserLeagueMemberships(user.uid);

      console.log('Successfully migrated user:', user.uid);

      return res.status(200).json({
        success: true,
        message: 'User successfully migrated to multi-league system',
        data: {
          userId: user.uid,
          userProfile: userProfile ? {
            id: userProfile.id,
            userId: userProfile.userId,
            userEmail: userProfile.userEmail,
            displayName: userProfile.displayName,
            defaultLeagueId: userProfile.defaultLeagueId,
            preferences: userProfile.preferences,
            createdAt: userProfile.createdAt.toDate().toISOString(),
            updatedAt: userProfile.updatedAt.toDate().toISOString(),
          } : null,
          memberships: memberships.map(membership => ({
            id: membership.id,
            userId: membership.userId,
            userEmail: membership.userEmail,
            leagueId: membership.leagueId,
            role: membership.role,
            joinedAt: membership.joinedAt.toDate().toISOString(),
            lastAccessedAt: membership.lastAccessedAt.toDate().toISOString(),
            displayName: membership.displayName,
            isPremium: membership.isPremium || false,
            isActive: membership.isActive,
          })),
          migratedFrom: {
            roleId: existingRole.id,
            leagueId: existingRole.leagueId,
            role: existingRole.role,
          }
        }
      });

    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      return res.status(500).json({ 
        error: 'Database error',
        details: firestoreError instanceof Error ? firestoreError.message : 'Unknown database error'
      });
    }

  } catch (error) {
    console.error('Error in migrateUser:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 