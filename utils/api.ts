import { auth } from '../lib/firebase';

export const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  console.log('=== MAKE AUTHENTICATED REQUEST ===');
  console.log('URL:', url);
  console.log('Options:', options);
  
  const user = auth.currentUser;
  console.log('Current user:', user ? {
    email: user.email,
    uid: user.uid,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
  } : 'No user');
  
  if (!user) {
    console.error('No authenticated user found');
    throw new Error('User not authenticated');
  }

  try {
    console.log('Getting ID token...');
    const token = await user.getIdToken();
    console.log('Token obtained successfully');
    console.log('Token length:', token.length);
    console.log('Token starts with:', token.substring(0, 20) + '...');
    console.log('Token ends with:', '...' + token.substring(token.length - 20));
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    console.log('Request headers:', {
      'Content-Type': headers['Content-Type'],
      'Authorization': headers['Authorization'] ? 'Bearer [TOKEN]' : 'No token',
    });

    console.log('Making fetch request...');
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('Response received');
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    return response;
  } catch (error) {
    console.error('Error in makeAuthenticatedRequest:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

export const generateMatchupDescription = async (
  team1: string,
  team1_record: string,
  team2: string,
  team2_record: string
): Promise<string> => {
  try {
    const response = await makeAuthenticatedRequest('/api/generateMatchupDescription', {
      method: 'POST',
      body: JSON.stringify({
        team1,
        team1_record,
        team2,
        team2_record,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate matchup description');
    }

    const data = await response.json();
    return data.description;
  } catch (error) {
    console.error('Error generating matchup description:', error);
    return 'Exciting matchup ahead!';
  }
};

export const createPaymentIntent = async (leagueId: string): Promise<{ clientSecret: string; paymentIntentId: string }> => {
  try {
    const response = await makeAuthenticatedRequest('/api/createPaymentIntent', {
      method: 'POST',
      body: JSON.stringify({ leagueId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}; 