# League Code Format Fix

## Issue Description

The application was experiencing "Invalid league code format" errors when users tried to join leagues. This was caused by a mismatch between the league code generation format and the validation format.

## Root Cause

The league code generation function in `pages/api/createLeague.ts` was creating codes in the format `XXX-XXX-XXXX-XXXX` (4 parts) instead of the expected `XXX-XXX-XXXX` (3 parts) format.

### Before Fix
```typescript
// INCORRECT: Generated 12 characters with hyphens every 3 characters
for (let i = 0; i < 12; i++) {
  if (i > 0 && i % 3 === 0) result += '-';
  result += chars.charAt(Math.floor(Math.random() * chars.length));
}
// Result: "ABC-DEF-GHI-JKL" (4 parts)
```

### After Fix
```typescript
// CORRECT: Generate 10 characters with hyphens at positions 3 and 6
for (let i = 0; i < 10; i++) {
  if (i === 3 || i === 6) result += '-';
  result += chars.charAt(Math.floor(Math.random() * chars.length));
}
// Result: "ABC-DEF-GHIJ" (3 parts)
```

## Changes Made

1. **Fixed `pages/api/createLeague.ts`**: Updated the league code generation to use the correct format
2. **Added `getAllLeagues()` method**: Added to `lib/firestore-server.ts` to support debugging
3. **Created debug endpoint**: Added `pages/api/debugLeagueCodes.ts` to identify existing invalid codes

## Validation

The validation function in `pages/api/joinLeague.ts` correctly expects the format:
```typescript
const leagueCodePattern = /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{4}$/;
```

This pattern matches:
- ✅ `ABC-123-DEF4` (correct format)
- ❌ `ABC-123-DEF-GHI` (wrong format - 4 parts)

## Debug Endpoint

To check for any existing leagues with incorrect codes, use the debug endpoint:

```bash
GET /api/debugLeagueCodes
```

This endpoint will:
- Return all active leagues
- Validate each league code format
- Provide a summary of valid vs invalid codes
- List details of any invalid codes found

### Example Response
```json
{
  "success": true,
  "analysis": {
    "totalLeagues": 5,
    "validCodes": 3,
    "invalidCodes": 2,
    "invalidLeagues": [
      {
        "id": "league1",
        "name": "Test League 1",
        "leagueCode": "ABC-DEF-GHI-JKL",
        "expectedFormat": "XXX-XXX-XXXX",
        "actualFormat": "4 parts: ABC-DEF-GHI-JKL"
      }
    ],
    "summary": "⚠️ Found 2 league(s) with incorrect format. These leagues may have issues with users trying to join."
  },
  "fixApplied": "League code generation has been fixed to use the correct XXX-XXX-XXXX format",
  "note": "New leagues will be created with correct codes. Existing invalid codes may need manual correction."
}
```

## Impact

- **New leagues**: Will be created with correct `XXX-XXX-XXXX` format
- **Existing leagues**: May have incorrect format and need manual correction
- **User experience**: Users trying to join leagues with incorrect codes will get validation errors

## Testing

The fix has been tested with a comprehensive validation script that confirms:
- Generated codes are in correct format
- Input formatting works correctly
- Validation accepts proper format
- Validation rejects improper format

## Next Steps

1. Monitor the debug endpoint for any existing invalid codes
2. If invalid codes are found, consider:
   - Manually updating them in the database
   - Providing a migration script
   - Notifying affected league admins
3. Test the join league functionality with new codes 