// Issues a short-lived LOCAL development token for a seeded user. Never usable in production:
// the API refuses AUTH_DEV_JWT_SECRET when NODE_ENV or DEPLOY_ENVIRONMENT is production.
// Usage: pnpm --filter @oxinov/lms-api dev:token -- <subject> [--unverified]
//   subjects from database/products/lms/seeds/dev_seed.sql: dev|sakura-owner, dev|sakura-instructor,
//   dev|learner-aiko, dev|learner-bikash, dev|everest-owner (or any new dev|... subject)
import 'dotenv/config';
import { SignJWT } from 'jose';

const subject = process.argv[2] ?? 'dev|learner-aiko';
const verified = !process.argv.includes('--unverified');
const secret = process.env.AUTH_DEV_JWT_SECRET;
if (!secret) {
  console.error('AUTH_DEV_JWT_SECRET is not set (see backend/products/lms-api/.env.example)');
  process.exit(2);
}


const token = await new SignJWT({ email_verified: verified })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuer('oxinov-dev')
  .setSubject(subject)
  .setIssuedAt()
  .setExpirationTime('8h')
  .sign(new TextEncoder().encode(secret));
console.log(token);
