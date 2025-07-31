import { NextApiRequest, NextApiResponse } from 'next';

// Initialize Firebase Admin SDK with better error handling
let firebaseAdminInitialized = false;
let initializationPromise: Promise<void> | null = null;

function initializeFirebaseAdmin(): Promise<void> {
  // Return existing promise if initialization is already in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Return resolved promise if already initialized
  if (firebaseAdminInitialized) {
    return Promise.resolve();
  }

  initializationPromise = new Promise(async (resolve, reject) => {
    try {
      // Check if we're in a server environment
      if (typeof window !== 'undefined') {
        console.log('Firebase Admin SDK not needed on client side');
        resolve();
        return;
      }

      console.log('=== INITIALIZING FIREBASE ADMIN SDK ===');
      
      // Check environment variables with more detailed logging
      const envVars = {
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
      };
      
      console.log('Environment variables check:', {
        FIREBASE_PROJECT_ID: !!envVars.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: !!envVars.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: !!envVars.FIREBASE_PRIVATE_KEY,
        NODE_ENV: process.env.NODE_ENV,
      });

      // Check if environment variables are available
      const missingVars = Object.entries(envVars)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingVars.length > 0) {
        const errorMsg = `Missing Firebase Admin SDK environment variables: ${missingVars.join(', ')}`;
        console.error(errorMsg);
        console.error('Firebase Admin SDK will not be initialized');
        console.error('Please set these environment variables in your Vercel deployment:');
        console.error('- FIREBASE_PROJECT_ID');
        console.error('- FIREBASE_CLIENT_EMAIL');
        console.error('- FIREBASE_PRIVATE_KEY');
        reject(new Error(errorMsg));
        return;
      }

      // Fix private key formatting
      let privateKey = envVars.FIREBASE_PRIVATE_KEY!;
      
      console.log('Original private key length:', privateKey.length);
      console.log('Original private key has newlines:', privateKey.includes('\\n'));
      console.log('Original private key has actual newlines:', privateKey.includes('\n'));
      
      // Remove quotes if present
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
        console.log('Removed outer quotes');
      }
      
      // Replace literal \n with actual newlines
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
        console.log('Replaced \\n with newlines');
      }
      
      // If no newlines are present, add them at the appropriate places
      if (!privateKey.includes('\n')) {
        console.log('No newlines found, adding them manually');
        privateKey = privateKey.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
        privateKey = privateKey.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
      }
      
      // Ensure the key has proper PEM format
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.error('Private key does not have proper PEM format');
        reject(new Error('Private key does not have proper PEM format'));
        return;
      }

      console.log('Private key format check passed');
      console.log('Final private key length:', privateKey.length);
      console.log('Final private key has newlines:', privateKey.includes('\n'));

      // Import Firebase Admin SDK
      const admin = require('firebase-admin');
      console.log('Firebase Admin SDK imported successfully');
      
      // Check existing apps
      const apps = admin.apps;
      console.log('Existing Firebase apps before initialization:', apps.length);
      
      // Always try to initialize, even if apps exist
      try {
        console.log('Creating new Firebase Admin app...');
        const app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: envVars.FIREBASE_PROJECT_ID,
            clientEmail: envVars.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
        });
        console.log('Firebase Admin app created successfully:', app.name);
      } catch (initError: any) {
        if (initError.code === 'app/duplicate-app') {
          console.log('Firebase app already exists, using existing app');
        } else {
          console.error('Failed to initialize Firebase app:', initError);
          reject(initError);
          return;
        }
      }
      
      // Verify initialization
      const finalApps = admin.apps;
      console.log('Firebase apps after initialization:', finalApps.length);
      
      if (finalApps.length > 0) {
        firebaseAdminInitialized = true;
        console.log('Firebase Admin SDK initialization complete');
        resolve();
      } else {
        console.error('Firebase Admin SDK initialization failed - no apps found');
        reject(new Error('Firebase Admin SDK initialization failed - no apps found'));
      }
      
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      reject(error);
    }
  });

  return initializationPromise;
}

// Initialize on module load
initializeFirebaseAdmin().catch(error => {
  console.error('Initial Firebase Admin SDK initialization failed:', error);
});

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    uid: string;
    email: string;
    displayName?: string;
  };
}

export const verifyAuth = async (req: NextApiRequest) => {
  try {
    console.log('=== VERIFY AUTH CALLED ===');
    console.log('firebaseAdminInitialized:', firebaseAdminInitialized);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Ensure Firebase Admin SDK is initialized
    if (!firebaseAdminInitialized) {
      console.log('Firebase Admin SDK not initialized, attempting to initialize...');
      try {
        await initializeFirebaseAdmin(); // Await the promise
      } catch (initError) {
        console.error('Failed to initialize Firebase Admin SDK during auth verification:', initError);
        console.error('This usually means environment variables are missing in production');
        return null;
      }
      
      // Check again after initialization attempt
      if (!firebaseAdminInitialized) {
        console.error('Firebase Admin SDK still not initialized after attempt');
        console.error('Check Vercel environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
        return null;
      }
    }

    const authHeader = req.headers.authorization;
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header value:', authHeader ? authHeader.substring(0, 20) + '...' : 'None');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header');
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Token extracted, length:', token.length);
    console.log('Token starts with:', token.substring(0, 20) + '...');
    
    try {
      const admin = require('firebase-admin');
      console.log('Firebase Admin SDK imported successfully');
      console.log('Available apps:', admin.apps.length);
      
      const auth = admin.auth();
      console.log('Firebase Auth instance obtained');
      console.log('Verifying token...');
      
      const decodedToken = await auth.verifyIdToken(token);
      console.log('Token verified successfully for user:', decodedToken.email);
      console.log('User UID:', decodedToken.uid);
      
      return {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || undefined,
      };
    } catch (error: any) {
      console.error('Token verification failed:', error);
      console.error('Token verification error details:', {
        message: error.message || 'Unknown error',
        code: error.code,
        stack: error.stack,
      });
      
      // Provide more specific error messages
      if (error.code === 'auth/id-token-expired') {
        console.error('Token is expired - user needs to sign in again');
      } else if (error.code === 'auth/invalid-id-token') {
        console.error('Token is invalid - possible client-side issue');
      } else if (error.code === 'auth/id-token-revoked') {
        console.error('Token has been revoked - user needs to sign in again');
      } else {
        console.error('Unknown token verification error');
      }
      
      return null;
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
};

export const withAuth = (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) => {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.split('Bearer ')[1];
      
      try {
        const admin = require('firebase-admin');
        const auth = admin.auth();
        const decodedToken = await auth.verifyIdToken(token);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || undefined,
        };
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
}; 