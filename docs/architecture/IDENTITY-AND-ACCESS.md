# Oxinov identity and access

One Oxinov account gives a person access to every launched Oxinov product. Signing in is as simple as a mainstream consumer AI product: one tap with Google, or an email one-time code, with no password to create. Stronger checks happen later and only when a person wants to do something that needs them, such as selling, posting a job, offering a service, or receiving money. This document is the source of truth for sign-in, single sign-on, trust levels, and policy acceptance. See [ADR-011](ADR.md#adr-011-one-oxinov-account-with-simple-sign-in-and-progressive-trust).

## Sign-in experience

```text
id.oxinov.com

        Oxinov
  Welcome to Oxinov

  [ G  Continue with Google ]
  [    Continue with Apple  ]      shown in iOS apps and on Apple devices
  ──────────── or ────────────
  [ you@example.com         ]
  [        Continue         ]      sends a 6-digit one-time code

  By continuing you agree to the Oxinov Terms and Privacy Policy.
```

| Method | Availability | Notes |
| --- | --- | --- |
| Continue with Google | Launch, web and mobile | Primary method. Accept only Google accounts whose email is verified. |
| Email one-time code | Launch, web and mobile | Six-digit code, 10-minute expiry, single use, rate-limited per email and IP. Works for people without Google. |
| Continue with Apple | Before the iOS app ships | Apple App Store rules require an equivalent privacy-focused option when third-party sign-in is offered in an iOS app. Handle hidden relay emails. |
| Passkeys | After launch | Optional faster sign-in and phishing-resistant second factor. |
| Microsoft / work accounts | When business customers request it | Enterprise SSO for customer organizations through identity brokering. |
| Password | Not offered to customers | Avoids password reuse, reset support load, and credential-stuffing risk. |

Rules:

- A new person reaches the product in at most two screens: choose a method, then one welcome screen on first sign-in only.
- The welcome screen shows the name and photo from Google (editable), asks for country and confirms minimum age, and has one **Agree and continue** button that records acceptance of the current Oxinov Terms and Privacy Policy.
- Returning users with a live session go straight to the product with no prompt.
- Error messages never reveal whether an email already has an account.

## Single sign-on across products

- `id.oxinov.com` runs the OIDC provider (Keycloak by default, per ADR-008). Every Oxinov web app, mobile app, and API is a separate OIDC client with its own audience.
- Web apps use the authorization code flow with PKCE through their own backend (backend-for-frontend); tokens are kept in secure, HTTP-only, same-site cookies, not browser storage. Mobile apps use the system browser with PKCE and store refresh tokens in the platform secure store.
- Opening another Oxinov product reuses the `id.oxinov.com` session, so the user never signs in twice. The product launcher in every app header links to the account portal and all launched products.
- Access tokens last 5–15 minutes. Refresh tokens rotate on use and are revoked on sign-out, suspension, or suspected theft. The default remembered session is 30 days of activity.
- **Sign out** ends the session in the current app and at `id.oxinov.com`; **Sign out of all devices** is available in the account portal.

## Account linking

- One person has one Oxinov account keyed by an immutable internal user ID, never by email.
- If a Google sign-in presents a verified email that matches an existing account, link it automatically. Never link an unverified email.
- People can add or remove sign-in methods in the account portal as long as one remains. Adding or removing a method emits a security event and a notification.

## Universal product access

- On first sign-in the platform grants a free **member** entitlement to every launched product. A person does not have to sign up again for each product.
- Paid plans, organization seats, and higher limits are extra entitlements from the control plane.
- Product roles stay inside each product. Being a seller in Commodity Market does not grant anything in Oxinov Jobs or OxinovLMS.
- A product that has not passed its release gate is invisible and grants nothing.

## Progressive trust levels

Easy sign-in gives low-risk access. Actions that can harm other people or move money require a higher, verified trust level plus acceptance of the relevant product policy. The platform owns trust levels; each product checks the level it needs for each action.

| Level | How it is reached | Examples of what it allows |
| --- | --- | --- |
| T0 Visitor | Not signed in | Read the company site, public listings, jobs, services, and course catalogues |
| T1 Member | Signed in with a verified email and accepted the Oxinov Terms and Privacy Policy | Free courses, save items, follow, basic profile, browse all products |
| T2 Contact-verified | Verified mobile number by SMS one-time code | Message other users, place orders, book services, apply to jobs, write reviews |
| T3 Identity-verified | Individual KYC approved by Oxinov operations | Sell in Commodity Market (produce, equipment, second-hand items), offer services, receive payouts, become an instructor |
| T4 Business-verified | Organization KYC approved for a platform organization | Post jobs as an employer, sell as a registered business, dealer, or cooperative, manage staff |
| Staff | Separate staff identity, hardware-key or authenticator MFA required | Moderation, KYC review, support elevation; never granted by Google sign-in alone |

A person at a lower level who tries a higher-level action sees one clear step to reach it, for example "Verify your phone to message sellers", and then returns to the action.

## Policy acceptance

- The Oxinov Terms and Privacy Policy are accepted once at T1. Each product role has a short product policy accepted just in time the first time the person takes that role: Marketplace Seller Policy, Provider Policy, Employer Policy, Instructor Policy, and the Inspector Partner Agreement.
- Every acceptance is stored with user ID, policy ID, version, timestamp, and channel. A material policy change asks for re-acceptance on the next visit; minor changes are notified only.
- Policies and enforcement are described in [platform policies](../company/PLATFORM-POLICIES.md).

## Enforcement

- Restrictions are scoped: a role in one product, one product, or the whole Oxinov account for severe or repeated violations.
- Suspension revokes refresh tokens and blocks new product sessions within one access-token lifetime.
- Every restriction records a reason code, actor, and appeal route, and emits audit and security events.

## Data ownership

| Data | Owner |
| --- | --- |
| Sign-in methods, sessions, MFA | Identity provider (`id.oxinov.com`) |
| Oxinov user profile, country, trust level, policy acceptances, organizations, entitlements, KYC status and documents | Platform control plane database |
| Product profile, product roles, and product activity | Each product database, referencing the platform user ID |

Products receive trust level and entitlements through the platform API or token claims with bounded caching; they never read the platform database.

## Security requirements

- Validate issuer, audience, signature, expiry, and nonce; use PKCE for every client; allow only registered redirect URIs.
- Rate-limit one-time codes and sign-in attempts; detect credential stuffing and impossible travel; emit `auth.*` security events.
- Staff and organization administrators must use MFA; customer passkeys and optional MFA are available in the account portal.
- Never log tokens, codes, or Google profile payloads.
