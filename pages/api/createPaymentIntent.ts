import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuth } from '../../utils/authMiddleware';
import { FirestoreServerService } from '../../lib/firestore-server';

// Initialize Stripe
let stripe: any = null;
function getStripe() {
  if (!stripe) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await verifyAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { leagueId } = req.body;

    if (!leagueId) {
      return res.status(400).json({ error: 'Missing leagueId' });
    }

    // Get the league to verify it exists and user is admin
    const league = await FirestoreServerService.getLeague(leagueId);
    if (!league) {
      return res.status(404).json({ error: 'League not found' });
    }

    // Check if user is the admin of this league
    if (league.adminUserId !== user.uid) {
      return res.status(403).json({ error: 'Only league admin can upgrade league' });
    }

    // Check if league is already paid
    if (league.isPaid) {
      return res.status(400).json({ error: 'League is already upgraded' });
    }

    // Create payment intent
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 499, // $4.99 in cents
      currency: 'usd',
      metadata: {
        leagueId: leagueId,
        leagueName: league.name,
        adminUserId: user.uid,
        adminEmail: user.email || '',
      },
      description: `Upgrade ${league.name} to premium`,
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 