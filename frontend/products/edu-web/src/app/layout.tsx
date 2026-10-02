import type { Metadata } from 'next';
import { Chakra_Petch, Inter, JetBrains_Mono, Noto_Sans_Devanagari, Orbitron, Rajdhani, Share_Tech_Mono } from 'next/font/google';
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
// Oxinov Studio and the store (ADR-028): Chakra Petch headings and Share Tech Mono HUD labels.
const chakra = Chakra_Petch({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-chakra', display: 'swap' });
const techMono = Share_Tech_Mono({ subsets: ['latin'], weight: '400', variable: '--font-techmono', display: 'swap' });

export const metadata: Metadata = {
  // Absolute addresses for link previews (Open Graph images of offering pages).
  metadataBase: new URL(process.env.APP_URL?.replace(/\/$/, '') || 'https://edu.oxinov.com'),
  title: { default: 'Oxinov Edu', template: '%s · Oxinov Edu' },
  description: 'Oxinov Edu: courses, lessons, and practice exams from your school, with your one Oxinov account.',
  icons: { icon: '/brand/oxinov-symbol.svg' },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const fonts = [orbitron, rajdhani, inter, devanagari, jetbrains, chakra, techMono].map((font) => font.variable).join(' ');
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
