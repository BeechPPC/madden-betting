import { NextApiRequest, NextApiResponse } from 'next';
import { FirestoreServerService } from '../../lib/firestore-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Test username validation
    const validationTests = [
      {
        test: 'Length check (3-20 chars)',
        valid: username.length >= 3 && username.length <= 20,
        details: `Length: ${username.length} (must be 3-20)`
      },
      {
        test: 'Character validation',
        valid: /^[a-zA-Z0-9_]+$/.test(username),
        details: `Contains only letters, numbers, and underscores`
      }
    ];

    // Test availability (this will fail in test mode, but that's expected)
    let availabilityTest = {
      test: 'Availability check',
      valid: false,
      details: 'Not tested in development mode'
    };

    try {
      const isAvailable = await FirestoreServerService.checkUsernameAvailability(username);
      availabilityTest = {
        test: 'Availability check',
        valid: isAvailable,
        details: isAvailable ? 'Username is available' : 'Username is taken'
      };
    } catch (error) {
      availabilityTest = {
        test: 'Availability check',
        valid: false,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    const allTests = [...validationTests, availabilityTest];
    const allValid = allTests.every(test => test.valid);

    return res.status(200).json({
      username,
      valid: allValid,
      tests: allTests,
      summary: {
        total: allTests.length,
        passed: allTests.filter(test => test.valid).length,
        failed: allTests.filter(test => !test.valid).length
      }
    });
  } catch (error) {
    console.error('Error testing username:', error);
    return res.status(500).json({ 
      error: 'Failed to test username',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 