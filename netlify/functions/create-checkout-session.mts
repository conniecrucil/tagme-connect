import Stripe from 'stripe';
import type { Context } from '@netlify/functions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async (req: Request, context: Context) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const { cart, customerInfo } = await req.json();

    // Validate required data
    if (!cart || !cart.length) {
      return new Response(JSON.stringify({ error: 'Cart is required' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    // Create line items for Stripe
    const lineItems = cart.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card',
          description: item.productType === 'basic' 
            ? 'One custom NFC card with personalized smart link'
            : 'Complete digital profile with automatic contact saving',
          images: [item.productType === 'basic' 
            ? `${process.env.NETLIFY_SITE_URL}/sample-tag-basic-card.webp`
            : `${process.env.NETLIFY_SITE_URL}/sample-tag-core-card.webp`
          ],
        },
        unit_amount: item.productType === 'basic' ? 4000 : 4700, // $40.00 and $47.00 in cents
      },
      quantity: item.quantity,
    }));

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NETLIFY_SITE_URL}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NETLIFY_SITE_URL}/cart`,
      customer_email: customerInfo?.email,
      metadata: {
        cart: JSON.stringify(cart),
        customerInfo: JSON.stringify(customerInfo),
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'],
      },
    });

    return new Response(JSON.stringify({
      sessionId: session.id,
      url: session.url
    }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
};

