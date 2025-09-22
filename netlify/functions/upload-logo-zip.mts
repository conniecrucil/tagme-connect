import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';

const s3Client = new S3Client({
  region: process.env.APP_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY!,
  },
});

export default async (req: Request, context: any) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { imageData, sessionId, cardNumber } = await req.json();

    if (!imageData || !sessionId || !cardNumber) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bucketName = process.env.APP_AWS_S3_BUCKET_NAME;
    
    if (!bucketName) {
      throw new Error('APP_AWS_S3_BUCKET_NAME environment variable is required');
    }

    // Create zip file with the logo image
    const zip = new JSZip();
    
    // Extract image data from base64
    const base64Data = imageData.blob.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Determine file extension - clean up any base64 suffix
    const ext = (imageData.ext || 'jpg').split(';')[0];
    const filename = `logo.${ext}`;
    
    // Add image to zip
    zip.file(filename, imageBuffer);
    
    // Generate zip buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // Generate unique folder ID for this upload
    const folderId = uuidv4();
    const zipKey = `user-logos/${folderId}.zip`;
    
    // Upload zip to S3
    await uploadToS3(bucketName, zipKey, zipBuffer, 'application/zip');
    
    // Return the S3 URL for the zip file
    const zipUrl = `https://${bucketName}.s3.${process.env.APP_AWS_REGION || 'us-east-1'}.amazonaws.com/${zipKey}`;
    
    return new Response(JSON.stringify({
      success: true,
      zipUrl,
      folderId,
      message: 'Logo zip uploaded successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error uploading logo zip:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to upload logo zip',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function uploadToS3(bucket: string, key: string, body: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // Cache for 1 year
  });

  await s3Client.send(command);
}
