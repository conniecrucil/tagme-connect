#!/bin/sh

# MinIO initialization script for creating buckets and setting up policies
# This script runs inside the MinIO container during startup

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
mc anonymous set download local/$BUCKET_NAME

# Set CORS policy for the bucket
echo "Setting CORS policy..."
cat > /tmp/cors-policy.json << 'CORS_EOF'
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "POST", "PUT", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-request-id"],
    "MaxAgeSeconds": 3000
  }
]
CORS_EOF

mc cors set /tmp/cors-policy.json local/$BUCKET_NAME || echo "Note: CORS setting skipped (may not be available)"

echo "MinIO initialization completed successfully!"
echo "Bucket '$BUCKET_NAME' is ready with:"
echo "  - Public read access (download)"
echo "  - CORS policy configured"
