import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from '../get-orders.mts';
import { createMockRequest, createMockContext, parseResponseJson, setupTestEnv, cleanupTestEnv } from './test-utils';

// Mock the supabase module
vi.mock('../utils/supabase', () => ({
  listOrders: vi.fn(),
}));

import * as supabaseModule from '../utils/supabase';

describe('get-orders', () => {
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

  it('should call listOrders with default parameters', async () => {
    const listOrdersMock = vi.spyOn(supabaseModule, 'listOrders' as any);
    listOrdersMock.mockResolvedValueOnce({
      orders: [],
      total: 0,
      limit: 50,
      offset: 0,
    });

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-orders',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);

    expect(listOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 50,
        offset: 0,
      })
    );
  });

  it('should parse pagination parameters correctly', async () => {
    const listOrdersMock = vi.spyOn(supabaseModule, 'listOrders' as any);
    listOrdersMock.mockResolvedValueOnce({
      orders: [],
      total: 100,
      limit: 25,
      offset: 25,
    });

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-orders?page=2&limit=25',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);

    expect(listOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 25,
        offset: 25, // (2 - 1) * 25
      })
    );
  });

  it('should parse status filter', async () => {
    const listOrdersMock = vi.spyOn(supabaseModule, 'listOrders' as any);
    listOrdersMock.mockResolvedValueOnce({
      orders: [],
      total: 0,
      limit: 50,
      offset: 0,
    });

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-orders?status=pending',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);

    expect(listOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
      })
    );
  });

  it('should parse shipped filter', async () => {
    const listOrdersMock = vi.spyOn(supabaseModule, 'listOrders' as any);
    listOrdersMock.mockResolvedValueOnce({
      orders: [],
      total: 0,
      limit: 50,
      offset: 0,
    });

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-orders?shipped=true',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);

    expect(listOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        shipped: true,
      })
    );
  });

  it('should parse fulfilled filter', async () => {
    const listOrdersMock = vi.spyOn(supabaseModule, 'listOrders' as any);
    listOrdersMock.mockResolvedValueOnce({
      orders: [],
      total: 0,
      limit: 50,
      offset: 0,
    });

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-orders?fulfilled=true',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);

    expect(listOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fulfilled: true,
      })
    );
  });

  it('should handle false boolean values correctly', async () => {
    const listOrdersMock = vi.spyOn(supabaseModule, 'listOrders' as any);
    listOrdersMock.mockResolvedValueOnce({
      orders: [],
      total: 0,
      limit: 50,
      offset: 0,
    });

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-orders?shipped=false&fulfilled=false',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);

    expect(listOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        shipped: false,
        fulfilled: false,
      })
    );
  });

  it('should return orders data on success', async () => {
    const listOrdersMock = vi.spyOn(supabaseModule, 'listOrders' as any);
    const mockOrders = {
      orders: [
        { id: 'order_1', status: 'completed', shipped: true },
        { id: 'order_2', status: 'pending', shipped: false },
      ],
      total: 2,
      limit: 50,
      offset: 0,
    };
    listOrdersMock.mockResolvedValueOnce(mockOrders);

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-orders',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);
    const data = await parseResponseJson(response);
    expect(data.orders).toHaveLength(2);
    expect(data.total).toBe(2);
  });

  it('should return 500 on database error', async () => {
    const listOrdersMock = vi.spyOn(supabaseModule, 'listOrders' as any);
    listOrdersMock.mockRejectedValueOnce(new Error('Database connection failed'));

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-orders',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(500);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Failed to fetch orders');
  });

  it('should include CORS headers in all responses', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-orders',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('should support multiple filters simultaneously', async () => {
    const listOrdersMock = vi.spyOn(supabaseModule, 'listOrders' as any);
    listOrdersMock.mockResolvedValueOnce({
      orders: [],
      total: 0,
      limit: 50,
      offset: 0,
    });

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-orders?status=completed&shipped=true&fulfilled=true&page=2&limit=25',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);

    expect(listOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        shipped: true,
        fulfilled: true,
        limit: 25,
        offset: 25,
      })
    );
  });

  it('should calculate offset based on page and limit', async () => {
    const listOrdersMock = vi.spyOn(supabaseModule, 'listOrders' as any);
    listOrdersMock.mockResolvedValueOnce({
      orders: [],
      total: 100,
      limit: 10,
      offset: 50,
    });

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-orders?page=6&limit=10',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);

    expect(listOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 50, // (6 - 1) * 10
        limit: 10,
      })
    );
  });
});


