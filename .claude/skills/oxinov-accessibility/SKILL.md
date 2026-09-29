---
name: oxinov-accessibility
description: Make Oxinov interfaces accessible to WCAG 2.2 AA - keyboard access, focus, labels, contrast through design tokens, captions and transcripts, accessible exam timers and accommodations, phone width, reduced motion, and plain English for translation. Use when building or reviewing any page, component, email, or mobile screen.
---

# Oxinov accessibility

Sources: [accessibility](../../../docs/07-design/accessibility.md), [design system](../../../docs/07-design/design-system.md), [user-centred product standard](../../../docs/12-research/user-centered-product-standard.md), [NFR](../../../docs/03-requirements/nfr.md). Rule: [frontend rules](../../../docs/14-ai-knowledge/frontend-rules.md).

Target: **WCAG 2.2 AA** for every web interface, and the same bar for mobile apps.

## Checklist for every page or component

| Area | Check |
| --- | --- |
| Structure | One `h1`; headings in order; landmarks (`header`, `main`, `nav`, `footer`); lists and tables used for lists and tables |
| Keyboard | Everything works with the keyboard alone, in a logical order; no keyboard traps; skip link on long pages |
| Focus | Visible focus on every control (`var(--ox-focus-ring)`); focus moves sensibly after dialogs and form errors |
| Forms | Every input has a visible label; errors say what is wrong and how to fix it, next to the field and in a summary |
| Contrast | Colors only from tokens; the design-system contrast test keeps text at 4.5:1 or more |
| Images and icons | Meaningful `alt` text; decorative images `alt=""`; icon-only buttons have an accessible name |
| Media | Captions for video, transcripts for audio, no autoplay with sound |
| Time limits | Exam timers are announced, can be read by screen readers, and allow time accommodations where the exam policy permits |
| Motion | Respect reduced motion (the tokens turn animation off) |
| Size | Works at 375 px wide and at 200% zoom without horizontal scrolling |
| Language | Plain English that browser translation handles; `lang` set; `translate="no"` only on brand names and code |

## How to check

1. Use the page with the keyboard only.
2. Check at phone width and in both themes.
3. Run `pnpm --filter @oxinov/design-system test` after any token change.
4. For the website, `pnpm --filter @oxinov/company-web test` checks one `h1`, alt text, and links.
5. Try a screen reader on anything new and interactive (NVDA on Windows, VoiceOver on macOS and iOS, TalkBack on Android).

Automated axe checks in end-to-end tests are planned with Playwright; until then these manual checks are the gate. Record known gaps honestly in the change.
