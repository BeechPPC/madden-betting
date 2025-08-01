# Database Implementation for Madden CFM Betting App

## Overview

The Madden CFM Betting app now uses **Firebase Firestore** as the primary database for storing leagues, user roles, bets, and matchups. Additionally, **Google Sheets** is used as a backup and reporting system.

## Database Architecture

### Primary Database: Firebase Firestore

The app uses Firebase Firestore collections to store all data:

#### Collections

1. **`leagues`** - Stores league information
2. **`userRoles`** - Stores user-league relationships and roles
3. **`bets`** - Stores user bets on matchups
4. **`matchups`** - Stores league matchups

### Backup System: Google Sheets

Google Sheets provides backup storage and reporting capabilities with the following sheets:
- **`Leagues`** - League information backup
- **`UserRoles`** - User role information backup
- **`Bets`** - Bet information backup
- **`Matchups`** - Matchup information backup
- **`Leaderboard`** - Current leaderboard
- **`Results`** - Match results

## Data Models

### League Document
```typescript
interface LeagueDocument {
  id: string;                    // Auto-generated Firestore ID
  name: string;                  // League name
  adminUserId: string;           // Admin's Firebase UID
  adminEmail: string;            // Admin's email
  createdAt: Timestamp;          // Creation timestamp
  isActive: boolean;             // League status
  leagueCode: string;            // Unique join code (XXX-XXX-XXXX)
  memberCount?: number;          // Number of members
}
```

### User Role Document
```typescript
interface UserRoleDocument {
  id: string;                    // Auto-generated Firestore ID
  userId: string;                // User's Firebase UID
  userEmail: string;             // User's email
  leagueId: string;              // League ID
  role: 'admin' | 'user';        // User role in league
  joinedAt: Timestamp;           // Join timestamp
  displayName: string;           // User's display name
  isActive: boolean;             // Active status
}
```

### Bet Document
```typescript
interface BetDocument {
  id: string;                    // Auto-generated Firestore ID
  userId: string;                // User's Firebase UID
  userEmail: string;             // User's email
  userDisplayName: string;       // User's display name
  leagueId: string;              // League ID
  matchupId: string;             // Matchup ID
  selectedTeam: string;          // Selected team
  createdAt: Timestamp;          // Bet timestamp
  isActive: boolean;             // Active status
}
```

### Matchup Document
```typescript
interface MatchupDocument {
  id: string;                    // Auto-generated Firestore ID
  leagueId: string;              // League ID
  team1: string;                 // First team
  team2: string;                 // Second team
  date: string;                  // Match date
  week: number;                  // Week number
  isActive: boolean;             // Active status
  winner?: string;               // Winning team (if completed)
  createdAt: Timestamp;          // Creation timestamp
}
```

## API Endpoints

### League Management

#### `POST /api/createLeague`
Creates a new league and assigns the creator as admin.

**Request Body:**
```json
{
  "leagueName": "My League",
  "adminEmail": "admin@example.com",
  "adminUserId": "firebase-uid",
  "displayName": "Admin Name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "League created successfully",
  "league": {
    "id": "firestore-id",
    "name": "My League",
    "leagueCode": "ABC-123-DEF4",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isActive": true,
    "adminUserId": "firebase-uid",
    "adminEmail": "admin@example.com"
  },
  "userRole": {
    "id": "role-id",
    "userId": "firebase-uid",
    "userEmail": "admin@example.com",
    "leagueId": "firestore-id",
    "role": "admin",
    "joinedAt": "2024-01-01T00:00:00.000Z",
    "displayName": "Admin Name"
  }
}
```

#### `POST /api/joinLeague`
Joins an existing league using a league code.

**Request Body:**
```json
{
  "leagueCode": "ABC-123-DEF4",
  "userEmail": "user@example.com",
  "userId": "firebase-uid",
  "displayName": "User Name"
}
```

#### `GET /api/getUserRole`
Gets the current user's role and league information.

