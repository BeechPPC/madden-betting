import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check client-side Firebase config
    const clientConfig = {
      NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Check server-side Firebase Admin SDK config
    const serverConfig = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
    };

    // Check if project IDs match
    const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const serverProjectId = process.env.FIREBASE_PROJECT_ID;
    const projectIdsMatch = clientProjectId === serverProjectId;

    // Check private key format (without exposing the actual key)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const privateKeyInfo = privateKey ? {
      length: privateKey.length,
      hasBeginMarker: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
      hasEndMarker: privateKey.includes('-----END PRIVATE KEY-----'),
      hasNewlines: privateKey.includes('\\n'),
      startsWithQuotes: privateKey.startsWith('"'),
      endsWithQuotes: privateKey.endsWith('"'),
    } : null;

    res.status(200).json({
      success: true,
      message: 'Environment variables check completed',
      clientConfig,
      serverConfig,
      projectIdsMatch,
      projectId: {
        client: clientProjectId || 'NOT_SET',
        server: serverProjectId || 'NOT_SET',
      },
      privateKeyInfo,
      missingVariables: {
        client: Object.entries(clientConfig).filter(([key, present]) => !present).map(([key]) => key),
        server: Object.entries(serverConfig).filter(([key, present]) => !present).map(([key]) => key),
      },
    });
    
  } catch (error) {
    console.error('Error in testEnv:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check environment variables',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 