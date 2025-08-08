import { NextApiRequest, NextApiResponse } from 'next';
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

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      try {
        // Update league payment status
        const leagueId = paymentIntent.metadata.leagueId;
        if (leagueId) {
          await FirestoreServerService.updateLeaguePaymentStatus(leagueId, paymentIntent.id);
          console.log(`League ${leagueId} payment completed successfully`);
        }
      } catch (error) {
        console.error('Error updating league payment status:', error);
        // Don't return error to Stripe - we'll handle this separately
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
} 