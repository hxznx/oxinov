# Data retention and deletion

Retention periods are product and legal decisions for each launch region. The periods below are proposed defaults for review by the data owner and qualified Nepal counsel before launch; they are not legal conclusions. Financial records and legally held security evidence may need longer retention than user-facing content.

## Proposed defaults

| Data | Owner | Proposed retention |
| --- | --- | --- |
| Oxinov account profile and sign-in methods | Platform | Life of account; deleted within 30 days of a verified deletion request |
| Sessions and refresh tokens | Identity provider | Until expiry or revocation |
| Email and SMS one-time codes | Identity provider / platform | Until use or 10-minute expiry; attempt counters 24 hours |
| Policy acceptance records | Platform | Life of account plus the legal limitation period |
| KYC documents (images) | Platform | Rejected: 90 days after decision. Approved: while the verified role is active plus the legally required period; then delete images and keep only status, reviewer, and decision date |
| Orders, bookings, payments, refunds, invoices | Product and platform ledger | As required by Nepal tax and accounting law |
| Marketplace messages | Product | 2 years after the related order, booking, or application closes, unless held for a dispute |
| Job applications and CVs | Jobs | 12 months after the posting closes, unless the candidate opts into a longer talent pool |
| Listings, service offers, job postings | Product | Life of account; archived listings 2 years |
| Reviews | Product | Life of the reviewed profile; reviewer identity removed on account deletion |
| LMS recordings, exams, results, certificates | LMS | Per tenant owner settings and LMS requirements |
| Audit logs | Platform and products | At least 1 year online, longer where law requires |
| Security events and incident evidence | Security | Per SOC retention and legal hold |
| Backups | Operations | Expire on a documented schedule so deleted data leaves backups |

## Export and deletion

- A person can export their data from every product through the account portal.
- A tenant owner can request LMS export before cancellation.
- Suspension preserves data. Deletion requires identity verification, a documented delay, removal from live stores and caches in every product, and a backup-expiry schedule.
- Records that the law requires Oxinov to keep, such as invoices, are retained with the minimum personal data and excluded from deletion until their period ends.
- Keep a minimal deletion audit record without retaining private content. See [privacy](../security/PRIVACY.md).
