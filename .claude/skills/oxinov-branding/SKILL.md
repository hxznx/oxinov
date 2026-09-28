---
name: oxinov-branding
description: Apply the Oxinov brand - product naming, the logo, neon cyberpunk visual direction, design tokens and themes, voice and tone, and honest public copy. Use when naming a product or feature, writing public or in-app copy, or changing colors, logos, or visual style.
---

# Oxinov branding

Sources: [brand system](../../../docs/07-design/brand.md), [design system](../../../docs/07-design/design-system.md), [marketing plan](../../../docs/13-marketing/marketing-plan.md). Code: `packages/design-system` ([README](../../../packages/design-system/README.md)).

## Names

- Write "Oxinov" with a capital O and no space. The legal name "Oxinov Pvt. Ltd." appears only in footers, policies, invoices, and contracts.
- Products are "Oxinov" plus a plain descriptive word: **Oxinov Edu** (short: Edu), Oxinov HR, Oxinov Market, Oxinov Services Market. Oxinov Studio, JP, and Tech are proposals only.
- Never call Edu "LMS" or "OxinovLMS"; say "learning platform" or "Edu workspace". Do not use the legacy names KrishiConnect, Kaji, or BT-Bazz.
- Invent no sub-brands; the name says what the product does.

## Look

- Visual direction: dark, neon, high-tech. Dark theme by default, with a light "Daylight" theme (`data-theme="light"`).
- Colors, cut corners, focus rings, and effects come only from tokens in `@oxinov/design-system` (`--ox-color-*`, `--ox-cut-*`, `--ox-focus-ring`). Each product has one accent token (Edu: `--ox-color-product-edu`).
- Fonts: Orbitron, Rajdhani, Inter, Noto Sans Devanagari, and JetBrains Mono, self-hosted by each app.
- The logo is approved: use the files from the design-system brand assets. Never redraw, recolor, stretch, or add effects to it.
- Reduced motion turns off animation; every text token passes WCAG AA contrast (`pnpm --filter @oxinov/design-system test` checks it).

## Voice

- Plain English that browser translators handle well (ADR-020): short sentences, common words.
- Support at least one messaging pillar: for everyone, everywhere; everything in one place; easy for teachers; safe and trustworthy.
- No hype: no superlatives or claims a reader cannot check. Never invent prices, ratings, reviews, partners, or certifications; practice exams are labeled as practice.

## Steps for a brand change

1. Check that the change is inside the approved brand; the brand strategy and tokens are still proposed, so a new direction needs the owner.
2. Change tokens in `packages/design-system/src/tokens.ts`, never in an app.
3. Run `pnpm --filter @oxinov/design-system build` and `test`, then build every app.
4. Update [brand](../../../docs/07-design/brand.md) or [design system](../../../docs/07-design/design-system.md) in the same change.
