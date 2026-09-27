# Functional Requirements Document: Oxinov Platform

**Version:** 1.1
**Date:** 2026-09-28
**Status:** Proposed for owner review
**Scope:** Company website (`oxinov.com`), identity (`id.oxinov.com`), account portal (`app.oxinov.com`), API gateway (`api.oxinov.com`), and the shared control-plane services used by every Oxinov product.
**Standard:** [Oxinov requirements standard](../README.md)

## Implementation status (2026-09-26)

Built and verified in production or CI. Requirements not listed are not built yet (or not yet verified); the per-requirement *Status* lines move to **Implemented** once the owner approves each FR. Source of truth for what runs: [current state](../../04-architecture/current-state.md).

| Requirement | State | Notes |
| --- | --- | --- |
| FR-SITE-2101 Company presence | Implemented | `oxinov.com` live; English only (ADR-020); product and division pages; SEO (NFR-19) |
| FR-SITE-2102 Brand and themes | Implemented | Dark default and Daylight theme; design-system tokens |
| FR-SITE-2103 Pricing page | Partly | Plan ladder and FAQ live; prices wait for approval |
| FR-SITE-2104 Contact and security reports | Partly | Contact details and `security.txt` live; contact form waits for `api.oxinov.com` |
| FR-SITE-2105 Cookie consent | Implemented | No trackers or non-essential cookies, so no banner is needed (tested) |
| FR-ID-2202 Email one-time code | Implemented | Keycloak email code through SES (sandbox until production access) |
| FR-ID-2201 Continue with Google | Partly | Flow scripted in `configure-realm.sh`; needs the owner's Google OAuth client |
| FR-ID-2204 No customer passwords | Partly | Sign-in has no password form; password-free registration is in progress |
| FR-ID-2205 First-sign-in welcome | Implemented | `app.oxinov.com/welcome` with policy acceptance |
| FR-ID-2207 Single sign-on across products | Implemented | One Keycloak session for `app.` and `edu.` |
| FR-ID-2209 Staff identities | Partly | Admin console not public; administrators need an authenticator-app code (TOTP); automation has its own service account. Separate staff realm and operator roles open |
| FR-POLICY-2401 Versioned policies | Partly | Policy pages live; text awaits legal review |
| FR-POLICY-2402 Acceptance records | Implemented | `PolicyAcceptance` in the platform database |
| FR-PLAN-2602 Automatic member access | Implemented | Granted on first sign-in (`accounts.service.ts`) |
| FR-PORTAL-3101 Account home, FR-PORTAL-3102 App launcher | Implemented (foundation) | `app.oxinov.com` |

## 1. Purpose and scope

The Oxinov Platform gives every person one Oxinov account that works across all launched Oxinov products, with simple sign-in, progressive verification, shared plans and billing, and consistent policies. Products own their workflows and data; the platform owns identity, trust, policies, organizations, entitlements, plans, payments ledger, KYC, notifications, messaging primitives, privacy requests, and the account portal.

Out of scope: product workflows such as courses, listings, job postings, and bookings (see each product FRD); Oxinov staff HR and finance systems.

Sources: [platform blueprint](../../01-company/platform-blueprint.md), [identity and access](../../04-architecture/identity-and-access.md), [platform policies](../../01-company/platform-policies.md), [subscription model](../../01-company/subscription-model.md), [brand](../../07-design/brand.md), and ADR-008 to ADR-013.

### Shared terms

| Term | Definition |
| --- | --- |
| Oxinov account | One person's identity, keyed by an immutable internal user ID |
| Trust level | T0 Visitor, T1 Member, T2 Contact-verified, T3 Identity-verified, T4 Business-verified; staff roles are separate |
| Entitlement key | A named capability such as `edu.ai_tutor`; products check keys, never plan names |
| Limit | A metered allowance such as `ai.credits.monthly` with a reset schedule |
| Organization | A customer group (company, school, cooperative) with members, roles, KYC status, and subscriptions |
| Launched product | A product that passed its release gate and is enabled in the product catalogue |
| Policy acceptance | An append-only record of a person accepting a specific policy version |

