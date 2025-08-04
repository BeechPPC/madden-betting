import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { makeAuthenticatedRequest } from '../utils/api';
import { copyToClipboard } from '../lib/utils';
import Login from '../components/Login';
import LandingPage from '../components/LandingPage';
import RoleSelection from '../components/RoleSelection';
import MatchupCard from '../components/MatchupCard';
import Leaderboard from '../components/Leaderboard';
import UserProfile from '../components/UserProfile';
import TeamMatchupHeader from '../components/TeamMatchupHeader';
import * as LucideIcons from "lucide-react";

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
  const { user, userRole, currentLeague, loading, isPremium } = useAuth();
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [selectedPicks, setSelectedPicks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isLoadingMatchups, setIsLoadingMatchups] = useState(false);
  const [matchupsError, setMatchupsError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);

  useEffect(() => {
    if (user && userRole && !loading) {
      fetchMatchups();
    }
  }, [user, userRole, loading]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
          <p className="mt-4 text-slate-300 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show landing page if user is not authenticated
  if (!user) {
    return <LandingPage />;
  }

  // Show role selection if user is authenticated but doesn't have a role
  if (user && !userRole) {
    console.log('User authenticated but no role, showing RoleSelection');
    console.log('User:', user);
    console.log('UserRole:', userRole);
    return <RoleSelection />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>Madden CFM Betting</title>
        <meta name="description" content="Weekly Madden CFM game predictions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LucideIcons.Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400" />
            <span className="text-lg sm:text-xl font-bold text-white">ClutchPicks</span>
          </div>
          <div className="flex items-center space-x-3">
            {userRole?.role === 'admin' && (
              <Link
                href="/admin"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Admin Panel
              </Link>
            )}
            <UserProfile />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center lg:text-left flex-1">
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <LucideIcons.Trophy className="h-8 w-8 text-emerald-400" />
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  Madden CFM Betting
                </h1>
              </div>
              <p className="text-lg text-slate-300">
                Make your picks for this week&apos;s matchups
              </p>
              {currentLeague && (
                <div className="flex items-center justify-center lg:justify-start space-x-2 flex-wrap gap-2">
                  <div className="bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 px-3 py-1 rounded-full text-sm font-medium">
                    {currentLeague.name}
                  </div>
                  <div 
                    className="bg-slate-600/20 text-slate-300 border border-slate-600/30 px-3 py-1 rounded-full text-sm font-mono font-medium cursor-pointer hover:bg-slate-600/30 transition-colors flex items-center space-x-1"
                    onClick={async () => {
                      if (currentLeague.leagueCode) {
                        const success = await copyToClipboard(currentLeague.leagueCode);
                        if (success) {
                          // You could add a toast notification here
                          console.log('League code copied to clipboard');
                        }
                      }
                    }}
                    title="Click to copy league code"
                  >
                    <span>{currentLeague.leagueCode}</span>
                    <LucideIcons.Copy className="h-3 w-3" />
                  </div>
                  {currentWeek && (
                    <div className="bg-blue-600/20 text-blue-400 border border-blue-600/30 px-3 py-1 rounded-full text-sm font-medium">
                      Week {currentWeek}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Matchup Header - Shows when matchups are available */}
        {matchups.length > 0 && (
          <div className="mb-6">
            <TeamMatchupHeader matchups={matchups} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 overflow-y-auto max-h-screen md:max-h-none">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mb-8">
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-white">
                      Welcome back, {user.displayName || user.email}
                    </span>
                    <p className="text-sm text-slate-300">
                      {userRole?.role === 'admin' ? 'Ready to manage your league?' : 'Ready to make your picks?'}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <LucideIcons.Gamepad2 className="h-6 w-6 text-emerald-400 mr-3" />
                    This Week&apos;s Matchups
                  </h2>
                  
                  {isLoadingMatchups ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
                      <p className="mt-4 text-slate-300 font-medium">Loading matchups...</p>
                    </div>
                  ) : matchupsError ? (
                    <div className="text-center py-12">
                      <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-6">
                        <LucideIcons.AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <p className="font-medium text-white mb-3">{matchupsError}</p>
                        <button
                          onClick={fetchMatchups}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  ) : matchups.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
                        <LucideIcons.Calendar className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">No Matchups Available</h3>
                      <p className="text-slate-300 font-medium mb-4">
                        {currentWeek ? `No matchups have been set up for Week ${currentWeek} yet.` : 'No matchups are currently available.'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {userRole?.role === 'admin' 
                          ? 'Set up this week\'s matchups in the Admin Panel.'
                          : 'Check back later or contact the admin to set up this week\'s matchups.'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {matchups.map((matchup, index) => (
                        <div 
                          key={matchup.id} 
                          className="animate-fade-in" 
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <MatchupCard
                            matchup={matchup}
                            selectedTeam={selectedPicks[matchup.id]}
                            onTeamSelect={(team) => handleTeamSelect(matchup.id, team)}
                            isPremium={isPremium}
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
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <LucideIcons.Check className="h-4 w-4 mr-2" />
                          Submit Picks
                        </>
                      )}
                    </button>
                    <div className="text-sm text-slate-300 font-medium bg-slate-700/50 px-4 py-2 rounded-full border border-slate-600">
                      {Object.keys(selectedPicks).length} of {matchups?.length || 0} picks selected
                    </div>
                  </div>
                )}

                {submitMessage && (
                  <div className={`mt-6 p-4 rounded-xl ${
                    submitMessage.includes('successfully') 
                      ? 'bg-emerald-900/20 border border-emerald-700/30' 
                      : 'bg-red-900/20 border border-red-700/30'
                  }`}>
                    <div className="flex items-center">
                      {submitMessage.includes('successfully') ? (
                        <LucideIcons.CheckCircle className="h-5 w-5 text-emerald-400 mr-2" />
                      ) : (
                        <LucideIcons.AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                      )}
                      <span className="font-medium text-white">{submitMessage}</span>
                    </div>
                  </div>
                )}
              </form>
            </div>
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