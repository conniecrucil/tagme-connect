#!/bin/sh

# MinIO initialization script for creating buckets and setting up policies
# This script runs inside the MinIO container during startup

set -e

echo "Starting MinIO initialization..."

# Wait for MinIO to be ready
until mc alias set local http://localhost:9000 ${MINIO_ROOT_USER:-minioadmin} ${MINIO_ROOT_PASSWORD:-minioadmin123}; do
  echo "Waiting for MinIO to be ready..."
  sleep 2
done

echo "MinIO is ready, setting up buckets..."

# Determine bucket name based on environment
if [ "${MINIO_ROOT_USER}" = "miniotest" ]; then
  BUCKET_NAME="tagme-test"
else
  BUCKET_NAME="tagme-dev"
fi

# Create the bucket if it doesn't exist
echo "Creating bucket: $BUCKET_NAME"
mc mb local/$BUCKET_NAME --ignore-existing

# Set bucket policy for public read access (like production S3)
echo "Setting bucket policy for public read access..."
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

mc policy set-json /tmp/bucket-policy.json local/$BUCKET_NAME

# Enable website hosting for the bucket
echo "Enabling website hosting for bucket: $BUCKET_NAME"
mc website set --index-document index.html local/$BUCKET_NAME

# Set CORS policy for the bucket
echo "Setting CORS policy..."
cat > /tmp/cors-policy.json << EOF
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "POST", "PUT", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-request-id"],
    "MaxAgeSeconds": 3000
  }
]
EOF

mc cors set /tmp/cors-policy.json local/$BUCKET_NAME

echo "MinIO initialization completed successfully!"
echo "Bucket '$BUCKET_NAME' is ready with:"
echo "  - Public read access"
echo "  - Website hosting enabled"
echo "  - CORS policy configured"
