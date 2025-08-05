import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { makeAuthenticatedRequest } from '../utils/api';

export default function DebugPage() {
  const { 
    user, 
    loading, 
    userLeagues, 
    currentLeague, 
    currentMembership, 
    hasMultipleLeagues,
    userRole,
    userProfile 
  } = useAuth();
  
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [authTestResult, setAuthTestResult] = useState<any>(null);

  const testAuth = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/testAuth');
      const data = await response.json();
      setAuthTestResult(data);
    } catch (error) {
      setAuthTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const testGetUserLeagues = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/getUserLeagues');
      const data = await response.json();
      setApiTestResult(data);
    } catch (error) {
      setApiTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  useEffect(() => {
    if (user) {
      testAuth();
      testGetUserLeagues();
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">Debug Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Authentication State */}
        <div className="bg-slate-800 p-4 sm:p-6 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Authentication State</h2>
          <div className="space-y-2 text-xs sm:text-sm">
            <div><strong>User:</strong> {user ? 'Authenticated' : 'Not authenticated'}</div>
            {user && (
              <>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>UID:</strong> {user.uid}</div>
                <div><strong>Display Name:</strong> {user.displayName || 'None'}</div>
              </>
            )}
            <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* League State */}
        <div className="bg-slate-800 p-4 sm:p-6 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">League State</h2>
          <div className="space-y-2 text-xs sm:text-sm">
            <div><strong>User Leagues Count:</strong> {userLeagues.length}</div>
            <div><strong>Has Multiple Leagues:</strong> {hasMultipleLeagues ? 'Yes' : 'No'}</div>
            <div><strong>Current League:</strong> {currentLeague ? currentLeague.name : 'None'}</div>
            <div><strong>Current Membership:</strong> {currentMembership ? `${currentMembership.role} in ${currentMembership.leagueName}` : 'None'}</div>
            <div><strong>User Role (Legacy):</strong> {userRole ? `${userRole.role} in ${userRole.leagueId}` : 'None'}</div>
            <div><strong>User Profile:</strong> {userProfile ? 'Exists' : 'None'}</div>
          </div>
        </div>

        {/* User Leagues Details */}
        <div className="bg-slate-800 p-4 sm:p-6 rounded-lg lg:col-span-2">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">User Leagues Details</h2>
          {userLeagues.length === 0 ? (
            <div className="text-slate-400 text-sm">No leagues found</div>
          ) : (
            <div className="space-y-2">
              {userLeagues.map((membership, index) => (
                <div key={membership.id} className="bg-slate-700 p-3 rounded">
                  <div className="text-xs sm:text-sm">
                    <div><strong>League {index + 1}:</strong> {membership.leagueName}</div>
                    <div><strong>Role:</strong> {membership.role}</div>
                    <div><strong>League ID:</strong> {membership.leagueId}</div>
                    <div><strong>Joined:</strong> {new Date(membership.joinedAt).toLocaleDateString()}</div>
                    <div><strong>Last Accessed:</strong> {new Date(membership.lastAccessedAt).toLocaleDateString()}</div>
                    <div><strong>Is Current:</strong> {currentLeague?.id === membership.leagueId ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Test Results */}
        <div className="bg-slate-800 p-4 sm:p-6 rounded-lg lg:col-span-2">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">API Test Results</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-medium mb-2">Auth Test</h3>
              <pre className="bg-slate-700 p-3 rounded text-xs sm:text-sm overflow-x-auto">
                {JSON.stringify(authTestResult, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-medium mb-2">Get User Leagues Test</h3>
              <pre className="bg-slate-700 p-3 rounded text-xs sm:text-sm overflow-x-auto">
                {JSON.stringify(apiTestResult, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 