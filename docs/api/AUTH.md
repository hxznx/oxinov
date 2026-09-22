# Authentication and authorization

Clerk verifies identity. PostgreSQL holds tenant memberships, roles, instructor approval, ownership, and access entitlements. The backend verifies the identity token, tenant membership, role, ownership, and object tenant before protected work. A supplied tenant ID or email address is never sufficient proof of access.

Platform operator support access is time-limited, reasoned, and audited. Tenant owners control tenant administration; only platform operators grant platform roles. Use MFA for administrators. Webhooks authenticate with provider signatures, not user sessions. See [tenant isolation](../security/SECURITY.md).