Store timestamps in UTC and display them in the user's time zone. Store money as currency plus integer minor units. Every protected read and write is authorized on the server.

## 2. Roles

| Role | Scope | Allowed actions |
| --- | --- | --- |
| Visitor (T0) | Public | Read public company, product, pricing, and legal pages |
| Member (T1–T4) | Own account | Manage own profile, sign-in methods, sessions, plans, privacy requests, and verification |
| Organization owner / admin | One organization | Manage members, roles, seats, billing, and organization KYC |
| Oxinov support agent | Staff | Read account metadata and cases; time-limited elevation with a reason for anything else |
| Oxinov trust reviewer | Staff | Review KYC and policy reports; cannot change plans or payments |
| Oxinov billing operator | Staff | Refunds, reconciliation, and plan operations within approval limits |
| Platform administrator | Staff | Product catalogue, plans, feature flags, and staff roles; cannot read product data by default |

Staff roles require a separate staff identity with MFA and are never granted by customer sign-in.

## 3. Functional requirements

### 3.1 Company website (SITE)

**FR-SITE-2101 — Company presence.** `oxinov.com` must present Oxinov Pvt. Ltd., its ten divisions, launched products, coming-soon products, research, careers, contact, and legal pages in English, readable through browser translation (no `translate="no"` except on brand names and code). Unlaunched products and divisions are labeled as future initiatives. *Changed 2026-09-26 by owner decision (ADR-020): English only; was English and Nepali.*
*Priority:* Must. *Status:* Proposed. *Access:* T0. *Source:* [blueprint](../../01-company/platform-blueprint.md).
- Acceptance: Given a visitor on any page, the header shows the Oxinov logo, division and product navigation, and a Sign in action.
- Acceptance: Given an unlaunched product, its page states "coming soon" and offers no sign-up or purchase.

**FR-SITE-2102 — Brand and themes.** Every public page must use the Oxinov design tokens and approved logo files, default to the dark theme, offer the light Daylight theme, meet WCAG 2.2 AA, and honor reduced-motion settings.
*Priority:* Must. *Status:* Proposed. *Access:* T0. *Source:* [brand](../../07-design/brand.md), [design system](../../07-design/design-system.md).
- Acceptance: Given a device with reduced motion enabled, no glitch, pulse, or scanline animation plays.
- Acceptance: Automated contrast checks fail the build on any text pair below 4.5:1.

**FR-SITE-2103 — Pricing page.** `oxinov.com/pricing` must list the Free, Plus, Pro, Business, and Enterprise plans, Oxinov One, and per-product features from the plan catalogue, with NPR prices and billing periods.
*Priority:* Must. *Status:* Proposed. *Access:* T0. *Source:* ADR-012.
- Acceptance: Given a plan change in the catalogue, the pricing page reflects it without a code release.
- Acceptance: Given an unpublished plan, it never appears on the page.

**FR-SITE-2104 — Contact and security reports.** Visitors must be able to send contact and security-disclosure messages through a form with abuse protection, and receive an acknowledgement.
*Priority:* Must. *Status:* Proposed. *Access:* T0. *Source:* [policies](../../01-company/platform-policies.md).
- Acceptance: Given a valid contact or security report, when submitted, then one case is recorded and an acknowledgement with its reference is returned without echoing sensitive content.
- Acceptance: Given repeated submissions from one source, rate limiting blocks further submissions and records a security event.

**FR-SITE-2105 — Cookie consent.** Non-essential cookies and analytics must stay off until the visitor opts in; the choice can be changed from the footer.
*Priority:* Must. *Status:* Proposed. *Access:* T0. *Source:* Cookie Policy.
- Acceptance: Given a visitor opts in and later withdraws consent, when the preference is saved, then new non-essential tracking stops and its removable cookies are cleared.
- Acceptance: Given a first visit, no analytics request is sent before consent.

