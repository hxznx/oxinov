# Oxinov brand system

**Status:** Logo approved; tokens proposed. **Visual direction:** cyberpunk — dark, neon, high-tech, and futuristic across the company website, platform, and every product. The approved Oxinov logo defines the brand colors below; type and naming remain working defaults until approved. Tokens live in `packages/design-system` and are the only source for colors, type, spacing, and effects in every Oxinov app.

## Brand architecture

Oxinov uses a **masterbrand** model, like a large multi-product technology company: one company brand, with products named "Oxinov + plain descriptive word" so customers immediately know what each product does and that one account works everywhere.

| Level | Name | Visual treatment |
| --- | --- | --- |
| Company | Ox Inov Pvt. Ltd. | Legal name in footers, policies, invoices, and contracts only |
| Masterbrand | Oxinov | Neon wordmark and symbol on `oxinov.com`, sign-in, account portal, and app launcher |
| Product | Oxinov Edu, Oxinov HR, Oxinov Commodity Market, Oxinov Services Market, later Oxinov AI | Oxinov symbol + product name; each product has one neon accent and one app icon |
| Plan | Oxinov One Plus, Pro; Business; Enterprise | Neon plan badge in the account menu and pricing page |
| Division | Oxinov Education, AgriTech, AI, … | Company website sections only; divisions are not customer-facing apps |

Naming rules:

- The registered company is **Ox Inov Pvt. Ltd.** (two words); use it only where the legal entity is meant (footers, policies, invoices, contracts, registrations). The brand, the platform, and every product are **Oxinov** (one word).
- Always write "Oxinov" with a capital O and no space. Write product names as two or three words with a space (for example, "Oxinov HR"). The first product, formerly "Oxinov Edu", is named "Oxinov Edu" at `edu.oxinov.com` (ADR-015). Its existing internal technical identifiers (packages, folders, databases, entitlement keys, tokens, and requirement IDs) keep the `lms` prefix and are never shown to customers (ADR-025).
- Do not use the legacy concept names KrishiConnect, Kaji, or BT-Bazz on Oxinov products.
- Product names describe the job to be done; avoid invented sub-brands.

## Brand strategy

**Status:** Proposed 2026-09-26 for owner approval. Marketing and SEO plans build on it: [marketing](../13-marketing/marketing-plan.md), [SEO](../13-marketing/seo/README.md).

Oxinov is a **global technology company** headquartered in Lalitpur. Its products are built for everyone, in every country, in **one language: English** (ADR-020). People who prefer another language read Oxinov through their browser's or device's built-in translation, so all Oxinov text is written to translate well. Local details that are not language (currency, payment method, time zone, date format) still follow the reader. The headquarters is part of the story, never a limit on who the products are for.

| Element | Oxinov (company) | Oxinov Edu (first product) |
| --- | --- | --- |
| Mission | Build world-class technology that helps people everywhere learn, work, and trade | Help every teacher, school, and learner in the world teach and learn online as easily as in class |
| Positioning | One global account across many useful products, designed to work for everyone: any device, any connection, clear English that translates well | The complete online classroom for any school or teacher: courses, video, audio, books, quizzes, exams, assignments, and class discussion in one place |
| Primary audience | Schools, businesses, creators, and professionals worldwide | Training institutes, language and exam-prep schools, IT and skill academies, tutors, and schools of any size, in any country |
| Secondary audience | Partners, investors, and developers | Learners of every age, and the parents or employers who pay |
| Proof points | Security-first engineering; one sign-in across products; accessible (WCAG 2.2 AA) and fast on low-cost phones | Works on any phone and slow connections; teachers can teach in any language; join by class code; teachers edit everything themselves; fair local pricing |

**Messaging pillars** (every page and post supports at least one):

1. **For everyone, everywhere:** clear English that any translator can read, your currency and time zone, and it works on any phone, even on slow connections.
2. **Everything in one place:** lessons, video and audio, books, quizzes, mock exams, assignments, notes, and class discussion.
3. **Easy for teachers:** set up a course in an afternoon without IT staff; invite a class with a code.
4. **Safe and trustworthy:** each organisation's data kept separate; sign-in without passwords; honest practice-exam labels; privacy by design.

