import type { Context } from '@netlify/functions';

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
  images?: {
    logo?: { url?: string; blob?: string; ext?: string; mime?: string };
    photo?: { url?: string; blob?: string; ext?: string; mime?: string };
    cover?: { url?: string; blob?: string; ext?: string; mime?: string };
  };
}

export default async (req: Request, context: Context) => {
  try {
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Content-Type': 'application/json' 
        },
      });
    }

    try {
      const url = new URL(req.url);
      const contactUrl = url.searchParams.get('contactUrl') || url.searchParams.get('uuid');

      if (!contactUrl) {
        console.error('Contact URL or UUID parameter is missing');
        return new Response(JSON.stringify({ error: 'Contact URL or UUID parameter is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let htmlUrl: string;
      let uuid: string;

      try {
        // Check if it's a full URL or just a UUID
        if (contactUrl.startsWith('http')) {
          // It's a full URL, extract UUID and use the URL directly
          htmlUrl = contactUrl;
          const urlParts = contactUrl.split('/');
          uuid = urlParts[urlParts.length - 2]; // UUID is the second-to-last part
        } else {
          // It's just a UUID, construct the URL using the bucket name
          const bucketName = process.env.APP_AWS_S3_BUCKET_NAME;
          if (!bucketName) {
            console.error('APP_AWS_S3_BUCKET_NAME environment variable is not set');
            throw new Error('APP_AWS_S3_BUCKET_NAME environment variable is required when providing UUID');
          }
          uuid = contactUrl;
          htmlUrl = `https://${bucketName}.s3.${process.env.APP_AWS_REGION || 'us-east-1'}.amazonaws.com/${uuid}/index.html`;
        }

        // Fetch the HTML content directly from the public URL
        const contactData = await retrieveContactCardDataFromUrl(htmlUrl, uuid);

        if (!contactData) {
          console.warn('Contact card not found:', htmlUrl);
          return new Response(JSON.stringify({ error: 'Contact card not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Construct the vCard URL based on the same pattern as HTML URL
        const baseUrl = htmlUrl.replace('/index.html', '');
        const vcardUrl = `${baseUrl}/contact.vcf`;

        return new Response(JSON.stringify({
          success: true,
          uuid,
          contactData,
          urls: {
            html: htmlUrl,
            vcard: vcardUrl
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (urlError) {
        console.error('Error processing URL:', urlError);
        return new Response(JSON.stringify({ 
          error: 'Invalid URL format',
          details: urlError instanceof Error ? urlError.message : 'Unknown error'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

    } catch (fetchError) {
      console.error('Error retrieving contact data:', fetchError);
      
      // Handle specific error types
      let statusCode = 500;
      let errorMessage = 'Failed to retrieve contact data';
      
      if (fetchError instanceof Error) {
        if (fetchError.message.includes('404') || fetchError.message.includes('Not Found')) {
          statusCode = 404;
          errorMessage = 'Contact card not found: The specified URL does not exist or is not publicly accessible.';
        } else if (fetchError.message.includes('403') || fetchError.message.includes('Forbidden')) {
          statusCode = 403;
          errorMessage = 'Access denied: The contact card is not publicly accessible.';
        } else if (fetchError.message.includes('ENOTFOUND') || fetchError.message.includes('fetch failed')) {
          statusCode = 404;
          errorMessage = 'Unable to reach the contact card URL. Please check the URL and try again.';
        }
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Unexpected error in retrieve-contact-data:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function retrieveContactCardDataFromUrl(htmlUrl: string, uuid: string): Promise<ContactCardData | null> {
  try {
    // Fetch the HTML content directly from the public URL
    const response = await fetch(htmlUrl);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Contact card doesn't exist
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const htmlContent = await response.text();

    if (!htmlContent) {
      return null;
    }

    // Parse contact data from HTML content
    const contactData = parseContactDataFromHTML(htmlContent);

    // Try to get image URLs by checking if images exist at common paths
    const baseUrl = htmlUrl.replace('/index.html', '');
    const imageUrls = await getImageUrlsFromBaseUrl(baseUrl);

    return {
      ...contactData,
      images: imageUrls
    };

  } catch (error) {
    console.error('Error retrieving contact card data from URL:', error);
    
    if (error instanceof Error && error.message.includes('404')) {
      return null; // Contact card doesn't exist
    }
    
    throw error;
  }
}

function parseContactDataFromHTML(htmlContent: string): Partial<ContactCardData> {
  const data: Partial<ContactCardData> = {};

  try {
    // Extract name
    const nameMatch = htmlContent.match(/<div class="name">([^<]+)<\/div>/);
    if (nameMatch) {
      data.name = nameMatch[1].trim();
    }

    // Extract title
    const titleMatch = htmlContent.match(/<div class="title">([^<]+)<\/div>/);
    if (titleMatch) {
      data.title = titleMatch[1].trim();
    }

    // Extract company
    const companyMatch = htmlContent.match(/<div class="company">([^<]+)<\/div>/);
    if (companyMatch) {
      data.company = companyMatch[1].trim();
    }

    // Extract email
    const emailMatch = htmlContent.match(/href="mailto:([^"]+)"/);
    if (emailMatch) {
      data.email = emailMatch[1].trim();
    }

    // Extract phone
    const phoneMatch = htmlContent.match(/href="tel:([^"]+)"/);
    if (phoneMatch) {
      data.phone = phoneMatch[1].trim();
    }

    // Extract website
    const websiteMatch = htmlContent.match(/href="(https?:\/\/[^"]+)" class="contact-item"[^>]*>[\s\S]*?Website/);
    if (websiteMatch) {
      data.website = websiteMatch[1].trim();
    }

    // Extract custom message
    const customMessageMatch = htmlContent.match(/<div class="custom-message">\s*"([^"]+)"\s*<\/div>/);
    if (customMessageMatch) {
      data.customMessage = customMessageMatch[1].trim();
    }

    // Extract social media links
    const socialMedia: Record<string, string> = {};
    const socialLinks = htmlContent.match(/<a href="([^"]+)" class="social-link"[^>]*>[\s\S]*?([A-Z][a-z]+)<\/a>/g);
    
    if (socialLinks) {
      socialLinks.forEach(link => {
        const urlMatch = link.match(/href="([^"]+)"/);
        const platformMatch = link.match(/>([A-Z][a-z]+)<\/a>/);
        
        if (urlMatch && platformMatch) {
          const platform = platformMatch[1].toLowerCase();
          socialMedia[platform] = urlMatch[1].trim();
        }
      });
    }

    if (Object.keys(socialMedia).length > 0) {
      data.socialMedia = socialMedia;
    }

    // Extract structured data for additional fields
    const structuredDataMatch = htmlContent.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (structuredDataMatch) {
      try {
        const structuredData = JSON.parse(structuredDataMatch[1]);
        
        if (structuredData.telephone) {
          data.mobile = structuredData.telephone;
        }
        
        if (structuredData.url) {
          data.website = structuredData.url;
        }
        
        if (structuredData.worksFor?.name) {
          data.company = structuredData.worksFor.name;
        }
        
        if (structuredData.jobTitle) {
          data.title = structuredData.jobTitle;
        }
      } catch (parseError) {
        console.error('Error parsing structured data:', parseError);
      }
    }

  } catch (error) {
    console.error('Error parsing HTML content:', error);
  }

  return data;
}

async function getImageUrlsFromBaseUrl(baseUrl: string): Promise<any> {
  const imageUrls: any = {};
  
  // Common image extensions to try
  const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  
  // Try to find images by attempting to fetch them directly
  const imageTypes = ['logo', 'photo', 'cover'];
  
  for (const imageType of imageTypes) {
    for (const ext of extensions) {
      try {
        const imageUrl = `${baseUrl}/${imageType}.${ext}`;
        
        // Try to fetch the image (this will fail if it doesn't exist)
        const response = await fetch(imageUrl, { method: 'HEAD' });
        
        if (response.ok) {
          // If we get here, the image exists
          imageUrls[imageType] = { url: imageUrl };
          break; // Found this image type, move to next
        }
      } catch (error) {
        // Image doesn't exist with this extension, try next
        continue;
      }
    }
  }

  return Object.keys(imageUrls).length > 0 ? imageUrls : undefined;
}
