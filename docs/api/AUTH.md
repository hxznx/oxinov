# Authentication and authorization

An approved OpenID Connect provider verifies identity; Keycloak is the company-platform default. PostgreSQL holds platform organizations and product entitlements, while the LMS database holds tenant memberships, roles, instructor approval, ownership, and LMS access rules. The backend verifies the token issuer, audience, signature, expiry, organization/product entitlement where applicable, tenant membership, role, ownership, and object tenant before protected work. A supplied organization ID, tenant ID, or email address is never sufficient proof of access.

Platform operator support access is time-limited, reasoned, and audited. Tenant owners control tenant administration; only platform operators grant platform roles. Use MFA for administrators. Webhooks authenticate with provider signatures, not user sessions. See [tenant isolation](../security/SECURITY.md).