### 3.2 Identity and sign-in (ID)

**FR-ID-2201 — Continue with Google.** A person must be able to sign in or create an Oxinov account with Google in one step. Only Google accounts with a verified email are accepted, and only email, name, and profile photo scopes are requested.
*Priority:* Must. *Status:* Proposed. *Access:* T0 → T1. *Source:* ADR-011.
- Acceptance: Given a new person with a verified Google email, when they choose Continue with Google, then an account is created and the welcome screen appears.
- Acceptance: Given a Google account with an unverified email, sign-in is refused with guidance to use an email code.

**FR-ID-2202 — Email one-time code.** A person must be able to sign in or create an account with a six-digit code sent to their email. Codes expire after 10 minutes, work once, and are rate-limited per email and per network source.
*Priority:* Must. *Status:* Proposed. *Access:* T0 → T1. *Source:* ADR-011.
- Acceptance: Given an expired or reused code, sign-in fails with a generic message.
- Acceptance: Error messages never reveal whether the email already has an account.

**FR-ID-2203 — Continue with Apple.** Apple sign-in must be available in iOS apps before they ship and must support hidden relay emails.
*Priority:* Must (before iOS release). *Status:* Proposed. *Access:* T0 → T1. *Source:* ADR-011.
- Acceptance: Given a relay email, the account works and notifications reach the relay address.
- Acceptance: Given Apple returns an invalid state, nonce, or token audience, when the callback is processed, then sign-in is refused and no account is linked.

**FR-ID-2204 — No customer passwords.** Customer accounts must not use passwords. Passkeys may be added as an optional method after launch.
*Priority:* Must. *Status:* Proposed. *Access:* All customers. *Source:* ADR-011.
- Acceptance: No customer-facing screen offers password creation or password reset.
- Acceptance: Given a customer submits a password credential directly to the identity endpoint, when authentication is evaluated, then it is refused without revealing account existence.

**FR-ID-2205 — First-sign-in welcome.** On first sign-in the platform must show one welcome screen with name and photo prefilled from the provider (editable), country, minimum-age confirmation, and a single **Agree and continue** action that records acceptance of the current Terms and Privacy Policy.
*Priority:* Must. *Status:* Proposed. *Access:* T0 → T1. *Source:* ADR-011, FR-POLICY-2401.
- Acceptance: Given a person below the minimum age for their country, the account is not activated.
- Acceptance: Returning users never see the welcome screen again unless a material policy change requires re-acceptance.

**FR-ID-2206 — Account linking.** Accounts are keyed by internal user ID. A verified email from a new sign-in method links to the existing account with that verified email; unverified emails never link. People can add or remove sign-in methods while at least one remains.
*Priority:* Must. *Status:* Proposed. *Access:* T1. *Source:* ADR-011.
- Acceptance: Given a new sign-in method, a notification is sent and an `auth` security event is emitted.
- Acceptance: Removing the last sign-in method is refused.

**FR-ID-2207 — Single sign-on across products.** A signed-in person must be able to open any launched Oxinov product without signing in again. Each product is a separate OIDC client with its own audience.
*Priority:* Must. *Status:* Proposed. *Access:* T1. *Source:* ADR-008, ADR-011.
- Acceptance: Given an active session, opening `edu.oxinov.com` from the app launcher lands signed in.
- Acceptance: Given a token issued for one product, another product's API rejects it.

**FR-ID-2208 — Sessions and sign-out.** Access tokens must last 5–15 minutes; refresh tokens rotate on use and are revoked on sign-out, suspension, or reuse detection. People can sign out of the current device or all devices, and see active sessions.
*Priority:* Must. *Status:* Proposed. *Access:* T1. *Source:* [identity and access](../../04-architecture/identity-and-access.md).
- Acceptance: Given sign-out of all devices, every product rejects that account's old refresh tokens.
- Acceptance: Given a reused refresh token, the whole token family is revoked and a security event is emitted.

