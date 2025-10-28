import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { Context } from '@netlify/functions';
import { generateVCard, type VCardConfig } from './utils/vcard-generator.js';
import { 
  getCardByUuid, 
  updateCard, 
  deleteCardAssets, 
  createCardAsset,
  upsertCardAsset,
  type CardData,
  type Action,
  type GenerationStatus
} from './utils/supabase';

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
  websiteUrl?: string;
  designFileUrl?: string;
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
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json' 
        },
      });
    }

    try {
      const { uuid, contactData } = await req.json();

      console.log('Received update request with UUID:', uuid);

      if (!uuid || !contactData) {
        console.error('Missing required parameters:', { uuid: !!uuid, contactData: !!contactData });
        return new Response(JSON.stringify({ error: 'UUID and contact data are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const bucketName = process.env.VITE_AWS_S3_BUCKET_NAME;
      const bucketUrl = process.env.VITE_AWS_S3_BUCKET_URL;
      
      if (!bucketName) {
        console.error('VITE_AWS_S3_BUCKET_NAME environment variable is not set');
        throw new Error('VITE_AWS_S3_BUCKET_NAME environment variable is required');
      }
      
      if (!bucketUrl) {
        console.error('VITE_AWS_S3_BUCKET_URL environment variable is not set');
        throw new Error('VITE_AWS_S3_BUCKET_URL environment variable is required');
      }

      try {
        // Update the contact card data in S3
        // Note: We rely on the database check below to verify the card exists,
        // since S3 ListObjects requires permissions that might not be available
        const result = await updateContactCardInS3(bucketName, bucketUrl, uuid, contactData);

        // Update database record
        try {
          const card = await getCardByUuid(uuid);
          if (card) {
            // Prepare updated card data
            const updatedCardData: CardData = {
              name: contactData.name,
              title: contactData.title,
              company: contactData.company,
              phone: contactData.phone,
              email: contactData.email,
              website: contactData.website,
              description: contactData.customMessage || contactData.desc,
              street: contactData.street,
              city: contactData.city,
              state: contactData.state,
              postal: contactData.postal,
              country: contactData.country,
              pronouns: contactData.pronouns,
              prefix: contactData.prefix,
              mobile: contactData.mobile,
              fname: contactData.fname,
              lname: contactData.lname,
              biz: contactData.biz,
              desc: contactData.desc,
              photo: contactData.photo
            };

            // Prepare updated actions
            const primaryActions: Action[] = contactData.primaryActions || [];
            const secondaryActions: Action[] = contactData.secondaryActions || [];

            // Determine asset flags
            const hasLogo = !!(contactData.images?.logo?.blob);
            const hasPhoto = !!(contactData.images?.photo?.blob);
            const hasCover = !!(contactData.images?.cover?.blob);

            // Update card record (preserve card_type, but update website_url and design_file_url if provided)
            await updateCard(card.id, {
              website_url: contactData.websiteUrl,
              design_file_url: contactData.designFileUrl,
              card_data: updatedCardData,
              primary_actions: primaryActions,
              secondary_actions: secondaryActions,
              logo_or_header: contactData.logoOrHeader || false,
              has_logo: hasLogo,
              has_photo: hasPhoto,
              has_cover: hasCover,
              generated_at: new Date().toISOString(),
              generation_status: {
                status: 'success',
                timestamp: new Date().toISOString()
              }
            });

            // Update assets using upsert - update existing records instead of deleting and recreating
            // NO LONGER DELETE ALL ASSETS - we now update existing ones
            
            // If images exist, create asset records for them
            if (hasLogo || hasPhoto || hasCover) {

              // Update or create asset records for uploaded images
              if (hasLogo && result.imageUrls?.logo) {
                await upsertCardAsset({
                  card_id: card.id,
                  asset_type: 'logo',
                  s3_key: `${uuid}/logo.${(contactData.images!.logo!.ext || 'jpg').split(';')[0]}`,
                  s3_url: result.imageUrls.logo,
                  mime_type: contactData.images!.logo!.mime || 'image/jpeg'
                });
              }

              if (hasPhoto && result.imageUrls?.photo) {
                await upsertCardAsset({
                  card_id: card.id,
                  asset_type: 'photo',
                  s3_key: `${uuid}/photo.${(contactData.images!.photo!.ext || 'jpg').split(';')[0]}`,
                  s3_url: result.imageUrls.photo,
                  mime_type: contactData.images!.photo!.mime || 'image/jpeg'
                });
              }

              if (hasCover && result.imageUrls?.cover) {
                await upsertCardAsset({
                  card_id: card.id,
                  asset_type: 'cover',
                  s3_key: `${uuid}/cover.${(contactData.images!.cover!.ext || 'jpg').split(';')[0]}`,
                  s3_url: result.imageUrls.cover,
                  mime_type: contactData.images!.cover!.mime || 'image/jpeg'
                });
              }

            }

            // Always update HTML and VCF assets since contact data changed
            await upsertCardAsset({
              card_id: card.id,
              asset_type: 'html',
              s3_key: `${uuid}/index.html`,
              s3_url: result.urls.html,
              mime_type: 'text/html'
            });

            await upsertCardAsset({
              card_id: card.id,
              asset_type: 'vcf',
              s3_key: `${uuid}/contact.vcf`,
              s3_url: result.urls.vcard,
              mime_type: 'text/vcard'
            });

            console.log('Database record updated successfully for card:', card.id);
          } else {
            console.warn('Card not found in database for UUID:', uuid);
            return new Response(JSON.stringify({ 
              error: 'Contact card not found in database',
              details: `Card with UUID ${uuid} does not exist`
            }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } catch (dbError) {
          console.error('Database update failed:', dbError);
          // Continue with S3 success but log database error
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Contact card updated successfully',
          uuid,
          urls: result.urls,
          imageUrls: result.imageUrls
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (s3Error) {
        console.error('S3 operation error:', s3Error);
        return new Response(JSON.stringify({ 
          error: 'Failed to update contact card in S3',
          details: s3Error instanceof Error ? s3Error.message : 'Unknown error'
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
    console.error('Unexpected error in update-contact-data:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function contactCardExists(bucketName: string, uuid: string): Promise<boolean> {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `${uuid}/`,
      MaxKeys: 1,
    });

    const response = await s3Client.send(listCommand);
    return (response.Contents && response.Contents.length > 0) || false;
  } catch (error) {
    console.error('Error checking if contact card exists:', error);
    return false;
  }
}

async function updateContactCardInS3(bucketName: string, bucketUrl: string, uuid: string, contactData: ContactCardData): Promise<{ urls: any; imageUrls: any }> {
  try {
    // Generate vCard content
    const vcardConfig: VCardConfig = {
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone || contactData.mobile,
      company: contactData.company,
      title: contactData.title,
      website: contactData.website,
      socialMedia: contactData.socialMedia,
      customMessage: contactData.customMessage
    };

    const vcardContent = generateVCard(vcardConfig);

    // Construct baseUrl for meta tags (used in OG properties)
    const baseUrl = `${bucketUrl}/${uuid}`;

    // Generate HTML content for the contact card
    const htmlContent = generateContactCardHTML(contactData, baseUrl);

    // Upload updated vCard file
    const vcardKey = `${uuid}/contact.vcf`;
    await uploadToS3(bucketName, vcardKey, vcardContent, 'text/vcard');

    // Upload updated HTML file
    const htmlKey = `${uuid}/index.html`;
    await uploadToS3(bucketName, htmlKey, htmlContent, 'text/html');

    // Handle image updates
    const imageUrls: Record<string, string> = {};
    
    if (contactData.images) {
      const { logo, photo, cover } = contactData.images;
      
      // Upload new images if they have base64 blob data
      if (logo?.blob && logo.blob.startsWith('data:')) {
        const logoKey = `${uuid}/logo.${(logo.ext || 'jpg').split(';')[0]}`;
        const logoBuffer = Buffer.from(logo.blob.split(',')[1], 'base64');
        await uploadToS3(bucketName, logoKey, logoBuffer, logo.mime || 'image/jpeg');
        imageUrls.logo = `${bucketUrl}/${logoKey}`;
      } else if (logo?.blob && (logo.blob.startsWith('http://') || logo.blob.startsWith('https://'))) {
        // Keep existing S3 URL
        imageUrls.logo = logo.blob;
      }
      
      if (photo?.blob && photo.blob.startsWith('data:')) {
        const photoKey = `${uuid}/photo.${(photo.ext || 'jpg').split(';')[0]}`;
        const photoBuffer = Buffer.from(photo.blob.split(',')[1], 'base64');
        await uploadToS3(bucketName, photoKey, photoBuffer, photo.mime || 'image/jpeg');
        imageUrls.photo = `${bucketUrl}/${photoKey}`;
      } else if (photo?.blob && (photo.blob.startsWith('http://') || photo.blob.startsWith('https://'))) {
        // Keep existing S3 URL
        imageUrls.photo = photo.blob;
      }
      
      if (cover?.blob && cover.blob.startsWith('data:')) {
        const coverKey = `${uuid}/cover.${(cover.ext || 'jpg').split(';')[0]}`;
        const coverBuffer = Buffer.from(cover.blob.split(',')[1], 'base64');
        await uploadToS3(bucketName, coverKey, coverBuffer, cover.mime || 'image/jpeg');
        imageUrls.cover = `${bucketUrl}/${coverKey}`;
      } else if (cover?.blob && (cover.blob.startsWith('http://') || cover.blob.startsWith('https://'))) {
        // Keep existing S3 URL
        imageUrls.cover = cover.blob;
      }
    }

    // baseUrl was already constructed earlier for meta tags
    
    return {
      urls: {
        html: `${baseUrl}/index.html`,
        vcard: `${baseUrl}/contact.vcf`
      },
      imageUrls
    };

  } catch (error) {
    console.error('Error updating contact card in S3:', error);
    throw error;
  }
}

async function uploadToS3(bucket: string, key: string, body: string | Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // Cache for 1 year
    ...(contentType === 'text/html' && {
      ContentDisposition: 'inline',
      ContentEncoding: 'utf-8'
    })
  });

  await s3Client.send(command);
}

function generateContactCardHTML(data: ContactCardData, baseUrl?: string): string {
  const { images } = data;
  
  // Helper function to get image URL from either url or blob property
  const getImageUrl = (image: { url?: string; blob?: string } | undefined) => {
    if (!image) return null;
    // Prefer url if available, otherwise use blob (for existing S3 images)
    return image.url || image.blob;
  };
  
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
        background: transparent;
        position: relative;
        background-size: cover;
        background-position: center;
        ${getImageUrl(images?.cover) ? `background-image: url('${getImageUrl(images?.cover)}');` : ''}
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
        border: 2px solid #a2e4d6;
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
        font-size: 24px;
        font-weight: 700;
        color: #000000;
        margin-bottom: 4px;
      }
      
      .title {
        font-size: 16px;
        color: #000000;
        margin-bottom: 4px;
      }
      
      .company {
        font-size: 16px;
        color: #a2e4d6;
        margin-bottom: 8px;
      }
      
      .contact-info {
        padding: 0 12px 12px;
      }
      
      .contact-item {
        display: flex;
        align-items: flex-start;
        padding: 12px 0;
        border-bottom: 1px solid #e5e7eb;
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
        display: none;
      }
      
      .contact-text {
        flex: 1;
        font-size: 16px;
      }
      
      .contact-label {
        font-weight: 500;
        color: #a2e4d6;
        font-size: 12px;
        margin-bottom: 4px;
        text-transform: uppercase;
      }
      
      .contact-value {
        color: #000000;
        margin-top: 2px;
        font-size: 18px;
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
        padding: 24px;
        background: #f8f9fa;
        border-top: 1px solid #f0f0f0;
        font-style: italic;
        color: #666;
        text-align: center;
      }
      
      .download-btn {
        margin: 32px auto 12px;
        padding: 12px;
        background: #6ed097;
        color: #222;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        width: 75%;
        display: block;
        transition: all 0.2s;
      }
      
      .download-btn:hover {
        background: #5dc087;
        color: white;
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
        <div class="contact-icon">📧</div>
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
        <div class="contact-icon">📞</div>
        <div class="contact-text">
          <div class="contact-label">Phone</div>
          <div class="contact-value">${data.phone}</div>
        </div>
      </a>
    `);
  }
  
  if (data.website) {
    contactItems.push(`
      <a href="${data.website}" class="contact-item" target="_blank">
        <div class="contact-icon">🌐</div>
        <div class="contact-text">
          <div class="contact-label">Website</div>
          <div class="contact-value">${data.website.replace(/^https?:\/\//, '')}</div>
        </div>
      </a>
    `);
  }

  // Generate social media links from primary and secondary actions
  const socialLinks: string[] = [];
  
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
        
        socialLinks.push(`
          <a href="${href}" class="social-link" target="_blank">
            <svg class="social-icon" viewBox="0 0 24 24" fill="currentColor">
              ${getSocialIcon(action.name)}
            </svg>
            ${action.name.charAt(0).toUpperCase() + action.name.slice(1)}
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
        
        socialLinks.push(`
          <a href="${href}" class="social-link" target="_blank">
            <svg class="social-icon" viewBox="0 0 24 24" fill="currentColor">
              ${getSocialIcon(action.name)}
            </svg>
            ${action.name.charAt(0).toUpperCase() + action.name.slice(1)}
          </a>
        `);
      }
    });
  }
  
  // Fallback to legacy socialMedia object if no actions are provided
  if (socialLinks.length === 0 && data.socialMedia) {
    Object.entries(data.socialMedia).forEach(([platform, url]) => {
      if (url) {
        socialLinks.push(`
          <a href="${url}" class="social-link" target="_blank">
            <svg class="social-icon" viewBox="0 0 24 24" fill="currentColor">
              ${getSocialIcon(platform)}
            </svg>
            ${platform.charAt(0).toUpperCase() + platform.slice(1)}
          </a>
        `);
      }
    });
  }

  // Prepare description: use customMessage if available, otherwise default to "custom contact card"
  const description = data.customMessage || 'custom contact card';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <meta name="author" content="${data.name || 'Contact'}">
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${data.name || 'Contact Card'}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="Smart Contact Card">
  ${getImageUrl(images?.photo) ? `<meta property="og:image" content="${getImageUrl(images?.photo)}">` : ''}
  ${getImageUrl(images?.photo) ? `<meta property="og:image:alt" content="${data.name || 'Contact'} profile photo">` : ''}
  ${baseUrl ? `<meta property="og:url" content="${baseUrl}/index.html">` : ''}
  ${data.name ? `<meta property="profile:first_name" content="${data.name.split(' ')[0]}">` : ''}
  ${data.name && data.name.split(' ').length > 1 ? `<meta property="profile:last_name" content="${data.name.split(' ').slice(1).join(' ')}">` : ''}
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${data.name || 'Contact Card'}">
  <meta name="twitter:description" content="${description}">
  ${getImageUrl(images?.photo) ? `<meta name="twitter:image" content="${getImageUrl(images?.photo)}">` : ''}
  ${getImageUrl(images?.photo) ? `<meta name="twitter:image:alt" content="${data.name || 'Contact'} profile photo">` : ''}
  
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
    ${getImageUrl(images?.photo) ? `"image": "${getImageUrl(images?.photo)}",` : ''}
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
    <div class="header" ${getImageUrl(images?.cover) && data.logoOrHeader ? `style="background-image: url('${getImageUrl(images?.cover)}'); background-size: cover; background-position: center;"` : ''}>
      ${getImageUrl(images?.logo) && !data.logoOrHeader ? `
        <div class="logo">
          <img src="${getImageUrl(images?.logo)}" alt="Logo">
        </div>
      ` : ''}
    </div>

    <!-- Profile Section -->
    <div class="profile">
      ${getImageUrl(images?.photo) ? `
        <div class="photo">
          <img src="${getImageUrl(images?.photo)}" alt="${data.name || 'Profile Photo'}">
        </div>
      ` : `
        <div class="photo"></div>
      `}
      
      <div class="name">${data.name || 'Contact'}</div>
      ${data.title ? `<div class="title">${data.title}</div>` : ''}
      ${data.company ? `<div class="company">${data.company}</div>` : ''}
    </div>

    <!-- Contact Information -->
    <div class="contact-info">
      ${contactItems.join('')}
    </div>

    <!-- Social Media Links -->
    ${socialLinks.length > 0 ? `
      <div class="social-links">
        <h3>Connect with me</h3>
        <div class="social-grid">
          ${socialLinks.join('')}
        </div>
      </div>
    ` : ''}

    <!-- Custom Message -->
    ${data.customMessage ? `
      <div class="custom-message">
        "${data.customMessage}"
      </div>
    ` : ''}

    <!-- Download vCard Button -->
    <button class="download-btn" onclick="downloadVCard()">
      Save Contact
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
