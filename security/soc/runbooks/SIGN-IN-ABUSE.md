# Sign-in abuse runbook

For customer sign-in at `id.oxinov.com` (the `oxinov` realm): email codes, no passwords (FR-ID-2202, FR-ID-2204).

## Trigger

- A Prometheus `oxinov-identity` alert ([rules](../../../monitoring/prometheus/rules/oxinov-alerts.yml)):
  - many wrong codes;
  - many unknown emails;
  - account lockouts;
  - failing sign-in email;
  - most sign-ins failing.
- In the mail relay logs, many `mail.limited` events (the relay refuses more than 5 emails to one address in 15 minutes).
- A person reports codes they did not request.

## Triage and containment

1. **Preserve evidence.** Keycloak events are kept 365 days: in the admin console, open **Events** in the `oxinov` realm, or use `kcadm.sh get events -r oxinov`. Also keep the mail relay's `mail.sent`, `mail.limited`, and `mail.failed` lines (`oxctl logs mail-relay`) and Traefik access logs for source addresses. Events hold user IDs and IP addresses, never codes.
2. **Decide which case it is:**
   - **Guessing codes** (wrong codes): each account locks after 5 failures, and Keycloak waits up to 15 minutes. Check whether one source address is hitting many accounts.
   - **Testing emails** (unknown emails): someone is checking which addresses have accounts.
   - **Inbox flooding** (`mail.limited`): repeated "Send a new code" or sign-in attempts against one address.
   - **Email failing** (`email_send_failed`): usually SES (sandbox, quota, suppression) or the relay, not an attack. See the SES points in the [production runbook](../../../devops/kubernetes/README.md).
3. **Contain only through approved controls.** Block an abusive source address at Traefik, or tighten the relay limits (`MAIL_LIMIT_PER_RECIPIENT`, `MAIL_LIMIT_WINDOW_SECONDS`, `MAIL_LIMIT_PER_MINUTE`). Do not turn off brute-force protection, and do not unlock accounts in bulk.
4. **If a code was shared or an account looks taken over,** follow the [account takeover runbook](ACCOUNT-TAKEOVER.md): sign the account out of every device (**Users**, then the user, then **Sessions**), and confirm the owner through `support@oxinov.com` before changing the account email.

## Recovery

- Lift blocks when the traffic stops.
- Tune the alert thresholds against real traffic.
- Add the source pattern to detections if it recurs.
- Record the incident and any customer communication.
- If email delivery failed, confirm with the local sign-in smoke test (`node devops/keycloak/signin-smoke.mjs`) and a real production sign-in before closing.