**FR-ID-2209 — Staff identities.** Oxinov staff must use separate staff identities with mandatory MFA; staff roles cannot be obtained through customer sign-in.
*Priority:* Must. *Status:* Proposed. *Access:* Staff. *Source:* ADR-011.
- Acceptance: Given a staff identity with valid MFA and an assigned role, when it signs in, then only that role's authorized staff functions are available.
- Acceptance: Given a customer account with a staff email, it has no staff permissions.

### 3.3 Trust levels (TRUST)

**FR-TRUST-2301 — Trust level record.** The platform must hold each person's current trust level (T0–T4) and its history, and expose it to products through the platform API and token claims with bounded caching.
*Priority:* Must. *Status:* Proposed. *Access:* Products read; platform writes. *Source:* ADR-011.
- Acceptance: Given a trust level change, products see the new level within the documented cache lifetime.
- Acceptance: Given a product or customer supplies a higher trust level in a request, when authorization runs, then the claim is ignored and the platform-owned record is used.

**FR-TRUST-2302 — Phone verification (T2).** A person must be able to reach T2 by verifying a mobile number with an SMS one-time code. A number can verify only one account at a time.
*Priority:* Must. *Status:* Proposed. *Access:* T1 → T2. *Source:* ADR-011.
- Acceptance: Given a valid unclaimed number and unexpired code, when verification succeeds, then the account reaches T2 and the code cannot be reused.
- Acceptance: Given a number already verified on another account, verification is refused with a support route.

**FR-TRUST-2303 — Step-up prompts.** When a product action needs a higher level or an unaccepted policy, the API must return `TRUST_LEVEL_REQUIRED` or `POLICY_ACCEPTANCE_REQUIRED` with the required level or policy ID, and the client must show one step and return to the original action afterwards.
*Priority:* Must. *Status:* Proposed. *Access:* All products. *Source:* [error contract](../../06-api/api-errors.md).
- Acceptance: Given a T1 member trying to message a seller, the phone-verification step appears and messaging opens after success.
- Acceptance: Client-supplied trust levels are ignored by every API.

**FR-TRUST-2304 — Restrictions.** Operations must be able to restrict a role in one product, one product, or the whole account, with a reason code and appeal route; account suspension revokes sessions.
*Priority:* Must. *Status:* Proposed. *Access:* Trust reviewer. *Source:* [policies](../../01-company/platform-policies.md).
- Acceptance: Given a product-role restriction, other products remain usable.
- Acceptance: Given a reviewer without the required scope or reason, when they attempt a restriction, then it is refused and audited.

### 3.4 Policies (POLICY)

**FR-POLICY-2401 — Versioned policies.** Every policy must be published with an ID, version, effective date, and English text at `oxinov.com/legal/*`, stating that the English version is binding when read through a translator. *Changed 2026-09-26 by owner decision (ADR-020): English only; was English and Nepali.*
*Priority:* Must. *Status:* Proposed. *Access:* T0. *Source:* [policies](../../01-company/platform-policies.md).
- Acceptance: Given a new version, the previous version remains readable in the history.
- Acceptance: Given a policy draft without an ID, version, effective date, or reviewed English text, when publication is attempted, then it is refused.

**FR-POLICY-2402 — Acceptance records.** Acceptances must be append-only records with user ID, policy ID, version, timestamp, channel, and locale.
*Priority:* Must. *Status:* Proposed. *Access:* Platform. *Source:* [policies](../../01-company/platform-policies.md).
- Acceptance: Given a person accepts a published policy version, when recorded, then the exact version, actor, UTC time, and channel can be retrieved for audit.
- Acceptance: No API allows editing or deleting an acceptance record.

