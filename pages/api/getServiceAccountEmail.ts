import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    
    if (!serviceAccountEmail) {
      return res.status(500).json({ 
        error: 'Service account email not configured',
        details: 'GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable is not set'
      });
    }

    return res.status(200).json({
      serviceAccountEmail,
      instructions: [
        '1. Copy the service account email above',
        '2. Open your Google Sheet',
        '3. Click "Share" in the top right',
        '4. Add the service account email as an "Editor"',
        '5. Make sure to uncheck "Notify people"',
        '6. Click "Share"',
        '7. Try verifying the sheet again'
      ]
    });
  } catch (error) {
    console.error('Error getting service account email:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 