# Authentication and authorization

Customers sign in once at `id.oxinov.com` with Google or an email one-time code and use every launched Oxinov product with the same session. The sign-in experience, trust levels, and policy acceptance are defined in [identity and access](../04-architecture/identity-and-access.md).

An approved OpenID Connect provider verifies identity; Keycloak is the company-platform default. The platform PostgreSQL database holds users, trust levels, policy acceptances, KYC status, organizations, and product entitlements. Each product database holds its own memberships, roles, and ownership; the LMS database holds tenant memberships, roles, instructor approval, and LMS access rules.

Before protected work, the backend verifies:

1. token issuer, audience, signature, expiry, and required scopes;
2. product entitlement from the platform (the member entitlement is granted automatically on first sign-in);
3. the trust level and product-role policy acceptance required by the action;
4. product or tenant membership, role, and ownership of the target object;
5. that the object belongs to the same tenant or owner scope.

A supplied organization ID, tenant ID, user ID, or email address is never sufficient proof of access. A lower trust level returns a stable `TRUST_LEVEL_REQUIRED` error with the required level so clients can show the next verification step.

Platform operator support access is time-limited, reasoned, and audited. Tenant owners control tenant administration; only platform operators grant platform roles. Staff and organization administrators must use MFA. Webhooks authenticate with provider signatures, not user sessions. See [tenant isolation](../09-security/security-baseline.md).
