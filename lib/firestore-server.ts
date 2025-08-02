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
}

export interface UserRoleDocument {
  id: string;
  userId: string;
  userEmail: string;
  leagueId: string;
  role: 'admin' | 'user';
  joinedAt: any; // Firestore Timestamp
  displayName: string;
  isActive: boolean;
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
} 