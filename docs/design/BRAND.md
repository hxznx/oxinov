# Oxinov brand system

**Status:** Logo approved; tokens proposed. **Visual direction:** cyberpunk — dark, neon, high-tech, and futuristic across the company website, platform, and every product. The approved Oxinov logo defines the brand colors below; type and naming remain working defaults until approved. Tokens live in `packages/design-system` and are the only source for colors, type, spacing, and effects in every Oxinov app.

## Brand architecture

Oxinov uses a **masterbrand** model, like a large multi-product technology company: one company brand, with products named "Oxinov + plain descriptive word" so customers immediately know what each product does and that one account works everywhere.

| Level | Name | Visual treatment |
| --- | --- | --- |
| Company | Oxinov Pvt. Ltd. | Legal name in footers, policies, invoices, and contracts only |
| Masterbrand | Oxinov | Neon wordmark and symbol on `oxinov.com`, sign-in, account portal, and app launcher |
| Product | Oxinov LMS, Oxinov Commodity Market, Oxinov Jobs, Oxinov Services Market, later Oxinov AI | Oxinov symbol + product name; each product has one neon accent and one app icon |
| Plan | Oxinov One Plus, Pro; Business; Enterprise | Neon plan badge in the account menu and pricing page |
| Division | Oxinov Education, AgriTech, AI, … | Company website sections only; divisions are not customer-facing apps |

Naming rules:

- Always write "Oxinov" with a capital O and no space. Write product names as two or three words with a space ("Oxinov Jobs"). The existing name "OxinovLMS" should move to "Oxinov LMS" or a friendlier name such as "Oxinov Learn" (decision pending).
- Do not use the legacy concept names KrishiConnect, Kaji, or BT-Bazz on Oxinov products.
- Product names describe the job to be done; avoid invented sub-brands.

## Cyberpunk principles

1. **Dark first.** Near-black backgrounds with deep blue-violet surfaces. Dark is the default theme in every product.
2. **Neon with purpose.** Neon marks brand, product identity, the primary action, focus, and status. Most of the screen stays calm so neon stays meaningful.
3. **Tech geometry.** Angled (clipped) corners, thin neon borders, grid lines, and HUD-style labels in monospace.
4. **Readable before cool.** Body text is never neon, never glowing, never glitched. Every text pair meets WCAG 2.2 AA; effects are decoration only.
5. **Motion is optional.** Glow pulses, glitch, and scanlines are off when the device requests reduced motion.

## Logo

The Oxinov symbol is a neon ring that shifts from cyan to violet to magenta, holding two chevrons that point toward each other: a cyan `>` and a magenta `<`. The chevrons read as an "X" for Oxinov inside the "O" ring and stand for two sides meeting in the middle: research and industry, learning and work, buyers and sellers, people and technology.

### Asset files

All files live in `packages/design-system/assets/brand/`. Use the SVG files in products; the JPEG is the approved master artwork.

| File | Use |
| --- | --- |
| `oxinov-logo-original.jpg` | Approved master artwork (1254 × 1254, black background); reference and social images |
| `oxinov-symbol.svg` | Default symbol on dark backgrounds; transparent, no glow; favicons and headers |
| `oxinov-symbol-glow.svg` | Hero sections, splash screens, and marketing; includes the neon glow on black |
| `oxinov-symbol-light.svg` | Light Daylight theme, documents, and print |
| `oxinov-symbol-mono.svg` | One-color use (`currentColor`): stamps, engraving, embossing, single-color print |
| `oxinov-app-icon.svg` | 512 × 512 app-icon source; the store or OS applies the corner mask |

The SVG files were redrawn from the master artwork and must be checked by the brand owner against the master before production use. A horizontal lockup (symbol + OXINOV wordmark in Orbitron, converted to outlines) is still to be produced.

### Logo colors

| Part | Dark backgrounds | Light backgrounds |
| --- | --- | --- |
| Ring gradient | `#00F0FF` → `#C040FF` → `#FF3EEC` (left to right) | `#0077A3` → `#7A2BC2` → `#B0128F` |
| Left chevron | `#00F0FF` | `#0077A3` |
| Right chevron | `#FF3EEC` | `#B0128F` |

### Usage rules

- Clear space equal to one quarter of the ring diameter on all sides. Minimum size 16 px for the symbol alone.
- Use the glow only on near-black backgrounds. Never add glow on light backgrounds.
- Do not rotate, recolor outside the palettes above, swap the chevron colors, fill the ring, stretch, outline, or place the symbol on busy photos without a dark overlay.
- Product app icons use the same symbol on `#07070D`; the product name, not a different symbol, identifies the product.

## Color tokens

Contrast ratios were checked when these tokens were proposed: dark values against `#07070D`, light values against `#F4F7FB`.

### Core (dark theme, default)

| Token | Value | Contrast | Use |
| --- | --- | --- | --- |
| `color.bg` | `#07070D` | — | Page background |
| `color.surface` | `#10101C` | — | Cards and panels |
| `color.surface-raised` | `#171728` | — | Menus, dialogs |
| `color.border` | `#26264A` | — | Default hairlines |
| `color.grid` | `#14142A` | — | Background grid pattern |
| `color.text` | `#E6F1FF` | 17.6:1 | Body text |
| `color.text-muted` | `#8B9BB4` | 7.1:1 | Secondary text |
| `color.brand` | `#00F0FF` neon cyan (from the logo) | 14.3:1 | Masterbrand, primary buttons, links, focus |
| `color.brand-2` | `#FF3EEC` neon magenta (from the logo) | 6.8:1 | Company-site highlights and the cyan-magenta signature pairing |
| `color.brand-mid` | `#C040FF` neon violet (from the logo) | 5.2:1 | Middle stop of the signature gradient |
| `color.highlight` | `#FCEE0A` electric yellow | 16.6:1 | Rare emphasis: new, featured, launch banners |
| `color.on-neon` | `#07070D` | 6.1:1 or better on every neon | Text on neon-filled buttons and badges |
| `color.focus` | `#00F0FF` 2 px ring + 6 px glow | — | Keyboard focus on every interactive element |

