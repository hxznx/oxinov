# Oxinov subscription and pricing model

**Status:** Proposed (research). Prices are hypotheses to validate with customers; they are not approved. See [ADR-012](../architecture/ADR.md#adr-012-feature-based-subscriptions-governed-by-oxinovcom).

## Model in one picture

Oxinov follows the pattern used by multi-product companies and consumer AI assistants: one account, a free tier that is genuinely useful, paid tiers that unlock features and raise limits, and team and enterprise plans for organizations. Every product ships as its own app, but plans, billing, and entitlements are governed centrally by `oxinov.com`.

```text
                    oxinov.com  (one account, one billing, one plan page: oxinov.com/pricing)
                                 │
          ┌──────────────────────┼───────────────────────────┐
          │                      │                           │
   Oxinov One             Product plans               Marketplace fees
   (bundle across         (per product, when           (Commodity Market, Services
    all products)          a product needs its own)     Market, Jobs)
          │                      │                           │
          └──────────── entitlements and usage limits ───────┘
                                 │
        lms app · market app · jobs app · services app · future apps
```

## Plan ladder

The same five tiers are used everywhere so customers learn one ladder.

| Tier | Who it is for | Pattern |
| --- | --- | --- |
| **Free** | Everyone with an Oxinov account | Core features of every launched product with fair usage limits; no card required |
| **Plus** | Individuals who use Oxinov regularly | Higher limits, premium features, no ads, priority processing |
| **Pro** | Power users and professionals | Highest individual limits, advanced and AI features, early access |
| **Business** | Teams and organizations (per seat) | Shared workspace, admin console, roles, invoices, data controls, support |
| **Enterprise** | Large institutions and government | Custom limits, SSO/SCIM, contracts, dedicated support, data residency options |

## Oxinov One (bundle)

Like a single membership across a family of products, **Oxinov One** is the default paid plan. A person subscribes once and gets the Plus or Pro tier in every launched product, plus shared benefits:

- shared monthly Oxinov AI credits usable in any product (LMS tutor, listing writer, CV helper, and later AI products);
- more storage for uploads and media;
- premium support and early access to new products.

Individual product plans exist only where a product has a distinct buyer (for example, an LMS institution or a high-volume seller). A product plan never removes features a person already has through Oxinov One.

## Features by product and tier (initial proposal)

| Product | Free | Plus / Pro (Oxinov One) | Business / Enterprise |
| --- | --- | --- | --- |
| **Oxinov Edu** | Free courses, limited mock exams per month, basic progress | All included practice content, unlimited mock exams, AI tutor and explanations, certificates, offline-ready content later | Institution workspaces (tenants), instructor seats, cohorts, analytics, branding, custom domain |
| **Oxinov Commodity Market** | Browse, buy, and list commodities or second-hand items with standard commission | Price alerts, market price history, more active listings, AI listing writer, condition badges | Dealer, cooperative & liquidator workspaces, member/fleet management, bulk listings & auctions, lower commission, reports |
| **Oxinov Jobs** | Candidate profile, apply to jobs | Profile boost, application insights, AI CV and cover-letter helper, LMS certificate badges highlighted | Employer plans: job-post packs, applicant search, featured jobs, team hiring seats |
| **Oxinov Services Market** | Browse, book, and offer services with standard commission | Priority booking, saved providers, AI request writer | Provider business plans: more categories and areas, staff accounts, featured placement, lower commission |
| **Oxinov AI** (future) | Limited daily messages | Higher limits, stronger models, file and image tools | Team workspace, admin and data controls, API credits |

## Revenue streams

| Stream | Where it applies |
| --- | --- |
| Subscriptions (monthly or annual; annual about two months cheaper) | Oxinov One, product plans, Business seats |
| Usage-based credits | AI usage beyond included limits, API access |
| Transaction commission | Commodity Market orders & escrow releases, and Services Market bookings; never charged to job candidates |
| Promotion | Featured listings, featured jobs, featured providers |
| Institutional contracts | LMS institutions, cooperatives, employers, enterprise and government |

## Price hypotheses (NPR, to validate)

| Plan | Monthly | Annual |
| --- | --- | --- |
| Free | 0 | 0 |
| Oxinov One Plus | 499 | 4,990 |
| Oxinov One Pro | 1,499 | 14,990 |
| Business (per seat) | 999 | 9,990 |
| Enterprise | Contract | Contract |

International pricing uses purchasing-power-adjusted local prices once an eligible international payment route exists. Validate with pilot users before publishing.

## Entitlements, not plan names

Products never check a plan name such as "Pro". The platform turns plans into **entitlements** and **limits**, and products check those:

```text
plan: oxinov-one-plus
  entitlements: lms.mock_exams.unlimited, lms.ai_tutor, market.price_alerts, jobs.cv_helper, ...
  limits:       ai.credits.monthly = 1000, storage.gb = 20, market.active_listings = 50
```

- A plan is a named bundle of entitlement keys and limits stored in the platform catalogue.
- Products ask the platform "does this user or organization have `lms.ai_tutor`?" and "how much of `ai.credits.monthly` is left?"
- Changing a plan's contents, running a promotion, or adding a regional plan needs no product code change.
- Usage is metered by products as events to the platform; the platform enforces limits and shows usage in the account portal, like usage bars in consumer AI apps.
- Free-tier limits reset on a published schedule; reaching a limit shows one clear upgrade or wait message.

## Where people subscribe

| Channel | Rule |
| --- | --- |
| Web, `oxinov.com/pricing` and `app.oxinov.com/billing` | Main place to compare plans, subscribe, change plan, see invoices, and cancel |
| Android app | Digital subscriptions sold inside the app use Google Play Billing where Google Play policy requires it |
| iOS app | Digital subscriptions sold inside the app use Apple In-App Purchase where App Store rules require it |
| Marketplace goods and in-person services | Not digital content; paid through Oxinov payments (Khalti, eSewa), not app store billing |

A subscription bought on any channel unlocks the same entitlements on every device and every product. The platform stores one subscription record per purchase with its channel, verifies app-store receipts server-side, and processes renewal and cancellation notifications idempotently. A person cannot hold two active subscriptions for the same plan through different channels without a warning.

## Billing in Nepal

- Khalti and eSewa are the first payment routes. Automatic recurring charges may not be available from local wallets, so the first release supports **prepaid periods** (1, 3, 6, or 12 months) with renewal reminders, a grace period, and one-tap renewal. Add auto-renewal when a provider supports it.
- Prices are shown in NPR including applicable VAT once tax treatment is confirmed.
- Downgrade and cancellation keep access until the end of the paid period. Refunds follow the published Payments, Escrow, Refunds, and Disputes Policy.
- International card subscriptions need an eligible provider or a merchant-of-record service for the Nepal entity; this is an open decision.

## Governance

- `oxinov.com/pricing` is the single public source of plans and prices. Product apps link to it and show only the plans relevant to them.
- Every plan, entitlement key, and limit has an owner and a version. Changes that reduce what paying customers receive require advance notice.
- Pricing experiments run on new customers only and are recorded.
- Students, schools, NGOs, and cooperatives may receive published discount programs verified through the platform.
