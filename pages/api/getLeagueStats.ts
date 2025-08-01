import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== GET LEAGUE STATS API CALLED ===');
    
    const user = await verifyAuth(req);
    if (!user) {
      console.log('Authentication failed - no user found');
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: 'User authentication failed - no valid user found'
      });
    }

    console.log('Authentication successful for user:', user.email);

    // Get user's role to verify they have access to a league
    const userRole = await FirestoreServerService.getUserRole(user.uid);
    if (!userRole) {
      return res.status(404).json({
        error: 'No league found',
        details: 'User is not a member of any league'
      });
    }

    // Get league information
    const league = await FirestoreServerService.getLeague(userRole.leagueId);
    if (!league) {
      return res.status(404).json({
        error: 'League not found',
        details: 'League information could not be retrieved'
      });
    }

    // Get league members
    const members = await FirestoreServerService.getLeagueMembers(userRole.leagueId);
    
    // Note: getLeagueBets and getLeagueMatchups are not implemented in FirestoreServerService yet
    // For now, we'll use empty arrays
    const bets: any[] = [];
    const matchups: any[] = [];

    // Calculate statistics
    const stats = {
      memberCount: members.length,
      betCount: bets.length,
      matchupCount: matchups.length,
      activeMatchups: matchups.filter(m => !m.winner).length,
      completedMatchups: matchups.filter(m => m.winner).length,
    };

    // Format members for response
    const formattedMembers = members.map(member => ({
      id: member.id,
      userId: member.userId,
      userEmail: member.userEmail,
      displayName: member.displayName,
      role: member.role,
      joinedAt: member.joinedAt.toDate().toISOString(),
    }));

    // Format bets for response
    const formattedBets = bets.map(bet => ({
      id: bet.id,
      userId: bet.userId,
      userEmail: bet.userEmail,
      userDisplayName: bet.userDisplayName,
      matchupId: bet.matchupId,
      selectedTeam: bet.selectedTeam,
      createdAt: bet.createdAt.toDate().toISOString(),
    }));

    // Format matchups for response
    const formattedMatchups = matchups.map(matchup => ({
      id: matchup.id,
      team1: matchup.team1,
      team2: matchup.team2,
      date: matchup.date,
      week: matchup.week,
      winner: matchup.winner,
      createdAt: matchup.createdAt.toDate().toISOString(),
    }));

    res.status(200).json({
      success: true,
      league: {
        id: league.id,
        name: league.name,
        leagueCode: league.leagueCode,
        createdAt: league.createdAt.toDate().toISOString(),
        isActive: league.isActive,
        adminUserId: league.adminUserId,
        adminEmail: league.adminEmail,
        memberCount: league.memberCount,
      },
      userRole: {
        id: userRole.id,
        userId: userRole.userId,
        userEmail: userRole.userEmail,
        leagueId: userRole.leagueId,
        role: userRole.role,
        joinedAt: userRole.joinedAt.toDate().toISOString(),
        displayName: userRole.displayName,
      },
      stats,
      members: formattedMembers,
      bets: formattedBets,
      matchups: formattedMatchups,
    });

  } catch (error) {
    console.error('Error in getLeagueStats API:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 