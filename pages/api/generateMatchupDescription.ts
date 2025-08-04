import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { team1, team1_record, team2, team2_record } = req.body;

    if (!team1 || !team1_record || !team2 || !team2_record) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Parse team records
    const parseRecord = (record: string) => {
      const match = record.match(/(\d+)-(\d+)/);
      if (match) {
        return { wins: parseInt(match[1]), losses: parseInt(match[2]) };
      }
      return { wins: 0, losses: 0 };
    };

    const team1Stats = parseRecord(team1_record);
    const team2Stats = parseRecord(team2_record);

    // Generate AI description based on records
    const description = generateMatchupDescription(team1, team1Stats, team2, team2Stats);

    res.status(200).json({ description });
  } catch (error) {
    console.error('Error generating matchup description:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function generateMatchupDescription(
  team1: string,
  team1Stats: { wins: number; losses: number },
  team2: string,
  team2Stats: { wins: number; losses: number }
): string {
  const team1WinRate = team1Stats.wins / (team1Stats.wins + team1Stats.losses) || 0;
  const team2WinRate = team2Stats.wins / (team2Stats.wins + team2Stats.losses) || 0;
  
  const totalGames1 = team1Stats.wins + team1Stats.losses;
  const totalGames2 = team2Stats.wins + team2Stats.losses;

  // Determine the stronger team
  const strongerTeam = team1WinRate > team2WinRate ? team1 : team2;
  const weakerTeam = team1WinRate > team2WinRate ? team2 : team1;
  const strongerWinRate = Math.max(team1WinRate, team2WinRate);
  const weakerWinRate = Math.min(team1WinRate, team2WinRate);

  // Generate descriptions based on different scenarios
  if (totalGames1 === 0 && totalGames2 === 0) {
    return "New teams face off in debut clash";
  }

  if (totalGames1 === 0 || totalGames2 === 0) {
    const newTeam = totalGames1 === 0 ? team1 : team2;
    const veteranTeam = totalGames1 === 0 ? team2 : team1;
    return `${newTeam} debuts against ${veteranTeam}`;
  }

  if (Math.abs(team1WinRate - team2WinRate) < 0.1) {
    return "Evenly matched teams battle for supremacy";
  }

  if (strongerWinRate > 0.8) {
    return `${strongerTeam} dominates as heavy favorite`;
  }

  if (strongerWinRate > 0.6) {
    return `${strongerTeam} favored in competitive matchup`;
  }

  if (weakerWinRate < 0.2) {
    return `${strongerTeam} expected to crush ${weakerTeam}`;
  }

  if (strongerWinRate > 0.5 && weakerWinRate < 0.4) {
    return `${strongerTeam} slight favorite in close game`;
  }

  // Default descriptions
  const descriptions = [
    `${strongerTeam} looks to extend winning streak`,
    `${weakerTeam} seeks upset against ${strongerTeam}`,
    `${strongerTeam} favored in this showdown`,
    `${weakerTeam} fights uphill battle`,
    `${strongerTeam} aims to maintain momentum`,
    `${weakerTeam} desperate for victory`,
    `${strongerTeam} confident entering matchup`,
    `${weakerTeam} hopes to turn season around`
  ];

  return descriptions[Math.floor(Math.random() * descriptions.length)];
} 