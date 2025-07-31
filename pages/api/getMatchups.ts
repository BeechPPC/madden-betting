import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleSheetsService } from '../../utils/googleSheets';

interface Matchup {
  id: string;
  week: number;
  team1: string;
  team1_record: string;
  team2: string;
  team2_record: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use our GoogleSheetsService to read matchups raw data
    const matchupsData = await GoogleSheetsService.readMatchupsRaw();

    if (!matchupsData || matchupsData.length === 0) {
      return res.status(404).json({ error: 'No matchups found in Google Sheets' });
    }

    // Transform the data to match the expected format
    const allMatchups: Matchup[] = matchupsData.map((row, index) => {
      const [week, team1, team1_record, team2, team2_record] = row;
      
      return {
        id: `matchup-${week}-${index}`,
        week: parseInt(week) || 1,
        team1: team1 || 'TBD',
        team1_record: team1_record || '0-0',
        team2: team2 || 'TBD',
        team2_record: team2_record || '0-0',
      };
    });

    // Get current week (highest week number in the data)
    const allWeeks = Array.from(new Set(allMatchups.map(m => m.week))).sort((a, b) => a - b);
    const currentWeek = allWeeks.length > 0 ? Math.max(...allWeeks) : 1;

    // Filter matchups to only show current week
    const currentWeekMatchups = allMatchups.filter(matchup => matchup.week === currentWeek);

    res.status(200).json({
      matchups: currentWeekMatchups, // Only return current week matchups
      currentWeek,
      totalMatchups: currentWeekMatchups.length,
      allWeeks, // For debugging
      debug: {
        totalMatchupsFound: allMatchups.length,
        weekDistribution: allMatchups.reduce((acc, m) => {
          acc[m.week] = (acc[m.week] || 0) + 1;
          return acc;
        }, {} as Record<number, number>)
      }
    });

  } catch (error) {
    console.error('Error fetching matchups:', error);
    res.status(500).json({ 
      error: 'Failed to fetch matchups from Google Sheets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 