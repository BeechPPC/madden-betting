# User Sign-In Flow Fix

## Problem
Previously, when users who had already created a league or joined an existing league signed back in, they were incorrectly shown the "Choose Your Role" page instead of being taken directly to the dashboard. This was caused by a bug in the `getUserRole` API that wasn't returning the complete league information.

## Root Cause
The `getUserRole` API was only returning basic user role information (`role`, `leagueId`, `displayName`) but not the complete league data that the AuthContext expected. The AuthContext was trying to set `data.league` and `data.userRole`, but the API response didn't include these properties.

## Solution

### 1. Updated `getUserRole` API (`pages/api/getUserRole.ts`)

**Changes Made:**
- Modified the API to fetch and return complete league information along with user role data
- Added league data fetching for both Firestore and Google Sheets fallback
- Updated response structure to match the expected format used by `createLeague` and `joinLeague` APIs

**New Response Structure:**
```json
{
  "userRole": {
    "id": "role-id",
    "userId": "user-uid",
    "userEmail": "user@example.com",
    "leagueId": "league-id",
    "role": "admin|user",
    "joinedAt": "2024-01-01T00:00:00.000Z",
    "displayName": "User Name"
  },
  "league": {
    "id": "league-id",
    "name": "League Name",
    "leagueCode": "ABC-123-DEF",
    "adminEmail": "admin@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isActive": true,
    "adminUserId": "admin-uid"
  },
  "source": "firestore|google-sheets"
}
```

### 2. Updated AuthContext (`contexts/AuthContext.tsx`)

**Changes Made:**
- Enhanced `fetchUserRole` function to properly handle 404 responses (no role found)
- Added explicit handling for users without a role to set `userRole` and `currentLeague` to `null`
- Improved error logging for better debugging

**Key Logic:**
```typescript
if (response.ok) {
  const data = await response.json();
  setUserRole(data.userRole);
  setCurrentLeague(data.league);
} else if (response.status === 404) {
  // User has no role - they need to create or join a league
  console.log('No user role found - user needs to create or join a league');
  setUserRole(null);
  setCurrentLeague(null);
}
```

## Flow After Fix

### For Users Who Have Created/Joined a League:
1. User signs in
2. `AuthContext` detects authentication state change
3. `fetchUserRole` is called automatically
4. `getUserRole` API returns complete user role and league data
5. AuthContext sets `userRole` and `currentLeague` state
6. Main dashboard renders with league information and betting interface

### For New Users (No League):
1. User signs in
2. `AuthContext` detects authentication state change
3. `fetchUserRole` is called automatically
4. `getUserRole` API returns 404 (no role found)
5. AuthContext sets `userRole` and `currentLeague` to `null`
6. RoleSelection component renders, allowing user to create or join a league

## Testing the Fix

To verify the fix works correctly:

1. **Test Existing User Sign-In:**
   - Sign in with a user who has already created or joined a league
   - Should be taken directly to the dashboard
   - League information should be displayed in the header

2. **Test New User Sign-In:**
   - Sign in with a new user who hasn't created or joined any league
   - Should see the "Choose Your Role" page
   - Should be able to create a new league or join an existing one

3. **Test Role Selection Flow:**
   - After creating or joining a league, should be redirected to the dashboard
   - League information should be properly displayed

## Files Modified
- `pages/api/getUserRole.ts` - Updated to return complete league information
- `contexts/AuthContext.tsx` - Enhanced error handling for 404 responses

## Benefits
- Users who have already created or joined leagues are now properly taken to the dashboard
- New users are correctly shown the role selection page
- Improved user experience with proper state management
- Better error handling and logging for debugging
- Consistent API response structure across all league-related endpoints 