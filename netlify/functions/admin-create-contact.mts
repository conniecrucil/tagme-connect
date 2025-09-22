import { Resend } from 'resend';
import type { Context } from '@netlify/functions';
import { transformS3UrlToDomain } from './utils/url-transform.js';
import { generateVCard, type VCardConfig } from './utils/vcard-generator.js';
import { inlineEmailCSS } from './utils/email-inline-css.js';
import { generateAdminContactCreationEmail } from './utils/email-templates.mjs';

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
    const { configuration } = await req.json();

    if (!configuration) {
      return new Response(JSON.stringify({ error: 'Missing configuration data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate unique session ID for admin creation
    const sessionId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Upload contact card to S3
    const s3Response = await uploadContactCardToS3(sessionId, configuration);

    // Send admin notification email
    await sendAdminNotificationEmail(sessionId, configuration, s3Response);

    return new Response(JSON.stringify({
      success: true,
      message: 'Contact created successfully',
      sessionId,
      s3Urls: s3Response.urls,
      contactName: configuration.name,
      contactEmail: configuration.email
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating admin contact:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create contact',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function uploadContactCardToS3(sessionId: string, configuration: any) {
  try {
    const response = await fetch(`${process.env.NETLIFY_SITE_URL || 'http://localhost:8888'}/.netlify/functions/upload-to-s3`, {
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
      throw new Error(`S3 upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

async function sendAdminNotificationEmail(sessionId: string, configuration: any, s3Data: any) {
  try {
    const emailHtml = generateAdminContactCreationEmail({
      sessionId,
      configuration,
      s3Data
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
