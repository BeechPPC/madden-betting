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
      // Redirect to landing page after successful sign out
      router.push('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
      setError('Failed to sign out. Please try again.');
    }
  }, [signOut, router]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 w-full relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl animate-pulse">
                <LucideIcons.Trophy className="h-10 w-10 text-white" />
              </div>
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Loading ClutchPicks</h2>
              <p className="text-slate-300">Setting up your experience...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no user (shouldn't happen but safety check)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 w-full relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50/50 backdrop-blur-sm shadow-xl shadow-black/20 max-w-md w-full">
            <CardContent className="p-8 text-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-2xl">
                  <LucideIcons.AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <div className="absolute inset-0 bg-red-400/20 rounded-full blur-md"></div>
              </div>
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-white">Authentication Required</h1>
                <p className="text-slate-300">Please sign in to access this page.</p>
                <Button
                  onClick={() => router.push('/')}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white px-8 py-3 rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
                >
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
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
      className="absolute top-6 right-6 flex items-center space-x-2 text-slate-300 hover:text-white hover:bg-slate-800/50 bg-slate-900/50 backdrop-blur-sm px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 z-50"
    >
      <LucideIcons.LogOut className="h-4 w-4" />
      <span className="text-sm font-medium">Sign out</span>
    </Button>
  );

  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 w-full relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <SignOutButton />
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="max-w-2xl w-full space-y-12">
            {/* Header Section */}
            <div className="text-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl">
                  <LucideIcons.Trophy className="h-12 w-12 text-white" />
                </div>
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md"></div>
              </div>
              <div className="space-y-4">
                <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/40 text-sm px-4 py-2 rounded-full shadow-lg shadow-emerald-500/10">
                  Welcome to ClutchPicks
                </Badge>
                <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                  Welcome,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-emerald-400">
                    {user?.displayName || user?.email}
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  Choose your role in the Madden CFM Tipping League and start your journey to becoming a champion.
                </p>
              </div>
            </div>
            
            {/* Role Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Create League Card */}
              <Card 
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-emerald-500/50 transition-all duration-500 hover:scale-105 backdrop-blur-sm shadow-xl shadow-black/20 group cursor-pointer"
                onClick={() => setStep('create')}
              >
                <CardContent className="p-8 space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:shadow-emerald-500/25 transition-all duration-300">
                      <LucideIcons.Crown className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors duration-300">
                      Create New League
                    </h3>
                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/40 text-xs px-3 py-1 rounded-full">
                      Admin Role
                    </Badge>
                    <p className="text-slate-300 leading-relaxed">
                      Set up matchups, mark winners, manage your league, and become the ultimate CFM commissioner.
                    </p>
                    <div className="flex items-center space-x-2 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300">
                      <span className="text-sm font-medium">Get Started</span>
                      <LucideIcons.ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Join League Card */}
              <Card 
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 backdrop-blur-sm shadow-xl shadow-black/20 group cursor-pointer"
                onClick={() => setStep('join')}
              >
                <CardContent className="p-8 space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-300">
                      <LucideIcons.Users className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">
                      Join Existing League
                    </h3>
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/40 text-xs px-3 py-1 rounded-full">
                      Player Role
                    </Badge>
                    <p className="text-slate-300 leading-relaxed">
                      Make picks, compete with friends, view leaderboards, and prove you&apos;re the best CFM predictor.
                    </p>
                    <div className="flex items-center space-x-2 text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
                      <span className="text-sm font-medium">Join Now</span>
                      <LucideIcons.ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 w-full relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <SignOutButton />
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="max-w-lg w-full space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl">
                  <LucideIcons.Crown className="h-10 w-10 text-white" />
                </div>
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md"></div>
              </div>
              <div className="space-y-4">
                <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/40 text-sm px-4 py-2 rounded-full shadow-lg shadow-emerald-500/10">
                  League Creation
                </Badge>
                <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                  Create Your League
                </h1>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Set up a new Madden CFM Betting league and become the commissioner
                </p>
              </div>
            </div>
            
            {/* Form Card */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm shadow-xl shadow-black/20">
              <CardContent className="p-8">
                <form onSubmit={handleCreateLeague} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="leagueName" className="block text-sm font-medium text-slate-300">
                      League Name
                    </label>
                    <Input
                      type="text"
                      id="leagueName"
                      value={leagueName}
                      onChange={(e) => setLeagueName(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 rounded-xl focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300"
                      placeholder="Enter your league name"
                      required
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <LucideIcons.AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                        <p className="text-red-400 font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center space-x-3 mb-3">
                        <LucideIcons.CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                        <p className="text-emerald-400 font-medium">{successMessage}</p>
                      </div>
                      {successMessage.includes('Share this code') && (
                        <div className="mt-4 p-4 bg-slate-700/50 rounded-xl border border-slate-600 backdrop-blur-sm">
                          <p className="text-sm text-slate-300 mb-3 font-medium">League Code:</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xl font-mono font-bold text-emerald-400 tracking-wider">
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
                              className="ml-3 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 rounded-lg transition-all duration-300"
                            >
                              <LucideIcons.Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-4 pt-4">
                    <Button
                      type="button"
                      onClick={handleBackToSelection}
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <LucideIcons.ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <LucideIcons.Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <LucideIcons.Plus className="h-4 w-4 mr-2" />
                          Create League
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 w-full relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <SignOutButton />
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="max-w-lg w-full space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl">
                  <LucideIcons.UserPlus className="h-10 w-10 text-white" />
                </div>
                <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-md"></div>
              </div>
              <div className="space-y-4">
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/40 text-sm px-4 py-2 rounded-full shadow-lg shadow-blue-500/10">
                  Join League
                </Badge>
                <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                  Join a League
                </h1>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Enter a league code to join an existing league and start competing
                </p>
              </div>
            </div>
            
            {/* Form Card */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm shadow-xl shadow-black/20">
              <CardContent className="p-8">
                <form onSubmit={handleJoinLeague} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="leagueCode" className="block text-sm font-medium text-slate-300">
                      League Code
                    </label>
                    <Input
                      type="text"
                      id="leagueCode"
                      value={leagueCode}
                      onChange={(e) => setLeagueCode(formatLeagueCodeInput(e.target.value))}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 rounded-xl focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300"
                      placeholder="XXX-XXX-XXXX"
                      maxLength={12}
                      required
                    />
                    <p className="text-xs text-slate-400">
                      Format: XXX-XXX-XXXX (letters and numbers)
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <LucideIcons.AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                        <p className="text-red-400 font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <LucideIcons.CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                        <p className="text-emerald-400 font-medium">{successMessage}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4 pt-4">
                    <Button
                      type="button"
                      onClick={handleBackToSelection}
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <LucideIcons.ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <LucideIcons.Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          <LucideIcons.Users className="h-4 w-4 mr-2" />
                          Join League
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RoleSelection; 