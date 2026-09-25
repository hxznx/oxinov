#!/bin/bash
# Nightly logical backup of every database on the starter server (ADR-017), streamed to S3.
# Restore: see devops/starter/README.md. Daily disk snapshots (Data Lifecycle Manager) are the second copy.
set -euo pipefail
cd "$(dirname "$0")"
BUCKET=${1:?backup bucket}
key="database/$(date -u +%Y/%m/%d)/oxinov-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
docker compose exec -T postgres pg_dumpall --username oxinov --clean --if-exists \
  | gzip -9 \
  | aws s3 cp - "s3://$BUCKET/$key" --region ap-south-1 --only-show-errors
echo "backup written to s3://$BUCKET/$key"
