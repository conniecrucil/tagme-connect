import type { Context } from '@netlify/functions';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getCardById, getCardAssets, type CardWithCustomer, type CardAsset } from './utils/supabase';

// Initialize S3 client
const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Use path-style addressing to avoid region mismatch issues
});

interface S3ObjectInfo {
  key: string;
  lastModified?: Date;
  size?: number;
  etag?: string;
}

interface AssetData {
  id?: string;
  asset_type: 'logo' | 'photo' | 'cover' | 'html' | 'vcf' | 'other';
  s3_key: string;
  s3_url: string;
  mime_type?: string;
  file_size?: number;
  created_at: string;
  _missing_in_s3?: boolean;
  _orphaned_s3?: boolean;
}

/**
 * List all objects in an S3 folder (prefix)
 */
async function listS3Objects(bucket: string, prefix: string): Promise<S3ObjectInfo[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents) {
      return [];
    }

    return response.Contents.map(obj => ({
      key: obj.Key || '',
      lastModified: obj.LastModified,
      size: obj.Size,
      etag: obj.ETag,
    }));
  } catch (error) {
    console.error('Error listing S3 objects:', error);
    return [];
  }
}

/**
 * Reconcile Supabase assets with S3 to ensure consistency
 */
async function reconcileAssets(assets: AssetData[], s3Path: string): Promise<AssetData[]> {
  const bucketName = process.env.VITE_AWS_S3_BUCKET_NAME;
  if (!bucketName || !s3Path) {
    return assets;
  }

  try {
    // List actual files in S3
    const s3Objects = await listS3Objects(bucketName, s3Path);
    
    // Create a map of S3 keys for quick lookup
    const s3Keys = new Set(s3Objects.map(obj => obj.key));
    
    // Reconcile: update asset URLs from S3 if they exist
    const reconciledAssets = assets.map(asset => {
      const existsInS3 = s3Keys.has(asset.s3_key);
      
      if (existsInS3) {
        // Asset exists in S3, return as-is
        return asset;
      } else {
        // Asset missing in S3, mark as missing
        return {
          ...asset,
          _missing_in_s3: true,
        };
      }
    });
    
    // Check for orphaned S3 objects (files in S3 not in database)
    const dbKeys = new Set(assets.map(asset => asset.s3_key));
    const orphanedS3Objects = s3Objects.filter(obj => !dbKeys.has(obj.key));
    
    // Add orphaned S3 objects to the list
    orphanedS3Objects.forEach(obj => {
      reconciledAssets.push({
        id: 'orphaned',
        asset_type: inferAssetType(obj.key),
        s3_key: obj.key,
        s3_url: `https://${bucketName}.s3.${process.env.APP_AWS_REGION || 'us-east-1'}.amazonaws.com/${obj.key}`,
        mime_type: inferMimeType(obj.key),
        file_size: obj.size,
        created_at: obj.lastModified?.toISOString() || new Date().toISOString(),
        _orphaned_s3: true,
      });
    });
    
    return reconciledAssets;
  } catch (error) {
    console.error('Error reconciling assets:', error);
    return assets;
  }
}

function inferAssetType(key: string): 'logo' | 'photo' | 'cover' | 'html' | 'vcf' | 'other' {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes('logo')) return 'logo';
  if (lowerKey.includes('photo')) return 'photo';
  if (lowerKey.includes('cover')) return 'cover';
  if (lowerKey.endsWith('.html') || lowerKey.includes('index')) return 'html';
  if (lowerKey.endsWith('.vcf')) return 'vcf';
  return 'other';
}

function inferMimeType(key: string): string {
  const lowerKey = key.toLowerCase();
  if (lowerKey.endsWith('.html')) return 'text/html';
  if (lowerKey.endsWith('.vcf')) return 'text/vcard';
  if (lowerKey.endsWith('.png')) return 'image/png';
  if (lowerKey.endsWith('.jpg') || lowerKey.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerKey.endsWith('.svg')) return 'image/svg+xml';
  if (lowerKey.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

export default async (req: Request, _context: Context) => {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Content-Type': 'application/json',
        },
      });
    }

    try {
      // Parse query parameters
      const url = new URL(req.url);
      const cardId = url.searchParams.get('cardId');

      if (!cardId) {
        return new Response(JSON.stringify({ error: 'Card ID is required' }), {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });
      }

      // Fetch card and assets from database
      let card: CardWithCustomer | null;
      let assets: CardAsset[];
      
      // Use Supabase client
      const [cardResult, assetsResult] = await Promise.all([
        getCardById(cardId),
        getCardAssets(cardId)
      ]);
      card = cardResult;
      assets = assetsResult || [];

      if (!card) {
        return new Response(JSON.stringify({ error: 'Card not found' }), {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });
      }

      // Reconcile assets with S3 if we have an s3_base_url
      if (card.s3_base_url) {
        try {
          // Extract the folder path from the s3_base_url
          // Example: https://bucket.s3.region.amazonaws.com/uuid/ -> uuid/
          const urlMatch = card.s3_base_url.match(/\/\/([^\/]+)\/?(.*?)\/?$/);
          if (urlMatch?.[2]) {
            const s3Path = urlMatch[2].replace(/\/$/, '') + '/';
            assets = await reconcileAssets(assets, s3Path);
          }
        } catch (reconcileError) {
          console.error('Error reconciling S3 assets:', reconcileError);
          // Continue with original assets if reconciliation fails
        }
      }

      return new Response(JSON.stringify({
        success: true,
        card,
        assets
      }), {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });

    } catch (dbError) {
      console.error('Database error in get-card-details:', dbError);
      
      // Check for specific Supabase configuration errors
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
      let statusCode = 500;
      let errorResponse = 'Failed to retrieve card details';
      
      if (errorMessage.includes('Missing Supabase environment variables')) {
        statusCode = 503; // Service Unavailable
        errorResponse = 'Database configuration error - missing Supabase environment variables';
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ECONNREFUSED')) {
        statusCode = 503;
        errorResponse = 'Database connection error - check if database services are running';
      }
      
      return new Response(JSON.stringify({ 
        error: errorResponse,
        details: errorMessage
      }), {
        status: statusCode,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Unexpected error in get-card-details:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    });
  }
};
