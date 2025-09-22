import { Resend } from 'resend';
import type { Context } from '@netlify/functions';
import { transformS3UrlToDomain } from './utils/url-transform.js';
import { inlineEmailCSS } from './utils/email-inline-css.js';
import { generateCustomerConfirmationEmail, generateAdminNotificationEmail } from './utils/email-templates.mjs';

const resend = new Resend(process.env.RESEND_API_KEY || '');

const emailFrom = process.env.EMAIL_FROM || 'hello@brianbancroft.ca';
const adminEmail = process.env.ADMIN_EMAIL || 'connectme-test@mailinator.com';

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { sessionId, customerInfo, cart } = body;

    if (!sessionId || !customerInfo || !cart) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate customer email is provided
    if (!customerInfo.email || !customerInfo.email.trim()) {
      return new Response(JSON.stringify({ error: 'Customer email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create a mock session object for compatibility with existing functions
    const session = {
      id: sessionId,
      metadata: {
        sessionId,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        totalItems: cart.reduce((sum: number, item: any) => sum + item.quantity, 0).toString(),
        totalAmount: cart.reduce((sum: number, item: any) => {
          const price = item.productType === 'basic' ? 40 : 47;
          return sum + (price * item.quantity);
        }, 0).toString()
      },
      shipping: customerInfo.shipping ? {
        address: customerInfo.shipping
      } : null
    };

    await handleCheckoutSessionCompleted(session, cart, customerInfo);

    return new Response(JSON.stringify({ success: true, message: 'Emails sent successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing purchase emails:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function handleCheckoutSessionCompleted(session: any, cart?: any, customerInfo?: any) {
  try {
    // Use provided data or fallback to metadata
    if (!cart || !customerInfo) {
      cart = [{
        productId: 'unknown',
        productType: 'basic',
        quantity: parseInt(session.metadata.totalItems) || 1,
        price: parseFloat(session.metadata.totalAmount) || 40
      }];
      // Validate that we have required customer email
      if (!session.metadata.customerEmail || !session.metadata.customerEmail.trim()) {
        throw new Error('Customer email is required but not found in session metadata');
      }
      
      customerInfo = {
        name: session.metadata.customerName || 'Customer',
        email: session.metadata.customerEmail,
        phone: ''
      };
    }

    // Upload contact cards to S3 (one per card) - only for core cards
    const s3Urls = [];
    for (const item of cart) {
      for (let i = 0; i < item.quantity; i++) {
        if (item.configuration && item.productType === 'core') {
          try {
            const s3Response = await uploadContactCardToS3(session.id, item.configuration, i + 1);
            s3Urls.push(s3Response);
          } catch (error) {
            console.error(`Failed to upload card ${i + 1} to S3:`, error);
          }
        }
      }
    }

    // Send customer confirmation email
    await sendCustomerConfirmationEmail(session, customerInfo, cart, s3Urls);

    // Send admin notification emails (one per card)
    for (const item of cart) {
      for (let i = 0; i < item.quantity; i++) {
        await sendAdminNotificationEmail(session, customerInfo, item, i + 1, s3Urls[i] || null);
      }
    }

    console.log('Successfully processed checkout session:', session.id);
  } catch (error) {
    console.error('Error handling checkout session:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  console.log('Payment succeeded:', paymentIntent.id);
  // Additional payment success logic can be added here
}

async function uploadContactCardToS3(sessionId: string, configuration: any, cardNumber: number) {
  try {
    const response = await fetch(`${process.env.NETLIFY_SITE_URL || 'http://localhost:8888'}/.netlify/functions/upload-to-s3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contactData: configuration,
        sessionId: `${sessionId}-${cardNumber}`
      })
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

async function sendCustomerConfirmationEmail(session: any, customerData: any, cart: any, s3Urls: any[] = []) {
  try {
    const emailHtml = generateCustomerConfirmationEmail({
      session,
      customerData,
      cart,
      s3Urls
    });

    await resend.emails.send({
      from: emailFrom, // This should be your verified domain
      to: [customerData.email],
      subject: `Order Confirmation - ${session.id}`,
      html: inlineEmailCSS(emailHtml),
    });

    console.log('Customer confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending customer confirmation email:', error);
  }
}

async function sendAdminNotificationEmail(session: any, customerData: any, item: any, cardNumber: any, s3Data: any = null) {
  try {
    // Handle card design zip upload for both basic and core cards
    let cardDesignZipUrl = null;
    
    if (item.configuration?.images?.cardDesign?.blob) {
      try {
        const cardDesignZipResponse = await fetch(`${process.env.NETLIFY_SITE_URL || 'http://localhost:8888'}/.netlify/functions/upload-logo-zip`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: item.configuration.images.cardDesign,
            sessionId: session.id,
            cardNumber: cardNumber
          }),
        });

        if (cardDesignZipResponse.ok) {
          const cardDesignZipData = await cardDesignZipResponse.json();
          cardDesignZipUrl = cardDesignZipData.zipUrl;
        } else {
          console.error('Failed to upload card design zip:', await cardDesignZipResponse.text());
        }
      } catch (error) {
        console.error('Error uploading card design zip:', error);
      }
    }
    
    const emailHtml = generateAdminNotificationEmail({
      session,
      customerData,
      item,
      cardNumber,
      s3Data,
      cardDesignZipUrl
    });

    await resend.emails.send({
      from: emailFrom, // This should be your verified domain
      to: [adminEmail],
      subject: `New Order - ${item.productType === 'basic' ? 'TAG Basic Card' : 'TAG Core Card'} #${cardNumber}`,
      html: inlineEmailCSS(emailHtml)
    });

    console.log(`Admin notification email sent for card ${cardNumber} - comprehensive template`);
  } catch (error) {
    console.error(`Error sending admin notification email for card ${cardNumber}:`, error);
  }
}