**FR-POLICY-2403 — Just-in-time role policies.** The first time a person takes a product role (Marketplace Seller, Provider, Employer, Instructor, Inspector Partner), the product must require acceptance of that role's policy before the action completes.
*Priority:* Must. *Status:* Proposed. *Access:* T2–T4. *Source:* ADR-011, ADR-013.
- Acceptance: Given the current role policy is accepted, when the person retries the original eligible action, then it continues without a second prompt.
- Acceptance: Given an unaccepted Marketplace Seller Policy, creating a listing returns `POLICY_ACCEPTANCE_REQUIRED`.

**FR-POLICY-2404 — Material changes.** A material policy change must require re-acceptance before the next protected action; a minor change sends a notification only.
*Priority:* Must. *Status:* Proposed. *Access:* T1+. *Source:* [policies](../../01-company/platform-policies.md).
- Acceptance: Given a material Terms change, the next protected request prompts re-acceptance.
- Acceptance: Given a minor change, when a protected action runs, then it is not blocked and one notification is sent.

### 3.5 Organizations (ORG)

**FR-ORG-2501 — Organizations and roles.** A member must be able to create an organization, invite members by email, assign owner, admin, and member roles, and remove members. The last owner cannot be removed.
*Priority:* Must. *Status:* Proposed. *Access:* T1 to create; owner/admin to manage. *Source:* ADR-008.
- Acceptance: Given an owner invites a member and assigns a permitted role, when the invitation is accepted, then membership exists only in that organization and the role change is audited.
- Acceptance: Given two organizations, members of one cannot read or change the other.

**FR-ORG-2502 — Organization switcher.** A person in several organizations must be able to switch the active organization in the portal and in every product header.
*Priority:* Should. *Status:* Proposed. *Access:* Member. *Source:* [design system](../../07-design/design-system.md).
- Acceptance: Given an organization switch, subsequent requests use only the new organization's context.
- Acceptance: Given a person supplies an organization where they have no active membership, when switching, then it is refused and the previous context remains active.

### 3.6 Plans and entitlements (PLAN)

**FR-PLAN-2601 — Plan catalogue.** Operators must be able to define plans as bundles of entitlement keys and limits, including Oxinov One and product plans, with regional prices and billing periods, without code changes.
*Priority:* Must. *Status:* Proposed. *Access:* Platform administrator. *Source:* ADR-012.
- Acceptance: Given a plan edit, existing subscribers keep their current terms until renewal unless the change adds benefits.
- Acceptance: Given a non-administrator or a plan with an invalid entitlement key, when saving, then the change is refused and no subscriber terms change.

**FR-PLAN-2602 — Automatic member access.** First sign-in must grant a free member entitlement to every launched product.
*Priority:* Must. *Status:* Proposed. *Access:* T1. *Source:* ADR-011.
- Acceptance: Given a newly launched product, existing members gain its free tier without action.
- Acceptance: Given an unlaunched or disabled product, when member entitlements are reconciled, then no entitlement or launcher entry is granted.

**FR-PLAN-2603 — Entitlement checks.** Products must check entitlement keys and remaining limits through the platform API; plan names are never checked in product code.
*Priority:* Must. *Status:* Proposed. *Access:* Products. *Source:* ADR-012.
- Acceptance: Given a revoked entitlement, the product denies the feature within the documented cache lifetime.
- Acceptance: Given a valid entitlement with remaining allowance, when the product checks it, then the feature is allowed without relying on a plan label.

**FR-PLAN-2604 — Usage metering.** Products must report usage events for metered limits; the platform enforces limits, resets them on schedule, and shows usage meters in the portal.
*Priority:* Must. *Status:* Proposed. *Access:* T1+. *Source:* ADR-012.
- Acceptance: Given an exhausted limit, the product shows the upgrade or wait message and blocks further use.
- Acceptance: Duplicate usage events with the same ID are counted once.

**FR-PLAN-2605 — Subscribe, change, and cancel.** Members and organization admins must be able to subscribe, upgrade, downgrade, and cancel from `app.oxinov.com/billing`. Downgrades and cancellations take effect at the end of the paid period.
*Priority:* Must. *Status:* Proposed. *Access:* T1 (personal), org admin (organization). *Source:* ADR-012.
- Acceptance: Given a cancellation, access continues until the period end and then returns to Free.
- Acceptance: Given a member without billing authority for an organization, when changing its plan, then the request is refused and no payment is initiated.

