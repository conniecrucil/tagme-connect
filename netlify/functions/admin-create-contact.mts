import { Resend } from 'resend';
import type { Context } from '@netlify/functions';
import { transformS3UrlToDomain } from './utils/url-transform.js';
import { generateVCard, type VCardConfig } from './utils/vcard-generator.js';
import { inlineEmailCSS } from './utils/email-inline-css.js';
import { generateAdminContactCreationEmail } from './utils/email-templates.mjs';
import { upsertCustomer, type Customer } from './utils/supabase';

const resend = new Resend(process.env.RESEND_API_KEY || '');
const emailFrom = process.env.EMAIL_FROM || 'contact@tagmeconnections.con';
const adminEmail = process.env.ADMIN_EMAIL || 'contact@tagmeconnections.con';

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
      const { configuration, customerEmail } = await req.json();

      if (!configuration) {
        console.error('Missing configuration data in request');
        return new Response(JSON.stringify({ error: 'Missing configuration data' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Generate unique session ID for admin creation
      const sessionId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        // Create or update customer if email provided
        let customer: Customer | null = null;
        if (customerEmail) {
          try {
            customer = await upsertCustomer({
              email: customerEmail,
              name: configuration.name,
              phone: configuration.phone || configuration.mobile,
              metadata: {
                source: 'admin_creation',
                session_id: sessionId
              }
            });
            console.log('Customer created/updated:', customer.id);
          } catch (customerError) {
            console.error('Failed to create/update customer:', customerError);
            // Continue without customer - card will be created without customer link
          }
        }

        // Upload contact card to S3 (this will also create card record in database)
        const s3Response = await uploadContactCardToS3(sessionId, configuration, req);

        // Send admin notification email
        await sendAdminNotificationEmail(sessionId, configuration, s3Response, customer);

        return new Response(JSON.stringify({
          success: true,
          message: 'Contact created successfully',
          sessionId,
          s3Urls: s3Response.urls,
          contactName: configuration.name,
          contactEmail: configuration.email,
          customerId: customer?.id,
          cardId: s3Response.card_id
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (s3Error) {
        console.error('S3 upload error:', s3Error);
        return new Response(JSON.stringify({ 
          error: 'Failed to upload contact card to S3',
          details: s3Error instanceof Error ? s3Error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return new Response(JSON.stringify({ 
        error: 'Failed to send notification email',
        details: emailError instanceof Error ? emailError.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Unexpected error in admin-create-contact:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function uploadContactCardToS3(sessionId: string, configuration: any, req: Request) {
  try {
    const baseUrl = getBaseUrlFromRequest(req);
    const response = await fetch(`${baseUrl}/.netlify/functions/upload-to-s3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contactData: configuration,
        sessionId: sessionId
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`S3 upload failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`S3 upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

async function sendAdminNotificationEmail(sessionId: string, configuration: any, s3Data: any, customer?: Customer | null) {
  try {
    const emailHtml = generateAdminContactCreationEmail({
      sessionId,
      configuration,
      s3Data,
      customer
    });

    await resend.emails.send({
      from: emailFrom,
      to: [adminEmail],
      subject: `Admin Contact Created - ${configuration.name} (${sessionId})`,
      html: inlineEmailCSS(emailHtml)
    });

    console.log('Admin notification email sent successfully');
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    throw error;
  }
}
