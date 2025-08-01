import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import * as LucideIcons from "lucide-react"
import { formatLeagueCodeInput, copyToClipboard } from '../lib/utils';

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
      setSuccessMessage(`League "${league.name}" created successfully! Share this code with your friends: ${league.leagueCode}`);
      
      // Navigate to the main dashboard after successful league creation
      // Add a longer delay to ensure AuthContext state is updated
      setTimeout(() => {
        console.log('Navigating to main dashboard after league creation...');
        router.push('/').catch((navError) => {
          console.error('Navigation error:', navError);
          setError('League created but navigation failed. Please refresh the page.');
        });
      }, 3000);
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
      
      // Navigate to the main dashboard after successfully joining league
      setTimeout(() => {
        router.push('/').catch((navError) => {
          console.error('Navigation error:', navError);
          setError('Successfully joined league but navigation failed. Please refresh the page.');
        });
      }, 2000);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="loading-spinner h-12 w-12 mx-auto border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-300 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if no user (shouldn't happen but safety check)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>
          <p className="text-slate-300 mb-4">Please sign in to continue.</p>
          <Button
            onClick={handleSignOut}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Sign out button component
  const SignOutButton = () => (
    <Button
      onClick={handleSignOut}
      variant="ghost"
      size="sm"
      className="absolute top-4 right-4 flex items-center space-x-2 text-slate-300 hover:text-white hover:bg-slate-700"
    >
      <LucideIcons.LogOut className="h-4 w-4" />
      <span className="text-sm font-medium">Sign out</span>
    </Button>
  );

  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative">
        <SignOutButton />
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl">
                <LucideIcons.Trophy className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Welcome, {user?.displayName || user?.email}
            </h1>
            <p className="text-slate-300 text-lg">
              Choose your role in the Madden CFM Betting league
            </p>
          </div>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white mb-2">
                Choose Your Role
              </CardTitle>
              <CardDescription className="text-slate-300">
                Select how you&apos;d like to participate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onClick={() => setStep('create')}
                className="w-full p-6 border-2 border-slate-600 hover:border-emerald-600/50 hover:bg-slate-700/50 transition-all duration-200 transform hover:scale-[1.02] bg-slate-800/50 rounded-lg cursor-pointer"
              >
                <div className="flex items-start space-x-4 w-full">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
                    <LucideIcons.Crown className="h-6 w-6" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-2">Create New League (Admin)</h3>
                    <p className="text-sm text-slate-300 leading-relaxed break-words">Set up matchups, mark winners, and manage your league</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setStep('join')}
                className="w-full p-6 border-2 border-slate-600 hover:border-blue-600/50 hover:bg-slate-700/50 transition-all duration-200 transform hover:scale-[1.02] bg-slate-800/50 rounded-lg cursor-pointer"
              >
                <div className="flex items-start space-x-4 w-full">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white">
                    <LucideIcons.Users className="h-6 w-6" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-2">Join Existing League</h3>
                    <p className="text-sm text-slate-300 leading-relaxed break-words">Make picks, compete with friends, and view leaderboard</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative">
        <SignOutButton />
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl">
                <LucideIcons.Crown className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Create Your League
            </h1>
            <p className="text-slate-300 text-lg">
              Set up a new Madden CFM Betting league
            </p>
          </div>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white mb-2">
                League Setup
              </CardTitle>
              <CardDescription className="text-slate-300">
                Create a new league and become the admin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateLeague} className="space-y-6">
                <div>
                  <label htmlFor="leagueName" className="block text-sm font-medium text-slate-300 mb-2">
                    League Name
                  </label>
                  <Input
                    type="text"
                    id="leagueName"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    placeholder="Enter your league name"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 font-medium">{error}</p>
                  </div>
                )}

                {successMessage && (
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-emerald-400 font-medium">{successMessage}</p>
                    {successMessage.includes('Share this code') && (
                      <div className="mt-3 p-2 bg-slate-700/50 rounded border border-slate-600">
                        <p className="text-xs text-slate-300 mb-1">League Code:</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-mono font-bold text-emerald-400 tracking-wider">
                            {successMessage.split('Share this code with your friends: ')[1]}
                          </p>
                          <Button
                            type="button"
                            onClick={async () => {
                              const code = successMessage.split('Share this code with your friends: ')[1];
                              const success = await copyToClipboard(code);
                              if (success) {
                                setSuccessMessage('League code copied to clipboard!');
                                setTimeout(() => {
                                  setSuccessMessage(`League "${leagueName}" created successfully! Share this code with your friends: ${code}`);
                                }, 2000);
                              }
                            }}
                            variant="ghost"
                            size="sm"
                            className="ml-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                          >
                            <LucideIcons.Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    onClick={handleBackToSelection}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating...' : 'Create League'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative">
        <SignOutButton />
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl">
                <LucideIcons.UserPlus className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Join a League
            </h1>
            <p className="text-slate-300 text-lg">
              Enter a league code to join an existing league
            </p>
          </div>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white mb-2">
                League Code
              </CardTitle>
              <CardDescription className="text-slate-300">
                Ask your league admin for the code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinLeague} className="space-y-6">
                              <div>
                <label htmlFor="leagueCode" className="block text-sm font-medium text-slate-300 mb-2">
                  League Code
                </label>
                <Input
                  type="text"
                  id="leagueCode"
                  value={leagueCode}
                  onChange={(e) => setLeagueCode(formatLeagueCodeInput(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  placeholder="XXX-XXX-XXXX"
                  maxLength={12}
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  Format: XXX-XXX-XXXX (letters and numbers)
                </p>
              </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 font-medium">{error}</p>
                  </div>
                )}

                {successMessage && (
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-emerald-400 font-medium">{successMessage}</p>
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    onClick={handleBackToSelection}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Joining...' : 'Join League'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default RoleSelection; 