**FR-PLAN-2606 — Prepaid periods in Nepal.** The first release must sell prepaid 1, 3, 6, and 12-month periods through Nepal providers, with renewal reminders, a grace period, and one-tap renewal.
*Priority:* Must. *Status:* Proposed. *Access:* T1+. *Source:* [subscription model](../../01-company/subscription-model.md).
- Acceptance: Given a period ending in 7 days, the person receives a renewal reminder.
- Acceptance: Given a renewal payment is not verified by the paid-through date plus grace period, when access is checked, then paid entitlements end without creating debt or a stored balance.

**FR-PLAN-2607 — App-store subscriptions.** In-app digital subscriptions on Android and iOS must use store billing where store rules require it; receipts and renewal notifications are verified server-side and unlock the same entitlements everywhere.
*Priority:* Must (before paid mobile release). *Status:* Proposed. *Access:* T1+. *Source:* ADR-012.
- Acceptance: Given an active store subscription, the web portal shows the plan and its channel.
- Acceptance: Given a second purchase of the same plan on another channel, the person is warned before paying.

### 3.7 Payments ledger (PAY)

**FR-PAY-2701 — Verified payments only.** Access, orders, and subscriptions must be granted only after server-side verification of the provider result. Browser redirects never grant anything.
*Priority:* Must. *Status:* Proposed. *Access:* Platform. *Source:* ADR-008, AGENTS.
- Acceptance: Given the provider API verifies the expected amount, currency, payee, and completed state, when the result is applied, then the related access or order transition occurs once.
- Acceptance: Given a forged success redirect, no entitlement or order state changes.

**FR-PAY-2702 — Idempotent ledger.** Every provider event must be stored once by provider event ID and applied to one internal ledger of orders, payments, refunds, escrow states, and payouts.
*Priority:* Must. *Status:* Proposed. *Access:* Platform. *Source:* ADR-012, ADR-013.
- Acceptance: Given the same webhook delivered twice, the ledger changes once.
- Acceptance: Given an invalid webhook signature, the event is rejected and a security event is emitted.

**FR-PAY-2703 — Escrow without stored value.** Escrow for marketplace orders must be recorded as ledger states while funds are held only by a licensed bank escrow or payment provider. Oxinov never holds a customer balance.
*Priority:* Must (before escrow orders). *Status:* Proposed. *Access:* Platform, Commodity Market. *Source:* ADR-013.
- Acceptance: Given a licensed provider confirms funds held for an order, when recorded, then the ledger shows the provider and order-specific escrow state rather than a customer balance.
- Acceptance: No screen or API shows a spendable Oxinov balance.

**FR-PAY-2704 — Refunds and reconciliation.** Billing operators must be able to issue full or partial refunds within approval limits, and the platform must reconcile ledger records with provider reports daily.
*Priority:* Must. *Status:* Proposed. *Access:* Billing operator. *Source:* Payments, Escrow, Refunds, and Disputes Policy.
- Acceptance: Given an authorized refund within the operator's limit, when the provider confirms it, then the ledger, entitlement or order, and receipt update once.
- Acceptance: Given a reconciliation mismatch, an alert is raised to billing operations.

**FR-PAY-2705 — Invoices.** The platform must issue invoices and receipts in NPR with Oxinov Pvt. Ltd. details and applicable tax once tax treatment is confirmed.
*Priority:* Must. *Status:* Proposed. *Access:* Payer. *Source:* [subscription model](../../01-company/subscription-model.md).
- Acceptance: Given a completed payment, the invoice is downloadable from the portal.
- Acceptance: Given a different payer or an unverified payment, when an invoice is requested, then the response is "not found" and no tax document is issued.

### 3.8 Verification (KYC)

