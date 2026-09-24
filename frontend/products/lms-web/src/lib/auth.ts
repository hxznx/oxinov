import { createWebAuth } from '@oxinov/web-auth';

/** Sign-in for Oxinov Edu (client oxinov-edu-web, audience oxinov-lms-api only; FR-ID-2207). */
export const auth = createWebAuth({ cookiePrefix: 'oxedu' });
