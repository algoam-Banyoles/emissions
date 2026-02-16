#!/usr/bin/env bash
set -euo pipefail

: "${S3_BUCKET:?S3_BUCKET is required}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?CLOUDFRONT_DISTRIBUTION_ID is required}"

npm ci
npm run build
aws s3 sync dist/ "s3://${S3_BUCKET}" --delete
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"

echo "Frontend deployed to s3://${S3_BUCKET} and CloudFront invalidated"