**FR-KYC-2801 — Individual verification (T3).** A T2 member must be able to submit identity documents for review. Approval sets T3; rejection records a reason and allows resubmission.
*Priority:* Must (before seller, provider, or payout features). *Status:* Proposed. *Access:* T2 → T3. *Source:* ADR-011.
- Acceptance: Given a trust reviewer approves complete valid evidence, when the decision is recorded, then the person reaches T3 and products receive only the level and status.
- Acceptance: Given a rejected submission, the person sees the reason and can resubmit.

**FR-KYC-2802 — Business verification (T4).** An organization owner must be able to submit registration and tax documents. Approval sets T4 for the organization.
*Priority:* Must (before employer, dealer, or cooperative features). *Status:* Proposed. *Access:* Org owner. *Source:* ADR-011.
- Acceptance: Given T4 approval, organization members act as the verified business only within that organization.
- Acceptance: Given a member who is not an owner or a reviewer outside the case scope, when they request the evidence, then access is refused.

**FR-KYC-2803 — Document protection.** KYC documents must be stored privately and encrypted, visible only to trust reviewers through short-lived access, with every view audited. Products receive only status and level.
*Priority:* Must. *Status:* Proposed. *Access:* Trust reviewer. *Source:* [privacy](../../09-security/privacy.md).
- Acceptance: Given an assigned reviewer requests an unexpired document link, when opened, then the view is authorized, time-limited, and audited without document content in logs.
- Acceptance: Given a product API request for a document, access is denied.

**FR-KYC-2804 — Retention.** Rejected document images must be deleted after the retention period; approved ones are deleted when the legal period ends, keeping only status and decision metadata.
*Priority:* Must. *Status:* Proposed. *Access:* Platform. *Source:* [retention](../../05-data/data-retention.md).
- Acceptance: A scheduled job deletes expired images and records a minimal audit entry.
- Acceptance: Given a documented active legal hold, when the normal deletion date arrives, then only the held evidence is preserved until the hold's reviewed end.

### 3.9 Notifications (NOTIF)

**FR-NOTIF-2901 — Delivery channels.** Products must send email, push, SMS, and in-app notifications through the platform notification service using plain-English templates that work with browser and email-client translation (ADR-020).
*Priority:* Must. *Status:* Proposed. *Access:* Products. *Source:* ADR-008, ADR-020.
- Acceptance: Given a product submits a valid versioned template and recipient event, when delivery succeeds, then each enabled channel records one final delivery status without message content in logs.
- Acceptance: Given a delivery failure, the service retries and records the final status.

**FR-NOTIF-2902 — Preferences.** People must be able to choose which non-essential notifications they receive per product and channel. Security and transaction notices cannot be disabled.
*Priority:* Must. *Status:* Proposed. *Access:* T1. *Source:* [privacy](../../09-security/privacy.md).
- Acceptance: Given marketing email disabled, no marketing email is sent.
- Acceptance: Given a security or transaction event, when the user has disabled marketing, then the required notice is still delivered through its configured essential channel.

### 3.10 Messaging (MSG)

**FR-MSG-3001 — Conversations.** The platform must provide conversation and message primitives that products use for buyer–seller, seeker–provider, and employer–candidate messaging, scoped to a product and a related record.
*Priority:* Should. *Status:* Proposed. *Access:* T2. *Source:* ADR-010.
- Acceptance: Given a conversation, only its participants and authorized moderators can read it.
- Acceptance: Given a participant posts a valid message, when the related record is active, then it appears once in that scoped conversation with actor and UTC time.

**FR-MSG-3002 — Safety.** People must be able to block and report users; messages with off-platform payment links show a warning.
*Priority:* Should. *Status:* Proposed. *Access:* T2. *Source:* [threat model](../../09-security/threat-model.md).
- Acceptance: Given a block, the blocked user can no longer send messages to that person.
- Acceptance: Given a report, when submitted, then a moderation case is created without exposing the reporter to the reported person.

