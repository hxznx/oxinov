# Oxinov Agri Market charter

**Status:** Draft. **Address:** `agri.oxinov.com`. **Pillar:** Oxinov AgriTech. **Origin:** Flo Softwares `comodity-market` (KrishiConnect) and `BT-Bazz-ComodityMarket-server`.

## Problem and customers

Nepali farmers and cooperatives sell produce through long chains of middlemen with little price visibility, while buyers and traders cannot easily verify quality, quantity, or seller identity. Oxinov Agri Market connects verified sellers and buyers of agricultural commodities with transparent listings, market prices, and tracked orders.

| Role | Description |
| --- | --- |
| Farmer / seller | Lists produce, accepts orders, tracks payment and delivery |
| Cooperative | Manages member farmers and shared listings on their behalf |
| Buyer / trader | Searches listings, places orders, reviews sellers |
| Warehouse operator | Records stored lots and issues digital warehouse receipts (later phase) |
| Agri expert | Publishes advisories and answers seller questions (later phase) |
| Oxinov operations | Moderates listings, resolves disputes, reviews KYC |

## First release scope

- Seller and buyer profiles linked to Oxinov identity and platform KYC.
- Commodity catalogue with categories, quality grades, units, and location.
- Listings with photos, quantity, price, availability, and moderation status.
- Search and filtering by commodity, district, price, and grade.
- Orders with a documented status lifecycle, order messaging, and cancellation rules.
- Payment through the platform payments ledger with server-verified eSewa or Khalti confirmation.
- Reviews after completed orders.
- Daily market price display from an approved data source.

## Out of scope for the first release

- A stored-value wallet or holding customer funds (requires Nepal Rastra Bank licensing review).
- Digital warehouse receipts as tradable or financeable instruments.
- Price prediction, weather advisories, logistics booking, and export trade.
- Its own login, OTP, password reset, KYC tables, or payment gateway code.

## Reuse from the source concept

Reuse as reference: the `Listing`, `Product`, `Order`, `MarketPrice`, `Review`, `SavedListing`, and role models; seller dashboard screens; the eSewa integration notes and KYC draft. Replace with platform services: `User`, `Kyc`, `KycVerificationHistory`, `Payment`, `Transaction`, `Notification`, `Conversation`/`Message`, and `UserDevice`.

## Product plane

| Part | Location |
| --- | --- |
| Web frontend | `frontend/products/agri-web/` at `agri.oxinov.com` |
| API | `backend/products/agri-api/` |
| Worker | `backend/products/agri-worker/` (price imports, order timeouts) |
| Database | `database/products/agri/` (own PostgreSQL database) |
| Contracts | `packages/contracts/agri/` |

## Access and trust

| Action | Required level | Policy accepted |
| --- | --- | --- |
| Browse listings and market prices | T0 Visitor | None |
| Save listings, follow sellers | T1 Member | Oxinov Terms and Privacy |
| Message a seller, place an order, review | T2 Contact-verified | Payments, Refunds, and Disputes Policy on first payment |
| Create listings and receive payment as an individual farmer | T3 Identity-verified | Seller Policy |
| Sell as a cooperative or registered business, manage members | T4 Business-verified | Seller Policy |

## Data classification

Confidential: KYC documents (held by the platform, referenced by ID), buyer and seller contact details, order and payment records. Internal: listing drafts and moderation notes. Public: approved listings, seller display names, and aggregated market prices.

## Regulatory review required before launch

- Nepal e-commerce registration and consumer protection obligations for an online marketplace.
- Rules for agricultural commodity trading, quality grading claims, and any market-price data licence.
- Payment flow design that avoids holding customer funds without the required Nepal Rastra Bank authorization.
- Individual privacy obligations for KYC and contact data.

These must be confirmed by qualified Nepal counsel; this charter does not state legal conclusions.

## Success metrics (targets to be set by the product owner)

Verified sellers, active listings, completed orders, order completion rate, dispute rate, median time from listing to first order, and payment verification failures.

## Release gate

| Item | Status |
| --- | --- |
| Accountable product owner | Pending |
| Rights to Flo Softwares concepts and product name confirmed in writing | Pending |
| Pilot district, cooperatives, and launch customers | Pending |
| Pricing or commission model | Pending |
| Regulatory review | Pending |
| Operations, moderation, and dispute support plan | Pending |
| Delivery budget and stop/continue checkpoint | Pending |
