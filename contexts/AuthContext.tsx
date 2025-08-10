import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth, signInWithGoogle, signInWithGoogleExisting, signOutUser, onAuthStateChange } from '../lib/firebase';
import { makeAuthenticatedRequest } from '../utils/api';

// Legacy interface for backward compatibility
interface UserRole {
  userId: string;
  userEmail: string;
  leagueId: string;
  role: 'admin' | 'user';
  joinedAt: Date;
  displayName: string;
  isPremium?: boolean;
}

// New interface for multi-league support
interface UserLeagueMembership {
  id: string;
  userId: string;
  userEmail: string;
  leagueId: string;
  leagueName: string;
  leagueCode: string;
  role: 'admin' | 'user';
  joinedAt: Date;
  lastAccessedAt: Date;
  displayName: string;
  isPremium?: boolean;
  isActive: boolean;
}

interface UserProfile {
  id: string;
  userId: string;
  userEmail: string;
  displayName: string;
  username?: string; // Custom username field for user preference
  defaultLeagueId?: string;
  preferences: {
    theme?: string;
    notifications?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface League {
  id: string;
  name: string;
  adminUserId: string;
  adminEmail: string;
  createdAt: Date;
  isActive: boolean;
  leagueCode: string;
  memberCount?: number;
  // Payment fields for per-league one-time payment
  isPaid: boolean;
  paidAt?: Date;
  paymentId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  // Legacy properties for backward compatibility
  userRole: UserRole | null;
  currentLeague: League | null;
  // New multi-league properties
  userLeagues: UserLeagueMembership[];
  userProfile: UserProfile | null;
  currentMembership: UserLeagueMembership | null;
  // Methods
  signIn: () => Promise<void>;
  signInExisting: () => Promise<void>;
  signOut: () => Promise<void>;
  createLeague: (leagueName: string) => Promise<League>;
  joinLeague: (leagueCode: string) => Promise<void>;
  switchLeague: (leagueId: string) => Promise<void>;
  fetchUserLeagues: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  // Computed properties
  isAdmin: boolean;
  isPremium: boolean;
  hasMultipleLeagues: boolean;
  displayName: string; // Computed display name using username priority
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
  // Legacy state for backward compatibility
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  // New multi-league state
  const [userLeagues, setUserLeagues] = useState<UserLeagueMembership[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentMembership, setCurrentMembership] = useState<UserLeagueMembership | null>(null);

  // Memoize fetchUserLeagues to prevent unnecessary re-renders and stale closures
  const fetchUserLeagues = useCallback(async (currentUser?: User | null) => {
    const userToCheck = currentUser || user;
    if (!userToCheck) return;
    
    console.log('fetchUserLeagues called for user:', userToCheck.email);
    
    try {
      const response = await makeAuthenticatedRequest('/api/getUserLeagues');
      console.log('getUserLeagues response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('getUserLeagues response data:', data);
        
        // Set multi-league data
        setUserLeagues(data.memberships || []);
        setUserProfile(data.userProfile ? {
          ...data.userProfile,
          createdAt: new Date(data.userProfile.createdAt),
          updatedAt: new Date(data.userProfile.updatedAt),
        } : null);
        setCurrentLeague(data.currentLeague ? {
          ...data.currentLeague,
          createdAt: new Date(data.currentLeague.createdAt),
          paidAt: data.currentLeague.paidAt ? new Date(data.currentLeague.paidAt) : undefined,
        } : null);
        setCurrentMembership(data.currentMembership ? {
          ...data.currentMembership,
          joinedAt: new Date(data.currentMembership.joinedAt),
          lastAccessedAt: new Date(data.currentMembership.lastAccessedAt),
        } : null);
        
        // Set legacy data for backward compatibility
        if (data.currentMembership) {
          setUserRole({
            userId: data.currentMembership.userId,
            userEmail: data.currentMembership.userEmail,
            leagueId: data.currentMembership.leagueId,
            role: data.currentMembership.role,
            joinedAt: new Date(data.currentMembership.joinedAt),
            displayName: data.currentMembership.displayName,
            isPremium: data.currentMembership.isPremium,
          });
        } else {
          setUserRole(null);
        }
        
        console.log('Updated state with:', {
          userLeaguesCount: data.memberships?.length || 0,
          hasCurrentLeague: !!data.currentLeague,
          hasCurrentMembership: !!data.currentMembership,
          hasMultipleLeagues: (data.memberships?.length || 0) > 1
        });
      } else if (response.status === 404) {
        // User has no memberships - they need to create or join a league
        console.log('No user memberships found - user needs to create or join a league');
        setUserLeagues([]);
        setUserProfile(null);
        setCurrentLeague(null);
        setCurrentMembership(null);
        setUserRole(null);
      } else {
        console.error('Error fetching user leagues:', response.status, response.statusText);
        // Don't throw here to prevent breaking the auth flow
      }
    } catch (error) {
      console.error('Error fetching user leagues:', error);
      // Don't throw here to prevent breaking the auth flow
    }
  }, [user]);

  // Legacy fetchUserRole for backward compatibility
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
      
      console.log('Auth state changed:', {
        hasUser: !!authUser,
        userEmail: authUser?.email,
        userId: authUser?.uid
      });
      
      setUser(authUser);
      
      if (authUser) {
        try {
          console.log('User authenticated, fetching leagues...');
          // Try to fetch multi-league data first
          await fetchUserLeagues(authUser);
        } catch (error) {
          console.error('Error fetching user leagues:', error);
          // Fallback to legacy method
          try {
            console.log('Falling back to legacy fetchUserRole...');
            await fetchUserRole(authUser);
          } catch (legacyError) {
            console.error('Error fetching user role:', legacyError);
          }
        }
      } else {
        console.log('User signed out, clearing state...');
        setUserRole(null);
        setCurrentLeague(null);
        setUserLeagues([]);
        setUserProfile(null);
        setCurrentMembership(null);
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
  }, [fetchUserLeagues, fetchUserRole]);

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
    
    // Update state with new multi-league data
    if (data.userMembership) {
      const newMembership: UserLeagueMembership = {
        ...data.userMembership,
        joinedAt: new Date(data.userMembership.joinedAt),
        lastAccessedAt: new Date(data.userMembership.lastAccessedAt),
      };
      setUserLeagues(prev => [newMembership, ...prev]);
      setCurrentMembership(newMembership);
    }
    
    if (data.userProfile) {
      const newProfile: UserProfile = {
        ...data.userProfile,
        createdAt: new Date(data.userProfile.createdAt),
        updatedAt: new Date(data.userProfile.updatedAt),
      };
      setUserProfile(newProfile);
    }
    
    // Set legacy data for backward compatibility
    if (data.userRole) {
      setUserRole(data.userRole);
    }
    if (data.league) {
      setCurrentLeague(data.league);
    }
    
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
    
    // Update state with new multi-league data
    if (data.userMembership) {
      const newMembership: UserLeagueMembership = {
        ...data.userMembership,
        joinedAt: new Date(data.userMembership.joinedAt),
        lastAccessedAt: new Date(data.userMembership.lastAccessedAt),
      };
      setUserLeagues(prev => [newMembership, ...prev]);
      setCurrentMembership(newMembership);
    }
    
    if (data.userProfile) {
      const newProfile: UserProfile = {
        ...data.userProfile,
        createdAt: new Date(data.userProfile.createdAt),
        updatedAt: new Date(data.userProfile.updatedAt),
      };
      setUserProfile(newProfile);
    }
    
    // Set legacy data for backward compatibility
    if (data.userRole) {
      setUserRole(data.userRole);
    }
    if (data.league) {
      setCurrentLeague(data.league);
    }
  };

