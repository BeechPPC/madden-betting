import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';
import RoleSelection from '../components/RoleSelection';
import { makeAuthenticatedRequest } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import * as LucideIcons from "lucide-react";

export default function ProfilePage() {
  const { user, userProfile, currentMembership, userLeagues, loading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user has any leagues (using new multi-league system or legacy system)
  const hasLeagues = currentMembership || userLeagues.length > 0;

  // Redirect to role selection if user is authenticated but doesn't have any leagues
  useEffect(() => {
    if (user && !hasLeagues && !loading) {
      router.push('/role-selection');
    }
  }, [user, hasLeagues, loading, router]);

  // Initialize username from user profile
  useEffect(() => {
    if (userProfile?.username) {
      setUsername(userProfile.username);
    }
  }, [userProfile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-400/30 border-t-emerald-400 mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-slate-300 text-lg font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <Login />;
  }

  // Show role selection if user is authenticated but doesn't have any leagues
  if (user && !hasLeagues) {
    return null; // Will redirect to role selection
  }

  const checkUsernameAvailability = async (value: string) => {
    if (!value || value.length < 3) {
      setAvailabilityStatus('idle');
      return;
    }

    setIsCheckingAvailability(true);
    setAvailabilityStatus('checking');

    try {
      const response = await makeAuthenticatedRequest('/api/checkUsername', {
        method: 'POST',
        body: JSON.stringify({ username: value }),
      });

      if (response.ok) {
        const data = await response.json();
        setAvailabilityStatus(data.available ? 'available' : 'taken');
      } else {
        setAvailabilityStatus('invalid');
      }
    } catch (error) {
      console.error('Error checking username availability:', error);
      setAvailabilityStatus('invalid');
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setMessage(null);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce the availability check
    timeoutRef.current = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500);
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      setMessage({ type: 'error', text: 'Please enter a username' });
      return;
    }

    setIsUpdating(true);
    setMessage(null);

    try {
      const response = await makeAuthenticatedRequest('/api/updateProfile', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
        // Refresh user profile data
        await refreshUserProfile();
        // Update local username state to match the updated profile
        setUsername(username.trim());
        // Reset availability status
        setAvailabilityStatus('idle');
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error });
      }
    } catch (error) {
      console.error('Error updating username:', error);
      setMessage({ type: 'error', text: 'Failed to update username' });
    } finally {
      setIsUpdating(false);
    }
  };

  const getAvailabilityIcon = () => {
    switch (availabilityStatus) {
      case 'checking':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500/30 border-t-blue-500"></div>;
      case 'available':
        return <LucideIcons.CheckCircle className="w-4 h-4 text-green-500" />;
      case 'taken':
        return <LucideIcons.XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getAvailabilityText = () => {
    switch (availabilityStatus) {
      case 'checking':
        return 'Checking availability...';
      case 'available':
        return 'Username is available!';
      case 'taken':
        return 'Username is already taken';
      default:
        return '';
    }
  };

  const getAvailabilityColor = () => {
    switch (availabilityStatus) {
      case 'available':
        return 'text-green-400';
      case 'taken':
        return 'text-red-400';
      case 'checking':
        return 'text-blue-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <>
      <Head>
        <title>Profile - Madden CFM Betting</title>
        <meta name="description" content="Manage your profile and username" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header */}
        <header className="border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/20">
          <div className="container mx-auto px-4 lg:px-6 h-20 flex items-center justify-between">
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => router.push('/')}>
              <div className="relative">
                <LucideIcons.Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">ClutchPicks</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/')}
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800/50 text-sm px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
              >
                <LucideIcons.Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              {userLeagues.length > 1 && (
                <Button
                  onClick={() => router.push('/admin')}
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white hover:bg-slate-800/50 text-sm px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  <LucideIcons.Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 lg:px-6 py-12 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 bg-emerald-600/20 text-emerald-400 border border-emerald-600/40 text-sm px-4 py-2 rounded-full shadow-lg shadow-emerald-500/10 mb-6">
                <LucideIcons.User className="w-4 h-4" />
                <span>Profile Management</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Your
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-emerald-400 animate-gradient ml-4">
                  Profile
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Customize your profile, manage your username, and control how you appear across all your leagues.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* User Info Card */}
              <div className="lg:col-span-1">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm shadow-2xl shadow-black/20 hover:shadow-emerald-500/5 transition-all duration-500">
                  <CardHeader className="text-center pb-6">
                    <div className="relative mx-auto mb-4">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-emerald-500/25">
                        {(userProfile?.username || user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-slate-900">
                        <LucideIcons.Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-white text-xl">
                      {userProfile?.username || user?.displayName || 'User'}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {user?.email || 'No email available'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                      <div className="flex items-center space-x-3 mb-3">
                        <LucideIcons.Users className="w-5 h-5 text-emerald-400" />
                        <span className="text-white font-medium">League Membership</span>
                      </div>
                      <div className="text-slate-300 text-sm">
                        {userLeagues.length} league{userLeagues.length !== 1 ? 's' : ''} joined
                      </div>
                    </div>
                    
                    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                      <div className="flex items-center space-x-3 mb-3">
                        <LucideIcons.Crown className="w-5 h-5 text-yellow-400" />
                        <span className="text-white font-medium">Account Status</span>
                      </div>
                      <div className="text-slate-300 text-sm">
                        {currentMembership?.role === 'admin' ? 'League Admin' : 'Member'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Settings Card */}
              <div className="lg:col-span-2">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm shadow-2xl shadow-black/20 hover:shadow-emerald-500/5 transition-all duration-500">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center">
                        <LucideIcons.Settings className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-2xl">Profile Settings</CardTitle>
                        <CardDescription className="text-slate-400">
                          Customize your display name and account preferences
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Username Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <LucideIcons.User className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-white font-semibold text-lg">Custom Username</h3>
                      </div>
                      
                      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                        <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-3">
                          Choose your display name
                        </label>
                        <div className="flex space-x-3">
                          <div className="flex-1 relative">
                            <Input
                              id="username"
                              type="text"
                              value={username}
                              onChange={(e) => handleUsernameChange(e.target.value)}
                              placeholder="Enter your desired username"
                              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 h-12 rounded-lg focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300"
                              maxLength={20}
                            />
                            {availabilityStatus !== 'idle' && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {getAvailabilityIcon()}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={handleUpdateUsername}
                            disabled={isUpdating || availabilityStatus === 'taken' || availabilityStatus === 'checking'}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white h-12 px-6 rounded-lg shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          >
                            {isUpdating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                                Updating...
                              </>
                            ) : (
                              <>
                                <LucideIcons.Save className="w-4 h-4 mr-2" />
                                Update
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {/* Availability Status */}
                        {availabilityStatus !== 'idle' && (
                          <div className="flex items-center space-x-2 mt-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                            {getAvailabilityIcon()}
                            <span className={`text-sm font-medium ${getAvailabilityColor()}`}>
                              {getAvailabilityText()}
                            </span>
                          </div>
                        )}

                        {/* Username Requirements */}
                        <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                          <div className="flex items-center space-x-2 mb-2">
                            <LucideIcons.Info className="w-4 h-4 text-blue-400" />
                            <span className="text-slate-300 font-medium text-sm">Username Requirements</span>
                          </div>
                          <ul className="text-xs text-slate-400 space-y-1">
                            <li>• 3-20 characters long</li>
                            <li>• Letters, numbers, and underscores only</li>
                            <li>• Must be unique across all users</li>
                            <li>• Cannot be changed frequently</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Current Information Display */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <LucideIcons.Info className="w-5 h-5 text-blue-400" />
                        <h3 className="text-white font-semibold text-lg">Current Information</h3>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                          <div className="flex items-center space-x-2 mb-2">
                            <LucideIcons.Mail className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-400 text-sm">Email Address</span>
                          </div>
                          <div className="text-white font-medium">{user?.email || 'No email available'}</div>
                        </div>
                        
                        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                          <div className="flex items-center space-x-2 mb-2">
                            <LucideIcons.User className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-400 text-sm">Google Name</span>
                          </div>
                          <div className="text-white font-medium">{user?.displayName || 'Not set'}</div>
                        </div>
                        
                        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                          <div className="flex items-center space-x-2 mb-2">
                            <LucideIcons.Tag className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-400 text-sm">Custom Username</span>
                          </div>
                          <div className="text-white font-medium">{userProfile?.username || 'Not set'}</div>
                        </div>
                        
                        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                          <div className="flex items-center space-x-2 mb-2">
                            <LucideIcons.Eye className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-400 text-sm">Display Name</span>
                          </div>
                          <div className="text-white font-medium">
                            {userProfile?.username || user?.displayName || user?.email || 'No display name'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message Display */}
                    {message && (
                      <div className={`p-4 rounded-xl border ${
                        message.type === 'success' 
                          ? 'bg-green-500/10 border-green-500/30 text-green-300' 
                          : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}>
                        <div className="flex items-center space-x-3">
                          {message.type === 'success' ? (
                            <LucideIcons.CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <LucideIcons.AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                          <span className="font-medium">{message.text}</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4 pt-6 border-t border-slate-700/50">
                      <Button
                        onClick={() => router.push('/')}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300 h-12 px-6 rounded-lg"
                      >
                        <LucideIcons.ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                      </Button>
                      
                      {userLeagues.length > 1 && (
                        <Button
                          onClick={() => router.push('/admin')}
                          variant="outline"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300 h-12 px-6 rounded-lg"
                        >
                          <LucideIcons.Settings className="w-4 h-4 mr-2" />
                          League Management
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 