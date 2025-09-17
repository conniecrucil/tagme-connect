import type { Context } from '@netlify/functions';
import { generateVCard, isValidVCard, type VCardConfig } from './utils/vcard-generator.js';

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
    const vcardContent = generateVCard(configuration as VCardConfig);

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

function validateConfiguration(config: any) {
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
      if (url && typeof url === 'string' && !isValidUrl(url)) {
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


function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

