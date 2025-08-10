import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';
import RoleSelection from '../components/RoleSelection';
import { makeAuthenticatedRequest } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function ProfilePage() {
  const { user, userProfile, currentMembership, userLeagues, loading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading...</p>
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
    
    // Debounce the availability check
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500);

    return () => clearTimeout(timeoutId);
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
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      case 'available':
        return <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>;
      case 'taken':
        return <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>;
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
        return 'text-green-600';
      case 'taken':
        return 'text-red-600';
      case 'checking':
        return 'text-blue-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <>
      <Head>
        <title>Profile - Madden CFM Betting</title>
        <meta name="description" content="Manage your profile and username" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="sport-header text-4xl mb-4">Profile Settings</h1>
              <p className="sport-subtitle text-slate-300">
                Customize your profile and manage your username
              </p>
            </div>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Account Information</CardTitle>
                <CardDescription className="text-slate-300">
                  Your account details and current display information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current User Info */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Current Information</h3>
                  <div className="space-y-2 text-slate-300">
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Google Display Name:</strong> {user.displayName || 'Not set'}</div>
                    <div><strong>Custom Username:</strong> {userProfile?.username || 'Not set'}</div>
                    <div><strong>Current Display Name:</strong> {userProfile?.username || user.displayName || user.email}</div>
                  </div>
                </div>

                {/* Username Settings */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                      Custom Username
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="Enter your desired username"
                        className="flex-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                        maxLength={20}
                      />
                      <Button
                        onClick={handleUpdateUsername}
                        disabled={isUpdating || availabilityStatus === 'taken' || availabilityStatus === 'checking'}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isUpdating ? 'Updating...' : 'Update'}
                      </Button>
                    </div>
                    
                    {/* Availability Status */}
                    {availabilityStatus !== 'idle' && (
                      <div className="flex items-center space-x-2 mt-2">
                        {getAvailabilityIcon()}
                        <span className={`text-sm ${getAvailabilityColor()}`}>
                          {getAvailabilityText()}
                        </span>
                      </div>
                    )}

                    {/* Username Requirements */}
                    <div className="text-xs text-slate-400 mt-2">
                      Username must be 3-20 characters long and contain only letters, numbers, and underscores.
                    </div>
                  </div>
                </div>

                {/* Message Display */}
                {message && (
                  <div className={`p-3 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
                      : 'bg-red-500/20 border border-red-500/30 text-red-300'
                  }`}>
                    {message.text}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    onClick={() => router.push('/')}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Back to Dashboard
                  </Button>
                  
                  {userLeagues.length > 1 && (
                    <Button
                      onClick={() => router.push('/admin')}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      League Management
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
} 