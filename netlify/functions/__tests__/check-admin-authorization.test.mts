import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from '../check-admin-authorization.mts';
import { createMockRequest, createMockContext, parseResponseJson, setupTestEnv, cleanupTestEnv } from './test-utils';

// Mock the supabase module
vi.mock('../utils/supabase', () => ({
  getSupabaseClient: vi.fn(),
}));

import * as supabaseModule from '../utils/supabase';

describe('check-admin-authorization', () => {
  beforeEach(() => {
    setupTestEnv();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnv();
    vi.clearAllMocks();
  });

  it('should handle OPTIONS request for CORS preflight', async () => {
    const req = createMockRequest({ method: 'OPTIONS' });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('should return 405 for non-GET requests (excluding OPTIONS)', async () => {
    const req = createMockRequest({ method: 'POST' });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(405);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Method not allowed');
  });

  it('should return 400 when email parameter is missing', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/check-admin-authorization',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(400);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Email parameter is required');
    expect(data.authorized).toBe(false);
  });

  it('should return unauthorized (false) for non-admin user', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'No rows found' },
            }),
          }),
        }),
      }),
    };

    vi.spyOn(supabaseModule, 'getSupabaseClient' as any).mockReturnValue(mockSupabase);

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/check-admin-authorization?email=user@example.com',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);
    const data = await parseResponseJson(response);
    expect(data.authorized).toBe(false);
    expect(data.email).toBe('user@example.com');
  });

  it('should return authorized (true) for admin user', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'admin-123', email: 'admin@example.com' },
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.spyOn(supabaseModule, 'getSupabaseClient' as any).mockReturnValue(mockSupabase);

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/check-admin-authorization?email=admin@example.com',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);
    const data = await parseResponseJson(response);
    expect(data.authorized).toBe(true);
    expect(data.email).toBe('admin@example.com');
  });

  it('should include CORS headers in all responses', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/check-admin-authorization',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should handle database errors gracefully', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Database connection failed')),
          }),
        }),
      }),
    };

    vi.spyOn(supabaseModule, 'getSupabaseClient' as any).mockReturnValue(mockSupabase);

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/check-admin-authorization?email=admin@example.com',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(500);
    const data = await parseResponseJson(response);
    expect(data.authorized).toBe(false);
    expect(data.error).toContain('Database connection failed');
  });

  it('should validate email query parameter correctly', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      }),
    };

    const getSupabaseSpy = vi.spyOn(supabaseModule, 'getSupabaseClient' as any);
    getSupabaseSpy.mockReturnValue(mockSupabase);

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/check-admin-authorization?email=test%40example.com',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);

    // Verify the supabase query was made with the correct email
    expect(mockSupabase.from).toHaveBeenCalledWith('admin_users_auth0');
  });

  it('should return 200 status even for unauthorized users', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'User not found' },
            }),
          }),
        }),
      }),
    };

    vi.spyOn(supabaseModule, 'getSupabaseClient' as any).mockReturnValue(mockSupabase);

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/check-admin-authorization?email=user@example.com',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);
  });
});

