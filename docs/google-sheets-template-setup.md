# Google Sheets Template Setup Guide

This guide explains how to set up the Google Sheets template that will be copied for each new league.

## Overview

The app now supports multiple leagues, each with their own Google Sheet. When a league admin creates a new league, the system automatically creates a copy of a template sheet for that league.

## Step 1: Create the Template Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "ClutchPicks Template" or similar
4. Share it with your service account email (the one in your environment variables) with "Editor" permissions

## Step 2: Set Up the Required Sheets

Create the following sheets in your template:

### 1. Matchups Sheet
- **Sheet Name**: `Matchups`
- **Headers**: `Week`, `Team 1`, `Team 1 Record`, `Team 2`, `Team 2 Record`
- **Sample Data**:
  ```
  Week | Team 1    | Team 1 Record | Team 2      | Team 2 Record
  1    | Cowboys   | 0-0           | Giants      | 0-0
  1    | Eagles    | 0-0           | Commanders  | 0-0
  2    | Cowboys   | 1-0           | Eagles      | 1-0
  2    | Giants    | 0-1           | Commanders  | 0-1
  ```

### 2. Bets Sheet
- **Sheet Name**: `Bets`
- **Headers**: `Timestamp`, `User Name`, `Matchup ID`, `Selected Team`, `Created At`

### 3. Leaderboard Sheet
- **Sheet Name**: `Leaderboard`
- **Headers**: `User Name`, `Wins`, `Losses`, `Points`

### 4. Results Sheet
- **Sheet Name**: `Results`
- **Headers**: `Timestamp`, `Matchup ID`, `Winning Team`, `Correct Picks`, `Incorrect Picks`, `Total Picks`

## Step 3: Get the Template Sheet ID

1. Open your template sheet
2. Copy the ID from the URL: `https://docs.google.com/spreadsheets/d/YOUR_TEMPLATE_SHEET_ID_HERE/edit`
3. The ID is the long string between `/d/` and `/edit`

## Step 4: Update Environment Variables

Add the template sheet ID to your `.env.local` file:

```env
# Google Sheets Template (for copying to new leagues)
GOOGLE_SHEET_TEMPLATE_ID=your_template_sheet_id_here

# Legacy single sheet (for backward compatibility)
GOOGLE_SHEET_ID=your_legacy_sheet_id_here
```

## Step 5: Test the Setup

1. Create a new league through the app
2. Check that a new Google Sheet is created with the league name
3. Verify that the new sheet has all the required tabs and headers
4. Test submitting bets and viewing matchups

## How It Works

1. **League Creation**: When an admin creates a new league, the system:
   - Creates a copy of the template sheet
   - Names it "ClutchPicks - [League Name] ([League Code])"
   - Sets up the required headers and sample data
   - Stores the new sheet ID in the league's settings

2. **Data Access**: All API calls now:
   - Get the user's current league
   - Retrieve the league's Google Sheet ID
   - Use that specific sheet for all operations

3. **Backward Compatibility**: The system maintains backward compatibility with the old single-sheet approach by falling back to the `GOOGLE_SHEET_ID` environment variable.

## Troubleshooting

### Template Sheet Not Found
- Verify `GOOGLE_SHEET_TEMPLATE_ID` is set correctly
- Ensure the service account has access to the template sheet
- Check that the template sheet exists and is not deleted

### New Sheets Not Created
- Verify the service account has Google Drive permissions
- Check that the template sheet is shared with the service account
- Look for errors in the server logs during league creation

### Data Not Appearing in New Sheets
- Verify the template has the correct sheet names and headers
- Check that the service account has write permissions to the new sheets
- Ensure the sheet structure matches the expected format

## Migration from Single Sheet

If you're migrating from the old single-sheet system:

1. Create the template sheet as described above
2. Set the `GOOGLE_SHEET_TEMPLATE_ID` environment variable
3. Keep the old `GOOGLE_SHEET_ID` for backward compatibility
4. New leagues will use the template, existing leagues can continue using the old sheet
5. Optionally, you can migrate existing leagues to their own sheets later

## Security Considerations

- The template sheet should be shared only with the service account
- Each league's sheet is automatically shared with the service account
- League admins can manually share their sheets with other users if needed
- Consider setting up proper Google Drive permissions for your service account 