# Account takeover runbook

## Trigger

Suspicious administrator sign-in, MFA removal, session creation, privileged role assignment, or confirmed stolen credentials.

## Triage and containment

1. Preserve identity-provider, application audit, role-change, source, and session events.
2. Verify changes through a trusted contact channel with the tenant owner or platform security owner.
3. Revoke affected sessions and credentials, require password reset and MFA recovery, and suspend privileged actions when authorized.
4. Review role, payout, refund, export, content-publication, and API-token changes made during the suspected period.

## Recovery

Restore authorized roles and configuration from audited state, rotate affected credentials, confirm MFA, and monitor the account for recurrence. Record customer communication and lessons learned.
