# UI and UX rules

Every Oxinov product uses the shared Oxinov shell (header, app launcher, account menu, footer, sign-in, upgrade and verification prompts) from the [design system](../../07-design/design-system.md), so people move between products with one account and one familiar layout. The rules below add LMS-specific behavior.

## Product evidence rule

The [user-centred product research and usability standard](../../12-research/user-centered-product-standard.md) is normative for every product. A material journey starts from an evidence-backed user need, is tested with intended users before build, and is benchmarked end to end before release. Research evidence links through the user need, FR/NFR, design, implementation, acceptance evidence, and live outcome.

The cyberpunk visual system is subordinate to usability. Reduce effects and use Calm intensity whenever comprehension, trust, performance, accessibility, bright outdoor use, or long reading would suffer. Stakeholder preference, visual polish, AI-generated personas, and analytics alone do not replace observed user behavior.

## Company-wide interaction rules

- Give every screen one clear purpose and primary action; use users' words instead of internal platform terms.
- Ask for phone, KYC, payment, policy, organization, and advanced configuration only when the intended action requires them.
- Show total price, fees, renewal, responsibility, data use, status, consequence, and next step before commitment.
- Preserve valid input and drafts, make retry idempotent, and return users to their intended action after sign-in, verification, payment, or reconnection.
- Design in plain English that translates well (ADR-020) and test pages through browser translation (a long-word language, a non-Latin script, and right-to-left), mobile and desktop, low-bandwidth recovery, light and dark themes, keyboard and assistive technology, and low digital confidence.
- Provide visible support, report, dispute, appeal, export, and deletion paths where relevant.

## LMS-specific rules

Make the active LMS workspace and role visible on every administrative screen. Keep navigation consistent across web and mobile: Discover, My Learning, Exams, Chat, and role-specific Manage. Show published course information, final price, prerequisites, and access terms before purchase.

Long authoring tasks use drafts and autosave. Destructive or financial actions show the affected tenant and records before confirmation. AI proposals show editable diffs before saving. Loading, empty, error, offline, and retry states are required for each primary flow.

Support the named writing systems and right-to-left Arabic content. See [design system](../../07-design/design-system.md) and [accessibility](../../07-design/accessibility.md).