### 3.11 Account portal (PORTAL)

**FR-PORTAL-3101 — Account home.** `app.oxinov.com` must show the person's products, plan, usage meters, verification level, organizations, and security status.
*Priority:* Must. *Status:* Proposed. *Access:* T1. *Source:* [blueprint](../../01-company/platform-blueprint.md).
- Acceptance: Given a new member, all launched products appear with their free tier.
- Acceptance: Given another person's account or organization identifier, when supplied to the portal, then no data outside the signed-in person's memberships is shown.

**FR-PORTAL-3102 — App launcher.** Every Oxinov web app must show the shared app launcher and account menu with the same behavior.
*Priority:* Must. *Status:* Proposed. *Access:* T1. *Source:* [design system](../../07-design/design-system.md).
- Acceptance: Given an unlaunched product, it is absent from the launcher.
- Acceptance: Given a launched entitled product, when selected, then its registered URL opens and the existing identity session is reused.

### 3.12 Privacy (PRIV)

**FR-PRIV-3201 — Export.** People must be able to request an export of their data across all products and download it within a published time.
*Priority:* Must. *Status:* Proposed. *Access:* T1. *Source:* [privacy](../../09-security/privacy.md).
- Acceptance: The export includes platform data and each launched product's data for that person.
- Acceptance: Given an export request for another person or organization, when authorization runs, then it is refused and no export job is created.

**FR-PRIV-3202 — Deletion.** People must be able to request account deletion with confirmation and a waiting period; deletion propagates to every product, keeping only records the law requires.
*Priority:* Must. *Status:* Proposed. *Access:* T1. *Source:* [retention](../../05-data/data-retention.md).
- Acceptance: Given a completed deletion, sign-in with the old methods creates a new, empty account.
- Acceptance: Given legally retained records, when deletion completes, then the person is told the category and end condition while those records remain excluded from ordinary product use.

### 3.13 Operations (OPS)

**FR-OPS-3301 — Audited staff support.** Support agents must request time-limited elevation with a reason to view account details beyond metadata; every elevation and action is audited.
*Priority:* Must. *Status:* Proposed. *Access:* Staff. *Source:* ADR-008.
- Acceptance: Given expired elevation, further access is denied.
- Acceptance: Given an authorized elevation with a valid reason and scope, when support accesses the case, then only scoped fields are visible and every action is audited.

**FR-OPS-3302 — Product catalogue and flags.** Platform administrators must be able to enable a product only after its release gate is recorded, and control features by market with flags.
*Priority:* Must. *Status:* Proposed. *Access:* Platform administrator. *Source:* [blueprint](../../01-company/platform-blueprint.md).
- Acceptance: Given a product without a recorded release gate, it cannot be enabled.
- Acceptance: Given an approved product and market flag, when an administrator enables it, then only eligible users in that market see it and the change is audited.

## 4. Product dependencies

| Product | Platform requirements it depends on |
| --- | --- |
| Oxinov Edu | FR-ID-2201–2208, FR-PLAN-2602–2605, FR-PAY-2701–2702, FR-POLICY-2403 (instructors), FR-PORTAL-3102 |
| Oxinov Commodity Market | FR-TRUST-2302–2304, FR-POLICY-2403, FR-PAY-2701–2703, FR-KYC-2801–2803, FR-MSG-3001–3002 |
| Oxinov HR (managed recruitment and direct hiring) | FR-TRUST-2302–2304, FR-KYC-2801–2802, FR-POLICY-2403, FR-PAY-2701–2702, FR-MSG-3001–3002 |
| Oxinov Services Market | FR-TRUST-2302–2304, FR-KYC-2801–2802, FR-PAY-2701–2702, FR-MSG-3001–3002 |

## 5. Open decisions

Minimum age by country, SMS and KYC providers, escrow bank partner, email one-time-code implementation in Keycloak, final plan prices and free limits, and tax treatment. See [risks and decisions](../../11-planning/risks.md).
