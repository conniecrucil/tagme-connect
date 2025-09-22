import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import type { Context } from '@netlify/functions';
import { generateVCard, type VCardConfig } from './utils/vcard-generator.js';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.APP_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || '',
  },
});

interface ContactCardData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
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
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { contactData, sessionId } = await req.json();

    if (!contactData || !sessionId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate unique folder ID
    const folderId = uuidv4();
    const bucketName = process.env.APP_AWS_S3_BUCKET_NAME;
    
    if (!bucketName) {
      throw new Error('APP_AWS_S3_BUCKET_NAME environment variable is required');
    }

    // Generate vCard content
    const vcardConfig: VCardConfig = {
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
      company: contactData.company,
      title: contactData.title,
      website: contactData.website,
      socialMedia: contactData.socialMedia,
      customMessage: contactData.customMessage
    };

    const vcardContent = generateVCard(vcardConfig);

    // Generate HTML content for the contact card
    const htmlContent = generateContactCardHTML(contactData);

    // Upload vCard file
    const vcardKey = `${folderId}/contact.vcf`;
    await uploadToS3(bucketName, vcardKey, vcardContent, 'text/vcard');

    // Upload HTML file
    const htmlKey = `${folderId}/index.html`;
    await uploadToS3(bucketName, htmlKey, htmlContent, 'text/html');

    // Upload images if they exist
    const imageUrls: Record<string, string> = {};
    
    if (contactData.images) {
      const { logo, photo, cover } = contactData.images;
      
      if (logo?.blob) {
        const logoKey = `${folderId}/logo.${(logo.ext || 'jpg').split(';')[0]}`;
        const logoBuffer = Buffer.from(logo.blob.split(',')[1], 'base64');
        await uploadToS3(bucketName, logoKey, logoBuffer, logo.mime || 'image/jpeg');
        imageUrls.logo = `${bucketName}.s3.${process.env.APP_AWS_REGION || 'us-east-1'}.amazonaws.com/${logoKey}`;
      }
      
      if (photo?.blob) {
        const photoKey = `${folderId}/photo.${(photo.ext || 'jpg').split(';')[0]}`;
        const photoBuffer = Buffer.from(photo.blob.split(',')[1], 'base64');
        await uploadToS3(bucketName, photoKey, photoBuffer, photo.mime || 'image/jpeg');
        imageUrls.photo = `${bucketName}.s3.${process.env.APP_AWS_REGION || 'us-east-1'}.amazonaws.com/${photoKey}`;
      }
      
      if (cover?.blob) {
        const coverKey = `${folderId}/cover.${(cover.ext || 'jpg').split(';')[0]}`;
        const coverBuffer = Buffer.from(cover.blob.split(',')[1], 'base64');
        await uploadToS3(bucketName, coverKey, coverBuffer, cover.mime || 'image/jpeg');
        imageUrls.cover = `${bucketName}.s3.${process.env.APP_AWS_REGION || 'us-east-1'}.amazonaws.com/${coverKey}`;
      }
    }

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

  } catch (error) {
    console.error('Error uploading to S3:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to upload to S3',
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
      
      .contact-icon {
        width: 16px;
        height: 16px;
        margin-right: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
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
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        text-decoration: none;
        transition: all 0.2s;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      
      .action-button:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
      
      .action-icon {
        width: 20px;
        height: 20px;
        color: white;
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

  // Generate social media icons (simplified SVG icons)
  const getSocialIcon = (platform: string): string => {
    const icons: Record<string, string> = {
      linkedin: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
      twitter: '<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>',
      facebook: '<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>',
      instagram: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
      youtube: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
      website: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
    };
    
    return icons[platform.toLowerCase()] || icons.website;
  };

  // Generate contact items
  const contactItems = [];
  
  if (data.email) {
    contactItems.push(`
      <a href="mailto:${data.email}" class="contact-item">
        <div class="contact-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-gray-600">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </div>
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
        <div class="contact-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-gray-600">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
        </div>
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
        <div class="contact-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-gray-600">
            <path d="M17 1.01L7 1c-1.1 0-1.99.9-1.99 2v18c0 1.1.89 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
          </svg>
        </div>
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
        <div class="contact-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-gray-600">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
          </svg>
        </div>
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
            <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
              ${getSocialIcon(action.name)}
            </svg>
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
            <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
              ${getSocialIcon(action.name)}
            </svg>
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
