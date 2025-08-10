// Server-side only - no client-side Firestore imports

// Server-side Firebase Admin SDK
let admin: any = null;
let db: any = null;

// Initialize Firebase Admin SDK for server-side operations
function initializeFirebaseAdmin() {
  if (admin) return admin;
  
  try {
    admin = require('firebase-admin');
    
    // Check if already initialized
    if (admin.apps.length === 0) {
      // Parse private key properly
      let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
      
      // Remove quotes if present
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      
      // Replace \n with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      // Ensure proper PEM format
      if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----\n')) {
        privateKey = '-----BEGIN PRIVATE KEY-----\n' + privateKey;
      }
      if (!privateKey.endsWith('\n-----END PRIVATE KEY-----\n')) {
        privateKey = privateKey + '\n-----END PRIVATE KEY-----\n';
      }
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    }
    
    db = admin.firestore();
    return admin;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

// Types for Firestore documents
export interface LeagueDocument {
  id: string;
  name: string;
  adminUserId: string;
  adminEmail: string;
  createdAt: any; // Firestore Timestamp
  isActive: boolean;
  leagueCode: string;
  memberCount?: number;
  // Payment fields for per-league one-time payment
  isPaid: boolean;
  paidAt?: any; // Firestore Timestamp
  paymentId?: string; // Stripe payment intent ID
  settings?: {
    googleSheetId?: string;
    updatedAt?: any; // Firestore Timestamp
    updatedBy?: string;
  };
}

// Legacy interface for backward compatibility
export interface UserRoleDocument {
  id: string;
  userId: string;
  userEmail: string;
  leagueId: string;
  role: 'admin' | 'user';
  joinedAt: any; // Firestore Timestamp
  displayName: string;
  isActive: boolean;
  isPremium?: boolean;
}

// New interface for multi-league support
export interface UserLeagueMembershipDocument {
  id: string;
  userId: string;
  userEmail: string;
  leagueId: string;
  role: 'admin' | 'user';
  joinedAt: any; // Firestore Timestamp
  displayName: string;
  isActive: boolean;
  isPremium?: boolean;
  lastAccessedAt: any; // Firestore Timestamp
}

// New interface for user profiles
export interface UserProfileDocument {
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
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface BetDocument {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  leagueId: string;
  matchupId: string;
  selectedTeam: string;
  createdAt: any; // Firestore Timestamp
  isActive: boolean;
}

export interface MatchupDocument {
  id: string;
  leagueId: string;
  team1: string;
  team2: string;
  date: string;
  week: number;
  isActive: boolean;
  winner?: string;
  createdAt: any; // Firestore Timestamp
}

export class FirestoreServerService {
  // Get database instance
  static getDb() {
    initializeFirebaseAdmin();
    return db;
  }

  // League operations
  static async createLeague(leagueData: Omit<LeagueDocument, 'id' | 'createdAt'>): Promise<LeagueDocument> {
    try {
      initializeFirebaseAdmin();
      
      const leagueRef = db.collection('leagues').doc();
      const leagueDoc: LeagueDocument = {
        ...leagueData,
        id: leagueRef.id,
        createdAt: admin.firestore.Timestamp.now(),
        memberCount: 1, // Start with admin as first member
        isPaid: false, // New leagues start as unpaid
      };

      await leagueRef.set(leagueDoc);
      console.log('League created successfully:', leagueDoc.id);
      return leagueDoc;
    } catch (error) {
      console.error('Error creating league:', error);
      throw new Error(`Failed to create league: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getLeague(leagueId: string): Promise<LeagueDocument | null> {
    try {
      initializeFirebaseAdmin();
      
      const leagueRef = db.collection('leagues').doc(leagueId);
      const leagueSnap = await leagueRef.get();
      
      if (leagueSnap.exists) {
        return leagueSnap.data() as LeagueDocument;
      }
      return null;
    } catch (error) {
      console.error('Error getting league:', error);
      throw new Error(`Failed to get league: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getLeagueByCode(leagueCode: string): Promise<LeagueDocument | null> {
    try {
      initializeFirebaseAdmin();
      
      const leaguesRef = db.collection('leagues');
      const querySnapshot = await leaguesRef.where('leagueCode', '==', leagueCode).where('isActive', '==', true).get();
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as LeagueDocument;
      }
      return null;
    } catch (error) {
      console.error('Error getting league by code:', error);
      throw new Error(`Failed to get league by code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getAllLeagues(): Promise<LeagueDocument[]> {
    try {
      initializeFirebaseAdmin();
      
      const leaguesRef = db.collection('leagues');
      const querySnapshot = await leaguesRef.where('isActive', '==', true).get();
      
      return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as LeagueDocument);
    } catch (error) {
      console.error('Error getting all leagues:', error);
      throw new Error(`Failed to get all leagues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateLeagueMemberCount(leagueId: string, count: number): Promise<void> {
    try {
      initializeFirebaseAdmin();
      
      const leagueRef = db.collection('leagues').doc(leagueId);
      await leagueRef.update({ memberCount: count });
    } catch (error) {
      console.error('Error updating league member count:', error);
      throw new Error(`Failed to update league member count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateLeagueGoogleSheetId(leagueId: string, googleSheetId: string, updatedBy: string): Promise<void> {
    try {
      initializeFirebaseAdmin();
      
      const leagueRef = db.collection('leagues').doc(leagueId);
      await leagueRef.update({
        'settings.googleSheetId': googleSheetId,
        'settings.updatedAt': admin.firestore.Timestamp.now(),
        'settings.updatedBy': updatedBy,
      });
      console.log(`Updated Google Sheet ID for league ${leagueId}: ${googleSheetId}`);
    } catch (error) {
      console.error('Error updating league Google Sheet ID:', error);
      throw new Error(`Failed to update league Google Sheet ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateLeaguePaymentStatus(leagueId: string, paymentId: string): Promise<void> {
    try {
      initializeFirebaseAdmin();
      
      const leagueRef = db.collection('leagues').doc(leagueId);
      await leagueRef.update({
        isPaid: true,
        paidAt: admin.firestore.Timestamp.now(),
        paymentId: paymentId,
      });
      console.log(`Updated payment status for league ${leagueId}: paid with payment ID ${paymentId}`);
    } catch (error) {
      console.error('Error updating league payment status:', error);
      throw new Error(`Failed to update league payment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // User role operations
  static async createUserRole(userRoleData: Omit<UserRoleDocument, 'id' | 'joinedAt'>): Promise<UserRoleDocument> {
    try {
      initializeFirebaseAdmin();
      
      const userRoleRef = db.collection('userRoles').doc();
      const userRoleDoc: UserRoleDocument = {
        ...userRoleData,
        id: userRoleRef.id,
        joinedAt: admin.firestore.Timestamp.now(),
        isActive: true,
      };

      await userRoleRef.set(userRoleDoc);
      console.log('User role created successfully:', userRoleDoc.id);
      return userRoleDoc;
    } catch (error) {
      console.error('Error creating user role:', error);
      throw new Error(`Failed to create user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserRole(userId: string): Promise<UserRoleDocument | null> {
    try {
      initializeFirebaseAdmin();
      
      const userRolesRef = db.collection('userRoles');
      const querySnapshot = await userRolesRef.where('userId', '==', userId).where('isActive', '==', true).get();
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as UserRoleDocument;
      }
      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      throw new Error(`Failed to get user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserRoleByLeague(userId: string, leagueId: string): Promise<UserRoleDocument | null> {
    try {
      initializeFirebaseAdmin();
      
      const userRolesRef = db.collection('userRoles');
      const querySnapshot = await userRolesRef
        .where('userId', '==', userId)
        .where('leagueId', '==', leagueId)
        .where('isActive', '==', true)
        .get();
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as UserRoleDocument;
      }
      return null;
    } catch (error) {
      console.error('Error getting user role by league:', error);
      throw new Error(`Failed to get user role by league: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getLeagueMembers(leagueId: string): Promise<UserRoleDocument[]> {
    try {
      initializeFirebaseAdmin();
      
      const userRolesRef = db.collection('userRoles');
      const querySnapshot = await userRolesRef.where('leagueId', '==', leagueId).where('isActive', '==', true).get();
      
      return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as UserRoleDocument);
    } catch (error) {
      console.error('Error getting league members:', error);
      throw new Error(`Failed to get league members: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Utility functions
  static async checkLeagueCodeExists(leagueCode: string): Promise<boolean> {
    try {
      const league = await this.getLeagueByCode(leagueCode);
      return league !== null;
    } catch (error) {
      console.error('Error checking league code existence:', error);
      return false;
    }
  }

  // Multi-league support methods
  
  // User Profile operations
  static async createUserProfile(userProfileData: Omit<UserProfileDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfileDocument> {
    try {
      initializeFirebaseAdmin();
      
      const userProfileRef = db.collection('userProfiles').doc();
      const userProfileDoc: UserProfileDocument = {
        ...userProfileData,
        id: userProfileRef.id,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };

      await userProfileRef.set(userProfileDoc);
      console.log('User profile created successfully:', userProfileDoc.id);
      return userProfileDoc;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error(`Failed to create user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserProfile(userId: string): Promise<UserProfileDocument | null> {
    try {
      initializeFirebaseAdmin();
      
      const userProfileRef = db.collection('userProfiles').doc(userId);
      const userProfileSnap = await userProfileRef.get();
      
      if (userProfileSnap.exists) {
        return userProfileSnap.data() as UserProfileDocument;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error(`Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateUserProfile(userId: string, updateData: Partial<UserProfileDocument>): Promise<void> {
    try {
      initializeFirebaseAdmin();
      
      const userProfileRef = db.collection('userProfiles').doc(userId);
      
      // Check if the document exists first
      const docSnap = await userProfileRef.get();
      
      if (!docSnap.exists) {
        // Create the document if it doesn't exist
        console.log(`User profile document doesn't exist for ${userId}, creating new profile`);
        await userProfileRef.set({
          userId: userId,
          userEmail: updateData.userEmail || '',
          displayName: updateData.displayName || '',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
          ...updateData,
        });
      } else {
        // Update existing document
        await userProfileRef.update({
          ...updateData,
          updatedAt: admin.firestore.Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      initializeFirebaseAdmin();
      
      // Username validation
      if (!username || username.length < 3 || username.length > 20) {
        return false;
      }
      
      // Check if username contains only alphanumeric characters and underscores
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return false;
      }
      
      // Check if username is already taken
      const userProfilesRef = db.collection('userProfiles');
      const querySnapshot = await userProfilesRef.where('username', '==', username.toLowerCase()).get();
      
      return querySnapshot.empty;
    } catch (error) {
      console.error('Error checking username availability:', error);
      throw new Error(`Failed to check username availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // User League Membership operations
  static async createUserLeagueMembership(membershipData: Omit<UserLeagueMembershipDocument, 'id' | 'joinedAt' | 'lastAccessedAt'>): Promise<UserLeagueMembershipDocument> {
    try {
      initializeFirebaseAdmin();
      
      const membershipRef = db.collection('userLeagueMemberships').doc();
      const membershipDoc: UserLeagueMembershipDocument = {
        ...membershipData,
        id: membershipRef.id,
        joinedAt: admin.firestore.Timestamp.now(),
        lastAccessedAt: admin.firestore.Timestamp.now(),
        isActive: true,
      };

      await membershipRef.set(membershipDoc);
      console.log('User league membership created successfully:', membershipDoc.id);
      return membershipDoc;
    } catch (error) {
      console.error('Error creating user league membership:', error);
      throw new Error(`Failed to create user league membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserLeagueMemberships(userId: string): Promise<UserLeagueMembershipDocument[]> {
    try {
      initializeFirebaseAdmin();
      
      const membershipsRef = db.collection('userLeagueMemberships');
      const querySnapshot = await membershipsRef
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .orderBy('lastAccessedAt', 'desc')
        .get();
      
      return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as UserLeagueMembershipDocument);
    } catch (error) {
      console.error('Error getting user league memberships:', error);
      throw new Error(`Failed to get user league memberships: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserLeagueMembership(userId: string, leagueId: string): Promise<UserLeagueMembershipDocument | null> {
    try {
      initializeFirebaseAdmin();
      
      const membershipsRef = db.collection('userLeagueMemberships');
      const querySnapshot = await membershipsRef
        .where('userId', '==', userId)
        .where('leagueId', '==', leagueId)
        .where('isActive', '==', true)
        .get();
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as UserLeagueMembershipDocument;
      }
      return null;
    } catch (error) {
      console.error('Error getting user league membership:', error);
      throw new Error(`Failed to get user league membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateMembershipAccess(userId: string, leagueId: string): Promise<void> {
    try {
      initializeFirebaseAdmin();
      
      const membership = await this.getUserLeagueMembership(userId, leagueId);
      if (membership) {
        const membershipRef = db.collection('userLeagueMemberships').doc(membership.id);
        await membershipRef.update({
          lastAccessedAt: admin.firestore.Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error updating membership access:', error);
      throw new Error(`Failed to update membership access: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateUserLeagueMembershipDisplayName(userId: string, leagueId: string, displayName: string): Promise<void> {
    try {
      initializeFirebaseAdmin();
      
      const membership = await this.getUserLeagueMembership(userId, leagueId);
      if (membership) {
        const membershipRef = db.collection('userLeagueMemberships').doc(membership.id);
        await membershipRef.update({
          displayName: displayName,
        });
      }
    } catch (error) {
      console.error('Error updating user league membership display name:', error);
      throw new Error(`Failed to update user league membership display name: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async deactivateMembership(userId: string, leagueId: string): Promise<void> {
    try {
      initializeFirebaseAdmin();
      
      const membership = await this.getUserLeagueMembership(userId, leagueId);
      if (membership) {
        const membershipRef = db.collection('userLeagueMemberships').doc(membership.id);
        await membershipRef.update({
          isActive: false,
        });
      }
    } catch (error) {
      console.error('Error deactivating membership:', error);
      throw new Error(`Failed to deactivate membership: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Migration helper methods
  static async migrateUserToMultiLeague(userId: string): Promise<void> {
    try {
      // Check if user already has a profile
      const existingProfile = await this.getUserProfile(userId);
      if (existingProfile) {
        console.log('User profile already exists for:', userId);
        return;
      }

      // Get existing user role
      const existingRole = await this.getUserRole(userId);
      if (!existingRole) {
        console.log('No existing user role found for:', userId);
        return;
      }

      // Create user profile
      await this.createUserProfile({
        userId: existingRole.userId,
        userEmail: existingRole.userEmail,
        displayName: existingRole.displayName,
        defaultLeagueId: existingRole.leagueId,
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      });

      // Create user league membership
      await this.createUserLeagueMembership({
        userId: existingRole.userId,
        userEmail: existingRole.userEmail,
        leagueId: existingRole.leagueId,
        role: existingRole.role,
        displayName: existingRole.displayName,
        isPremium: existingRole.isPremium,
        isActive: true,
      });

      console.log('Successfully migrated user to multi-league:', userId);
    } catch (error) {
      console.error('Error migrating user to multi-league:', error);
      throw error;
    }
  }
} 