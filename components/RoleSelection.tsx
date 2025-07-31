import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const RoleSelection: React.FC = () => {
  const { user, createLeague, joinLeague, signOut, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'create' | 'join'>('select');
  const [leagueName, setLeagueName] = useState('');
  const [leagueCode, setLeagueCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear any pending timeouts when component unmounts
      setError('');
      setSuccessMessage('');
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
      setError('Failed to sign out. Please try again.');
    }
  }, [signOut]);

  const handleCreateLeague = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName.trim()) {
      setError('Please enter a league name');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const league = await createLeague(leagueName.trim());
      setSuccessMessage(`League "${league.name}" created successfully! Your league code is: ${league.leagueCode}`);
      
      // Use a more reliable navigation approach
      const timeoutId = setTimeout(() => {
        router.push('/').catch((navError) => {
          console.error('Navigation error:', navError);
          setError('League created but navigation failed. Please refresh the page.');
        });
      }, 2000);

      // Cleanup timeout if component unmounts
      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error('Error creating league:', error);
      if (error instanceof Error) {
        setError(`Failed to create league: ${error.message}`);
      } else {
        setError('Failed to create league. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [leagueName, createLeague, router]);

  const handleJoinLeague = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueCode.trim()) {
      setError('Please enter a league code');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      await joinLeague(leagueCode.trim());
      setSuccessMessage('Successfully joined the league!');
      
      // Use a more reliable navigation approach
      const timeoutId = setTimeout(() => {
        router.push('/').catch((navError) => {
          console.error('Navigation error:', navError);
          setError('Successfully joined league but navigation failed. Please refresh the page.');
        });
      }, 2000);

      // Cleanup timeout if component unmounts
      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error('Error joining league:', error);
      setError(error instanceof Error ? error.message : 'Failed to join league');
    } finally {
      setIsSubmitting(false);
    }
  }, [leagueCode, joinLeague, router]);

  const handleBackToSelection = useCallback(() => {
    setStep('select');
    setError('');
    setSuccessMessage('');
    setLeagueName('');
    setLeagueCode('');
  }, []);

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="loading-spinner h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if no user (shouldn't happen but safety check)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">Please sign in to continue.</p>
          <button
            onClick={handleSignOut}
            className="btn-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Sign out button component
  const SignOutButton = () => (
    <button
      onClick={handleSignOut}
      className="absolute top-4 right-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-xl p-2 transition-all duration-200 hover:bg-white/50"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span className="text-sm font-medium">Sign out</span>
    </button>
  );

  if (step === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <SignOutButton />
        <div className="max-w-md w-full space-y-8 animate-fade-in">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center shadow-large">
                <span className="text-3xl">🏈</span>
              </div>
            </div>
            <h1 className="sport-header mb-3">
              Welcome, {user?.displayName || user?.email}
            </h1>
            <p className="sport-subtitle">
              Choose your role in the Madden CFM Betting league
            </p>
          </div>
          
          <div className="card-sport p-8">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Choose Your Role
                </h2>
                <p className="text-gray-600 font-medium">
                  Select how you&apos;d like to participate
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => setStep('create')}
                  className="w-full p-6 border-2 border-primary-200 rounded-xl hover:border-primary-300 hover:shadow-medium transition-all duration-200 transform hover:scale-[1.02] bg-gradient-to-r from-primary-50 to-primary-100/50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xl">
                      🏆
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-gray-900">Create New League (Admin)</h3>
                      <p className="text-sm text-gray-600">Set up matchups, mark winners, and manage your league</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setStep('join')}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-medium transition-all duration-200 transform hover:scale-[1.02] bg-white"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 flex items-center justify-center text-white font-bold text-xl">
                      👥
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-gray-900">Join Existing League</h3>
                      <p className="text-sm text-gray-600">Make picks, compete with friends, and view leaderboard</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <SignOutButton />
        <div className="max-w-md w-full space-y-8 animate-fade-in">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center shadow-large">
                <span className="text-3xl">🏆</span>
              </div>
            </div>
            <h1 className="sport-header mb-3">
              Create Your League
            </h1>
            <p className="sport-subtitle">
              Set up a new Madden CFM Betting league
            </p>
          </div>
          
          <div className="card-sport p-8">
            <form onSubmit={handleCreateLeague} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  League Setup
                </h2>
                <p className="text-gray-600 font-medium">
                  Create a new league and become the admin
                </p>
              </div>
              
              <div>
                <label htmlFor="leagueName" className="block text-sm font-medium text-gray-700 mb-2">
                  League Name
                </label>
                <input
                  type="text"
                  id="leagueName"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  className="input-field"
                  placeholder="Enter your league name"
                  required
                />
              </div>

              {error && (
                <div className="error-message">
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="success-message">
                  <p className="font-medium">{successMessage}</p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleBackToSelection}
                  className="flex-1 btn-secondary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create League'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'join') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <SignOutButton />
        <div className="max-w-md w-full space-y-8 animate-fade-in">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-accent-500 to-accent-600 flex items-center justify-center shadow-large">
                <span className="text-3xl">👥</span>
              </div>
            </div>
            <h1 className="sport-header mb-3">
              Join a League
            </h1>
            <p className="sport-subtitle">
              Enter a league code to join an existing league
            </p>
          </div>
          
          <div className="card-sport p-8">
            <form onSubmit={handleJoinLeague} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  League Code
                </h2>
                <p className="text-gray-600 font-medium">
                  Ask your league admin for the code
                </p>
              </div>
              
              <div>
                <label htmlFor="leagueCode" className="block text-sm font-medium text-gray-700 mb-2">
                  League Code
                </label>
                <input
                  type="text"
                  id="leagueCode"
                  value={leagueCode}
                  onChange={(e) => setLeagueCode(e.target.value)}
                  className="input-field"
                  placeholder="Enter league code"
                  required
                />
              </div>

              {error && (
                <div className="error-message">
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="success-message">
                  <p className="font-medium">{successMessage}</p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleBackToSelection}
                  className="flex-1 btn-secondary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Joining...' : 'Join League'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RoleSelection; 