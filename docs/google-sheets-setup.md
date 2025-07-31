# Google Sheets Setup Guide

## Sheet Structure

Create a Google Sheet with the following tabs:

### 1. Bets Tab
| Column A | Column B | Column C | Column D | Column E |
|----------|----------|----------|----------|----------|
| Timestamp | User Name | Matchup ID | Selected Team | Created At |

### 2. Leaderboard Tab
| Column A | Column B | Column C | Column D |
|----------|----------|----------|----------|
| User Name | Wins | Losses | Points |

### 3. Matchups Tab
| Column A | Column B | Column C | Column D |
|----------|----------|----------|----------|
| Matchup ID | Team 1 | Team 2 | Date |

## Environment Variables

Add these to your `.env.local` file:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-google-sheet-id
```

## Getting Your Sheet ID

1. Open your Google Sheet
2. Copy the ID from the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`
3. The ID is the long string between `/d/` and `/edit`

## Permissions

Make sure to share your Google Sheet with your service account email with "Editor" permissions.

## Testing the Connection

You can test the connection by making a POST request to `/api/googleSheets` with:

```json
{
  "action": "read_leaderboard"
}
```

This should return the current leaderboard data from your Google Sheet. 