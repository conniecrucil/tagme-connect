import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

let client: CloudFrontClient | null = null;

function getClient(): CloudFrontClient {
  if (!client) {
    client = new CloudFrontClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  return client;
}

function normalizePaths(paths: string | string[]): string[] {
  const list = Array.isArray(paths) ? paths : [paths];
  return list
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((path) => (path.startsWith('/') ? path : `/${path}`));
}

export async function invalidateCloudFrontPaths({
  paths,
  callerReference,
}: {
  paths: string | string[];
  callerReference?: string;
}): Promise<{ invalidationId?: string } | void> {
  const distributionId = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID;

  if (!distributionId) {
    console.warn('CloudFront distribution ID not set; skipping invalidation');
    return;
  }

  const normalizedPaths = normalizePaths(paths);

  if (normalizedPaths.length === 0) {
    console.warn('No CloudFront paths provided for invalidation; skipping');
    return;
  }

  const reference = callerReference ?? `card-update-${Date.now()}`;

  try {
    const response = await getClient().send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: reference,
          Paths: {
            Quantity: normalizedPaths.length,
            Items: normalizedPaths,
          },
        },
      }),
    );

    const invalidationId = response.Invalidation?.Id;
    console.info('Submitted CloudFront invalidation', {
      distributionId,
      invalidationId,
      paths: normalizedPaths,
    });

    return { invalidationId };
  } catch (error) {
    console.error('Failed to create CloudFront invalidation', error);
    throw error;
  }
}