**Tagline candidates** (English only; test with users, including people who read them through a translator):

| Brand | Candidates |
| --- | --- |
| Oxinov | "Technology for everyone." · "Where learning meets work." · "Built for the world." |
| Oxinov Edu | "Your classroom, online." · "Teach anywhere. Learn anywhere." |

The current website title, "Technology built in Nepal", describes the origin rather than the audience; replace it with the approved company tagline.

## Language policy (owner decision, 2026-09-26, ADR-020)

- **Oxinov writes in English only:** websites, product screens, emails, notifications, policies, help, marketing, and support. There are no translated versions to maintain.
- **Readers translate for themselves:** pages never block browser translation (`lang="en"` on every page, no `translate="no"` except on brand names, code, and the logo), and layouts allow translated text to grow by up to 40% without breaking.
- **Course content is the teacher's choice:** teachers and learners write lessons, questions, and answers in any language and script (NFR-08, FR-LANG-902); the interface around them stays English.
- **Brand names are never translated:** mark "Oxinov" and product names with `translate="no"` so translators keep them intact.

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
| Oxinov Edu | `color.product.edu` | `#B388FF` neon violet (7.5:1) | `#6B2FD6` (6.5:1) |
| Oxinov Commodity Market | `color.product.market` | `#39FF14` acid green (14.8:1) | `#2E7D0B` (4.8:1) |
| Oxinov HR | `color.product.hr` | `#FF8A00` neon orange (8.5:1) | `#B34700` (5.1:1) |
| Oxinov Services Market | `color.product.services` | `#3D8BFF` electric blue (6.1:1) | `#1F5FD1` (5.4:1) |
| Oxinov AI (future) | `color.product.ai` | `#FF3EEC` neon magenta (6.8:1) | `#B0128F` (5.9:1) |

LMS tenant branding (logo and accent) may replace the product accent inside a tenant workspace, but never the semantic, focus, or text tokens.

## Typography

| Role | Font | Notes |
| --- | --- | --- |
| Display (hero titles, logo-like headings, Latin only) | Orbitron | Futuristic geometric face; 32 px and larger only; never for paragraphs |
| Headings (Latin and Devanagari scripts) | Rajdhani | Techno-condensed face that includes Devanagari, so headings match across English, Hindi, Nepali, and other Devanagari languages |
| Body and UI text | Inter | High readability at small sizes |
| Devanagari body text | Noto Sans Devanagari | Loaded only for Devanagari locales (for example `hi`, `ne`) and content |
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

Confident, clear, and future-facing, but never cryptic. Short sentences and plain words; the tech flavor lives in the visuals and HUD labels, not in jargon. English only, written so that a machine translator gives a correct result in any language. Error messages say what happened and what to do next.

| Do | Don't |
| --- | --- |
| "Invite your class with a code." | "Leverage our seamless onboarding paradigm." |
| "Your quiz is saved." | "Operation completed successfully." |
| "This is a practice score, not an official result." | "Guaranteed to pass JLPT!" |
| "Rs 1,500 a month for up to 100 learners." | "Affordable pricing!!!" |

- **Tone by moment:** marketing is warm and ambitious; product screens are calm and exact; errors are kind and specific; security and billing are formal.
- **Write for translation (plain global English):** one idea per sentence, sentences under 20 words, active voice, and the same word for the same thing every time (for example always "course", never also "class" and "program"). Avoid idioms, slang, sports or cultural references, puns, and phrasal verbs with many meanings ("set up" is fine; "hit the ground running" is not). Write numbers as digits, spell out abbreviations once, and never put text inside images, where translators cannot reach it.
- **Locale without translation:** dates, times, numbers, and currencies follow the reader's settings (for example 26 Sep 2026 or 9/26/2026; 1,500.00 or 1.500,00), while the words stay English.
- **Claims:** no "best", "#1", "guaranteed", or exam-pass promises; every number (learners, schools, uptime) must be true on the day it is published.
- **Inclusion:** gender-neutral wording; names, places, and examples from many countries and cultures; images of real people of different ages, backgrounds, and abilities, with consent; no idioms, humor, or symbols that only work in one culture.
- **Global by default:** never assume a country, currency, calendar, or phone format; say "your country" or detect it, and let people change it.

