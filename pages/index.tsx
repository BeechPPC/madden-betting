import { useState, useEffect } from 'react';
import Head from 'next/head';
import MatchupCard from '../components/MatchupCard';
import Leaderboard from '../components/Leaderboard';
import { useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';
import UserProfile from '../components/UserProfile';
import { makeAuthenticatedRequest } from '../utils/api';

interface Matchup {
  id: string;
  week: number;
  team1: string;
  team1_record: string;
  team2: string;
  team2_record: string;
}

interface Bet {
  id: string;
  user_name: string;
  matchup_id: string;
  selected_team: string;
  created_at: string;
}

export default function Home() {
  const { user, loading } = useAuth();
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [selectedPicks, setSelectedPicks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [isLoadingMatchups, setIsLoadingMatchups] = useState<boolean>(false);
  const [matchupsError, setMatchupsError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      fetchMatchups();
    }
  }, [user, loading]);

  const fetchMatchups = async () => {
    try {
      setIsLoadingMatchups(true);
      setMatchupsError(null);
      const response = await makeAuthenticatedRequest('/api/getMatchups');
      const data = await response.json();
      
      if (response.ok) {
        setMatchups(data.matchups);
        setCurrentWeek(data.currentWeek);
      } else {
        setMatchupsError(data.error || 'Failed to load matchups');
      }
    } catch (error) {
      console.error('Error fetching matchups:', error);
      setMatchupsError('Error loading matchups');
    } finally {
      setIsLoadingMatchups(false);
    }
  };

  const handleTeamSelect = (matchupId: string, team: string) => {
    setSelectedPicks(prev => ({
      ...prev,
      [matchupId]: team
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setSubmitMessage('Please sign in to submit picks');
      return;
    }

    const picksCount = Object.keys(selectedPicks).length;
    if (picksCount === 0) {
      setSubmitMessage('Please select at least one team');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await makeAuthenticatedRequest('/api/submitBet', {
        method: 'POST',
        body: JSON.stringify({
          user_name: user.displayName || user.email || 'Unknown User',
          user_id: user.uid,
          picks: selectedPicks,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage('Picks submitted successfully!');
        setSelectedPicks({});
      } else {
        setSubmitMessage(data.error || 'Failed to submit picks');
      }
    } catch (error) {
      setSubmitMessage('Error submitting picks');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="loading-spinner h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen">
      <Head>
        <title>Madden CFM Betting</title>
        <meta name="description" content="Weekly Madden CFM game predictions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center lg:text-left flex-1">
            <h1 className="sport-header mb-3 animate-fade-in">
              Madden CFM Betting
            </h1>
            <p className="sport-subtitle mb-4">
              Make your picks for this week's matchups
            </p>
            {currentWeek && (
              <div className="week-badge animate-bounce-in">
                Week {currentWeek}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="/admin"
              className="btn-secondary"
            >
              Admin Panel
            </a>
            <UserProfile />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="card-sport p-8 mb-8 animate-slide-up">
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-soft">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-gray-900">
                      Welcome back, {user.displayName || user.email}
                    </span>
                    <p className="text-sm text-gray-600">Ready to make your picks?</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="mr-3">🏈</span>
                  This Week's Matchups
                </h2>
                
                {isLoadingMatchups ? (
                  <div className="text-center py-12">
                    <div className="loading-spinner h-8 w-8 mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">Loading matchups...</p>
                  </div>
                ) : matchupsError ? (
                  <div className="text-center py-12">
                    <div className="error-message">
                      <p className="font-medium">{matchupsError}</p>
                      <button
                        onClick={fetchMatchups}
                        className="mt-3 btn-secondary"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : matchups.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-2xl">📅</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Matchups Available</h3>
                    <p className="text-gray-500 font-medium mb-4">
                      {currentWeek ? `No matchups have been set up for Week ${currentWeek} yet.` : 'No matchups are currently available.'}
                    </p>
                    <p className="text-sm text-gray-400">
                      Check back later or contact the admin to set up this week's matchups.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {matchups.map((matchup, index) => (
                      <div key={matchup.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                        <MatchupCard
                          matchup={matchup}
                          selectedTeam={selectedPicks[matchup.id]}
                          onTeamSelect={(team) => handleTeamSelect(matchup.id, team)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {matchups.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="loading-spinner h-4 w-4 mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Picks'
                    )}
                  </button>
                  <div className="text-sm text-gray-600 font-medium bg-gray-100 px-4 py-2 rounded-full">
                    {Object.keys(selectedPicks).length} of {matchups?.length || 0} picks selected
                  </div>
                </div>
              )}

              {submitMessage && (
                <div className={`mt-6 p-4 rounded-xl ${
                  submitMessage.includes('successfully') 
                    ? 'success-message' 
                    : 'error-message'
                }`}>
                  <div className="flex items-center">
                    {submitMessage.includes('successfully') ? (
                      <span className="mr-2">✅</span>
                    ) : (
                      <span className="mr-2">⚠️</span>
                    )}
                    <span className="font-medium">{submitMessage}</span>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Leaderboard Sidebar */}
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>
        </div>
      </main>
    </div>
  );
} 