import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { generateLeagueId } from '../../lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== TEST CREATE LEAGUE API CALLED ===');
    
    // Test 1: Authentication
    console.log('Testing authentication...');
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        step: 'authentication'
      });
    }
    console.log('✅ Authentication successful for user:', user.email);

    // Test 2: Request body parsing
    console.log('Testing request body parsing...');
    const { leagueName, adminEmail, adminUserId, displayName } = req.body;
    console.log('Request body:', { leagueName, adminEmail, adminUserId, displayName });
    
    if (!leagueName || !adminEmail || !adminUserId || !displayName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        step: 'request_validation',
        received: { leagueName, adminEmail, adminUserId, displayName }
      });
    }
    console.log('✅ Request body validation passed');

    // Test 3: Firebase Admin SDK
    console.log('Testing Firebase Admin SDK...');
    try {
      const admin = require('firebase-admin');
      console.log('✅ Firebase Admin SDK imported successfully');
      console.log('Available apps:', admin.apps.length);
      
      const auth = admin.auth();
      console.log('✅ Firebase Auth instance obtained successfully');
    } catch (firebaseError) {
      console.error('❌ Firebase Admin SDK error:', firebaseError);
      return res.status(500).json({ 
        error: 'Firebase configuration error',
        step: 'firebase_admin',
        details: firebaseError instanceof Error ? firebaseError.message : 'Unknown Firebase error'
      });
    }

    // Test 4: League code generation
    console.log('Testing league code generation...');
    try {
      const leagueCode = generateLeagueId();
      console.log('✅ Generated league code:', leagueCode);
    } catch (codeError) {
      console.error('❌ League code generation error:', codeError);
      return res.status(500).json({ 
        error: 'League code generation failed',
        step: 'code_generation',
        details: codeError instanceof Error ? codeError.message : 'Unknown error'
      });
    }

    // Test 5: Firestore import (without actual operations)
    console.log('Testing Firestore import...');
    try {
      const { FirestoreService } = require('../../lib/firestore');
      console.log('✅ FirestoreService imported successfully');
    } catch (firestoreError) {
      console.error('❌ Firestore import error:', firestoreError);
      return res.status(500).json({ 
        error: 'Firestore import failed',
        step: 'firestore_import',
        details: firestoreError instanceof Error ? firestoreError.message : 'Unknown error'
      });
    }

    // Test 6: Google Sheets import (without actual operations)
    console.log('Testing Google Sheets import...');
    try {
      const { GoogleSheetsService } = require('../../utils/googleSheets');
      console.log('✅ GoogleSheetsService imported successfully');
    } catch (sheetsError) {
      console.error('❌ Google Sheets import error:', sheetsError);
      return res.status(500).json({ 
        error: 'Google Sheets import failed',
        step: 'sheets_import',
        details: sheetsError instanceof Error ? sheetsError.message : 'Unknown error'
      });
    }

    // All tests passed
    console.log('✅ All tests passed successfully');
    
    res.status(200).json({
      success: true,
      message: 'All tests passed - league creation should work',
      tests: [
        'authentication',
        'request_validation', 
        'firebase_admin',
        'code_generation',
        'firestore_import',
        'sheets_import'
      ]
    });

  } catch (error) {
    console.error('❌ Test error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    res.status(500).json({ 
      error: 'Test failed',
      step: 'unknown',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 