### Core (light "Daylight" theme)

Offered in every product for bright outdoor use, printing, and preference. Same structure, darker neon so text stays readable.

| Token | Value | Contrast on `#F4F7FB` |
| --- | --- | --- |
| `color.bg` / `color.surface` | `#F4F7FB` / `#FFFFFF` | — |
| `color.text` / `color.text-muted` | `#0A0A12` / `#4A5568` | 18.4:1 / 7.0:1 |
| `color.brand` | `#0077A3` | 4.7:1 |
| `color.brand-2` | `#B0128F` | 5.9:1 |
| `color.brand-mid` | `#7A2BC2` | 6.6:1 |
| `color.highlight` (text) | `#7A6A00` | 5.0:1 |

### Semantic

| Token | Dark | Light |
| --- | --- | --- |
| `color.success` | `#00FF9C` (15.1:1) | `#047857` (5.1:1) |
| `color.warning` | `#FCEE0A` (16.6:1) | `#7A6A00` (5.0:1) |
| `color.danger` | `#FF4D6D` (6.3:1) | `#C8102E` (5.5:1) |

### Product neon accents

Accents identify the product in its header, app icon, borders, and glow. Primary actions inside every product still use `color.brand` cyan so the family feels like one system.

| Product | Token | Dark | Light |
| --- | --- | --- | --- |
| Oxinov LMS | `color.product.lms` | `#B388FF` neon violet (7.5:1) | `#6B2FD6` (6.5:1) |
| Oxinov Commodity Market | `color.product.market` | `#39FF14` acid green (14.8:1) | `#2E7D0B` (4.8:1) |
| Oxinov Jobs | `color.product.jobs` | `#FF8A00` neon orange (8.5:1) | `#B34700` (5.1:1) |
| Oxinov Services Market | `color.product.services` | `#3D8BFF` electric blue (6.1:1) | `#1F5FD1` (5.4:1) |
| Oxinov AI (future) | `color.product.ai` | `#FF3EEC` neon magenta (6.8:1) | `#B0128F` (5.9:1) |

LMS tenant branding (logo and accent) may replace the product accent inside a tenant workspace, but never the semantic, focus, or text tokens.

## Typography

| Role | Font | Notes |
| --- | --- | --- |
| Display (hero titles, logo-like headings, Latin only) | Orbitron | Futuristic geometric face; 32 px and larger only; never for paragraphs |
| Headings (Latin and Nepali) | Rajdhani | Techno-condensed face that includes Devanagari, so English and Nepali headings match |
| Body and UI text | Inter | High readability at small sizes |
| Nepali body text | Noto Sans Devanagari | Loaded for `ne` locale and Devanagari content |
| Japanese (LMS content) | Noto Sans JP | Loaded only where Japanese content appears |
| HUD labels, codes, prices, data | JetBrains Mono | Uppercase small labels (for example `// STATUS: VERIFIED`), tabular numbers |

All fonts have open licences and are self-hosted. Type scale (rem, 16 px base): 0.75, 0.875, 1 (body), 1.125, 1.25, 1.5, 1.875, 2.25, 3, 4 (display). Line height 1.6 for body and 1.15 for headings. Minimum body size is 16 px on mobile. Use letter-spacing 0.08em on uppercase HUD labels.

## Effects

| Effect | Token | Rule |
| --- | --- | --- |
| Neon glow | `effect.glow.{brand,product}` = `0 0 6px`, `0 0 18px` of the accent at 60% and 25% | Buttons on hover, focus rings, active nav, app icons. Never on body text |
| Neon border | `border.neon` = 1 px accent at 70% | Cards that are selected, featured, or active |
| Clipped corners | `shape.cut.sm` 6 px, `shape.cut.md` 12 px (CSS `clip-path` polygon) | Buttons, cards, badges, dialogs; top-right and bottom-left corners cut |
| Grid background | `effect.grid` 32 px lines in `color.grid` | Page backgrounds and hero sections; behind content, very low contrast |
| Scanlines | `effect.scanline` 2 px lines at 4% opacity | Hero sections and the sign-in background only |
| Glitch | `motion.glitch` 300 ms, once | Logo on load and error illustrations only; disabled under reduced motion |
| Gradient | `gradient.signature` `#00F0FF` → `#C040FF` → `#FF3EEC`, matching the logo ring | Logo lockup, hero headline accent, plan badges; not on buttons or text blocks |

## Space and motion

- Spacing scale in 4 px steps: 4, 8, 12, 16, 24, 32, 48, 64.
- Radius: 0 by default (cut corners replace rounding); 999 px only for avatars and toggles.
- Motion: 120–200 ms ease-out for state changes; glow fades 150 ms; no continuous animation except loading indicators.

## Voice

Confident, clear, and future-facing, but never cryptic. Short sentences and plain words; the tech flavor lives in the visuals and HUD labels, not in jargon. English and Nepali at launch, with the same meaning in both. Error messages say what happened and what to do next.
