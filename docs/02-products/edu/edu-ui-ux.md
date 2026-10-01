# UI and UX rules

Every Oxinov product uses the shared Oxinov shell (header, app launcher, account menu, footer, sign-in, upgrade and verification prompts) from the [design system](../../07-design/design-system.md), so people move between products with one account and one familiar layout. The rules below add LMS-specific behavior.

**Status:** Current · **Owner:** Founder · **Last reviewed:** 2026-10-01

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

## Oxinov store (ADR-028)

The store is a fusion of futuristic, gaming, and cyberpunk interfaces: HUD frames with clipped corners, corner brackets, and thin rule lines; neon cyan and magenta accents on near-black; monospace labels such as `// LANGUAGES` and `SYS.READY`; game-style level badges, progress bars, and "unlocked" states. The store home hero uses **Full** intensity; other discovery pages (categories, offering pages, "My learning") use **Standard**. Checkout, payment review, reading PDFs, watching lessons, and exams use **Calm** intensity, as the design system requires.

| Screen | Purpose and primary action |
| --- | --- |
| Store home | Hero with the Oxinov promise, category rails (Languages, Technology, Ideas and research), featured offerings with "from NPR 5,000"; primary action **Explore** |
| Offering page | Kind badge, introduction video, syllabus, free items playable, locked items with a lock icon, live sessions, instructor; plan cards (1 month, 6 months, 1 year, Lifetime) showing price and the exact end date; primary action **Choose plan** |
| Checkout | Calm: plan summary, bank QR with account name, amount, and reference, then transaction ID and screenshot; primary action **Submit for review**; card payment appears when available |
| Payment status | "In review", "Approved", or "Rejected" with the reason and the next step; the support address is always visible |
| My learning | Each offering with progress, level badge, access end date or "Lifetime", and **Continue**; renewal call to action before expiry |
| Player and viewer | Calm: video or document fills the frame, watermark with the learner's email, no download control, chapter list beside or below |
| Admin: payments | Calm: oldest review first, evidence inline, **Approve** and **Reject with reason** |
| Admin: offering | Kind, category, plans and prices, free or subscriber per item, YouTube or Drive address per lesson, live sessions |
| Account centre | Windows-Settings layout: profile card with level, menu (subscriptions, activity, notifications, messages and OXI, certificates, invite friends, profile, privacy); sign out, sign out everywhere, download data, delete account with typed confirmation |
| Messages | Conversations with OXI (rule-based course advisor until the AI gateway exists), Oxinov support, instructors, and read-only notices; suggestion chips and "Talk to a human" |
| Admin: Studio dashboard | Same layout: grouped menu (Overview, Content, Sales, People, System), figures from recorded data only, "Needs you" list, send a notice, give free access, OXI settings, learners table |
| Admin: course builder | Outline (drag to reorder), lesson editor, settings; paste many links; duplicate as template; publish checklist; "Design with AI" |
| Admin: AI course designer | Prompt, options (kind, category, level, language, length), extras; draft labeled "AI draft"; accept, redo, or edit per chapter; opens in the builder, never publishes |
| Admin: quizzes, media, team, learners | Quiz editor with answer key and AI drafts marked unchecked; media library with link health; team roles table and audit log; learner list with segments, bulk actions, and detail |
| Admin: share kit | Post image in four sizes, caption (AI drafts checked by a person), tracked link per network, optional campaign coupon |

Prices always show the currency, the full amount, and what the plan includes before commitment. Locked items show the title so learners know what they will get, never the content.

Management screens for learners and administrators follow the Windows 11 Settings pattern in Oxinov colors: left menu with a profile card and search, a "Section › Item" heading, and expandable rows holding dropdowns, switches, and **Edit** buttons. On a phone the menu becomes a list of rows and actions sit in a bottom bar.

## Expert review of the store (2026-10-01)

A review of the store as a place to sell courses, skills, ideas, and intellectual property found these gaps; each now has a requirement and a screen on the design canvas.

| Finding | Why it matters | Fix |
| --- | --- | --- |
| A phone cannot scan a QR code shown on its own screen | Most learners browse and pay on the same phone, so checkout would stall | Save QR to gallery, copy buttons, WhatsApp help, review time (FR-CATALOG-314) |
| New learners face a full store with no direction | Choice overload delays the first lesson | Three-question goal setup and a suggested path that starts free (FR-AUTH-105) |
| Courses are sold one by one | Learners want an outcome, not a course; one-by-one sales leave money on the table | Mission paths with progress and an optional bundle (FR-CATALOG-312) |
| Ideas and research were sold like courses | Buyers of intellectual property need to know what they may do with it | Abstract, contents, samples, version, "you may / you may not", commercial license (FR-CATALOG-313) |
| Offering pages lacked buying information | People pay when they can see what they get and what happens if it is wrong | Included list, monthly cost per plan, certificate preview, FAQ with the refund or change policy (FR-CATALOG-315) |
| Slow and costly mobile data in Nepal | Video stalls lose learners | Data saver (FR-PLAYER-407) |
| The owner cannot see where buyers drop off | Without it, design changes are guesses | Sales funnel per offering (FR-ANALYTICS-806) |
| Manual review is slow and error-prone | Reused receipts and wrong amounts slip through | Automatic match checks that block reused transaction IDs (FR-MGMT-1405) |
| Phone navigation differed between screens | Learners get lost | One bottom bar everywhere: Store, Learn, Live, Chat, Account |
| Returning learners started from the store top | Momentum is lost | "Continue where you left off" at the top of the store |

Never fill trust areas with invented numbers: reviews, ratings, learner counts, and results appear only from real data, and bundle prices and the refund policy wait for the owner.

Support the named writing systems and right-to-left Arabic content. See [design system](../../07-design/design-system.md) and [accessibility](../../07-design/accessibility.md).
