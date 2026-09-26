import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Orbitron, Rajdhani } from 'next/font/google';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { themeInitScript } from '@/components/ThemeToggle';
import { JsonLd, organizationSchema, siteMetadata, websiteSchema } from '@/seo';
import './globals.css';

// next/font downloads these at build time and serves them from this site (self-hosted fonts). The site is
// English only (ADR-020), so only Latin subsets load. Only the body and hero fonts are preloaded; the
// heading and HUD fonts load on first use (font budget, docs/design/BRAND.md typography T1-T3).
const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-orbitron', display: 'swap' });
const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
  preload: false,
});
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap', preload: false });

// Search and sharing defaults live in src/seo (docs/marketing/seo).
export const metadata: Metadata = siteMetadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  const fonts = [orbitron, rajdhani, inter, jetbrains].map((font) => font.variable).join(' ');
  return (
    <html lang="en" data-theme="dark" className={fonts} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
