import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
      },
    });
  }

  try {

    console.log('validate-card');

    const { configuration } = await req.json();



    if (!configuration) {
      return new Response(JSON.stringify({ error: 'Configuration is required' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    // Validate required fields
    const validationErrors = validateConfiguration(configuration);

    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({
        error: 'Validation failed',
        details: validationErrors
      }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    // Generate vCard to test validity
    const vcardContent = generateVCard(configuration);

    // Basic vCard structure validation
    if (!isValidVCard(vcardContent)) {
      return new Response(JSON.stringify({
        error: 'Invalid vCard generated',
        details: ['Generated vCard does not meet standard requirements']
      }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Configuration validated successfully',
      vcardPreview: vcardContent.substring(0, 200) + '...' // Preview only, not full vCard
    }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error validating card configuration:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
};

function validateConfiguration(config) {
  const errors = [];

  // Optional fields validation - only validate if values are provided
  if (config.name && config.name.trim().length === 0) {
    errors.push('Name cannot be empty if provided');
  }

  if (config.email) {
    if (!isValidEmail(config.email)) {
      errors.push('Email address must be valid if provided');
    }
  }

  if (config.phone && config.phone.trim().length === 0) {
    errors.push('Phone number cannot be empty if provided');
  }

  // Optional but recommended fields
  if (config.company && config.company.trim().length > 100) {
    errors.push('Company name is too long (max 100 characters)');
  }

  if (config.title && config.title.trim().length > 100) {
    errors.push('Job title is too long (max 100 characters)');
  }

  if (config.website && !isValidUrl(config.website)) {
    errors.push('Website must be a valid URL');
  }

  // Social media validation
  if (config.socialMedia) {
    Object.entries(config.socialMedia).forEach(([platform, url]) => {
      if (url && !isValidUrl(url)) {
        errors.push(`${platform} URL is invalid`);
      }
    });
  }

  // Custom message length validation
  if (config.customMessage && config.customMessage.length > 500) {
    errors.push('Custom message is too long (max 500 characters)');
  }

  return errors;
}

function generateVCard(config) {
  const lines = [];

  // vCard header
  lines.push('BEGIN:VCARD');
  lines.push('VERSION:3.0');

  // Name
  if (config.name && config.name.trim()) {
    const nameParts = config.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    lines.push(`FN:${config.name}`);
    lines.push(`N:${lastName};${firstName};;;`);
  } else {
    // Use a default name if none provided
    lines.push(`FN:Contact Card`);
    lines.push(`N:Card;Contact;;;`);
  }
  
  // Organization
  if (config.company) {
    lines.push(`ORG:${config.company}`);
  }
  
  if (config.title) {
    lines.push(`TITLE:${config.title}`);
  }
  
  // Contact information
  if (config.email) {
    lines.push(`EMAIL:${config.email}`);
  }
  
  if (config.phone) {
    lines.push(`TEL:${config.phone}`);
  }
  
  // Website
  if (config.website) {
    lines.push(`URL:${config.website}`);
  }
  
  // Social media links
  if (config.socialMedia) {
    Object.entries(config.socialMedia).forEach(([platform, url]) => {
      if (url) {
        lines.push(`URL;TYPE=${platform.toUpperCase()}:${url}`);
      }
    });
  }
  
  // Custom message as note
  if (config.customMessage) {
    lines.push(`NOTE:${config.customMessage}`);
  }
  
  // vCard footer
  lines.push('END:VCARD');
  
  return lines.join('\n');
}

function isValidVCard(vcardContent) {
  // Basic vCard structure validation
  const lines = vcardContent.split('\n');

  // Must start with BEGIN:VCARD and end with END:VCARD
  if (!lines[0].startsWith('BEGIN:VCARD') || !lines[lines.length - 1].startsWith('END:VCARD')) {
    return false;
  }

  // Must have VERSION
  if (!lines.some(line => line.startsWith('VERSION:'))) {
    return false;
  }

  // Must have at least one contact field (FN, EMAIL, TEL, etc.)
  const hasContactInfo = lines.some(line =>
    line.startsWith('FN:') ||
    line.startsWith('EMAIL:') ||
    line.startsWith('TEL:') ||
    line.startsWith('URL:')
  );

  if (!hasContactInfo) {
    return false;
  }

  return true;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

