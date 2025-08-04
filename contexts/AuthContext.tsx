import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, onAuthStateChange } from '../lib/firebase';
import { makeAuthenticatedRequest } from '../utils/api';

interface UserRole {
  userId: string;
  userEmail: string;
  leagueId: string;
  role: 'admin' | 'user';
  joinedAt: Date;
  displayName: string;
  isPremium?: boolean;
}

interface League {
  id: string;
  name: string;
  adminUserId: string;
  adminEmail: string;
  createdAt: Date;
  isActive: boolean;
  leagueCode: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: UserRole | null;
  currentLeague: League | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  createLeague: (leagueName: string) => Promise<League>;
  joinLeague: (leagueCode: string) => Promise<void>;
  fetchUserRole: () => Promise<void>;
  isAdmin: boolean;
  isPremium: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);

  // Memoize fetchUserRole to prevent unnecessary re-renders and stale closures
  const fetchUserRole = useCallback(async (currentUser?: User | null) => {
    const userToCheck = currentUser || user;
    if (!userToCheck) return;
    
    try {
      const response = await makeAuthenticatedRequest('/api/getUserRole');
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.userRole);
        setCurrentLeague(data.league);
      } else if (response.status === 404) {
        // User has no role - they need to create or join a league
        console.log('No user role found - user needs to create or join a league');
        setUserRole(null);
        setCurrentLeague(null);
      } else {
        console.error('Error fetching user role:', response.status, response.statusText);
        // Don't throw here to prevent breaking the auth flow
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Don't throw here to prevent breaking the auth flow
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChange(async (authUser) => {
      if (!isMounted) return;
      
      setUser(authUser);
      
      if (authUser) {
        try {
          // Pass the authUser directly to avoid race conditions
          await fetchUserRole(authUser);
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      } else {
        setUserRole(null);
        setCurrentLeague(null);
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [fetchUserRole]);

  const createLeague = async (leagueName: string): Promise<League> => {
    if (!user) throw new Error('User not authenticated');
    
    console.log('createLeague called with:', { leagueName, userEmail: user.email, userId: user.uid });
    
    const response = await makeAuthenticatedRequest('/api/createLeague', {
      method: 'POST',
      body: JSON.stringify({
        leagueName,
        adminEmail: user.email,
        adminUserId: user.uid,
        displayName: user.displayName || user.email || 'Unknown User'
      }),
    });

    console.log('createLeague response status:', response.status);
    console.log('createLeague response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = 'Failed to create league';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error('Server error response:', errorData);
      } catch (jsonError) {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text();
          console.error('Non-JSON error response:', errorText);
          errorMessage = `Server error (${response.status}): ${errorText.substring(0, 100)}`;
        } catch (textError) {
          console.error('Could not read error response:', textError);
          errorMessage = `Server error (${response.status}): Could not read response`;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('createLeague success response:', data);
    console.log('Setting userRole:', data.userRole);
    console.log('Setting currentLeague:', data.league);
    setUserRole(data.userRole);
    setCurrentLeague(data.league);
    return data.league;
  };

  const joinLeague = async (leagueCode: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    const response = await makeAuthenticatedRequest('/api/joinLeague', {
      method: 'POST',
      body: JSON.stringify({
        leagueCode,
        userEmail: user.email,
        userId: user.uid,
        displayName: user.displayName || user.email || 'Unknown User'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join league');
    }

    const data = await response.json();
    setUserRole(data.userRole);
    setCurrentLeague(data.league);
  };

  const signIn = async () => {
    try {
      if (!auth) {
        throw new Error('Firebase is not properly configured. Please check your .env.local file.');
      }
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
      setUserRole(null);
      setCurrentLeague(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    userRole,
    currentLeague,
    signIn,
    signOut,
    createLeague,
    joinLeague,
    fetchUserRole,
    isAdmin: userRole?.role === 'admin',
    isPremium: userRole?.isPremium || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 