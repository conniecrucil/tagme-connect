import { upsertCustomer, type Customer } from './utils/supabase';
import * as Sentry from '@sentry/node';

// Initialize Sentry for error tracking
Sentry.init({
  dsn: 'https://7184a4ca4bd3c0d242e0297974ff3ce0@o258608.ingest.us.sentry.io/4510055747223552',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  tracesSampleRate: 1.0,
});

// Email sending disabled - we're not using a database
// import { Resend } from 'resend';
// import { inlineEmailCSS } from './utils/email-inline-css';
// import { generateAdminContactCreationEmail } from './utils/email-templates';

interface ContactCardData {
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  title?: string;
  website?: string;
  street?: string;
  city?: string;
  state?: string;
  postal?: string;
  country?: string;
  socialMedia?: Record<string, string>;
  customMessage?: string;
  primaryActions?: Array<{ name: string; value: string; color?: string }>;
  secondaryActions?: Array<{ name: string; value: string; color?: string }>;
  logoOrHeader?: boolean;
  cardType?: 'basic' | 'core';
  websiteUrl?: string;
  designFileUrl?: string;
  fname?: string;
  lname?: string;
  biz?: string;
  desc?: string;
  photo?: string;
  pronouns?: string;
  prefix?: string;
  images?: {
    logo?: { url?: string; blob?: string; ext?: string; mime?: string };
    photo?: { url?: string; blob?: string; ext?: string; mime?: string };
    cover?: { url?: string; blob?: string; ext?: string; mime?: string };
  };
}

interface ErrorResponseData {
  error: string;
  details: string;
  partialSuccess: boolean;
  succeeded: {
    customerCreated: boolean;
    customerId: string | null;
  };
  failed: {
    s3Upload: boolean;
    cardCreation: boolean;
  };
  troubleshooting?: string;
}

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
  return (
    process.env.APP_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    'http://localhost:3000'
  );
}

export default async (req: Request, context: any) => {
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
      
      // Declare customer outside try-catch so it's accessible in catch block
      let customer: Customer | null = null;

      try {
        // Create or update customer if email provided
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

        // Note: Email notifications disabled - we're not using a database
        // Previously sent admin notification email here:
        // await sendAdminNotificationEmail(sessionId, configuration, s3Response, customer);

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
        
        // Capture error in Sentry with additional context
        Sentry.captureException(s3Error, {
          tags: {
            function: 'admin-create-contact',
            operation: 's3_upload',
            partial_success: 'true'
          },
          contexts: {
            operation: {
              type: 's3_upload_failure',
              customerId: customer?.id || null,
              sessionId: sessionId,
              contactName: configuration.name,
              contactEmail: configuration.email,
              customerCreated: !!customer
            }
          },
          extra: {
            errorMessage: s3Error instanceof Error ? s3Error.message : 'Unknown error',
            sessionId,
            configuration: {
              name: configuration.name,
              email: configuration.email,
              phone: configuration.phone
            }
          }
        });
        
        // Provide detailed context about what succeeded and what failed
        const errorMessage = s3Error instanceof Error ? s3Error.message : 'Unknown error';
        const responseData: ErrorResponseData = {
          error: 'Failed to upload contact card to S3',
          details: errorMessage,
          partialSuccess: true,
          succeeded: {
            customerCreated: !!customer,
            customerId: customer?.id || null
          },
          failed: {
            s3Upload: true,
            cardCreation: true
          }
        };

        // Try to extract more details from the error if it's from upload-to-s3 function
        if (typeof errorMessage === 'string' && errorMessage.includes('upload-to-s3')) {
          responseData.troubleshooting = 'The contact card HTML and files failed to upload to storage. The customer record was created successfully. You may need to retry this operation or check the storage configuration.';
        }

        return new Response(JSON.stringify(responseData), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

    } catch (parseError) {
      // This catches JSON parsing errors or other errors from the inner try block
      console.error('Error parsing request or handling contact creation:', parseError);
      
      Sentry.captureException(parseError, {
        tags: {
          function: 'admin-create-contact',
          operation: 'request_parsing'
        }
      });
      
      return new Response(JSON.stringify({ 
        error: 'Failed to create contact',
        details: parseError instanceof Error ? parseError.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Unexpected error in admin-create-contact:', error);
    
    Sentry.captureException(error, {
      tags: {
        function: 'admin-create-contact',
        operation: 'unexpected_error'
      }
    });
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function uploadContactCardToS3(sessionId: string, configuration: ContactCardData, req: Request) {
  try {
    const baseUrl = getBaseUrlFromRequest(req);
    const response = await fetch(`${baseUrl}/api/upload-to-s3`, {
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
      
      // Try to parse error details from the response
      let errorDetails = response.statusText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.details) {
          errorDetails = `${errorJson.error}: ${errorJson.details}`;
        }
      } catch {
        // If parsing fails, use the raw error text
        errorDetails = errorText || response.statusText;
      }
      
      throw new Error(`S3 upload failed: ${errorDetails}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

// Email sending disabled - we're not using a database
// async function sendAdminNotificationEmail(sessionId: string, configuration: any, s3Data: any, customer?: Customer | null) {
//   try {
//     const emailHtml = generateAdminContactCreationEmail({
//       sessionId,
//       configuration,
//       s3Data,
//       customer
//     });
//
//     await resend.emails.send({
//       from: emailFrom,
//       to: [adminEmail],
//       subject: `Admin Contact Created - ${configuration.name} (${sessionId})`,
//       html: inlineEmailCSS(emailHtml)
//     });
//
//     console.log('Admin notification email sent successfully');
//   } catch (error) {
//     console.error('Error sending admin notification email:', error);
//     throw error;
//   }
// }