**Response:**
```json
{
  "userRole": {
    "id": "role-id",
    "userId": "firebase-uid",
    "userEmail": "user@example.com",
    "leagueId": "league-id",
    "role": "user",
    "joinedAt": "2024-01-01T00:00:00.000Z",
    "displayName": "User Name"
  },
  "league": {
    "id": "league-id",
    "name": "My League",
    "leagueCode": "ABC-123-DEF4",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isActive": true,
    "adminUserId": "admin-uid",
    "adminEmail": "admin@example.com"
  }
}
```

#### `GET /api/getLeagueStats`
Gets comprehensive league statistics and member information.

**Response:**
```json
{
  "success": true,
  "league": { /* league info */ },
  "userRole": { /* user role info */ },
  "stats": {
    "memberCount": 5,
    "betCount": 12,
    "matchupCount": 3,
    "activeMatchups": 2,
    "completedMatchups": 1
  },
  "members": [ /* array of members */ ],
  "bets": [ /* array of bets */ ],
  "matchups": [ /* array of matchups */ ]
}
```

## Firestore Service

The `FirestoreService` class provides all database operations:

### League Operations
- `createLeague()` - Creates a new league
- `getLeague()` - Gets league by ID
- `getLeagueByCode()` - Gets league by join code
- `updateLeagueMemberCount()` - Updates member count

### User Role Operations
- `createUserRole()` - Creates user role
- `getUserRole()` - Gets user's current role
- `getUserRoleByLeague()` - Gets user's role in specific league
- `getLeagueMembers()` - Gets all league members

### Bet Operations
- `createBet()` - Creates a new bet
- `getUserBets()` - Gets user's bets
- `getLeagueBets()` - Gets all league bets

### Matchup Operations
- `createMatchup()` - Creates a new matchup
- `getLeagueMatchups()` - Gets league matchups
- `updateMatchupWinner()` - Updates matchup winner

### Utility Operations
- `checkLeagueCodeExists()` - Checks if league code is unique
- `getLeagueStats()` - Gets comprehensive league statistics

## Google Sheets Integration

### Setup
Run `POST /api/setupSheets` to create required sheets with proper headers.

### Backup Operations
- League creation automatically writes to Google Sheets
- User joining automatically writes to Google Sheets
- Bet submission writes to Google Sheets
- All operations are non-blocking (don't fail if Sheets is unavailable)

### Reading from Sheets
- `readLeagues()` - Reads league data from Sheets
- `readUserRoles()` - Reads user role data from Sheets
- `readMatchups()` - Reads matchup data from Sheets
- `readLeaderboard()` - Reads leaderboard data from Sheets

## Security Rules

Firestore security rules should be configured to:
1. Allow authenticated users to read their own data
2. Allow league admins to manage their league
3. Allow league members to read league data
4. Prevent unauthorized access to other users' data

Example security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own user role
    match /userRoles/{document} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // League members can read their league
    match /leagues/{document} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/userRoles/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data.leagueId == document;
    }
  }
}
```

## Error Handling

All database operations include comprehensive error handling:
- Network errors are caught and logged
- Invalid data is validated before storage
- Duplicate entries are prevented
- Graceful degradation when Google Sheets is unavailable

## Performance Considerations

- Firestore queries use indexes for efficient lookups
- League codes are generated with uniqueness checks
- Member counts are cached and updated asynchronously
- Google Sheets operations are non-blocking

## Migration from Previous Implementation

The previous implementation only stored data in memory. This new implementation:
1. Persists all data in Firestore
2. Provides backup in Google Sheets
3. Enables multi-user access
4. Supports data recovery
5. Allows for analytics and reporting

## Testing

Use the following endpoints to test the implementation:
- `GET /api/testFirebase` - Tests Firebase connectivity
- `GET /api/testGoogleSheets` - Tests Google Sheets connectivity
- `POST /api/setupSheets` - Sets up Google Sheets structure 