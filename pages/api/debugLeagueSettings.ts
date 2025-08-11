import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';
import { DocumentData } from 'firebase-admin/firestore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== DEBUG LEAGUE SETTINGS API CALLED ===');
    
    // Temporarily skip authentication for debugging
    // const user = await verifyAuth(req);
    // if (!user) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    // For now, let's just get all leagues and see what's in the database
    console.log('Getting all leagues from database...');
    
    const allLeagues = await FirestoreServerService.getAllLeagues();
    console.log('Found leagues:', allLeagues.length);

    // Get all user roles
    console.log('Getting all user roles...');
    const db = FirestoreServerService.getDb();
    const userRolesSnapshot = await db.collection('userRoles').get();
    const userRoles = userRolesSnapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get all user memberships
    console.log('Getting all user memberships...');
    const userMembershipsSnapshot = await db.collection('userLeagueMemberships').get();
    const userMemberships = userMembershipsSnapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get all user profiles
    console.log('Getting all user profiles...');
    const userProfilesSnapshot = await db.collection('userProfiles').get();
    const userProfiles = userProfilesSnapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        leagues: allLeagues.map(l => ({
          id: l.id,
          name: l.name,
          leagueCode: l.leagueCode,
          adminUserId: l.adminUserId,
          adminEmail: l.adminEmail,
          isActive: l.isActive,
          isPaid: l.isPaid,
          settings: l.settings,
          createdAt: l.createdAt
        })),
        userRoles: userRoles.map(r => ({
          id: r.id,
          userId: r.userId,
          userEmail: r.userEmail,
          leagueId: r.leagueId,
          role: r.role,
          isActive: r.isActive,
          joinedAt: r.joinedAt
        })),
        userMemberships: userMemberships.map(m => ({
          id: m.id,
          userId: m.userId,
          userEmail: m.userEmail,
          leagueId: m.leagueId,
          role: m.role,
          isActive: m.isActive,
          lastAccessedAt: m.lastAccessedAt
        })),
        userProfiles: userProfiles.map(p => ({
          id: p.id,
          userId: p.userId,
          userEmail: p.userEmail,
          displayName: p.displayName,
          defaultLeagueId: p.defaultLeagueId,
          createdAt: p.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error in debugLeagueSettings:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 