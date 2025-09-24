import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import type { Context } from '@netlify/functions';
import { generateVCard, type VCardConfig } from './utils/vcard-generator.mjs';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.APP_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || '',
  },
});

// Helper function to get display name for action buttons
const getDisplayName = (name: string): string => {
  const displayNames: Record<string, string> = {
    // Primary actions
    email: 'Email',
    call: 'Call',
    Mobile: 'Mobile',
    website: 'Website',
    location: 'Location',
    calendar: 'Calendar',
    Home: 'Home',
    Office: 'Office',
    fax: 'Fax',
    signal: 'Signal',
    messenger: 'Messenger',
    whatsApp: 'WhatsApp',
    telegram: 'Telegram',
    weChat: 'WeChat',
    matrix: 'Matrix',
    
    // Secondary actions
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    x: 'X',
    bluesky: 'Bluesky',
    tiktok: 'TikTok',
    snapchat: 'Snapchat',
    twitch: 'Twitch',
    vimeo: 'Vimeo',
    spotify: 'Spotify',
    discord: 'Discord',
    reddit: 'Reddit',
    pinterest: 'Pinterest',
    github: 'GitHub',
    apple: 'Apple',
    behance: 'Behance',
    dribbble: 'Dribbble',
    artstation: 'ArtStation',
    bemer: 'Bemer',
    buymeacoffee: 'Buy Me a Coffee',
    cashapp: 'Cash App',
    coinbase: 'Coinbase',
    yelp: 'Yelp',
    npm: 'NPM'
  };
  
  return displayNames[name] || name;
};

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
  images?: {
    logo?: { url?: string; blob?: string; ext?: string; mime?: string };
    photo?: { url?: string; blob?: string; ext?: string; mime?: string };
    cover?: { url?: string; blob?: string; ext?: string; mime?: string };
  };
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
      const { contactData, sessionId } = await req.json();

      if (!contactData || !sessionId) {
        console.error('Missing required parameters:', { contactData: !!contactData, sessionId: !!sessionId });
        return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Generate unique folder ID
      const folderId = uuidv4();
      const bucketName = process.env.APP_AWS_S3_BUCKET_NAME;
      
      if (!bucketName) {
        console.error('APP_AWS_S3_BUCKET_NAME environment variable is not set');
        throw new Error('APP_AWS_S3_BUCKET_NAME environment variable is required');
      }

      try {
        // Generate HTML content for the contact card
        const htmlContent = generateContactCardHTML(contactData);

        // Upload HTML file
        const htmlKey = `${folderId}/index.html`;
        await uploadToS3(bucketName, htmlKey, htmlContent, 'text/html');

        // Upload images if they exist
        const imageUrls: Record<string, string> = {};
        
        if (contactData.images) {
          const { logo, photo, cover } = contactData.images;
          
          if (logo?.blob) {
            try {
              const logoKey = `${folderId}/logo.${(logo.ext || 'jpg').split(';')[0]}`;
              const logoBuffer = Buffer.from(logo.blob.split(',')[1], 'base64');
              await uploadToS3(bucketName, logoKey, logoBuffer, logo.mime || 'image/jpeg');
              imageUrls.logo = `${bucketName}.s3.${process.env.APP_AWS_REGION || 'us-east-1'}.amazonaws.com/${logoKey}`;
            } catch (logoError) {
              console.error('Error uploading logo:', logoError);
              // Continue without logo rather than failing completely
            }
          }
          
          if (photo?.blob) {
            try {
              const photoKey = `${folderId}/photo.${(photo.ext || 'jpg').split(';')[0]}`;
              const photoBuffer = Buffer.from(photo.blob.split(',')[1], 'base64');
              await uploadToS3(bucketName, photoKey, photoBuffer, photo.mime || 'image/jpeg');
              imageUrls.photo = `${bucketName}.s3.${process.env.APP_AWS_REGION || 'us-east-1'}.amazonaws.com/${photoKey}`;
            } catch (photoError) {
              console.error('Error uploading photo:', photoError);
              // Continue without photo rather than failing completely
            }
          }
          
          if (cover?.blob) {
            try {
              const coverKey = `${folderId}/cover.${(cover.ext || 'jpg').split(';')[0]}`;
              const coverBuffer = Buffer.from(cover.blob.split(',')[1], 'base64');
              await uploadToS3(bucketName, coverKey, coverBuffer, cover.mime || 'image/jpeg');
              imageUrls.cover = `${bucketName}.s3.${process.env.APP_AWS_REGION || 'us-east-1'}.amazonaws.com/${coverKey}`;
            } catch (coverError) {
              console.error('Error uploading cover:', coverError);
              // Continue without cover rather than failing completely
            }
          }
        }

        // Generate vCard content with uploaded image URLs
        const vcardConfig: VCardConfig = {
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          company: contactData.company,
          title: contactData.title,
          website: contactData.website,
          socialMedia: contactData.socialMedia,
          customMessage: contactData.customMessage,
          photo: contactData.photo,
          imageUrls: imageUrls
        };

        const vcardContent = generateVCard(vcardConfig);

        // Upload vCard file
        const vcardKey = `${folderId}/contact.vcf`;
        await uploadToS3(bucketName, vcardKey, vcardContent, 'text/vcard');

        // Return the public URLs
        const baseUrl = `https://${bucketName}.s3.${process.env.APP_AWS_REGION || 'us-east-1'}.amazonaws.com/${folderId}`;
        
        return new Response(JSON.stringify({
          success: true,
          folderId,
          urls: {
            html: `${baseUrl}/index.html`,
            vcard: `${baseUrl}/contact.vcf`
          },
          imageUrls
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (contentError) {
        console.error('Error generating or uploading content:', contentError);
        return new Response(JSON.stringify({ 
          error: 'Failed to generate or upload contact card content',
          details: contentError instanceof Error ? contentError.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

    } catch (s3Error) {
      console.error('S3 operation error:', s3Error);
      return new Response(JSON.stringify({ 
        error: 'Failed to upload to S3',
        details: s3Error instanceof Error ? s3Error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Unexpected error in upload-to-s3:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function uploadToS3(bucket: string, key: string, body: string | Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    // Removed ACL as modern S3 buckets often have ACLs disabled
    // Public access should be handled via bucket policy instead
    CacheControl: 'public, max-age=31536000', // Cache for 1 year
    // Additional headers for better website serving
    ...(contentType === 'text/html' && {
      ContentDisposition: 'inline',
      ContentEncoding: 'utf-8'
    })
  });

  await s3Client.send(command);
}

function generateContactCardHTML(data: ContactCardData): string {
  const { images } = data;
  
  // Generate CSS for mobile-first design
  const css = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        line-height: 1.6;
        color: #333;
        background: #f5f5f5;
        padding: 20px;
      }
      
      .contact-card {
        max-width: 320px;
        margin: 0 auto;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        overflow: hidden;
      }
      
      .header {
        height: 80px;
        background: #e4eaea;
        position: relative;
        background-size: cover;
        background-position: center;
        ${images?.cover?.url ? `background-image: url('${images.cover.url}');` : ''}
      }
      
      .logo {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translateX(-50%) translateY(-50%);
        width: 350px;
        height: 100px;
        background: transparent;
        padding: 0;
        box-shadow: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .logo img {
        width: 100%;
        height: 100%;
        border-radius: 0;
        object-fit: contain;
      }
      
      .profile {
        padding: 12px;
        text-align: center;
      }
      
      .photo {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        margin: 0 auto 12px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        background: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: #666;
      }
      
      .photo img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
      
      .name {
        font-size: 18px;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 4px;
      }
      
      .title {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }
      
      .company {
        font-size: 12px;
        color: #888;
        margin-bottom: 8px;
      }
      
      .contact-info {
        padding: 0 12px 12px;
      }
      
      .contact-item {
        display: flex;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
        text-decoration: none;
        color: inherit;
        transition: background-color 0.2s;
      }
      
      .contact-item:hover {
        background-color: #f9fafb;
      }
      
      .contact-item:last-child {
        border-bottom: none;
      }
      
      .contact-label {
        font-size: 11px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }
      
      .contact-text {
        flex: 1;
        font-size: 14px;
      }
      
      .contact-label {
        font-weight: 500;
        color: #6b7280;
        font-size: 12px;
      }
      
      .contact-value {
        color: #1f2937;
        margin-top: 2px;
        font-size: 14px;
      }
      
      .actions-section {
        padding: 12px;
      }
      
      .actions-separator {
        border-top: 1px solid #e5e7eb;
        margin: 12px 0;
      }
      
      .actions-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: center;
        margin-bottom: 16px;
      }
      
      .action-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 16px;
        border-radius: 8px;
        text-decoration: none;
        transition: all 0.2s;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        min-width: auto;
        height: auto;
      }
      
      .action-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
      
      .action-text {
        font-size: 12px;
        font-weight: 600;
        color: white;
        text-align: center;
        line-height: 1.2;
        text-transform: none;
        letter-spacing: 0.25px;
        white-space: nowrap;
      }
      
      .custom-message {
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
        font-style: italic;
        color: #1f2937;
        text-align: left;
        font-size: 14px;
      }
      
      .download-btn {
        margin: 24px;
        padding: 16px;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        width: calc(100% - 48px);
        transition: background 0.2s;
      }
      
      .download-btn:hover {
        background: #059669;
      }
      
      @media (max-width: 480px) {
        body {
          padding: 10px;
        }
        
        .contact-card {
          max-width: 100%;
        }
        
        .profile {
          padding: 40px 16px 16px;
        }
        
        .contact-info {
          padding: 0 16px 16px;
        }
        
        .social-links {
          padding: 16px;
        }
        
        .custom-message {
          padding: 16px;
        }
      }
    </style>
  `;

  // Generate text labels for action buttons
  const getActionLabel = (platform: string): string => {
    return getDisplayName(platform);
  };

  // Generate contact items
  const contactItems = [];
  
  if (data.email) {
    contactItems.push(`
      <a href="mailto:${data.email}" class="contact-item">
        <div class="contact-text">
          <div class="contact-label">Email</div>
          <div class="contact-value">${data.email}</div>
        </div>
      </a>
    `);
  }
  
  if (data.phone) {
    contactItems.push(`
      <a href="tel:${data.phone}" class="contact-item">
        <div class="contact-text">
          <div class="contact-label">Phone</div>
          <div class="contact-value">${data.phone}</div>
        </div>
      </a>
    `);
  }
  
  if (data.mobile) {
    contactItems.push(`
      <a href="tel:${data.mobile}" class="contact-item">
        <div class="contact-text">
          <div class="contact-label">Mobile</div>
          <div class="contact-value">${data.mobile}</div>
        </div>
      </a>
    `);
  }
  
  if (data.website) {
    contactItems.push(`
      <a href="${data.website}" class="contact-item" target="_blank">
        <div class="contact-text">
          <div class="contact-label">Website</div>
          <div class="contact-value">${data.website.replace(/^https?:\/\//, '')}</div>
        </div>
      </a>
    `);
  }

  // Generate action buttons from primary and secondary actions
  const primaryActionButtons: string[] = [];
  const secondaryActionButtons: string[] = [];
  
  // Add primary actions
  if (data.primaryActions) {
    data.primaryActions.forEach((action) => {
      if (action.value) {
        let href = action.value;
        if (action.name === 'whatsApp') {
          // Format WhatsApp links as https://wa.me/[number]
          const phoneNumber = action.value.replace(/[^\d+]/g, ''); // Remove all non-digit characters except +
          href = `https://wa.me/${phoneNumber}`;
        } else if (action.name === 'call' || action.name === 'Mobile' || action.name === 'phone' || action.name === 'Home' || action.name === 'Office' || action.name === 'fax' || action.name === 'signal') {
          // Format phone links as tel:[number]
          href = `tel:${action.value}`;
        }
        
        primaryActionButtons.push(`
          <a href="${href}" class="action-button" style="background-color: ${action.color || '#10b981'};" target="_blank">
            <span class="action-text">${getActionLabel(action.name)}</span>
          </a>
        `);
      }
    });
  }
  
  // Add secondary actions
  if (data.secondaryActions) {
    data.secondaryActions.forEach((action) => {
      if (action.value) {
        let href = action.value;
        if (action.name === 'whatsApp') {
          // Format WhatsApp links as https://wa.me/[number]
          const phoneNumber = action.value.replace(/[^\d+]/g, ''); // Remove all non-digit characters except +
          href = `https://wa.me/${phoneNumber}`;
        } else if (action.name === 'call' || action.name === 'Mobile' || action.name === 'phone' || action.name === 'Home' || action.name === 'Office' || action.name === 'fax' || action.name === 'signal') {
          // Format phone links as tel:[number]
          href = `tel:${action.value}`;
        }
        
        secondaryActionButtons.push(`
          <a href="${href}" class="action-button" style="background-color: ${action.color || '#6b7280'};" target="_blank">
            <span class="action-text">${getActionLabel(action.name)}</span>
          </a>
        `);
      }
    });
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Contact information for ${data.name || 'Contact'}${data.company ? ` at ${data.company}` : ''}">
  <meta name="author" content="${data.name || 'Contact'}">
  <meta property="og:title" content="${data.name || 'Contact Card'}">
  <meta property="og:description" content="Contact information for ${data.name || 'Contact'}${data.company ? ` at ${data.company}` : ''}">
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="Smart Contact Card">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${data.name || 'Contact Card'}">
  <meta name="twitter:description" content="Contact information for ${data.name || 'Contact'}${data.company ? ` at ${data.company}` : ''}">
  <title>${data.name || 'Contact Card'}</title>
  
  <!-- Structured Data for SEO -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "${data.name || 'Contact'}",
    ${data.email ? `"email": "${data.email}",` : ''}
    ${data.phone ? `"telephone": "${data.phone}",` : ''}
    ${data.website ? `"url": "${data.website}",` : ''}
    ${data.company ? `"worksFor": {
      "@type": "Organization",
      "name": "${data.company}"
    },` : ''}
    ${data.title ? `"jobTitle": "${data.title}",` : ''}
    ${images?.photo?.url ? `"image": "${images.photo.url}",` : ''}
    "sameAs": [
      ${(() => {
        const urls: string[] = [];
        if (data.primaryActions) {
          data.primaryActions.forEach(action => {
            if (action.value) urls.push(`"${action.value}"`);
          });
        }
        if (data.secondaryActions) {
          data.secondaryActions.forEach(action => {
            if (action.value) urls.push(`"${action.value}"`);
          });
        }
        if (urls.length === 0 && data.socialMedia) {
          Object.values(data.socialMedia).filter(url => url).forEach(url => urls.push(`"${url}"`));
        }
        return urls.join(',');
      })()}
    ]
  }
  </script>
  
  ${css}
</head>
<body>
  <div class="contact-card">
    <!-- Header Section -->
    <div class="header" ${images?.cover?.url && data.logoOrHeader ? `style="background-image: url('${images.cover.url}'); background-size: cover; background-position: center;"` : ''}>
      ${images?.logo?.url && !data.logoOrHeader ? `
        <div class="logo">
          <img src="${images.logo.url}" alt="Logo">
        </div>
      ` : ''}
    </div>

    <!-- Profile Section -->
    <div class="profile">
      ${images?.photo?.url ? `
        <div class="photo">
          <img src="${images.photo.url}" alt="${data.name || 'Profile Photo'}">
        </div>
      ` : `
        <div class="photo">👤</div>
      `}
      
      <div class="name">${data.name || 'Contact'}</div>
      ${data.title ? `<div class="title">${data.title}</div>` : ''}
      ${data.company ? `<div class="company">${data.company}</div>` : ''}
    </div>

    <!-- Contact Information -->
    <div class="contact-info">
      ${contactItems.join('')}
      
      ${data.customMessage ? `
        <div class="custom-message">
          "${data.customMessage}"
        </div>
      ` : ''}
    </div>

    <!-- Actions Section -->
    ${(primaryActionButtons.length > 0 || secondaryActionButtons.length > 0) ? `
      <div class="actions-section">
        <hr class="actions-separator">
        
        ${primaryActionButtons.length > 0 ? `
          <div class="actions-grid">
            ${primaryActionButtons.join('')}
          </div>
        ` : ''}
        
        ${(primaryActionButtons.length > 0 && secondaryActionButtons.length > 0) ? `
          <hr class="actions-separator">
        ` : ''}
        
        ${secondaryActionButtons.length > 0 ? `
          <div class="actions-grid">
            ${secondaryActionButtons.join('')}
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- Download vCard Button -->
    <button class="download-btn" onclick="downloadVCard()">
      📥 Save Contact
    </button>
  </div>

  <script>
    function downloadVCard() {
      // Create a link to download the vCard
      const link = document.createElement('a');
      link.href = './contact.vcf';
      link.download = '${(data.name || 'contact').replace(/[^a-zA-Z0-9]/g, '_')}.vcf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  </script>
</body>
</html>`;
}
