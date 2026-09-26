// Creates the lesson media bucket on the local S3-compatible server and allows the Edu web app to upload
// and stream directly (CORS). Local development and CI only; Amazon S3 buckets are managed by Terraform.
// Usage: node scripts/media-bucket.mjs   (reads MEDIA_BUCKET, MEDIA_S3_ENDPOINT, AWS_ACCESS_KEY_ID,
//        AWS_SECRET_ACCESS_KEY, and MEDIA_CORS_ORIGINS, default http://localhost:3002)
import 'dotenv/config';
import { CreateBucketCommand, PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3';

const bucket = process.env.MEDIA_BUCKET;
const endpoint = process.env.MEDIA_S3_ENDPOINT;
if (!bucket || !endpoint) {
  console.error('MEDIA_BUCKET and MEDIA_S3_ENDPOINT are required (local S3-compatible server only).');
  process.exit(2);
}
const origins = (process.env.MEDIA_CORS_ORIGINS ?? 'http://localhost:3002').split(',').map((origin) => origin.trim());
const s3 = new S3Client({ region: process.env.MEDIA_S3_REGION ?? 'ap-south-1', endpoint, forcePathStyle: true });

try {
  await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  console.log(`created bucket ${bucket}`);
} catch (error) {
  if (!['BucketAlreadyOwnedByYou', 'BucketAlreadyExists'].includes(error.name)) throw error;
  console.log(`bucket ${bucket} exists`);
}

await s3.send(
  new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: origins,
          AllowedMethods: ['PUT', 'GET', 'HEAD'],
          AllowedHeaders: ['Content-Type', 'Range'],
          ExposeHeaders: ['ETag', 'Content-Length', 'Content-Range', 'Accept-Ranges'],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);
console.log(`CORS allows ${origins.join(', ')}`);
