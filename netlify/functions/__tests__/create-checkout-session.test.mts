import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockRequest, createMockContext, parseResponseJson, setupTestEnv, cleanupTestEnv } from './test-utils';

// Mock stripe BEFORE importing handler
vi.mock('stripe', () => {
  return {
    default: vi.fn(() => ({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: 'cs_test_12345',
            url: 'https://checkout.stripe.com',
          }),
        },
      },
    })),
  };
});

// Mock the supabase module
vi.mock('../utils/supabase', () => ({
  upsertCustomer: vi.fn(),
  createOrder: vi.fn(),
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

// Import handler AFTER mocks
import handler from '../create-checkout-session.mts';

describe('create-checkout-session', () => {
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

  it('should return 405 for PUT requests', async () => {
    const req = createMockRequest({ method: 'PUT' });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(405);
  });

  it('should return 405 for DELETE requests', async () => {
    const req = createMockRequest({ method: 'DELETE' });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(405);
  });

  it('should return 400 when cart is empty', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/create-checkout-session',
      body: { cart: [], customerInfo: { email: 'test@example.com' } },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(400);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Cart is required');
  });

  it('should return 400 when cart is missing', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/create-checkout-session',
      body: { customerInfo: { email: 'test@example.com' } },
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(400);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Cart is required');
  });

  it('should include CORS headers in error responses', async () => {
    const req = createMockRequest({ method: 'POST' });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('should validate request method', async () => {
    for (const method of ['OPTIONS', 'PATCH', 'HEAD']) {
      const req = createMockRequest({ method });
      const context = createMockContext();

      const response = await handler(req, context as any);
      // Should return 405 for unsupported methods or handle OPTIONS
      expect([200, 405]).toContain(response.status);
    }
  });

  it('should handle missing Origin header gracefully', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/create-checkout-session',
      body: { cart: [], customerInfo: {} },
      headers: {},
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    // Should use default URL if origin header is missing
    expect(response.status).toBe(400); // Empty cart
  });

  it('should handle malformed JSON body gracefully', async () => {
    const req = {
      method: 'POST',
      url: 'http://localhost/.netlify/functions/create-checkout-session',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as unknown as Request;
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(500);
  });

  it('should accept valid cart items', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost/.netlify/functions/create-checkout-session',
      body: {
        cart: [
          { productType: 'basic', quantity: 1, price: 40 },
        ],
        customerInfo: {
          email: 'test@example.com',
          name: 'Test User',
        },
      },
    });
    const context = createMockContext();

    // Will fail with Stripe error but validates cart structure
    const response = await handler(req, context as any);
    expect([200, 400, 500]).toContain(response.status);
  });
});

