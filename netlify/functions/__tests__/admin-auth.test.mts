import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from '../admin-auth.mts';
import { createMockRequest, createMockContext, parseResponseJson, setupTestEnv, cleanupTestEnv } from './test-utils';

describe('admin-auth', () => {
  beforeEach(() => {
    setupTestEnv();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnv();
    vi.clearAllMocks();
  });

  it('should return 405 for non-GET requests', async () => {
    const req = createMockRequest({ method: 'POST' });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(405);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Method not allowed');
  });

  it('should return 401 when Authorization header is missing', async () => {
    const req = createMockRequest({ method: 'GET' });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(401);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Authentication required');
  });

  it('should return 401 when Authorization header is not Basic auth', async () => {
    const req = createMockRequest({
      method: 'GET',
      headers: { Authorization: 'Bearer token123' },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(401);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Authentication required');
  });

  it('should return 401 for invalid base64 Authorization header', async () => {
    const req = createMockRequest({
      method: 'GET',
      headers: { Authorization: 'Basic !!!' },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(401);
    const data = await parseResponseJson(response);
    expect(data.error).toContain('Invalid');
  });

  it('should return 401 for invalid credentials', async () => {
    const credentials = Buffer.from('admin:wrongpassword').toString('base64');
    const req = createMockRequest({
      method: 'GET',
      headers: { Authorization: `Basic ${credentials}` },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(401);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Invalid credentials');
  });

  it('should return 200 for valid credentials', async () => {
    const credentials = Buffer.from('admin:password123').toString('base64');
    const req = createMockRequest({
      method: 'GET',
      headers: { Authorization: `Basic ${credentials}` },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);
    const data = await parseResponseJson(response);
    expect(data.authenticated).toBe(true);
    expect(data.message).toBe('Authentication successful');
  });

  it('should return 500 when admin credentials are not configured', async () => {
    delete process.env.ADMIN_USER;
    delete process.env.ADMIN_PASS;

    const credentials = Buffer.from('admin:password123').toString('base64');
    const req = createMockRequest({
      method: 'GET',
      headers: { Authorization: `Basic ${credentials}` },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(500);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Admin credentials not configured');
  });

  it('should accept case-insensitive Authorization header', async () => {
    const credentials = Buffer.from('admin:password123').toString('base64');
    const req = createMockRequest({
      method: 'GET',
      headers: { authorization: `Basic ${credentials}` },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);
    const data = await parseResponseJson(response);
    expect(data.authenticated).toBe(true);
  });

  it('should include CORS headers in responses', async () => {
    const credentials = Buffer.from('admin:password123').toString('base64');
    const req = createMockRequest({
      method: 'GET',
      headers: { Authorization: `Basic ${credentials}` },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });
});

