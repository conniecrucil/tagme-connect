import Stripe from 'stripe';
import { getOrderByStripeSession, updateOrderFulfillment } from './utils/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async (req: Request, context: any) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'sessionId is required' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    try {
      // Retrieve the Stripe checkout session
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Get receipt URL from the payment intent
      let receiptUrl = null;
      if (session.payment_intent) {
        const paymentIntent: any = await stripe.paymentIntents.retrieve(
          typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id
        );
        
        if (paymentIntent.charges.data.length > 0) {
          const charge = paymentIntent.charges.data[0];
          if (charge.receipt_url) {
            receiptUrl = charge.receipt_url;
          }
        }
      }

      // Update the order with the receipt URL if we found it
      if (receiptUrl) {
        const order = await getOrderByStripeSession(sessionId);
        if (order && !order.stripe_receipt_url) {
          const supabase = (await import('./utils/supabase')).getSupabaseClient();
          await supabase
            .from('orders')
            .update({ stripe_receipt_url: receiptUrl })
            .eq('id', order.id);
        }
      }

      return new Response(JSON.stringify({ receipt_url: receiptUrl }), {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return new Response(JSON.stringify({ 
        error: 'Failed to retrieve receipt URL',
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
    console.error('Error in get-stripe-receipt-url:', error);
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
