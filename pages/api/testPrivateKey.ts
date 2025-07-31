import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== TESTING PRIVATE KEY FORMAT ===');
    
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!privateKey) {
      return res.status(500).json({ error: 'FIREBASE_PRIVATE_KEY not found' });
    }
    
    console.log('Private key length:', privateKey.length);
    console.log('First 100 chars:', privateKey.substring(0, 100));
    console.log('Last 100 chars:', privateKey.substring(privateKey.length - 100));
    
    // Test different parsing approaches
    let parsedKey = privateKey;
    
    // Remove quotes
    if (parsedKey.startsWith('"') && parsedKey.endsWith('"')) {
      parsedKey = parsedKey.slice(1, -1);
      console.log('Removed quotes');
    }
    
    // Replace \n with actual newlines
    parsedKey = parsedKey.replace(/\\n/g, '\n');
    console.log('Replaced \\n with newlines');
    
    // Check PEM format
    const hasBegin = parsedKey.includes('-----BEGIN PRIVATE KEY-----');
    const hasEnd = parsedKey.includes('-----END PRIVATE KEY-----');
    const hasNewlines = parsedKey.includes('\n');
    
    console.log('Has BEGIN marker:', hasBegin);
    console.log('Has END marker:', hasEnd);
    console.log('Has newlines:', hasNewlines);
    
    // Try to create a properly formatted key
    let formattedKey = parsedKey;
    
    // Ensure proper PEM format
    if (!formattedKey.startsWith('-----BEGIN PRIVATE KEY-----\n')) {
      formattedKey = formattedKey.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
    }
    
    if (!formattedKey.endsWith('\n-----END PRIVATE KEY-----\n')) {
      formattedKey = formattedKey.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----\n');
    }
    
    // Test Firebase Admin SDK with the formatted key
    let firebaseTestResult = 'Not tested';
    try {
      const admin = require('firebase-admin');
      
      // Check if already initialized
      if (admin.apps.length === 0) {
        const serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: formattedKey,
        };
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        firebaseTestResult = 'Success: Firebase Admin SDK initialized with formatted key';
      } else {
        firebaseTestResult = 'Success: Firebase Admin SDK already initialized';
      }
    } catch (firebaseError) {
      firebaseTestResult = `Failed: ${firebaseError instanceof Error ? firebaseError.message : 'Unknown error'}`;
    }
    
    console.log('Firebase test result:', firebaseTestResult);
    
    res.status(200).json({
      success: true,
      originalLength: privateKey.length,
      parsedLength: parsedKey.length,
      formattedLength: formattedKey.length,
      hasBegin,
      hasEnd,
      hasNewlines,
      originalKey: privateKey.substring(0, 200) + '...',
      parsedKey: parsedKey.substring(0, 200) + '...',
      formattedKey: formattedKey.substring(0, 200) + '...',
      firebaseTestResult,
    });
    
  } catch (error) {
    console.error('Error testing private key:', error);
    res.status(500).json({
      error: 'Failed to test private key',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 