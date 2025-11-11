import type { Context } from '@netlify/functions';
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  type ObjectIdentifier,
} from '@aws-sdk/client-s3';
import {
  getCardById,
  deleteCardAssets,
  deleteCard,
} from './utils/supabase';

const s3Client = new S3Client({
  region: process.env.APP_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

async function listAllKeys(bucket: string, prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined = undefined;

  do {
    const resp = await s3Client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }));
    const contents = resp.Contents || [];
    for (const obj of contents) {
      if (obj.Key) keys.push(obj.Key);
    }
    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

async function deleteKeys(bucket: string, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const CHUNK = 1000; // DeleteObjects max
  for (let i = 0; i < keys.length; i += CHUNK) {
    const slice = keys.slice(i, i + CHUNK);
    const objects: ObjectIdentifier[] = slice.map((Key) => ({ Key }));
    await s3Client.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: objects, Quiet: true },
    }));
  }
}

export default async (req: Request, context: Context) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const cardId = body.cardId as string | undefined;
    if (!cardId) {
      return new Response(JSON.stringify({ error: 'cardId is required' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    // Lookup card for uuid
    const card = await getCardById(cardId);
    if (!card) {
      // Nothing to delete in DB/S3
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    const bucket = process.env.VITE_AWS_S3_BUCKET_NAME;
    const uuid = (card as any).uuid as string | undefined;

    // Attempt S3 cleanup (best effort)
    if (bucket && uuid) {
      try {
        const prefix = `${uuid}/`;
        const keys = await listAllKeys(bucket, prefix);
        if (keys.length > 0) {
          await deleteKeys(bucket, keys);
        }
      } catch (s3err) {
        // Log and continue to DB deletion
        console.error('S3 deletion error:', s3err);
      }
    }

    // DB cleanup
    try {
      await deleteCardAssets(cardId);
    } catch (dbErr) {
      // Continue; assets table might be already empty
      console.warn('deleteCardAssets warning:', dbErr);
    }
    await deleteCard(cardId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('delete-card error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
};


