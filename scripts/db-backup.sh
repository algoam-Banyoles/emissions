#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${S3_BACKUP_BUCKET:?S3_BACKUP_BUCKET is required}"

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="emissionsv2-${TIMESTAMP}.sql.gz"

pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip > "$BACKUP_FILE"
aws s3 cp "$BACKUP_FILE" "s3://${S3_BACKUP_BUCKET}/db-backups/${BACKUP_FILE}"
rm -f "$BACKUP_FILE"

echo "Backup uploaded to s3://${S3_BACKUP_BUCKET}/db-backups/${BACKUP_FILE}"
