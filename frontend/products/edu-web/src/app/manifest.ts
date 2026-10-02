import type { MetadataRoute } from 'next';

/**
 * Installable web app (FR-MOBILE-1504): "Add to home screen" opens Oxinov Edu full screen from its icon. The
 * icons are the Oxinov app icons (frontend/company-web/scripts/generate-images.sh); shortcuts open the two
 * places learners return to most.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Oxinov Edu',
    short_name: 'Oxinov Edu',
    description: 'Courses, skills, ideas, and live classes from Oxinov, with free lessons to start.',
    start_url: '/?source=app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    lang: 'en',
    background_color: '#07070D',
    theme_color: '#07070D',
    categories: ['education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'My learning', url: '/spaces?source=app', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Messages', url: '/account/messages?source=app', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
