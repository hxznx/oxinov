import { createWebAuth } from '@oxinov/web-auth';

/** Sign-in for the account portal (client oxinov-platform-web, audience oxinov-platform-api). */
export const auth = createWebAuth({ cookiePrefix: 'ox' });
