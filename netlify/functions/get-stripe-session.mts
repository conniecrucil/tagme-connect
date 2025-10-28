import Stripe from 'stripe';
import { getCustomerByEmail, updateCustomer } from './utils/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async (req: Request) => {
  try {
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
        console.error('Session ID is missing from request');
        return new Response(JSON.stringify({ error: 'Session ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      try {
        // Retrieve the Stripe checkout session
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Extract shipping address if available and update customer record
        let shippingAddress = null;
        let dbShippingAddress = null;
        
        try {
          // Try to get shipping address from collected_information.shipping_details
          if (session.collected_information?.shipping_details?.address) {
            const shippingDetails = session.collected_information.shipping_details.address;
            shippingAddress = {
              line1: shippingDetails.line1,
              line2: shippingDetails.line2,
              city: shippingDetails.city,
              state: shippingDetails.state,
              postal_code: shippingDetails.postal_code,
              country: shippingDetails.country,
            };
            // Convert to database format, handling null values
            dbShippingAddress = {
              street: shippingDetails.line1 || '',
              city: shippingDetails.city || '',
              state: shippingDetails.state || '',
              postal: shippingDetails.postal_code || '',
              country: shippingDetails.country || '',
            };
          } else if ((session as unknown as { shipping?: { address?: Stripe.Address } }).shipping?.address) {
            // Fallback to legacy shipping address location
            const addr = (session as unknown as { shipping: { address: Stripe.Address } }).shipping.address;
            shippingAddress = {
              line1: addr.line1,
              line2: addr.line2,
              city: addr.city,
              state: addr.state,
              postal_code: addr.postal_code,
              country: addr.country,
            };
            // Convert to database format, handling null values
            dbShippingAddress = {
              street: addr.line1 || '',
              city: addr.city || '',
              state: addr.state || '',
              postal: addr.postal_code || '',
              country: addr.country || '',
            };
          } else if (session.metadata?.shipping_address) {
            // Fallback to metadata if available
            try {
              shippingAddress = JSON.parse(session.metadata.shipping_address);
            } catch {
              console.log('Could not parse shipping address from metadata');
            }
          }
        } catch (shippingError) {
          console.warn('Error extracting shipping address:', shippingError);
          // Continue without shipping address
        }

        // Extract billing address if available
        let billingAddress = null;
        try {
          if (session.customer_details?.address) {
            const billingDetails = session.customer_details.address;
            billingAddress = {
              line1: billingDetails.line1,
              line2: billingDetails.line2,
              city: billingDetails.city,
              state: billingDetails.state,
              postal_code: billingDetails.postal_code,
              country: billingDetails.country,
            };
          }
        } catch (billingError) {
          console.warn('Error extracting billing address:', billingError);
          // Continue without billing address
        }

        // Extract customer information
        const customerInfo = {
          email: session.customer_email || session.customer_details?.email,
          name: session.customer_details?.name,
          phone: session.customer_details?.phone,
        };

        // Update customer record with stripe_customer_id and shipping_address
        if (customerInfo.email) {
          try {
            const customer = await getCustomerByEmail(customerInfo.email);
            if (customer) {
              const updates: { stripe_customer_id?: string; shipping_address?: { street: string; city: string; state: string; postal: string; country: string } } = {};
              
              // Update stripe_customer_id if available
              if (session.customer && typeof session.customer === 'string') {
                updates.stripe_customer_id = session.customer;
              }
              
              // Update shipping_address if available
              if (dbShippingAddress) {
                updates.shipping_address = dbShippingAddress;
              }
              
              // Only update if we have changes to make
              if (Object.keys(updates).length > 0) {
                await updateCustomer(customer.id, updates);
                console.log('Customer record updated with:', updates);
              }
            }
          } catch (updateError) {
            console.error('Error updating customer record:', updateError);
            // Continue even if customer update fails
          }
        }

        const responseData = {
          sessionId: session.id,
          customerInfo,
          shippingAddress,
          billingAddress,
          paymentStatus: session.payment_status,
          amountTotal: session.amount_total,
          currency: session.currency,
          metadata: session.metadata,
        }

        console.log('Response data:', responseData);

        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });

      } catch (stripeError) {
        console.error('Stripe API error:', stripeError);
        
        // Check if it's a Stripe error indicating the session doesn't exist
        if (stripeError && typeof stripeError === 'object' && 'type' in stripeError) {
          const error = stripeError as Stripe.errors.StripeError;
          if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
            // Session not found - return 404 instead of 500
            return new Response(JSON.stringify({ error: 'Session not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
        
        // For other errors, return 500
        return new Response(JSON.stringify({ 
          error: 'Failed to retrieve session',
          details: stripeError instanceof Error ? stripeError.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

    } catch (parseError) {
      console.error('Error parsing request:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid request format',
        details: parseError instanceof Error ? parseError.message : 'Unknown error'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Unexpected error in get-stripe-session:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
