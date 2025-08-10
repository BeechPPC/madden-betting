import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { username } = req.body;

    // Validate username if provided
    if (username !== undefined) {
      if (username === '') {
        // Allow clearing username
        await FirestoreServerService.updateUserProfile(user.uid, { 
          username: undefined,
          userEmail: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User'
        });

        // Update user's display name in their league membership to use email fallback
        const userRole = await FirestoreServerService.getUserRole(user.uid);
        if (userRole) {
          const fallbackDisplayName = user.displayName || user.email?.split('@')[0] || 'User';
          await FirestoreServerService.updateUserLeagueMembershipDisplayName(user.uid, userRole.leagueId, fallbackDisplayName);
        }

        return res.status(200).json({ 
          success: true, 
          message: 'Username cleared successfully' 
        });
      }

      // Validate username format
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ 
          error: 'Username must be between 3 and 20 characters' 
        });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ 
          error: 'Username can only contain letters, numbers, and underscores' 
        });
      }

      // Check if username is available
      const isAvailable = await FirestoreServerService.checkUsernameAvailability(username);
      if (!isAvailable) {
        return res.status(400).json({ 
          error: 'Username is already taken' 
        });
      }

      // Get current user profile to get old username
      const currentProfile = await FirestoreServerService.getUserProfile(user.uid);
      const oldUsername = currentProfile?.username;

      // Update user profile with new username
      await FirestoreServerService.updateUserProfile(user.uid, { 
        username: username.toLowerCase(),
        userEmail: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User'
      });

      // Update user's display name in their league membership and Google Sheets
      const userRole = await FirestoreServerService.getUserRole(user.uid);
      if (userRole) {
        await FirestoreServerService.updateUserLeagueMembershipDisplayName(user.uid, userRole.leagueId, username.toLowerCase());
        
        // Update username in Google Sheets if there was an old username
        if (oldUsername && oldUsername !== username.toLowerCase()) {
          const league = await FirestoreServerService.getLeague(userRole.leagueId);
          if (league?.settings?.googleSheetId) {
            try {
              const { GoogleSheetsService } = await import('../../utils/googleSheets');
              await GoogleSheetsService.updateUserNameInSheet(oldUsername, username.toLowerCase(), league.settings.googleSheetId);
            } catch (error) {
              console.error('Error updating username in Google Sheets:', error);
              // Don't fail the request if Google Sheets update fails
            }
          }
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Username updated successfully',
        username: username.toLowerCase()
      });
    }

    return res.status(400).json({ error: 'No valid update data provided' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ 
      error: 'Failed to update user profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 