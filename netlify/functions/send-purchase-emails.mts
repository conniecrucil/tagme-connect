import { Resend } from 'resend';
import type { Context } from '@netlify/functions';
import { transformS3UrlToDomain } from './utils/url-transform.js';
import { inlineEmailCSS } from './utils/email-inline-css.js';
import { generateCustomerConfirmationEmail, generateAdminNotificationEmail } from './utils/email-templates.mjs';

const resend = new Resend(process.env.RESEND_API_KEY || '');

const emailFrom = process.env.EMAIL_FROM || 'contact@tagmeconnections.con';
const adminEmail = process.env.ADMIN_EMAIL || 'contact@tagmeconnections.con';

// In-memory store for tracking sent emails (in production, use a database or Redis)
// This prevents duplicate emails from being sent if the function is called multiple times
// for the same session ID (e.g., page refresh, direct URL access, etc.)
const sentEmails = new Set<string>();

// Helper function to get base URL from request headers
function getBaseUrlFromRequest(req: Request): string {
  // Try to get the origin from request headers first
  const origin = req.headers.get('origin');
  if (origin) {
    return origin;
  }

  // Try to extract from referer header
  const referer = req.headers.get('referer');
  if (referer) {
    // Remove the path from referer to get just the base URL
    return referer.replace(/\/[^\/]*$/, '');
  }

  // Try to get from host header and construct URL
  const host = req.headers.get('host');
  if (host) {
    // Determine protocol based on host
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    return `${protocol}://${host}`;
  }

  // Fallback to environment variable or localhost
  return process.env.NETLIFY_SITE_URL || 'http://localhost:8888';
}

export default async (req: Request, context: Context) => {
  try {
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
        console.error('Missing required parameters:', { sessionId: !!sessionId, customerInfo: !!customerInfo, cart: !!cart });
        return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check if emails have already been sent for this session
      if (sentEmails.has(sessionId)) {
        console.log('Emails already sent for session:', sessionId);
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Emails already sent for this session',
          duplicate: true 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Validate customer email is provided
      if (!customerInfo.email || !customerInfo.email.trim()) {
        console.error('Customer email is missing or empty');
        return new Response(JSON.stringify({ error: 'Customer email is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      try {
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

        await handleCheckoutSessionCompleted(session, cart, customerInfo, req);

        // Mark emails as sent for this session
        sentEmails.add(sessionId);

        return new Response(JSON.stringify({ success: true, message: 'Emails sent successfully' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (emailError) {
        console.error('Error sending purchase emails:', emailError);
        return new Response(JSON.stringify({ 
          error: 'Failed to send purchase emails',
          details: emailError instanceof Error ? emailError.message : 'Unknown error'
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
    console.error('Unexpected error in send-purchase-emails:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function handleCheckoutSessionCompleted(session: any, cart?: any, customerInfo?: any, req?: Request) {
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
            // Create a copy of configuration without images to avoid logo upload conflicts
            const configurationWithoutImages = {
              ...item.configuration,
              images: {
                logo: { url: null, blob: null, ext: null, mime: null },
                photo: item.configuration.images?.photo || { url: null, blob: null, ext: null, mime: null },
                cover: item.configuration.images?.cover || { url: null, blob: null, ext: null, mime: null }
              }
            };
            const s3Response = await uploadContactCardToS3(session.id, configurationWithoutImages, i + 1, req);
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
        await sendAdminNotificationEmail(session, customerInfo, item, i + 1, s3Urls[i] || null, req);
      }
    }

    console.log('Successfully processed checkout session:', session.id);
  } catch (error) {
    console.error('Error handling checkout session:', error);
  }
}



async function uploadContactCardToS3(sessionId: string, configuration: any, cardNumber: number, req?: Request) {
  try {
    const baseUrl = req ? getBaseUrlFromRequest(req) : (process.env.NETLIFY_SITE_URL || 'http://localhost:8888');
    const response = await fetch(`${baseUrl}/.netlify/functions/upload-to-s3`, {
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

async function sendAdminNotificationEmail(session: any, customerData: any, item: any, cardNumber: any, s3Data: any = null, req?: Request) {
  try {
    // Handle logo zip upload for both basic and core cards
    let cardDesignZipUrl = null;
    
    // Check for logo in both cardDesign (basic cards) and logo (core cards) fields
    const logoImageData = item.configuration?.images?.cardDesign?.blob 
      ? item.configuration.images.cardDesign 
      : item.configuration?.images?.logo?.blob 
        ? item.configuration.images.logo 
        : null;
    
    if (logoImageData) {
      try {
        const baseUrl = req ? getBaseUrlFromRequest(req) : (process.env.NETLIFY_SITE_URL || 'http://localhost:8888');
        const cardDesignZipResponse = await fetch(`${baseUrl}/.netlify/functions/upload-logo-zip`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: logoImageData,
            sessionId: session.id,
            cardNumber: cardNumber
          }),
        });

        if (cardDesignZipResponse.ok) {
          const cardDesignZipData = await cardDesignZipResponse.json();
          cardDesignZipUrl = cardDesignZipData.zipUrl;
        } else {
          console.error('Failed to upload logo zip:', await cardDesignZipResponse.text());
        }
      } catch (error) {
        console.error('Error uploading logo zip:', error);
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

