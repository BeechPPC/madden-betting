import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleSheetsService } from '../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read raw matchups data
    const matchupsData = await GoogleSheetsService.readMatchupsRaw();

    if (!matchupsData || matchupsData.length === 0) {
      return res.status(404).json({ error: 'No matchups found in Google Sheets' });
    }

    // Transform and analyze the data
    const allMatchups = matchupsData.map((row, index) => {
      const [week, team1, team1_record, team2, team2_record] = row;
      return {
        id: `matchup-${week}-${index}`,
        week: parseInt(week) || 1,
        team1: team1 || 'TBD',
        team1_record: team1_record || '0-0',
        team2: team2 || 'TBD',
        team2_record: team2_record || '0-0',
        rawRow: row // Include raw data for debugging
      };
    });

    // Analyze week distribution
    const weekDistribution = allMatchups.reduce((acc, m) => {
      acc[m.week] = (acc[m.week] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const allWeeks = Array.from(new Set(allMatchups.map(m => m.week))).sort((a, b) => a - b);
    const currentWeek = allWeeks.length > 0 ? Math.max(...allWeeks) : 1;
    const currentWeekMatchups = allMatchups.filter(matchup => matchup.week === currentWeek);

    res.status(200).json({
      success: true,
      rawData: matchupsData,
      processedMatchups: allMatchups,
      weekAnalysis: {
        allWeeks,
        currentWeek,
        weekDistribution,
        totalMatchups: allMatchups.length,
        currentWeekMatchups: currentWeekMatchups.length
      },
      currentWeekMatchups: currentWeekMatchups
    });

  } catch (error) {
    console.error('Error testing Google Sheets:', error);
    res.status(500).json({ 
      error: 'Failed to test Google Sheets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 