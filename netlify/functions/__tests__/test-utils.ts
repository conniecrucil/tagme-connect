import { vi } from 'vitest';

/**
 * Mock request builder for testing netlify functions
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
} = {}): Request {
  const {
    method = 'GET',
    url = 'http://localhost/.netlify/functions/test',
    body = null,
    headers = {},
  } = options;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  return {
    method,
    url,
    headers: new Headers(defaultHeaders),
    json: async () => body,
    text: async () => typeof body === 'string' ? body : JSON.stringify(body),
    blob: async () => new Blob([JSON.stringify(body)]),
    arrayBuffer: async () => new ArrayBuffer(0),
    clone: () => createMockRequest(options),
  } as unknown as Request;
}

/**
 * Mock context for netlify functions
 */
export function createMockContext() {
  return {
    params: {},
    clientContext: {},
  };
}

/**
 * Parse response JSON
 */
export async function parseResponseJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Mock Supabase client
 */
export function createMockSupabaseClient() {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      update: vi.fn().mockResolvedValue({ data: {}, error: null }),
      delete: vi.fn().mockResolvedValue({ data: {}, error: null }),
      eq: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    }),
  };
}

/**
 * Mock Stripe client
 */
export function createMockStripeClient() {
  return {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: 'cs_test_12345',
          url: 'https://checkout.stripe.com/pay/cs_test_12345',
          payment_status: 'unpaid',
        }),
        retrieve: vi.fn().mockResolvedValue({
          id: 'cs_test_12345',
          payment_status: 'paid',
          payment_intent: 'pi_test_12345',
        }),
      },
    },
    customers: {
      create: vi.fn().mockResolvedValue({
        id: 'cus_test_12345',
        email: 'test@example.com',
      }),
      retrieve: vi.fn().mockResolvedValue({
        id: 'cus_test_12345',
        email: 'test@example.com',
      }),
    },
    invoices: {
      retrieveUpcoming: vi.fn().mockResolvedValue({
        lines: {
          data: [],
        },
      }),
    },
  };
}

/**
 * Mock Auth0 verification
 */
export function createMockAuth0Verifier() {
  return {
    verify: vi.fn().mockResolvedValue({
      sub: 'auth0|user123',
      email: 'user@example.com',
      iat: Math.floor(Date.now() / 1000),
    }),
  };
}

/**
 * Setup environment variables for tests
 */
export function setupTestEnv() {
  process.env.STRIPE_SECRET_KEY = 'sk_test_12345';
  process.env.SUPABASE_URL = 'http://localhost:54321';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_key';
  process.env.ADMIN_USER = 'admin';
  process.env.ADMIN_PASS = 'password123';
  process.env.AUTH0_DOMAIN = 'test.auth0.com';
  process.env.AUTH0_CLIENT_ID = 'test_client_id';
  process.env.AUTH0_CLIENT_SECRET = 'test_client_secret';
  process.env.NETLIFY_SITE_URL = 'http://localhost:8888';
}

/**
 * Clean up environment variables after tests
 */
export function cleanupTestEnv() {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.ADMIN_USER;
  delete process.env.ADMIN_PASS;
  delete process.env.AUTH0_DOMAIN;
  delete process.env.AUTH0_CLIENT_ID;
  delete process.env.AUTH0_CLIENT_SECRET;
  delete process.env.NETLIFY_SITE_URL;
}


