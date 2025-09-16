exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { configuration } = JSON.parse(event.body);

    if (!configuration) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Configuration is required' }),
      };
    }

    // Validate required fields
    const validationErrors = validateConfiguration(configuration);
    
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Validation failed',
          details: validationErrors 
        }),
      };
    }

    // Generate vCard to test validity
    const vcardContent = generateVCard(configuration);
    
    // Basic vCard structure validation
    if (!isValidVCard(vcardContent)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Invalid vCard generated',
          details: ['Generated vCard does not meet standard requirements']
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Configuration validated successfully',
        vcardPreview: vcardContent.substring(0, 200) + '...' // Preview only, not full vCard
      }),
    };

  } catch (error) {
    console.error('Error validating card configuration:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

function validateConfiguration(config) {
  const errors = [];

  // Required fields validation
  if (!config.name || config.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!config.email || !isValidEmail(config.email)) {
    errors.push('Valid email address is required');
  }

  if (!config.phone || config.phone.trim().length === 0) {
    errors.push('Phone number is required');
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
  if (config.name) {
    const nameParts = config.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    lines.push(`FN:${config.name}`);
    lines.push(`N:${lastName};${firstName};;;`);
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
  
  // Must have at least FN (formatted name)
  if (!lines.some(line => line.startsWith('FN:'))) {
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
