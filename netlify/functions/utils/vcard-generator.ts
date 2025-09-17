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

/**
 * Creates a vCard attachment object for email sending
 */
export function createVCardAttachment(
  config: VCardConfig, 
  sessionId: string, 
  cardNumber: number
): { filename: string; content: string } {
  const vcardContent = generateVCard(config);
  const filename = `vcard-${sessionId}-${cardNumber}.vcf`;
  
  return {
    filename,
    content: vcardContent
  };
}