## Proposed refinements (2026-09-26, owner approval needed)

These are recommendations from a review of the tokens and the live website. Nothing below changes `packages/design-system` until the owner approves it; each approved item then updates the tokens, the contrast tests, and this document together.

### Color

| # | Finding | Proposal |
| --- | --- | --- |
| C1 | The Edu accent `#B388FF` is close to the logo's middle violet `#C040FF`, so Edu screens read as "Oxinov" rather than "Edu". | Move Edu to a clearly different hue, for example neon teal-green `#2EF2B8` (dark, 13.9:1) / `#00785A` (light, 5.1:1). |
| C2 | Market's acid green `#39FF14` is easy to confuse with the success green `#00FF9C`; people with red-green color blindness may not tell "Market" from "success". | Keep success green; move Market to lime `#C6FF00` (dark, 16.9:1) / `#5A7300` (light, 5.0:1), and always pair status colors with an icon and text. |
| C3 | Dark neon is right for the brand and marketing, but long lesson reading and exams on phones are tiring in dark mode for many learners and parents. | Keep dark as the brand default, but let Edu follow the device setting (system light or dark) and default lesson and exam reading surfaces to the Daylight theme. |
| C4 | Yellow `#FCEE0A` is both "highlight" and "warning". | Keep yellow for warnings only; use the signature gradient or magenta for "new" and "featured" badges. |
| C5 | Photos and illustrations have no color rules yet. | Real, well-lit photos with a subtle cyan-magenta duotone overlay on marketing pages only; never over text. |

### Typography

The website currently loads **5 families in 26 files (about 668 KB)** and preloads 10 of them (about 372 KB) on every first visit, which slows the first view on mobile data, especially for the many people worldwide on low-cost phones and slower networks (Largest Contentful Paint target: 2.5 s, NFR-01).

| # | Proposal |
| --- | --- |
| T1 | Performance budget: at most **120 KB of fonts** on first view; preload only Inter (body) and Orbitron (hero); load the rest on demand (`preload: false`). |
| T2 | Orbitron: one weight (700), for the logo lockup and hero titles only. Rajdhani: two weights (600, 700). Inter: the variable font, latin subset. JetBrains Mono: one weight (500). |
| T3 | The interface is English, so websites and app screens load Latin fonts only. Script fonts (Noto Sans Devanagari, JP, KR, Arabic, and others) load only inside course content that uses them, never on marketing pages. Rely on system fonts as the fallback for translated pages. |
| T4 | Minimum body size 16 px, line height 1.6 for lessons; never set Rajdhani below 18 px (it is condensed and hard to read small). |
| T5 | Check that key pages still look right when a browser translates them into long-word languages (German), a non-Latin script (Hindi, Japanese), and a right-to-left language (Arabic). |

### Brand assets checklist

| Asset | Status | Needed for |
| --- | --- | --- |
| Logo files (6 SVG and PNG variants) | Done | Everything |
| Social share images (1200 × 630) for the company and each product (short English text only) | Missing | Link previews on Facebook, WhatsApp, LinkedIn, X, LINE, and others (see [SEO](../13-marketing/seo/README.md)) |
| Social profile set: avatar 400 × 400, Facebook cover 1640 × 624, YouTube banner 2560 × 1440 | Missing | Facebook, Instagram, TikTok, YouTube, LinkedIn |
| Web app manifest and icons (192, 512, maskable) | Missing on the website | "Add to home screen" on Android |
| Email signature and letterhead (Daylight colors) | Missing | Zoho mailboxes, invoices, proposals |
| One-page brand sheet (logo, colors, fonts, do and don't) | Missing | Partners, printers, freelancers |
| Photo and illustration library | Missing | Marketing pages and ads |
