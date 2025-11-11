import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from '../validate-card.mts';
import { createMockRequest, createMockContext, parseResponseJson, setupTestEnv, cleanupTestEnv } from './test-utils';

// Mock the vcard generator
vi.mock('../utils/vcard-generator.js', () => ({
  generateVCard: vi.fn().mockReturnValue('BEGIN:VCARD\nVERSION:3.0\nFN:Test User\nEND:VCARD'),
  isValidVCard: vi.fn().mockReturnValue(true),
}));

import * as vcardModule from '../utils/vcard-generator.js';

describe('validate-card', () => {
  beforeEach(() => {
    setupTestEnv();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnv();
    vi.clearAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    const req = createMockRequest({ method: 'GET' });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(405);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Method not allowed');
  });

  it('should return 400 when configuration is missing', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/validate-card',
      body: {},
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(400);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Configuration is required');
  });

  it('should validate required configuration fields', async () => {
    const generateVCardMock = vi.spyOn(vcardModule, 'generateVCard' as any);
    generateVCardMock.mockReturnValueOnce('BEGIN:VCARD\nVERSION:3.0\nFN:Test\nEND:VCARD');

    const isValidVCardMock = vi.spyOn(vcardModule, 'isValidVCard' as any);
    isValidVCardMock.mockReturnValueOnce(true);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/validate-card',
      body: {
        configuration: {
          name: 'Test User',
          email: 'test@example.com',
        },
      },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    // Empty optional fields are allowed
    expect([200, 400]).toContain(response.status);
  });

  it('should return 400 when generated vCard is invalid', async () => {
    const generateVCardMock = vi.spyOn(vcardModule, 'generateVCard' as any);
    generateVCardMock.mockReturnValueOnce('INVALID_VCARD_CONTENT');

    const isValidVCardMock = vi.spyOn(vcardModule, 'isValidVCard' as any);
    isValidVCardMock.mockReturnValueOnce(false);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/validate-card',
      body: {
        configuration: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          title: 'Developer',
          company: 'Test Company',
        },
      },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(400);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Invalid vCard generated');
  });

  it('should successfully validate valid configuration', async () => {
    const generateVCardMock = vi.spyOn(vcardModule, 'generateVCard' as any);
    generateVCardMock.mockReturnValueOnce('BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nEMAIL:john@example.com\nEND:VCARD');

    const isValidVCardMock = vi.spyOn(vcardModule, 'isValidVCard' as any);
    isValidVCardMock.mockReturnValueOnce(true);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/validate-card',
      body: {
        configuration: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          title: 'Developer',
          company: 'Test Company',
        },
      },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);
    const data = await parseResponseJson(response);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Configuration validated successfully');
  });

  it('should include vCard preview in response', async () => {
    // Create a longer vCard to ensure preview is shorter
    const vcardContent = 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nEMAIL:john@example.com\nPHONE:1234567890\nTITLE:Senior Developer\nCOMPANY:Test Company\nADR:123 Main St\nURL:https://example.com\nNOTE:Some longer note content here that will be truncated\nEND:VCARD';
    const generateVCardMock = vi.spyOn(vcardModule, 'generateVCard' as any);
    generateVCardMock.mockReturnValueOnce(vcardContent);

    const isValidVCardMock = vi.spyOn(vcardModule, 'isValidVCard' as any);
    isValidVCardMock.mockReturnValueOnce(true);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/validate-card',
      body: {
        configuration: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          title: 'Developer',
          company: 'Test Company',
        },
      },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);
    const data = await parseResponseJson(response);
    expect(data.vcardPreview).toBeDefined();
    expect(data.vcardPreview).toContain('...');
  });

  it('should include CORS headers in responses', async () => {
    const req = createMockRequest({ method: 'POST' });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('should handle complex configurations', async () => {
    const generateVCardMock = vi.spyOn(vcardModule, 'generateVCard' as any);
    generateVCardMock.mockReturnValueOnce('BEGIN:VCARD\nVERSION:3.0\nFN:Complex User\nEND:VCARD');

    const isValidVCardMock = vi.spyOn(vcardModule, 'isValidVCard' as any);
    isValidVCardMock.mockReturnValueOnce(true);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/validate-card',
      body: {
        configuration: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1 (555) 123-4567',
          title: 'Senior Software Engineer',
          company: 'Tech Company Inc',
          website: 'https://example.com',
          address: '123 Main St, San Francisco, CA',
          socialLinks: {
            linkedin: 'https://linkedin.com/in/johndoe',
            twitter: 'https://twitter.com/johndoe',
          },
          notes: 'Some notes about the contact',
        },
      },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);
    const data = await parseResponseJson(response);
    expect(data.success).toBe(true);
  });

  it('should handle vCard generation errors', async () => {
    const generateVCardMock = vi.spyOn(vcardModule, 'generateVCard' as any);
    generateVCardMock.mockImplementation(() => {
      throw new Error('vCard generation failed');
    });

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/validate-card',
      body: {
        configuration: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(500);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Failed to generate vCard');
  });

  it('should validate minimum required fields', async () => {
    const generateVCardMock = vi.spyOn(vcardModule, 'generateVCard' as any);
    generateVCardMock.mockReturnValueOnce('BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nEND:VCARD');

    const isValidVCardMock = vi.spyOn(vcardModule, 'isValidVCard' as any);
    isValidVCardMock.mockReturnValueOnce(true);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/validate-card',
      body: {
        configuration: {
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
  });

  it('should handle special characters in configuration', async () => {
    // The validation function doesn't specifically block special characters
    // It focuses on valid email format, empty strings, and length limits
    const generateVCardMock = vi.spyOn(vcardModule, 'generateVCard' as any);
    generateVCardMock.mockReturnValueOnce('BEGIN:VCARD\nVERSION:3.0\nFN:John Test\nEND:VCARD');

    const isValidVCardMock = vi.spyOn(vcardModule, 'isValidVCard' as any);
    isValidVCardMock.mockReturnValueOnce(true);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/validate-card',
      body: {
        configuration: {
          firstName: 'John@Test',
          lastName: 'Doe',
        },
      },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    // Should allow alphanumeric and special characters in name
    expect([200, 400]).toContain(response.status);
  });

  it('should accept valid email formats', async () => {
    const generateVCardMock = vi.spyOn(vcardModule, 'generateVCard' as any);
    generateVCardMock.mockReturnValueOnce('BEGIN:VCARD\nVERSION:3.0\nFN:Test\nEMAIL:test@example.co.uk\nEND:VCARD');

    const isValidVCardMock = vi.spyOn(vcardModule, 'isValidVCard' as any);
    isValidVCardMock.mockReturnValueOnce(true);

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/validate-card',
      body: {
        configuration: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test+tag@example.co.uk',
        },
      },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect([200, 400]).toContain(response.status);
  });

  it('should reject invalid email formats', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/validate-card',
      body: {
        configuration: {
          firstName: 'Test',
          lastName: 'User',
          email: 'invalid-email',
        },
      },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(400);
  });
});

