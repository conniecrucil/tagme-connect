import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler from '../get-cards.mts';
import { createMockRequest, createMockContext, parseResponseJson, setupTestEnv, cleanupTestEnv } from './test-utils';

// Mock the supabase module
vi.mock('../utils/supabase', () => ({
  listCards: vi.fn(),
}));

import * as supabaseModule from '../utils/supabase';

describe('get-cards', () => {
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

  it('should return 400 when limit is less than 1', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards?limit=0',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(400);
    const data = await parseResponseJson(response);
    expect(data.error).toContain('Limit must be between 1 and 100');
  });

  it('should return 400 when limit is greater than 100', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards?limit=101',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(400);
    const data = await parseResponseJson(response);
    expect(data.error).toContain('Limit must be between 1 and 100');
  });

  it('should return 400 when offset is negative', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards?offset=-1',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(400);
    const data = await parseResponseJson(response);
    expect(data.error).toContain('Offset must be non-negative');
  });

  it('should return 400 for invalid status parameter', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards?status=invalid',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(400);
    const data = await parseResponseJson(response);
    expect(data.error).toContain('Status must be success, error, or pending');
  });

  it('should return 400 for invalid date_from format', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards?date_from=invalid-date',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(400);
    const data = await parseResponseJson(response);
    expect(data.error).toContain('Invalid date_from format');
  });

  it('should return 400 for invalid date_to format', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards?date_to=not-a-date',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(400);
    const data = await parseResponseJson(response);
    expect(data.error).toContain('Invalid date_to format');
  });

  it('should accept valid status values', async () => {
    const listCardsMock = vi.spyOn(supabaseModule, 'listCards' as any);
    listCardsMock.mockResolvedValueOnce({
      cards: [],
      total: 0,
      limit: 20,
      offset: 0,
    });

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards?status=success',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);
  });

  it('should call listCards with correct parameters', async () => {
    const listCardsMock = vi.spyOn(supabaseModule, 'listCards' as any);
    listCardsMock.mockResolvedValueOnce({
      cards: [],
      total: 0,
      limit: 50,
      offset: 10,
    });

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards?limit=50&offset=10&customer_email=test@example.com',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);

    expect(listCardsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 50,
        offset: 10,
        customer_email: 'test@example.com',
      })
    );
  });

  it('should return 200 with cards data on success', async () => {
    const listCardsMock = vi.spyOn(supabaseModule, 'listCards' as any);
    const mockCards = {
      cards: [
        { id: '1', customer_email: 'test@example.com', status: 'success' },
        { id: '2', customer_email: 'test@example.com', status: 'success' },
      ],
      total: 2,
      limit: 20,
      offset: 0,
    };
    listCardsMock.mockResolvedValueOnce(mockCards);

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(200);
    const data = await parseResponseJson(response);
    expect(data.cards).toHaveLength(2);
    expect(data.total).toBe(2);
  });

  it('should return 500 on database error', async () => {
    const listCardsMock = vi.spyOn(supabaseModule, 'listCards' as any);
    listCardsMock.mockRejectedValueOnce(new Error('Database connection error'));

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(500);
    const data = await parseResponseJson(response);
    expect(data.error).toBe('Failed to retrieve cards');
  });

  it('should return 503 when missing Supabase environment variables', async () => {
    const listCardsMock = vi.spyOn(supabaseModule, 'listCards' as any);
    listCardsMock.mockRejectedValueOnce(
      new Error('Missing Supabase environment variables')
    );

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(503);
    const data = await parseResponseJson(response);
    expect(data.error).toContain('Database configuration error');
  });

  it('should return 503 on connection refused error', async () => {
    const listCardsMock = vi.spyOn(supabaseModule, 'listCards' as any);
    listCardsMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.status).toBe(503);
    const data = await parseResponseJson(response);
    expect(data.error).toContain('Database connection error');
  });

  it('should include CORS headers in all responses', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards',
    });
    const context = createMockContext();

    const response = await handler(req, context as any);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('should use default limit of 20 when not provided', async () => {
    const listCardsMock = vi.spyOn(supabaseModule, 'listCards' as any);
    listCardsMock.mockResolvedValueOnce({
      cards: [],
      total: 0,
      limit: 20,
      offset: 0,
    });

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards',
    });
    const context = createMockContext();

    await handler(req, context as any);
    expect(listCardsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 20,
      })
    );
  });

  it('should use default offset of 0 when not provided', async () => {
    const listCardsMock = vi.spyOn(supabaseModule, 'listCards' as any);
    listCardsMock.mockResolvedValueOnce({
      cards: [],
      total: 0,
      limit: 20,
      offset: 0,
    });

    const req = createMockRequest({
      method: 'GET',
      url: 'http://localhost/.netlify/functions/get-cards',
    });
    const context = createMockContext();

    await handler(req, context as any);
    expect(listCardsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 0,
      })
    );
  });
});

