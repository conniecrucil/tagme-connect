import Stripe from 'stripe';
import type { Context } from '@netlify/functions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { sessionId } = await req.json();

    console.log('Received sessionId:', sessionId);

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Retrieve the Stripe checkout session
    console.log('Attempting to retrieve Stripe session:', sessionId);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Successfully retrieved session:', session.id);

    // Extract shipping address if available
    let shippingAddress = null;
    
    // Try to get shipping address from the session
    if ((session as any).shipping?.address) {
      shippingAddress = {
        line1: (session as any).shipping.address.line1,
        line2: (session as any).shipping.address.line2,
        city: (session as any).shipping.address.city,
        state: (session as any).shipping.address.state,
        postal_code: (session as any).shipping.address.postal_code,
        country: (session as any).shipping.address.country,
      };
    } else if (session.metadata?.shipping_address) {
      // Fallback to metadata if available
      try {
        shippingAddress = JSON.parse(session.metadata.shipping_address);
      } catch (e) {
        console.log('Could not parse shipping address from metadata');
      }
    }

    // Extract customer information
    const customerInfo = {
      email: session.customer_email || session.customer_details?.email,
      name: session.customer_details?.name,
      phone: session.customer_details?.phone,
    };

    return new Response(JSON.stringify({
      sessionId: session.id,
      customerInfo,
      shippingAddress,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
    }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error retrieving Stripe session:', error);
    return new Response(JSON.stringify({ error: 'Failed to retrieve session' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
