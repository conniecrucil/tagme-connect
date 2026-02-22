import Stripe from 'stripe';
import { upsertCustomer, createOrder, type Customer } from './utils/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async (req: Request, context: any) => {
  try {
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
        console.error('Cart validation failed: cart is empty or missing');
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
    const configuredBaseUrl =
      process.env.APP_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
      process.env.NETLIFY_SITE_URL;
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^\/]*$/, '') || configuredBaseUrl || 'http://localhost:3000';
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
    
    // Create or update customer in database if email provided
    let customer: Customer | null = null;
    if (customerInfo?.email) {
      try {
        customer = await upsertCustomer({
          email: customerInfo.email,
          name: customerInfo.name,
          phone: customerInfo.phone,
          metadata: {
            source: 'checkout_session',
            session_id: sessionId
          }
        });
        console.log('Customer created/updated:', customer.id);
      } catch (customerError) {
        console.error('Failed to create/update customer:', customerError);
        // Continue without customer - order will be created without customer link
      }
    }

    // Remove temporary file-based cart storage (legacy code)
    const fs = await import('fs/promises');
    const path = await import('path');
    const dataDir = path.join(process.cwd(), 'temp-cart-data');
    
    try {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(
        path.join(dataDir, `${sessionId}.json`),
        JSON.stringify({
          cart,
          customerInfo,
          timestamp: new Date().toISOString(),
          customer_id: customer?.id
        }, null, 2)
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
        customer_id: customer?.id || '',
        customerName: customerInfo?.name || 'Customer',
        customerEmail: customerInfo?.email || '',
        totalItems: cart.reduce((sum: number, item: any) => sum + item.quantity, 0).toString(),
        totalAmount: cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toString()
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'],
      },
    });

    // Create order in Supabase after getting Stripe session ID
    try {
      await createOrder({
        customer_id: customer?.id || null,
        stripe_session_id: session.id,
        customer_info: customerInfo || {},
        cart_data: cart,
        status: 'pending',
        shipped: false,
        fulfilled: false,
      });
    } catch (orderError) {
      console.error('Failed to create order record:', orderError);
      // Continue with session creation even if order creation fails
    }

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

    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      
      // Handle specific Stripe errors
      if (stripeError && typeof stripeError === 'object' && 'type' in stripeError) {
        const error = stripeError as any;
        if (error.type === 'StripeInvalidRequestError') {
          return new Response(JSON.stringify({ 
            error: 'Invalid request to payment processor',
            details: error.message 
          }), {
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
          });
        }
      }
      
      return new Response(JSON.stringify({ 
        error: 'Failed to create checkout session',
        details: stripeError instanceof Error ? stripeError.message : 'Unknown error'
      }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Unexpected error in create-checkout-session:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
};
