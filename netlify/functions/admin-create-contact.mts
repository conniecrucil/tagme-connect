import { Resend } from 'resend';
import type { Context } from '@netlify/functions';
import { generateVCard, type VCardConfig } from './utils/vcard-generator.js';

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
    // Generate vCard attachment
    const vcardConfig: VCardConfig = {
      name: configuration.name,
      email: configuration.email,
      phone: configuration.phone,
      company: configuration.company,
      title: configuration.title,
      website: configuration.website,
      socialMedia: configuration.socialMedia,
      customMessage: configuration.customMessage
    };

    const vcardContent = generateVCard(vcardConfig);
    const vcardAttachment = {
      filename: `${configuration.name.replace(/\s+/g, '_')}_contact.vcf`,
      content: Buffer.from(vcardContent).toString('base64'),
      contentType: 'text/vcard'
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Admin Contact Creation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background: white; }
            .card-config { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; background: #f8f9fa; border-radius: 0 0 8px 8px; }
            .success-badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .url-box { background: #e0f2fe; padding: 15px; border-radius: 8px; border-left: 4px solid #0288d1; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Admin Contact Created</h1>
              <p>A new contact has been successfully created through the admin panel.</p>
              <span class="success-badge">CREATED</span>
            </div>
            
            <div class="content">
              <h2>Creation Information</h2>
              <div class="card-config">
                <p><strong>Creation ID:</strong> ${sessionId}</p>
                <p><strong>Created At:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Method:</strong> Admin Panel</p>
              </div>

              <h3>📋 Contact Details</h3>
              <div class="card-config">
                <h4>Basic Information:</h4>
                <p><strong>Name:</strong> ${configuration.name || 'Not provided'}</p>
                <p><strong>Email:</strong> ${configuration.email || 'Not provided'}</p>
                <p><strong>Phone:</strong> ${configuration.phone || 'Not provided'}</p>
                <p><strong>Mobile:</strong> ${configuration.mobile || 'Not provided'}</p>
                <p><strong>Company:</strong> ${configuration.company || 'Not provided'}</p>
                <p><strong>Title:</strong> ${configuration.title || 'Not provided'}</p>
                <p><strong>Website:</strong> ${configuration.website || 'Not provided'}</p>
                
                <h4>Address Information:</h4>
                <p><strong>Street:</strong> ${configuration.street || 'Not provided'}</p>
                <p><strong>City:</strong> ${configuration.city || 'Not provided'}</p>
                <p><strong>State:</strong> ${configuration.state || 'Not provided'}</p>
                <p><strong>Postal Code:</strong> ${configuration.postal || 'Not provided'}</p>
                <p><strong>Country:</strong> ${configuration.country || 'Not provided'}</p>
                
                <h4>Social Media Links:</h4>
                ${configuration.socialMedia && Object.keys(configuration.socialMedia).length > 0 ? `
                  <ul>
                    ${Object.entries(configuration.socialMedia).map(([platform, url]) => 
                      `<li><strong>${platform.charAt(0).toUpperCase() + platform.slice(1)}:</strong> <a href="${url}" target="_blank">${url}</a></li>`
                    ).join('')}
                  </ul>
                ` : '<p>No social media links provided</p>'}
                
                <h4>Custom Message:</h4>
                <p style="font-style: italic; background: #f8f9fa; padding: 10px; border-radius: 4px;">
                  "${configuration.customMessage || 'No custom message provided'}"
                </p>
              </div>

              <h3>🌐 Digital Contact Card</h3>
              <div class="url-box">
                <p><strong>✅ Successfully uploaded to S3</strong></p>
                <p><strong>📱 View Online:</strong> <a href="${s3Data.urls.html}" target="_blank" style="color: #0288d1; text-decoration: none;">${s3Data.urls.html}</a></p>
                <p><strong>📥 Download vCard:</strong> <a href="${s3Data.urls.vcard}" download style="color: #0288d1; text-decoration: none;">Save to Contacts</a></p>
                <p><strong>📁 S3 Folder ID:</strong> ${s3Data.folderId}</p>
              </div>

              <h3>📎 Attachments</h3>
              <div class="card-config">
                <p><strong>vCard File:</strong> ${vcardAttachment.filename}</p>
                <p><em>This contact card is attached to this email for your records.</em></p>
              </div>

              <h3>📊 Summary</h3>
              <div class="card-config">
                <p>✅ Contact information validated and processed</p>
                <p>✅ vCard file generated successfully</p>
                <p>✅ HTML contact page created</p>
                <p>✅ Files uploaded to S3 storage</p>
                <p>✅ Contact is now live and shareable</p>
              </div>
            </div>

            <div class="footer">
              <p>This contact was created through the admin panel at ${new Date().toLocaleString()}</p>
              <p>© Admin Panel | Smart Business Cards</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: emailFrom,
      to: [adminEmail],
      subject: `Admin Contact Created - ${configuration.name} (${sessionId})`,
      html: emailHtml,
      attachments: [vcardAttachment]
    });

    console.log('Admin notification email sent successfully');
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    throw error;
  }
}
