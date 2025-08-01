import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, Timestamp, DocumentData } from 'firebase/firestore';
import { db } from './firebase';

// Types for Firestore documents
export interface LeagueDocument {
  id: string;
  name: string;
  adminUserId: string;
  adminEmail: string;
  createdAt: Timestamp;
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
  joinedAt: Timestamp;
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
  createdAt: Timestamp;
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
  createdAt: Timestamp;
}

export class FirestoreService {
  // League operations
  static async createLeague(leagueData: Omit<LeagueDocument, 'id' | 'createdAt'>): Promise<LeagueDocument> {
    try {
      const leagueRef = doc(collection(db, 'leagues'));
      const leagueDoc: LeagueDocument = {
        ...leagueData,
        id: leagueRef.id,
        createdAt: Timestamp.now(),
        memberCount: 1, // Start with admin as first member
      };

      await setDoc(leagueRef, leagueDoc);
      console.log('League created successfully:', leagueDoc.id);
      return leagueDoc;
    } catch (error) {
      console.error('Error creating league:', error);
      throw new Error(`Failed to create league: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getLeague(leagueId: string): Promise<LeagueDocument | null> {
    try {
      const leagueRef = doc(db, 'leagues', leagueId);
      const leagueSnap = await getDoc(leagueRef);
      
      if (leagueSnap.exists()) {
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
      const leaguesRef = collection(db, 'leagues');
      const q = query(leaguesRef, where('leagueCode', '==', leagueCode), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
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

  static async updateLeagueMemberCount(leagueId: string, count: number): Promise<void> {
    try {
      const leagueRef = doc(db, 'leagues', leagueId);
      await updateDoc(leagueRef, { memberCount: count });
    } catch (error) {
      console.error('Error updating league member count:', error);
      throw new Error(`Failed to update league member count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // User role operations
  static async createUserRole(userRoleData: Omit<UserRoleDocument, 'id' | 'joinedAt'>): Promise<UserRoleDocument> {
    try {
      const userRoleRef = doc(collection(db, 'userRoles'));
      const userRoleDoc: UserRoleDocument = {
        ...userRoleData,
        id: userRoleRef.id,
        joinedAt: Timestamp.now(),
        isActive: true,
      };

      await setDoc(userRoleRef, userRoleDoc);
      console.log('User role created successfully:', userRoleDoc.id);
      return userRoleDoc;
    } catch (error) {
      console.error('Error creating user role:', error);
      throw new Error(`Failed to create user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserRole(userId: string): Promise<UserRoleDocument | null> {
    try {
      const userRolesRef = collection(db, 'userRoles');
      const q = query(userRolesRef, where('userId', '==', userId), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
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
      const userRolesRef = collection(db, 'userRoles');
      const q = query(
        userRolesRef, 
        where('userId', '==', userId), 
        where('leagueId', '==', leagueId), 
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
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
      const userRolesRef = collection(db, 'userRoles');
      const q = query(userRolesRef, where('leagueId', '==', leagueId), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as UserRoleDocument);
    } catch (error) {
      console.error('Error getting league members:', error);
      throw new Error(`Failed to get league members: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Bet operations
  static async createBet(betData: Omit<BetDocument, 'id' | 'createdAt'>): Promise<BetDocument> {
    try {
      const betRef = doc(collection(db, 'bets'));
      const betDoc: BetDocument = {
        ...betData,
        id: betRef.id,
        createdAt: Timestamp.now(),
        isActive: true,
      };

      await setDoc(betRef, betDoc);
      console.log('Bet created successfully:', betDoc.id);
      return betDoc;
    } catch (error) {
      console.error('Error creating bet:', error);
      throw new Error(`Failed to create bet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserBets(userId: string, leagueId: string): Promise<BetDocument[]> {
    try {
      const betsRef = collection(db, 'bets');
      const q = query(
        betsRef, 
        where('userId', '==', userId), 
        where('leagueId', '==', leagueId), 
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as BetDocument);
    } catch (error) {
      console.error('Error getting user bets:', error);
      throw new Error(`Failed to get user bets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getLeagueBets(leagueId: string): Promise<BetDocument[]> {
    try {
      const betsRef = collection(db, 'bets');
      const q = query(betsRef, where('leagueId', '==', leagueId), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as BetDocument);
    } catch (error) {
      console.error('Error getting league bets:', error);
      throw new Error(`Failed to get league bets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Matchup operations
  static async createMatchup(matchupData: Omit<MatchupDocument, 'id' | 'createdAt'>): Promise<MatchupDocument> {
    try {
      const matchupRef = doc(collection(db, 'matchups'));
      const matchupDoc: MatchupDocument = {
        ...matchupData,
        id: matchupRef.id,
        createdAt: Timestamp.now(),
        isActive: true,
      };

      await setDoc(matchupRef, matchupDoc);
      console.log('Matchup created successfully:', matchupDoc.id);
      return matchupDoc;
    } catch (error) {
      console.error('Error creating matchup:', error);
      throw new Error(`Failed to create matchup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getLeagueMatchups(leagueId: string): Promise<MatchupDocument[]> {
    try {
      const matchupsRef = collection(db, 'matchups');
      const q = query(matchupsRef, where('leagueId', '==', leagueId), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }) as MatchupDocument);
    } catch (error) {
      console.error('Error getting league matchups:', error);
      throw new Error(`Failed to get league matchups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateMatchupWinner(matchupId: string, winner: string): Promise<void> {
    try {
      const matchupRef = doc(db, 'matchups', matchupId);
      await updateDoc(matchupRef, { winner });
    } catch (error) {
      console.error('Error updating matchup winner:', error);
      throw new Error(`Failed to update matchup winner: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  static async getLeagueStats(leagueId: string): Promise<{
    memberCount: number;
    betCount: number;
    matchupCount: number;
  }> {
    try {
      const [members, bets, matchups] = await Promise.all([
        this.getLeagueMembers(leagueId),
        this.getLeagueBets(leagueId),
        this.getLeagueMatchups(leagueId),
      ]);

      return {
        memberCount: members.length,
        betCount: bets.length,
        matchupCount: matchups.length,
      };
    } catch (error) {
      console.error('Error getting league stats:', error);
      throw new Error(`Failed to get league stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 