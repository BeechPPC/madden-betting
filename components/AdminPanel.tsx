import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { makeAuthenticatedRequest } from '../utils/api';
import TeamLogo from './TeamLogo';

interface Matchup {
  id: string;
  week: number;
  team1: string;
  team1_record: string;
  team2: string;
  team2_record: string;
}

interface LeaderboardEntry {
  user_name: string;
  wins: number;
  losses: number;
  points: number;
  rank: number;
}

export default function AdminPanel() {
  const router = useRouter();
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [winners, setWinners] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchMatchups();
    fetchLeaderboard();
  }, []);

  const fetchMatchups = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/getMatchups');
      const data = await response.json();
      
      if (response.ok && data.matchups) {
        setMatchups(data.matchups);
      } else {
        console.error('Error fetching matchups:', data.error || 'Unknown error');
        setMatchups([]);
        setMessage(data.error || 'Error fetching matchups');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error fetching matchups:', error);
      setMatchups([]);
      setMessage('Error fetching matchups');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/getLeaderboard');
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleTeamSelect = (matchupId: string, team: string) => {
    setWinners(prev => ({
      ...prev,
      [matchupId]: team
    }));
  };

  const handleMarkWinners = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedWinners = Object.keys(winners).filter(matchupId => winners[matchupId]);
    
    if (selectedWinners.length === 0) {
      setMessage('Please select at least one winner');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      // Mark winners one by one
      let totalCorrect = 0;
      let totalIncorrect = 0;
      
      for (const matchupId of selectedWinners) {
        const response = await makeAuthenticatedRequest('/api/markWinner', {
          method: 'POST',
          body: JSON.stringify({
            matchup_id: matchupId,
            winning_team: winners[matchupId],
          }),
        });

        const data = await response.json();
        
        if (response.ok) {
          totalCorrect += data.correctPicks || 0;
          totalIncorrect += data.incorrectPicks || 0;
        } else {
          throw new Error(data.error || 'Failed to mark winner');
        }
      }

      setMessage(`Winners marked successfully! ${totalCorrect} correct picks, ${totalIncorrect} incorrect picks`);
      setMessageType('success');
      setWinners({});
      
      // Refresh leaderboard
      fetchLeaderboard();
    } catch (error) {
      setMessage('Error marking winners');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/');
  };

  const selectedWinnersCount = Object.keys(winners).filter(matchupId => winners[matchupId]).length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Admin Panel - Mark Winners</h2>
        <button
          onClick={handleBackToDashboard}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors duration-200"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </button>
      </div>
      
      {/* Mark Winners Form */}
      <form onSubmit={handleMarkWinners} className="mb-8">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Select Winners for Each Matchup</h3>
          <p className="text-gray-600 mb-4">Click on a team to mark them as the winner for that matchup.</p>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading matchups...</p>
            </div>
          ) : matchups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No matchups available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchups.map((matchup) => (
                <div key={matchup.id} className="card-sport p-4 hover:shadow-large transition-all duration-300">
                  <div className="text-center mb-4">
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      Week {matchup.week}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Team 1 */}
                    <button
                      type="button"
                      onClick={() => handleTeamSelect(matchup.id, matchup.team1)}
                      className={`w-full p-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                        winners[matchup.id] === matchup.team1
                          ? 'border-green-500 bg-green-50 shadow-medium'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-soft'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <TeamLogo teamName={matchup.team1} size="md" />
                        <div className="text-left">
                          <span className="font-bold text-gray-900 text-base">{matchup.team1}</span>
                          <p className="text-sm text-gray-500">{matchup.team1_record}</p>
                        </div>
                      </div>
                      {winners[matchup.id] === matchup.team1 && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xs">
                          ✓
                        </div>
                      )}
                    </button>

                    {/* VS Divider */}
                    <div className="vs-divider">
                      <span className="vs-text">VS</span>
                    </div>

                    {/* Team 2 */}
                    <button
                      type="button"
                      onClick={() => handleTeamSelect(matchup.id, matchup.team2)}
                      className={`w-full p-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                        winners[matchup.id] === matchup.team2
                          ? 'border-green-500 bg-green-50 shadow-medium'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-soft'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <TeamLogo teamName={matchup.team2} size="md" />
                        <div className="text-left">
                          <span className="font-bold text-gray-900 text-base">{matchup.team2}</span>
                          <p className="text-sm text-gray-500">{matchup.team2_record}</p>
                        </div>
                      </div>
                      {winners[matchup.id] === matchup.team2 && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xs">
                          ✓
                        </div>
                      )}
                    </button>
                  </div>

                  {winners[matchup.id] && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-green-100/80 border border-green-200 rounded-xl">
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          <TeamLogo teamName={winners[matchup.id]} size="sm" />
                          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xs ml-1">
                            ✓
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-green-800 text-sm">
                            Winner: <span className="text-green-900">{winners[matchup.id]}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isSubmitting || selectedWinnersCount === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="loading-spinner h-4 w-4 mr-2"></div>
                Marking Winners...
              </div>
            ) : (
              'Mark Selected Winners'
            )}
          </button>
          <div className="text-sm text-gray-600 font-medium bg-gray-100 px-4 py-2 rounded-full">
            {selectedWinnersCount} of {isLoading ? '...' : matchups.length} winners selected
          </div>
        </div>
      </form>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          messageType === 'success' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Current Leaderboard */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Current Leaderboard</h3>
        {leaderboard.length === 0 ? (
          <p className="text-gray-500">No leaderboard data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wins
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Losses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((entry) => (
                  <tr key={entry.user_name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{entry.rank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.losses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.points}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 