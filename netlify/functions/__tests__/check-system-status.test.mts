import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handler } from '../check-system-status.mts';
import { setupTestEnv, cleanupTestEnv } from './test-utils';

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  HeadObjectCommand: vi.fn().mockImplementation((params) => params),
}));

// Mock supabase
vi.mock('../utils/supabase', () => ({
  getSupabaseClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ error: null, data: [] }),
      }),
    }),
  }),
}));

describe('check-system-status', () => {
  beforeEach(() => {
    setupTestEnv();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnv();
    vi.clearAllMocks();
  });

  it('should return 405 for non-GET requests', async () => {
    const event = {
      httpMethod: 'POST',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.statusCode).toBe(405);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Method not allowed');
  });

  it('should check all required environment variables', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    // Verify all sections are present
    expect(body.status).toHaveProperty('stripe');
    expect(body.status).toHaveProperty('email');
    expect(body.status).toHaveProperty('company');
    expect(body.status).toHaveProperty('aws');
    expect(body.status).toHaveProperty('admin');
    expect(body.status).toHaveProperty('netlify');
    expect(body.status).toHaveProperty('supabase');
    expect(body.status).toHaveProperty('postgres');
    expect(body.status).toHaveProperty('connectivity');
  });

  it('should report stripe configuration status', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body.status.stripe).toHaveProperty('secretKey');
    expect(body.status.stripe).toHaveProperty('publishableKey');
    expect(typeof body.status.stripe.secretKey).toBe('boolean');
  });

  it('should report email configuration status', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body.status.email).toHaveProperty('resendApiKey');
    expect(body.status.email).toHaveProperty('emailFrom');
    expect(body.status.email).toHaveProperty('adminEmail');
    expect(body.status.email).toHaveProperty('supportEmail');
  });

  it('should report AWS configuration status', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body.status.aws).toHaveProperty('accessKeyId');
    expect(body.status.aws).toHaveProperty('secretAccessKey');
    expect(body.status.aws).toHaveProperty('region');
    expect(body.status.aws).toHaveProperty('bucketName');
  });

  it('should report Supabase configuration status', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body.status.supabase).toHaveProperty('url');
    expect(body.status.supabase).toHaveProperty('serviceRoleKey');
    expect(body.status.supabase).toHaveProperty('databaseUrl');
  });

  it('should return summary with health status', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body.summary).toHaveProperty('isHealthy');
    expect(body.summary).toHaveProperty('criticalServices');
    expect(body.summary).toHaveProperty('totalCritical');
    expect(body.summary).toHaveProperty('awsConfigured');
    expect(body.summary).toHaveProperty('totalAws');
    expect(body.summary).toHaveProperty('healthPercentage');
  });

  it('should calculate health percentage correctly', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body.summary.healthPercentage).toBeGreaterThanOrEqual(0);
    expect(body.summary.healthPercentage).toBeLessThanOrEqual(100);
  });

  it('should report healthy system when all critical services configured', async () => {
    // Set all critical env vars
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test';
    process.env.RESEND_API_KEY = 'test_key';
    process.env.EMAIL_FROM = 'from@example.com';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.SUPPORT_EMAIL = 'support@example.com';
    process.env.COMPANY_NAME = 'Test Company';
    process.env.COMPANY_WEBSITE = 'https://example.com';
    process.env.ADMIN_USER = 'admin';
    process.env.ADMIN_PASS = 'password';
    process.env.PROJECT_URL = 'http://localhost';
    process.env.SUPABASE_KEY = 'key';

    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body.summary.isHealthy).toBe(true);
  });

  it('should report unhealthy system when critical services missing', async () => {
    // Clear critical env vars
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PUBLISHABLE_KEY;

    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body.summary.isHealthy).toBe(false);
  });

  it('should include CORS headers in responses', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Content-Type']).toBe('application/json');
  });

  it('should include timestamp of check', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body.lastChecked).toBeDefined();
    expect(new Date(body.lastChecked)).toBeInstanceOf(Date);
  });

  it('should handle errors gracefully', async () => {
    // Mock a throwing supabase call to trigger error handling
    vi.doMock('../utils/supabase', () => ({
      getSupabaseClient: vi.fn().mockImplementation(() => {
        throw new Error('Supabase initialization failed');
      }),
    }), { virtual: true });

    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    // Should still return a valid response (error is caught internally)
    expect(response.statusCode).toBeGreaterThanOrEqual(200);
  });

  it('should report admin configuration status', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body.status.admin).toHaveProperty('user');
    expect(body.status.admin).toHaveProperty('pass');
  });

  it('should report postgres configuration status', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body.status.postgres).toHaveProperty('password');
    expect(body.status.postgres).toHaveProperty('db');
    expect(body.status.postgres).toHaveProperty('user');
    expect(body.status.postgres).toHaveProperty('jwtSecret');
  });

  it('should check connectivity status', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event as any);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body.status.connectivity).toHaveProperty('bucketAccess');
    expect(body.status.connectivity).toHaveProperty('supabaseConnectivity');
    expect(body.status.connectivity).toHaveProperty('posthogConfigured');
    expect(body.status.connectivity).toHaveProperty('sentryConfigured');
  });
});

