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

    // Get base URL for redirects and images
    // Use the origin from the request headers to support both localhost and production
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^\/]*$/, '') || process.env.NETLIFY_SITE_URL || 'http://localhost:8888';
    const baseUrl = origin;

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
            ? `${baseUrl}/sample-tag-basic-card.webp`
            : `${baseUrl}/sample-tag-core-card.webp`
          ],
        },
        unit_amount: item.productType === 'basic' ? 4000 : 4700, // $40.00 and $47.00 in cents
      },
      quantity: item.quantity,
    }));

    // Generate a unique session ID for storing cart data
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store cart data in a temporary location (in production, use a database)
    // For now, we'll store it in the file system
    const cartData = {
      cart,
      customerInfo,
      timestamp: new Date().toISOString()
    };
    
    // In a real implementation, you'd store this in a database
    // For this POC, we'll store it in a JSON file
    const fs = await import('fs/promises');
    const path = await import('path');
    const dataDir = path.join(process.cwd(), 'temp-cart-data');
    
    try {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(
        path.join(dataDir, `${sessionId}.json`),
        JSON.stringify(cartData, null, 2)
      );
    } catch (error) {
      console.error('Error storing cart data:', error);
      // Continue without storing - webhook will have limited data
    }

    // Create Stripe Checkout Session with minimal metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      customer_email: customerInfo?.email,
      metadata: {
        sessionId: sessionId,
        customerName: customerInfo?.name || 'Customer',
        customerEmail: customerInfo?.email || '',
        totalItems: cart.reduce((sum: number, item: any) => sum + item.quantity, 0).toString(),
        totalAmount: cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toString()
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

