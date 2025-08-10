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

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Check username availability
    const isAvailable = await FirestoreServerService.checkUsernameAvailability(username);

    return res.status(200).json({
      available: isAvailable,
      username: username.toLowerCase(),
    });
  } catch (error) {
    console.error('Error checking username availability:', error);
    return res.status(500).json({ 
      error: 'Failed to check username availability',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 