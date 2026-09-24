# Design system

The Oxinov design system makes every Oxinov product look and behave like one family while each product keeps its own app. The visual direction is **cyberpunk**: dark-first, neon accents, clipped corners, grid backgrounds, and HUD-style labels, with readability and accessibility always taking priority over effects. Brand, color, type, spacing, and naming are defined in the [brand system](BRAND.md). Tokens and shared components live in `packages/design-system` and are consumed by `company-web`, `platform-web`, every product web app, and (as equivalent native components) every mobile app.

## Tokens

Use shared semantic tokens for background, surface, border, text, muted text, focus, success, warning, danger, brand, and product accent. Never hard-code a color, font, spacing, glow, or shape value in a product. LMS tenant themes may change logo, accent, and public-page content while semantic contrast and focus visibility remain valid. The dark cyberpunk theme is the default; the light Daylight theme is required in every product and follows the system setting when the user has not chosen.

## Effect intensity

Every product uses the cyberpunk style. Intensity varies with the audience and task so effects never slow people down:

| Level | Where | Effects allowed |
| --- | --- | --- |
| Full | Company website hero sections, sign-in background, Oxinov AI, launch pages | Grid, scanlines, signature gradient, glitch on logo, glow |
| Standard | Account portal, Oxinov Edu, Oxinov Jobs | Grid background, clipped corners, glow on hover and focus, HUD labels |
| Calm | Oxinov Commodity Market, Oxinov Services Market, checkout, exams, forms, KYC, and long reading | Clipped corners and neon accents only; no scanlines, glitch, or animated glow |

Reduced-motion settings turn off all animation at every level. Exams, payments, and KYC always use the Calm level.

## Shared Oxinov shell (every product)

These components are identical across products so a person always knows they are in Oxinov and can move between products with one account:

| Component | Behavior |
| --- | --- |
| **Oxinov header** | Near-black bar with a thin bottom border in the product neon; Oxinov symbol + product name in the product accent, product navigation, app launcher, account menu |
| **App launcher** | Grid button that opens a HUD-style panel of neon product tiles and lists every launched Oxinov product and the account portal; opens products with single sign-on |
| **Account menu** | Avatar, name, email, plan badge, verification level, links to Manage account, Billing, Usage, Language, Theme, Sign out |
| **Sign-in page** | Continue with Google, Continue with Apple (where required), email one-time code; see [identity and access](../architecture/IDENTITY-AND-ACCESS.md) |
| **Welcome screen** | First sign-in only: name, country, age confirmation, Agree and continue |
| **Verification step prompt** | Explains the one step needed (verify phone, verify identity, verify business) and returns to the original action |
| **Policy acceptance dialog** | Just-in-time product-role policy with summary, link to full text, and Accept |
| **Plan badge and upgrade prompt** | Shows current plan; when a feature or limit needs an upgrade, shows what the upgrade unlocks and the price, with "Not now" |
| **Usage meter** | Shows used and remaining allowance (AI credits, listings, mock exams) and the reset date |
| **Pricing table** | Free, Plus, Pro, Business, Enterprise columns driven by the plan catalogue; see the [subscription model](../company/SUBSCRIPTION-MODEL.md) |
| **Oxinov footer** | Oxinov Pvt. Ltd., product links, legal links (Terms, Privacy, Acceptable Use, Cookies), language switcher, status page |

## Shared building blocks

Buttons, links, form fields with inline validation, one-time-code input, select, date picker, file upload with progress, card, list item, data table, tabs, badge, avatar, toast, confirmation dialog, empty state, skeleton loader, pagination, search bar with filters, rating stars, price display (NPR formatting), status chip, chat thread, and AI change preview.

## Product components

Each product builds its own domain components on the shared tokens and blocks:

- **Oxinov Edu:** course card, lesson player, exam timer and question, result summary, certificate.
- **Oxinov Commodity Market:** listing card, condition and quality grade chip, inspection report, price ticker and index chart, RFQ thread, escrow timeline.
- **Oxinov Jobs:** job card, candidate profile, application pipeline, skill match indicator.
- **Oxinov Services Market:** provider card, service demand card, booking calendar, booking timeline.

## States and platforms

Document loading, empty, error, offline, disabled, and success states for every component. Web uses accessible Radix/shadcn/ui patterns styled with the cyberpunk tokens (cut corners through `clip-path`, glow through `box-shadow`, never through images); mobile uses native React Native controls with equivalent behavior and the same tokens. Final logo and any palette refinements await brand approval and are tracked in [BRAND.md](BRAND.md).
