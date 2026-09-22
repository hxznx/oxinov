# External integrations

| System | Purpose | Required controls |
| --- | --- | --- |
| Clerk | Identity and sessions | Map identity to tenant membership; verify tokens server-side. |
| Stripe | Web payments, SaaS plans, Connect payouts | Verify webhook signatures, event IDs, tenant/account mapping, and reconciliation. |
| Apple/Google billing | Mobile digital purchases where required | Verify receipts server-side; normalize entitlements. |
| Mux | Hosted recorded video | Signed playback, upload callbacks, tenant media mapping. |
| Email/push providers | Verification, announcements, alerts | Templates, opt-in, retries, delivery status. |
| AI provider | Draft content and configuration | Tenant permission, limits, review, prompt/data minimization. |

Provider credentials live in a secrets manager, never in the repo. See [API](../api/API-SPEC.md) and [secrets policy](../security/SECRETS-MANAGEMENT.md).
