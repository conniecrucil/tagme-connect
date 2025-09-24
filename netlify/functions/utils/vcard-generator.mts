/**
 * vCard generation utility functions
 * Shared between validation and email attachment functionality
 */

export interface VCardConfig {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
  socialMedia?: Record<string, string>;
  customMessage?: string;
  photo?: string; // Data URL or base64 encoded image
  imageUrls?: Record<string, string>;
}

/**
 * Generates a vCard (.vcf) file content from configuration data
 */
export function generateVCard(config: VCardConfig): string {
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
  
  // Photo/Avatar
  if (config.photo) {
    // If photo is a data URI, convert to proper vCard 3.0 format
    if (config.photo.startsWith('data:')) {
      // Extract MIME type and base64 data
      const mimeMatch = config.photo.match(/data:([^;]+);base64,(.+)/);
      if (mimeMatch) {
        const mimeType = mimeMatch[1];
        const base64Data = mimeMatch[2];
        
        // Determine the image type for vCard
        let imageType = 'JPEG'; // Default to JPEG
        if (mimeType.includes('png')) {
          imageType = 'PNG';
        } else if (mimeType.includes('gif')) {
          imageType = 'GIF';
        }
        
        // Format for vCard 3.0: PHOTO;TYPE=JPEG;ENCODING=BASE64:base64data
        lines.push(`PHOTO;TYPE=${imageType};ENCODING=BASE64:${base64Data}`);
      } else {
        // Fallback: treat as base64 data
        lines.push(`PHOTO;TYPE=JPEG;ENCODING=BASE64:${config.photo}`);
      }
    } else if (config.imageUrls?.photo) {
      // If we have an uploaded photo URL, use that
      lines.push(`PHOTO:${config.imageUrls.photo}`);
    } else {
      // Assume it's base64 data without data URL prefix
      lines.push(`PHOTO;TYPE=JPEG;ENCODING=BASE64:${config.photo}`);
    }
  } else if (config.imageUrls?.photo) {
    // Fallback to imageUrls if no direct photo field
    lines.push(`PHOTO:${config.imageUrls.photo}`);
  }
  
  // Custom message as note
  if (config.customMessage) {
    lines.push(`NOTE:${config.customMessage}`);
  }
  
  // vCard footer
  lines.push('END:VCARD');
  
  return lines.join('\n');
}

/**
 * Validates that the generated vCard content meets basic vCard standards
 */
export function isValidVCard(vcardContent: string): boolean {
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

