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
  const [selectedMatchup, setSelectedMatchup] = useState<string>('');
  const [winningTeam, setWinningTeam] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setMatchups(data.matchups);
    } catch (error) {
      console.error('Error fetching matchups:', error);
      setMessage('Error fetching matchups');
      setMessageType('error');
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

  const handleMarkWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMatchup || !winningTeam) {
      setMessage('Please select a matchup and winning team');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await makeAuthenticatedRequest('/api/markWinner', {
        method: 'POST',
        body: JSON.stringify({
          matchup_id: selectedMatchup,
          winning_team: winningTeam,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Winner marked successfully! ${data.correctPicks} correct picks, ${data.incorrectPicks} incorrect picks`);
        setMessageType('success');
        setSelectedMatchup('');
        setWinningTeam('');
        
        // Refresh leaderboard
        fetchLeaderboard();
      } else {
        setMessage(data.error || 'Failed to mark winner');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Error marking winner');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedMatchup = () => {
    return matchups.find(m => m.id === selectedMatchup);
  };

  const handleBackToDashboard = () => {
    router.push('/');
  };

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
      
      {/* Mark Winner Form */}
      <form onSubmit={handleMarkWinner} className="mb-8">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Matchup
            </label>
            <select
              value={selectedMatchup}
              onChange={(e) => setSelectedMatchup(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Choose a matchup...</option>
              {matchups.map((matchup) => (
                <option key={matchup.id} value={matchup.id}>
                  {matchup.team1} vs {matchup.team2} (Week {matchup.week})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Winning Team
            </label>
            {selectedMatchup ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setWinningTeam(getSelectedMatchup()!.team1)}
                  className={`w-full p-3 border rounded-md transition-all duration-200 flex items-center space-x-3 ${
                    winningTeam === getSelectedMatchup()!.team1
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <TeamLogo teamName={getSelectedMatchup()!.team1} size="sm" />
                  <span className="font-medium text-gray-900">{getSelectedMatchup()!.team1}</span>
                  {winningTeam === getSelectedMatchup()!.team1 && (
                    <span className="ml-auto text-green-600">✓</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setWinningTeam(getSelectedMatchup()!.team2)}
                  className={`w-full p-3 border rounded-md transition-all duration-200 flex items-center space-x-3 ${
                    winningTeam === getSelectedMatchup()!.team2
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <TeamLogo teamName={getSelectedMatchup()!.team2} size="sm" />
                  <span className="font-medium text-gray-900">{getSelectedMatchup()!.team2}</span>
                  {winningTeam === getSelectedMatchup()!.team2 && (
                    <span className="ml-auto text-green-600">✓</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
                Select a matchup first
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !selectedMatchup || !winningTeam}
          className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-md transition duration-200"
        >
          {isSubmitting ? 'Marking Winner...' : 'Mark Winner'}
        </button>
      </form>

      {/* Selected Matchup Preview */}
      {selectedMatchup && getSelectedMatchup() && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Matchup Preview:</h4>
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-3">
              <TeamLogo teamName={getSelectedMatchup()!.team1} size="md" />
              <div className="text-center">
                <p className="font-semibold text-gray-900">{getSelectedMatchup()!.team1}</p>
                <p className="text-sm text-gray-500">{getSelectedMatchup()!.team1_record}</p>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-500">VS</div>
            <div className="flex items-center space-x-3">
              <div className="text-center">
                <p className="font-semibold text-gray-900">{getSelectedMatchup()!.team2}</p>
                <p className="text-sm text-gray-500">{getSelectedMatchup()!.team2_record}</p>
              </div>
              <TeamLogo teamName={getSelectedMatchup()!.team2} size="md" />
            </div>
          </div>
          {winningTeam && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">
                Winner: <span className="font-semibold text-green-600">{winningTeam}</span>
              </p>
            </div>
          )}
        </div>
      )}

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