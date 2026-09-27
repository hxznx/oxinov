/**
 * Oxinov design tokens. The single source of truth is docs/07-design/brand.md; change both together.
 * Colors come from the approved logo (cyan #00F0FF, violet #C040FF, magenta #FF3EEC).
 */

export type ThemeName = 'dark' | 'light';
/** Internal product keys keep the `lms` prefix for Oxinov Edu (ADR-015). */
export type ProductKey = 'lms' | 'hr' | 'market' | 'services' | 'ai';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  grid: string;
  text: string;
  textMuted: string;
  brand: string;
  brand2: string;
  brandMid: string;
  highlight: string;
  onNeon: string;
  focus: string;
  success: string;
  warning: string;
  danger: string;
  product: Record<ProductKey, string>;
}

export const themes: Record<ThemeName, ThemeColors> = {
  dark: {
    bg: '#07070D',
    surface: '#10101C',
    surfaceRaised: '#171728',
    border: '#26264A',
    grid: '#14142A',
    text: '#E6F1FF',
    textMuted: '#8B9BB4',
    brand: '#00F0FF',
    brand2: '#FF3EEC',
    brandMid: '#C040FF',
    highlight: '#FCEE0A',
    onNeon: '#07070D',
    focus: '#00F0FF',
    success: '#00FF9C',
    warning: '#FCEE0A',
    danger: '#FF4D6D',
    product: {
      lms: '#B388FF',
      market: '#39FF14',
      hr: '#FF8A00',
      services: '#3D8BFF',
      ai: '#FF3EEC',
    },
  },
  light: {
    bg: '#F4F7FB',
    surface: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    border: '#D5DCE8',
    grid: '#E6EBF3',
    text: '#0A0A12',
    textMuted: '#4A5568',
    brand: '#0077A3',
    brand2: '#B0128F',
    brandMid: '#7A2BC2',
    highlight: '#7A6A00',
    onNeon: '#FFFFFF',
    focus: '#0077A3',
    success: '#047857',
    warning: '#7A6A00',
    danger: '#C8102E',
    product: {
      lms: '#6B2FD6',
      market: '#2E7D0B',
      hr: '#B34700',
      services: '#1F5FD1',
      ai: '#B0128F',
    },
  },
};

/** Fonts are self-hosted by each app; these stacks name the family and safe fallbacks. */
export const fonts = {
  display: "'Orbitron', 'Rajdhani', system-ui, sans-serif",
  heading: "'Rajdhani', 'Noto Sans Devanagari', system-ui, sans-serif",
  body: "'Inter', 'Noto Sans Devanagari', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace",
} as const;

/** Type scale in rem (16 px base). */
export const typeScale = [0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.875, 2.25, 3, 4] as const;

export const lineHeight = { body: 1.6, heading: 1.15 } as const;

/** Spacing in px, 4 px steps. */
export const space = [4, 8, 12, 16, 24, 32, 48, 64] as const;

export const radius = { none: '0', pill: '999px' } as const;

/** Corner cuts for `clip-path`: top-right and bottom-left corners are removed. */
export function cutCorners(size: number): string {
  return `polygon(0 0, calc(100% - ${size}px) 0, 100% ${size}px, 100% 100%, ${size}px 100%, 0 calc(100% - ${size}px))`;
}

export const cut = { sm: 6, md: 12 } as const;

export const motion = {
  fastMs: 120,
  baseMs: 200,
  glowMs: 150,
  glitchMs: 300,
  easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
} as const;

export const gradientSignature = 'linear-gradient(90deg, #00F0FF 0%, #C040FF 50%, #FF3EEC 100%)';