  const switchLeague = async (leagueId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    const response = await makeAuthenticatedRequest('/api/switchLeague', {
      method: 'POST',
      body: JSON.stringify({ leagueId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to switch league');
    }

    // Refresh user leagues to get updated data
    await fetchUserLeagues();
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

  const signInExisting = async () => {
    try {
      if (!auth) {
        throw new Error('Firebase is not properly configured. Please check your .env.local file.');
      }
      await signInWithGoogleExisting();
    } catch (error) {
      console.error('Error signing in existing user:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
      setUserRole(null);
      setCurrentLeague(null);
      setUserLeagues([]);
      setUserProfile(null);
      setCurrentMembership(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const refreshUserProfile = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const response = await makeAuthenticatedRequest('/api/getUserLeagues');
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.userProfile ? {
          ...data.userProfile,
          createdAt: new Date(data.userProfile.createdAt),
          updatedAt: new Date(data.userProfile.updatedAt),
        } : null);
        
        // Also update currentMembership to ensure displayName updates
        if (data.currentMembership) {
          setCurrentMembership({
            ...data.currentMembership,
            joinedAt: new Date(data.currentMembership.joinedAt),
            lastAccessedAt: new Date(data.currentMembership.lastAccessedAt),
          });
        }
        
        // Update userLeagues as well to ensure all memberships are current
        if (data.memberships) {
          setUserLeagues(data.memberships.map((membership: any) => ({
            ...membership,
            joinedAt: new Date(membership.joinedAt),
            lastAccessedAt: new Date(membership.lastAccessedAt),
          })));
        }
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  // Computed display name with username priority
  const displayName = userProfile?.username || currentMembership?.displayName || user?.displayName || user?.email || 'Unknown User';

  const value = {
    user,
    loading,
    userRole,
    currentLeague,
    userLeagues,
    userProfile,
    currentMembership,
    signIn,
    signInExisting,
    signOut,
    createLeague,
    joinLeague,
    switchLeague,
    fetchUserLeagues,
    refreshUserProfile,
    isAdmin: currentMembership?.role === 'admin' || userRole?.role === 'admin',
    isPremium: currentLeague?.isPaid || false, // Use league payment status instead of user premium
    hasMultipleLeagues: userLeagues.length >= 1, // Changed from > 1 to >= 1 to allow joining additional leagues
    displayName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 