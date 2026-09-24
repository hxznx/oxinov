# Oxinov Services Market charter

**Status:** Draft. **Address:** `services.oxinov.com`. **Pillar:** Oxinov Services. **Origin:** Flo Softwares `service-platform`, `service-platform-frontend`, and `servive-platform-frontend` (which contains the Kaji Service Platform backend).

## Problem and customers

People and businesses in Nepal find local service providers through word of mouth, with no verification, clear pricing, or recourse. Oxinov Services Market lets service seekers post needs or book verified providers, and lets providers win work and build a reputation.

| Role | Description |
| --- | --- |
| Service seeker | Posts a service demand or books a listed service |
| Service provider | Individual or business offering services in categories and areas |
| Oxinov operations | Verifies providers, manages categories, handles reports and disputes |

## First release scope

- Seeker and provider profiles linked to Oxinov identity and platform KYC.
- Service categories and subcategories managed by operations.
- Provider service listings with price type, availability, and service area.
- Service demands posted by seekers with provider responses and quotes.
- Bookings with a documented status lifecycle and booking messaging.
- Payment through the platform payments ledger with server-verified confirmation.
- Reviews after completed bookings and a report-and-dispute flow.

## Out of scope for the first release

- Real estate listings, transport services, entertainment bookings, product listings, and public resources found in the source concept. Each needs its own product decision.
- Job postings (owned by Oxinov Jobs) and courses, class bookings, exams, and certifications (owned by OxinovLMS).
- Oxinov's own consulting and engineering client projects, which remain a module of the account portal.
- Its own login, OTP, KYC, notifications, or payment code.

## Reuse from the source concept

Reuse as reference: `Service`, `ServiceCategory`, `ServiceSubcategory`, `ServiceDemand`, `ServiceDemandResponse`, `ServiceBooking`, `ServiceReview`, `ServiceReport`, and provider and seeker statistics; seeker and admin dashboard screens. Replace with platform services: `User`, `OTP`, `RefreshToken`, `IndividualKYC`, `IndustrialKYC`, `PaymentMethod`, `PaymentTransaction`, `Notification`, and `Conversation`/`Message`. Move learning models to OxinovLMS and job models to Oxinov Jobs.

## Product plane

| Part | Location |
| --- | --- |
| Web frontend | `frontend/products/services-web/` at `services.oxinov.com` |
| API | `backend/products/services-api/` |
| Database | `database/products/services/` (own PostgreSQL database) |
| Contracts | `packages/contracts/services/` |

## Access and trust

| Action | Required level | Policy accepted |
| --- | --- | --- |
| Browse services and providers | T0 Visitor | None |
| Save providers, post a service demand draft | T1 Member | Oxinov Terms and Privacy |
| Publish a demand, book, message, review | T2 Contact-verified | Payments, Refunds, and Disputes Policy on first payment |
| Offer services and receive payment as an individual | T3 Identity-verified | Provider Policy |
| Offer services as a registered business with staff | T4 Business-verified | Provider Policy |

## Data classification

Confidential: seeker and provider contact details, addresses, booking and payment records, KYC references, and dispute evidence. Public: approved provider profiles, service listings, and reviews.

## Regulatory review required before launch

- Nepal e-commerce registration and consumer protection obligations for a services marketplace.
- Professional licensing for regulated service categories such as electrical, health, and legal work.
- Payment and escrow design that avoids holding customer funds without the required authorization.
- Individual privacy obligations for addresses and contact data.

These must be confirmed by qualified Nepal counsel; this charter does not state legal conclusions.

## Success metrics (targets to be set by the product owner)

Verified providers per category and area, demands with at least one response, booking completion rate, dispute rate, repeat seekers, and provider response time.

## Release gate

| Item | Status |
| --- | --- |
| Accountable product owner | Pending |
| Rights to Flo Softwares concepts and product name confirmed in writing | Pending |
| Launch city, categories, and providers | Pending |
| Pricing or commission model | Pending |
| Regulatory review | Pending |
| Operations, verification, and dispute support plan | Pending |
| Delivery budget and stop/continue checkpoint | Pending |
