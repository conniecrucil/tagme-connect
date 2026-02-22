/**
 * Transforms S3 URLs to domain-based URLs by removing the S3-specific parts
 * @param s3Url - The S3 URL to transform
 * @returns The transformed URL using the domain format
 */
export function transformS3UrlToDomain(s3Url: string): string {
  if (!s3Url) return s3Url;
  
  // Extract bucket name from S3 URL
  // Pattern: https://domain.s3.dev.amazonaws.com/path
  const s3Match = s3Url.match(/https:\/\/([^\/]+)\.s3\.[^\/]+\.amazonaws\.com\/(.+)/);
  
  if (s3Match) {
    const bucketName = s3Match[1];
    const path = s3Match[2];
    
    // The bucket name should already be the domain (e.g., "example-bucket.com")
    // Just remove the .s3.dev.amazonaws.com part
    return `https://${bucketName}/${path}`;
  }
  
  return s3Url;
}
