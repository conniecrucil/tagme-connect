import { expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';

type MailpitMessage = Record<string, any>;

export interface TestIdentity {
  suffix: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  websiteUrl: string;
}

export function createTestIdentity(prefix: 'basic' | 'core'): TestIdentity {
  const suffix = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const firstName = prefix === 'basic' ? 'Basic' : 'Core';
  const lastName = suffix.slice(-6);
  return {
    suffix,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: `e2e+${suffix}@mailinator.com`,
    phone: '555-123-4567',
    websiteUrl: `https://example.com/${suffix}`,
  };
}

export function getSessionIdFromPageUrl(url: string): string {
  const sessionId = new URL(url).searchParams.get('session_id');
  if (!sessionId) {
    throw new Error(`No session_id found in URL: ${url}`);
  }
  return sessionId;
}

export async function uploadGeneratedPngViaButton(
  page: Page,
  buttonLabel: string,
  fileName: string,
  width: number,
  height: number,
  color: string,
) {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: buttonLabel }).click();
  const chooser = await chooserPromise;
  const base64 = await page.evaluate(
    ({ width, height, color }) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.max(16, Math.floor(Math.min(width, height) / 8))}px sans-serif`;
      ctx.fillText(`${width}x${height}`, 12, Math.max(28, Math.floor(height / 2)));
      return canvas.toDataURL('image/png').split(',')[1];
    },
    { width, height, color },
  );
  await chooser.setFiles({
    name: fileName,
    mimeType: 'image/png',
    buffer: Buffer.from(base64, 'base64'),
  });
}

async function poll<T>(
  fn: () => Promise<T | null>,
  timeoutMs = 90_000,
  intervalMs = 2_000,
): Promise<T> {
  const start = Date.now();
  let lastError: unknown;
  while (Date.now() - start < timeoutMs) {
    try {
      const result = await fn();
      if (result != null) return result;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(
    `Timed out after ${timeoutMs}ms${lastError ? `; last error: ${String(lastError)}` : ''}`,
  );
}

function mailpitBaseUrl(): string {
  return process.env.MAILPIT_API_URL || process.env.SUPABASE_MAILPIT_URL || 'http://127.0.0.1:54324';
}

async function getMailpitMessages(): Promise<MailpitMessage[]> {
  const response = await fetch(`${mailpitBaseUrl()}/api/v1/messages`);
  if (!response.ok) {
    throw new Error(`Mailpit messages request failed: ${response.status}`);
  }
  const data = (await response.json()) as { messages?: MailpitMessage[] };
  return data.messages ?? [];
}

function extractAddresses(value: any): string[] {
  if (!value) return [];
  if (typeof value === 'string') return [value.toLowerCase()];
  if (Array.isArray(value)) return value.flatMap((entry) => extractAddresses(entry));
  if (typeof value === 'object') {
    const candidates = [
      value.Address,
      value.address,
      value.Email,
      value.email,
      value.Mailbox && value.Domain ? `${value.Mailbox}@${value.Domain}` : undefined,
      value.mailbox && value.domain ? `${value.mailbox}@${value.domain}` : undefined,
    ].filter(Boolean);
    if (candidates.length) return candidates.map((v) => String(v).toLowerCase());
    return Object.values(value).flatMap((entry) => extractAddresses(entry));
  }
  return [];
}

function messageSubject(message: MailpitMessage): string {
  return String(message.Subject ?? message.subject ?? message?.Content?.Headers?.Subject?.[0] ?? '');
}

function messageId(message: MailpitMessage): string | null {
  return (
    (message.ID as string | undefined) ??
    (message.Id as string | undefined) ??
    (message.id as string | undefined) ??
    null
  );
}

async function getMailpitMessageDetailRaw(id: string): Promise<string> {
  const response = await fetch(`${mailpitBaseUrl()}/api/v1/message/${id}`);
  if (!response.ok) {
    throw new Error(`Mailpit message detail request failed (${id}): ${response.status}`);
  }
  const raw = await response.text();
  return raw.replace(/\\\//g, '/');
}

export async function assertMailpitPurchaseEmails(options: {
  sessionId: string;
  customerEmail: string;
  websiteUrl: string;
  productLabel: 'TAG Basic Card' | 'TAG Core Card';
  customerName?: string;
  requireWebsiteInCustomerBody?: boolean;
  requireWebsiteInAdminBody?: boolean;
  timeoutMs?: number;
}) {
  const adminEmail = (process.env.ADMIN_EMAIL || 'connectme-test@mailinator.com').trim().toLowerCase();
  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL must be set to validate Mailpit admin recipient');
  }

  const customerEmail = options.customerEmail.toLowerCase();
  const timeoutMs = options.timeoutMs ?? 120_000;

  const result = await poll(
    async () => {
      const messages = await getMailpitMessages();
      const candidates = messages.slice(0, 25);

      let customerMatch: { message: MailpitMessage; body: string } | null = null;
      let adminMatch: { message: MailpitMessage; body: string } | null = null;

      for (const message of candidates) {
        const recipients = extractAddresses(message.To ?? message.to);
        const id = messageId(message);
        if (!id) continue;

        const isCustomerRecipient = recipients.includes(customerEmail);
        const isAdminRecipient = recipients.includes(adminEmail);
        if (!isCustomerRecipient && !isAdminRecipient) continue;

        const body = await getMailpitMessageDetailRaw(id);
        if (!body.includes(options.sessionId)) continue;

        if (isCustomerRecipient && !customerMatch) {
          customerMatch = { message, body };
        }
        if (isAdminRecipient && !adminMatch) {
          adminMatch = { message, body };
        }
      }

      if (!customerMatch || !adminMatch) return null;
      return { customerMatch, adminMatch };
    },
    timeoutMs,
    2_000,
  );

  const customerSubject = messageSubject(result.customerMatch.message);
  const adminSubject = messageSubject(result.adminMatch.message);

  expect(customerSubject).toContain('Order Confirmation');
  expect(customerSubject).toContain(options.sessionId);
  expect(adminSubject).toContain(`New Order - ${options.productLabel}`);

  for (const body of [result.customerMatch.body, result.adminMatch.body]) {
    expect(body).toContain(options.sessionId);
    expect(body).toContain(options.customerEmail);
  }
  if (options.requireWebsiteInCustomerBody ?? true) {
    expect(result.customerMatch.body).toContain(options.websiteUrl);
  }
  if (options.requireWebsiteInAdminBody ?? true) {
    expect(result.adminMatch.body).toContain(options.websiteUrl);
  }

  if (options.customerName) {
    expect(result.customerMatch.body).toContain(options.customerName);
  }

  return {
    customerBody: result.customerMatch.body,
    adminBody: result.adminMatch.body,
    customerSubject,
    adminSubject,
  };
}

type CoreArtifacts = {
  customer: any;
  card: any;
  assets: Array<{ asset_type: string; s3_key: string; s3_url: string }>;
};

let _supabase: ReturnType<typeof createClient> | null = null;
function supabaseAdminClient() {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL || process.env.PROJECT_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY) are required');
  }
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

export async function waitForCoreCardArtifactsByEmail(
  email: string,
  createdAfterMs: number,
  expectedImageAssetTypes: Array<'cover' | 'logo' | 'photo'>,
) {
  const result = await poll<CoreArtifacts>(
    async () => {
      const supabase = supabaseAdminClient();

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (customerError) throw customerError;
      if (!customer) return null;

      const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('card_type', 'core')
        .order('created_at', { ascending: false })
        .limit(5);
      if (cardsError) throw cardsError;

      const card = (cards ?? []).find((row) => {
        const ts = row?.created_at ? new Date(row.created_at).getTime() : 0;
        return Number.isFinite(ts) && ts >= createdAfterMs;
      });
      if (!card) return null;

      const { data: assets, error: assetsError } = await supabase
        .from('card_assets')
        .select('asset_type,s3_key,s3_url')
        .eq('card_id', card.id);
      if (assetsError) throw assetsError;
      if (!assets || assets.length === 0) return null;

      const types = new Set(assets.map((a) => a.asset_type));
      for (const requiredType of ['html', 'vcf', ...expectedImageAssetTypes]) {
        if (!types.has(requiredType)) return null;
      }

      return { customer, card, assets };
    },
    120_000,
    2_000,
  );

  return result;
}

let _s3: S3Client | null = null;
function s3Client() {
  if (_s3) return _s3;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('S3_ENDPOINT, S3_ACCESS_KEY, and S3_SECRET_KEY are required');
  }
  _s3 = new S3Client({
    endpoint,
    region: process.env.APP_AWS_REGION || 'us-east-1',
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _s3;
}

export async function assertMinioObjectsExist(keys: string[]) {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error('S3_BUCKET_NAME is required');
  }

  const client = s3Client();
  for (const key of keys) {
    const response = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    expect(response.$metadata.httpStatusCode).toBeGreaterThanOrEqual(200);
    expect(response.$metadata.httpStatusCode).toBeLessThan(300);
  }
}
