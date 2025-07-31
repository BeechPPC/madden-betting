import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set proper headers
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Test API called successfully');
    
    // Just return a simple success response
    res.status(200).json({
      success: true,
      message: 'Test API is working',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in test API:', error);
    return res.status(500).json({ 
      error: 'Test API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 