import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';

// Helper function to validate league code format (same as joinLeague.ts)
function isValidLeagueCode(code: string): boolean {
  const leagueCodePattern = /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{4}$/;
  return leagueCodePattern.test(code);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Debug league codes request from user:', user.email);

    // Get all leagues from Firestore
    const leagues = await FirestoreServerService.getAllLeagues();
    
    const analysis = {
      totalLeagues: leagues.length,
      validCodes: 0,
      invalidCodes: 0,
      invalidLeagues: [] as any[],
      validLeagues: [] as any[],
      summary: ''
    };

    leagues.forEach((league: any) => {
      const isValid = isValidLeagueCode(league.leagueCode);
      if (isValid) {
        analysis.validCodes++;
        analysis.validLeagues.push({
          id: league.id,
          name: league.name,
          leagueCode: league.leagueCode,
          adminEmail: league.adminEmail,
          createdAt: league.createdAt
        });
      } else {
        analysis.invalidCodes++;
        analysis.invalidLeagues.push({
          id: league.id,
          name: league.name,
          leagueCode: league.leagueCode,
          adminEmail: league.adminEmail,
          createdAt: league.createdAt,
          expectedFormat: 'XXX-XXX-XXXX',
          actualFormat: `${league.leagueCode.split('-').length} parts: ${league.leagueCode.split('-').join('-')}`
        });
      }
    });

    // Generate summary
    if (analysis.invalidCodes === 0) {
      analysis.summary = '✅ All league codes are in the correct format!';
    } else {
      analysis.summary = `⚠️ Found ${analysis.invalidCodes} league(s) with incorrect format. These leagues may have issues with users trying to join.`;
    }

    res.status(200).json({
      success: true,
      analysis,
      fixApplied: 'League code generation has been fixed to use the correct XXX-XXX-XXXX format',
      note: 'New leagues will be created with correct codes. Existing invalid codes may need manual correction.'
    });

  } catch (error) {
    console.error('Error in debugLeagueCodes API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 