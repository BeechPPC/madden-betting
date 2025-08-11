import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { makeAuthenticatedRequest } from '../utils/api';

interface LeaderboardEntry {
  user_name: string;
  correct_picks: number;
  total_picks: number;
  win_percentage: number;
  rank: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await makeAuthenticatedRequest('/api/getLeaderboard');
      const data = await response.json();
      
      if (response.ok) {
        setLeaderboard(data.leaderboard);
      } else if (response.status === 404) {
        // Handle 404 errors gracefully - user needs to set up their league
        console.log('Leaderboard 404 - user needs to set up league:', data.error);
        if (data.error === 'User not found in any league') {
          setError('Please create or join a league to view the leaderboard');
        } else if (data.error === 'League does not have a Google Sheet configured') {
          setError('League setup incomplete. Please contact the admin to configure the leaderboard.');
        } else {
          setError(data.error || 'League not properly configured');
        }
      } else {
        setError(data.error || 'Failed to load leaderboard');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Error loading leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'rank-1';
      case 2:
        return 'rank-2';
      case 3:
        return 'rank-3';
      default:
        return '';
    }
  };

  return (
    <div className="card-sport p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <span className="mr-3">🏆</span>
          Leaderboard
        </h2>
        <button
          onClick={fetchLeaderboard}
          className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="loading-spinner h-8 w-8 mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading leaderboard...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          {error.includes('create or join a league') ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Join the Competition!</h3>
              <p className="text-gray-600 text-sm mb-4">
                Create or join a league to see the leaderboard and compete with others.
              </p>
              <Link
                href="/role-selection"
                className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200"
              >
                Create or Join League →
              </Link>
            </div>
          ) : (
            <div className="error-message">
              <p className="font-medium">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="mt-3 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-500 font-medium">No picks submitted yet</p>
          <p className="text-sm text-gray-400 mt-1">Be the first to make your picks!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_name}
              className={`leaderboard-item p-4 ${getRankClass(entry.rank)} animate-fade-in`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-sm shadow-soft">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{entry.user_name}</p>
                    <p className="text-sm text-gray-500">
                      {entry.correct_picks}/{entry.total_picks} correct picks
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {entry.win_percentage}%
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    {entry.correct_picks} wins
                  </p>
                </div>
              </div>
              
              {/* Progress bar for top 3 */}
              {entry.rank <= 3 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                      style={{ width: `${entry.win_percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-500 font-medium">
            Leaderboard updates after each week&apos;s results
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Make your picks to climb the rankings!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard; 