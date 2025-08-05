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
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Panel - Mark Winners</h2>
        <button
          onClick={handleBackToDashboard}
          className="flex items-center justify-center sm:justify-start space-x-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors duration-200 text-sm sm:text-base"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </button>
      </div>
      
      {/* Mark Winners Form */}
      <form onSubmit={handleMarkWinners} className="mb-6 sm:mb-8">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Select Winners for Each Matchup</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">Click on a team to mark them as the winner for that matchup.</p>
          
          {isLoading ? (
            <div className="text-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-500 mx-auto mb-3 sm:mb-4"></div>
              <p className="text-sm sm:text-base text-gray-500">Loading matchups...</p>
            </div>
          ) : matchups.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-sm sm:text-base text-gray-500">No matchups available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {matchups.map((matchup) => (
                <div key={matchup.id} className="card-sport p-3 sm:p-4 hover:shadow-large transition-all duration-300">
                  <div className="text-center mb-3 sm:mb-4">
                    <span className="text-xs sm:text-sm font-medium text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
                      Week {matchup.week}
                    </span>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3">
                    {/* Team 1 */}
                    <button
                      type="button"
                      onClick={() => handleTeamSelect(matchup.id, matchup.team1)}
                      className={`w-full p-2 sm:p-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                        winners[matchup.id] === matchup.team1
                          ? 'border-green-500 bg-green-50 shadow-medium'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-soft'
                      }`}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <TeamLogo teamName={matchup.team1} size="sm" />
                        <div className="text-left min-w-0 flex-1">
                          <span className="font-bold text-gray-900 text-sm sm:text-base truncate block">{matchup.team1}</span>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{matchup.team1_record}</p>
                        </div>
                      </div>
                      {winners[matchup.id] === matchup.team1 && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ml-2">
                          ✓
                        </div>
                      )}
                    </button>

                    {/* VS Divider */}
                    <div className="vs-divider">
                      <span className="vs-text text-xs sm:text-sm">VS</span>
                    </div>

                    {/* Team 2 */}
                    <button
                      type="button"
                      onClick={() => handleTeamSelect(matchup.id, matchup.team2)}
                      className={`w-full p-2 sm:p-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                        winners[matchup.id] === matchup.team2
                          ? 'border-green-500 bg-green-50 shadow-medium'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-soft'
                      }`}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <TeamLogo teamName={matchup.team2} size="sm" />
                        <div className="text-left min-w-0 flex-1">
                          <span className="font-bold text-gray-900 text-sm sm:text-base truncate block">{matchup.team2}</span>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{matchup.team2_record}</p>
                        </div>
                      </div>
                      {winners[matchup.id] === matchup.team2 && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ml-2">
                          ✓
                        </div>
                      )}
                    </button>
                  </div>

                  {winners[matchup.id] && (
                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gradient-to-r from-green-50 to-green-100/80 border border-green-200 rounded-xl">
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          <TeamLogo teamName={winners[matchup.id]} size="sm" />
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xs ml-1">
                            ✓
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-green-800 text-xs sm:text-sm truncate">
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <button
            type="submit"
            disabled={isSubmitting || selectedWinnersCount === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="loading-spinner h-3 w-3 sm:h-4 sm:w-4 mr-2"></div>
                <span className="text-xs sm:text-sm">Marking Winners...</span>
              </div>
            ) : (
              'Mark Selected Winners'
            )}
          </button>
          <div className="text-xs sm:text-sm text-gray-600 font-medium bg-gray-100 px-3 sm:px-4 py-2 rounded-full text-center sm:text-left">
            {selectedWinnersCount} of {isLoading ? '...' : matchups.length} winners selected
          </div>
        </div>
      </form>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-md text-sm sm:text-base ${
          messageType === 'success' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Current Leaderboard */}
      <div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Current Leaderboard</h3>
        {leaderboard.length === 0 ? (
          <p className="text-sm sm:text-base text-gray-500">No leaderboard data available</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wins
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Losses
                      </th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Win %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboard.map((entry) => (
                      <tr key={entry.user_name} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          #{entry.rank}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {entry.user_name}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {entry.wins}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {entry.losses}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {entry.points}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 