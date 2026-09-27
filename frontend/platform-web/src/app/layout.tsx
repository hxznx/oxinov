import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Noto_Sans_Devanagari, Orbitron, Rajdhani } from 'next/font/google';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/SiteFooter';
import { themeInitScript } from '@/components/ThemeToggle';
import './globals.css';

// next/font downloads these at build time and serves them from this app (self-hosted fonts).
const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-orbitron', display: 'swap' });
const rajdhani = Rajdhani({ subsets: ['latin', 'devanagari'], weight: ['500', '600', '700'], variable: '--font-rajdhani', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const devanagari = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-devanagari', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Oxinov account', template: '%s · Oxinov account' },
  description: 'Your one Oxinov account: sign in once and reach every Oxinov product.',
  icons: { icon: '/brand/oxinov-symbol.svg' },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const fonts = [orbitron, rajdhani, inter, devanagari, jetbrains].map((font) => font.variable).join(' ');
  return (
    <html lang="en" data-theme="dark" className={fonts} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
