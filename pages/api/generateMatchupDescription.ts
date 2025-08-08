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

  // Determine the stronger and weaker teams
  const strongerTeam = team1WinRate > team2WinRate ? team1 : team2;
  const weakerTeam = team1WinRate > team2WinRate ? team2 : team1;
  const strongerWinRate = Math.max(team1WinRate, team2WinRate);
  const weakerWinRate = Math.min(team1WinRate, team2WinRate);
  const strongerStats = team1WinRate > team2WinRate ? team1Stats : team2Stats;
  const weakerStats = team1WinRate > team2WinRate ? team2Stats : team1Stats;

  // Calculate win differential
  const winDifferential = Math.abs(team1WinRate - team2WinRate);
  const totalGamesDifferential = Math.abs(totalGames1 - totalGames2);

  // Enhanced description generation with more sophisticated logic
  const descriptions: string[] = [];

  // Handle teams with no games played
  if (totalGames1 === 0 && totalGames2 === 0) {
    return getRandomDescription([
      "Rookie teams clash in season opener",
      "Fresh faces battle for first victory",
      "Newcomers seek inaugural win",
      "Debut showdown between untested squads"
    ]);
  }

  // Handle one team with no games
  if (totalGames1 === 0 || totalGames2 === 0) {
    const newTeam = totalGames1 === 0 ? team1 : team2;
    const veteranTeam = totalGames1 === 0 ? team2 : team1;
    const veteranStats = totalGames1 === 0 ? team2Stats : team1Stats;
    const veteranWinRate = totalGames1 === 0 ? team2WinRate : team1WinRate;
    
    if (veteranWinRate > 0.7) {
      return getRandomDescription([
        `${newTeam} faces daunting challenge against dominant ${veteranTeam}`,
        `${veteranTeam} looks to crush ${newTeam} in debut`,
        `${newTeam} debuts against powerhouse ${veteranTeam}`
      ]);
    } else if (veteranWinRate < 0.3) {
      return getRandomDescription([
        `${newTeam} has golden opportunity against struggling ${veteranTeam}`,
        `${veteranTeam} desperate for win against rookie ${newTeam}`,
        `${newTeam} could upset struggling ${veteranTeam}`
      ]);
    } else {
      return getRandomDescription([
        `${newTeam} debuts against experienced ${veteranTeam}`,
        `${veteranTeam} welcomes ${newTeam} to the league`,
        `${newTeam} tests skills against ${veteranTeam}`
      ]);
    }
  }

  // Handle very close matchups (win rate difference < 10%)
  if (winDifferential < 0.1) {
    return getRandomDescription([
      "Evenly matched teams in nail-biter",
      "Toss-up game between equals",
      "Dead heat matchup with no clear favorite",
      "Balanced teams battle for edge",
      "Coin flip game between evenly matched squads"
    ]);
  }

  // Handle dominant teams (win rate > 80%)
  if (strongerWinRate > 0.8) {
    if (strongerStats.wins >= 8) {
      return getRandomDescription([
        `${strongerTeam} continues dominance against ${weakerTeam}`,
        `${strongerTeam} looks unstoppable against ${weakerTeam}`,
        `${weakerTeam} faces impossible odds against ${strongerTeam}`,
        `${strongerTeam} aims for perfect season against ${weakerTeam}`
      ]);
    } else {
      return getRandomDescription([
        `${strongerTeam} heavy favorite against ${weakerTeam}`,
        `${strongerTeam} expected to dominate ${weakerTeam}`,
        `${weakerTeam} faces uphill battle against ${strongerTeam}`,
        `${strongerTeam} looks to extend hot streak`
      ]);
    }
  }

  // Handle very weak teams (win rate < 20%)
  if (weakerWinRate < 0.2) {
    return getRandomDescription([
      `${strongerTeam} should easily handle ${weakerTeam}`,
      `${weakerTeam} desperate for any win against ${strongerTeam}`,
      `${strongerTeam} expected to crush struggling ${weakerTeam}`,
      `${weakerTeam} faces another tough loss against ${strongerTeam}`
    ]);
  }

  // Handle moderate favorites (win rate 60-80%)
  if (strongerWinRate > 0.6 && strongerWinRate <= 0.8) {
    return getRandomDescription([
      `${strongerTeam} favored in competitive matchup`,
      `${strongerTeam} slight edge over ${weakerTeam}`,
      `${weakerTeam} looks for upset against ${strongerTeam}`,
      `${strongerTeam} confident but ${weakerTeam} dangerous`,
      `${strongerTeam} aims to maintain momentum`
    ]);
  }

  // Handle close but not even matchups (win rate difference 10-30%)
  if (winDifferential >= 0.1 && winDifferential < 0.3) {
    return getRandomDescription([
      `${strongerTeam} slight favorite in close game`,
      `${weakerTeam} seeks upset against ${strongerTeam}`,
      `${strongerTeam} has edge but ${weakerTeam} competitive`,
      `${weakerTeam} fights uphill battle against ${strongerTeam}`,
      `${strongerTeam} favored in tight contest`
    ]);
  }

  // Handle teams with very different experience levels
  if (totalGamesDifferential > 5) {
    const experiencedTeam = totalGames1 > totalGames2 ? team1 : team2;
    const inexperiencedTeam = totalGames1 > totalGames2 ? team2 : team1;
    return getRandomDescription([
      `${experiencedTeam} experience vs ${inexperiencedTeam} potential`,
      `${inexperiencedTeam} tests mettle against veteran ${experiencedTeam}`,
      `${experiencedTeam} veteran savvy against ${inexperiencedTeam}`,
      `${inexperiencedTeam} learning curve against ${experiencedTeam}`
    ]);
  }

  // Default descriptions based on general patterns
  if (strongerWinRate > 0.5) {
    return getRandomDescription([
      `${strongerTeam} looks to extend winning ways`,
      `${strongerTeam} favored in this showdown`,
      `${weakerTeam} seeks upset against ${strongerTeam}`,
      `${strongerTeam} aims to maintain momentum`,
      `${weakerTeam} fights uphill battle`,
      `${strongerTeam} confident entering matchup`,
      `${weakerTeam} hopes to turn season around`,
      `${strongerTeam} looks to build on success`
    ]);
  } else {
    return getRandomDescription([
      "Both teams desperate for victory",
      "Loser leaves with season on the line",
      "Critical game for both teams",
      "Must-win situation for both squads",
      "High stakes matchup with playoff implications"
    ]);
  }
}

function getRandomDescription(descriptions: string[]): string {
  return descriptions[Math.floor(Math.random() * descriptions.length)];
} 