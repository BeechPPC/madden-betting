import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';
import RoleSelection from '../components/RoleSelection';
import AdminPanel from '../components/AdminPanel';
import { makeAuthenticatedRequest } from '../utils/api';
import * as LucideIcons from "lucide-react";
import { Badge } from '../components/ui/badge';

export default function AdminPage() {
  const { user, isAdmin, displayName, userLeagues, currentMembership } = useAuth();
  const [currentSection, setCurrentSection] = useState<'main' | 'setup'>('main');
  const [sheetId, setSheetId] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentLeague, setCurrentLeague] = useState<any>(null);

  // Get current league info
  useEffect(() => {
    const getCurrentLeague = async () => {
      try {
        const response = await makeAuthenticatedRequest('/api/getUserLeagues', {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.leagues && data.leagues.length > 0) {
            const activeLeague = data.leagues.find((l: any) => l.isActive);
            setCurrentLeague(activeLeague);
          }
        }
      } catch (error) {
        console.error('Error getting current league:', error);
      }
    };

    getCurrentLeague();
  }, []);

  // Show loading state while checking authentication
  if (!user) {
    return <Login />;
  }

  // Check if user has any leagues
  const hasLeagues = userLeagues.length > 0 || currentMembership;

  // Show role selection if user is authenticated but doesn't have any leagues
  if (user && !hasLeagues) {
    return <RoleSelection />;
  }

  // Check if user is admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 max-w-md mx-4">
            <LucideIcons.ShieldX className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-slate-300 mb-4">You don&apos;t have permission to access the admin panel.</p>
            <p className="text-sm text-slate-400">Only league admins can access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleVerifyConnection = async () => {
    if (!sheetId.trim()) {
      setVerificationStatus('error');
      setVerificationMessage('Please enter a Sheet ID');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('idle');
    setVerificationMessage('');

    try {
      const response = await makeAuthenticatedRequest('/api/verifySheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sheetId: sheetId.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationStatus('success');
        setVerificationMessage(data.message);
        
        // Verification successful - don't auto-save, let user click save button
      } else {
        setVerificationStatus('error');
        setVerificationMessage(data.error || 'Verification failed');
      }
    } catch (error) {
      setVerificationStatus('error');
      setVerificationMessage('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!isAdmin) {
      setVerificationStatus('error');
      setVerificationMessage('Only admins can update league settings');
      return;
    }

    console.log('Is admin check (string):', isAdmin ? 'true' : 'false');

    setIsSaving(true);
    setVerificationMessage('Saving settings...');

    try {
      console.log('Making API request to updateLeagueSettingsV2...');
      const response = await makeAuthenticatedRequest('/api/updateLeagueSettingsV2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sheetId: sheetId.trim() }),
      });

      console.log('API response status:', response.status);
      console.log('API response ok:', response.ok);

      const data = await response.json();
      console.log('API response data:', data);

      if (response.ok) {
        setVerificationStatus('success');
        setVerificationMessage('Google Sheet settings saved successfully!');
      } else {
        setVerificationStatus('error');
        setVerificationMessage(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error in handleSaveSettings:', error);
      setVerificationStatus('error');
      setVerificationMessage('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>Admin Panel - Madden CFM Betting</title>
        <meta name="description" content="Admin panel for managing Madden CFM betting results" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LucideIcons.Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400" />
            <span className="text-lg sm:text-xl font-bold text-white">ClutchPicks</span>
            <span className="text-sm text-emerald-400 font-medium hidden sm:block">Admin</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Current League Display */}
            {currentLeague && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-slate-800 rounded-md border border-slate-700">
                <LucideIcons.Users className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-slate-300">
                  {currentLeague.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {currentLeague.role}
                </Badge>
              </div>
            )}
            {/* Setup Link */}
            <button
              onClick={() => setCurrentSection(currentSection === 'main' ? 'setup' : 'main')}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors duration-200"
            >
              <LucideIcons.Settings className="h-4 w-4" />
              <span className="hidden sm:block">
                {currentSection === 'main' ? 'Setup Sheets' : 'Back to Admin'}
              </span>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-medium">
                {displayName.charAt(0)}
              </div>
              <span className="text-sm font-medium text-slate-300 hidden sm:block">
                {displayName}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-3">
              {currentSection === 'main' ? (
                <LucideIcons.Settings className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400" />
              ) : (
                <LucideIcons.FileSpreadsheet className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400" />
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                {currentSection === 'main' ? 'Admin Panel' : 'Google Sheets Setup'}
              </h1>
            </div>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl">
              {currentSection === 'main' 
                ? 'Manage matchups, mark winners, and update leaderboard for your CFM league'
                : currentLeague 
                  ? `Configure Google Sheets for ${currentLeague.name}`
                  : 'Configure Google Sheets for your current league'
              }
            </p>
            {currentLeague && currentSection === 'setup' && (
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <LucideIcons.Info className="h-4 w-4" />
                <span>
                  This configuration is specific to <strong className="text-emerald-400">{currentLeague.name}</strong>. 
                  Each league can have its own Google Sheet.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {currentSection === 'main' ? (
          <AdminPanel />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Google Sheets Setup Instructions</h2>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Step 1 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">Copy the Template Sheet</h3>
                      <p className="text-sm sm:text-base text-blue-800 mb-4">
                        Click the link below to access our template Google Sheet. This template contains all the necessary columns and formatting for your league data.
                      </p>
                      <a
                        href="https://docs.google.com/spreadsheets/d/1r-PRUjsnYjnuJbdIWWCAdQuM6YnigaDL1G5U-PNclpA/copy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-base font-medium rounded-md transition-colors duration-200"
                      >
                        <LucideIcons.ExternalLink className="h-4 w-4" />
                        <span>Copy Template Sheet</span>
                      </a>
                      <p className="text-xs sm:text-sm text-blue-700 mt-2">
                        Click above to make a copy of the template sheet
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-2">Get Your Sheet ID</h3>
                      <p className="text-sm sm:text-base text-green-800 mb-4">
                        After making a copy, you&apos;ll need the Sheet ID from the URL. The URL will look like this:
                      </p>
                      <div className="bg-gray-100 p-3 rounded-md font-mono text-xs sm:text-sm text-gray-800 mb-4 overflow-x-auto">
                        https://docs.google.com/spreadsheets/d/<span className="bg-yellow-200 px-1 rounded">YOUR_SHEET_ID_HERE</span>/edit
                      </div>
                      <p className="text-xs sm:text-sm text-green-700">
                        Copy the highlighted portion (the long string of letters and numbers)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-purple-900 mb-2">Configure Permissions</h3>
                      <p className="text-sm sm:text-base text-purple-800 mb-4">
                        Make sure your sheet is accessible to our system. In your Google Sheet:
                      </p>
                      <ul className="list-disc list-inside text-sm sm:text-base text-purple-800 space-y-1 mb-4">
                        <li>Click &quot;Share&quot; in the top right</li>
                        <li>Change to &quot;Anyone with the link&quot; can view</li>
                        <li>Click &quot;Done&quot;</li>
                      </ul>
                      <p className="text-xs sm:text-sm text-purple-700">
                        This allows our system to read your league data while keeping it secure
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        4
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-orange-900 mb-2">Connect Your Sheet</h3>
                      <p className="text-sm sm:text-base text-orange-800 mb-4">
                        Paste your Sheet ID below and verify the connection:
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="sheetId" className="block text-sm font-medium text-orange-900 mb-2">
                            Sheet ID
                          </label>
                          <input
                            type="text"
                            id="sheetId"
                            value={sheetId}
                            onChange={(e) => setSheetId(e.target.value)}
                            placeholder="Enter your Google Sheet ID here..."
                            className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                          />
                          <p className="text-xs text-orange-700 mt-1">
                            You can paste the full URL or just the Sheet ID
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                          <button
                            type="button"
                            onClick={handleVerifyConnection}
                            disabled={isVerifying}
                            className="inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white text-sm sm:text-base font-medium rounded-md transition-colors duration-200"
                          >
                            {isVerifying ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <LucideIcons.Check className="h-4 w-4" />
                                <span>Verify Connection</span>
                              </>
                            )}
                          </button>
                          
                          {verificationStatus === 'success' && (
                            <button
                              type="button"
                              onClick={handleSaveSettings}
                              disabled={isSaving}
                              className="inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white text-sm sm:text-base font-medium rounded-md transition-colors duration-200"
                            >
                              {isSaving ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <LucideIcons.Save className="h-4 w-4" />
                                  <span>Save Settings</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="mt-6 sm:mt-8 p-4 border rounded-lg ${
                verificationStatus === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : verificationStatus === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    verificationStatus === 'success' 
                      ? 'bg-green-500' 
                      : verificationStatus === 'error'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                  }`}></div>
                  <span className={`font-medium text-sm sm:text-base ${
                    verificationStatus === 'success' 
                      ? 'text-green-900' 
                      : verificationStatus === 'error'
                      ? 'text-red-900'
                      : 'text-gray-700'
                  }`}>
                    {verificationStatus === 'success' 
                      ? 'Connection Status: Connected' 
                      : verificationStatus === 'error'
                      ? 'Connection Status: Error'
                      : 'Connection Status: Not Configured'
                    }
                  </span>
                </div>
                <p className={`text-xs sm:text-sm mt-2 ${
                  verificationStatus === 'success' 
                    ? 'text-green-800' 
                    : verificationStatus === 'error'
                    ? 'text-red-800'
                    : 'text-gray-600'
                }`}>
                  {verificationMessage || 
                    (verificationStatus === 'success' 
                      ? 'Your Google Sheet is connected and ready to use!'
                      : 'Complete the steps above to connect your Google Sheet and start managing your league data.'
                    )
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 