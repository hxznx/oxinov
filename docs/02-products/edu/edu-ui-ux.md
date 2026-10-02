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
| Admin: settings | Payment details (bank QR upload, account, reference prefix, review time, help contact), default prices, coupons, policies, email allowance, store look |
| Payment rejected | Calm: the reviewer's reason, what to do, **Fix and resubmit** on the same payment, message support; free lessons stay open |
| Emails and receipt | Welcome, thank-you, rejection with a fix link, renewal reminder; printable receipt with company and tax details |

Prices always show the currency, the full amount, and what the plan includes before commitment. Locked items show the title so learners know what they will get, never the content.

Management screens for learners and administrators follow the Windows 11 Settings pattern in Oxinov colors: left menu with a profile card and search, a "Section › Item" heading, and expandable rows holding dropdowns, switches, and **Edit** buttons.

**Built so far (2026-10-02):** Oxinov Studio lives at `/w/{slug}/studio` for the owner and administrators: a left menu grouped Overview, Content, Business, and System with the workspace card and a lit bar on the current section; the dashboard (live tiles and the "Needs you" list); Offerings and prices (sale state per offering and its plans); Payments (review queue and the review page); Learners and join codes; and Settings with collapsible groups (payment details with the QR, default prices, policies, coupons) that show their status on the right. The workspace page shows one **Oxinov Studio** button instead of separate admin buttons, and the earlier `/store/...`, `/people`, and `/teach/{id}/plans` addresses redirect to Studio. Studio uses Chakra Petch titles and Share Tech Mono labels, self-hosted with the other fonts. Menu items appear only when their feature works; the funnel, notices, free access, OXI, builder tools, media, team, and share kit join the menu as they are built. Below 1024 px the menu becomes a scrolling strip above the page. On a phone the menu becomes a list of rows and actions sit in a bottom bar.

**Learner store, built 2026-10-02:** `edu.oxinov.com` opens on the store for everyone, signed in or not: a moving status ticker, the hero ("Learn the skills. Own the ideas.") with the starting plan prices, kind chips (All, Course, Training, Idea, Think tank, Skill) and search that filter every rail, a "Free to learn" rail, then one rail per category (Languages, Technology, Ideas and research, More from Oxinov), and "Continue where you left off" for signed-in learners. Each card links to the offering page at `/o/{slug}`: kind and category, introduction, what is included (counted from the real syllabus), the syllabus with free and locked items, plan cards with monthly cost and end dates, and questions that quote the store's review time and refund policy. Ideas and think-tank research use magenta and add the "you may / you may not" license box and a commercial-license contact. **Continue to payment** signs the visitor in, adds them to the store as a learner without a join code, and opens the course with the chosen plan ready for bank QR checkout and a coupon. "My learning" (`/spaces`) keeps the list of learning spaces, join codes, and creating a space. Administrators set each offering's kind and category in Studio › Offerings and prices. Instructor cards, live sessions, mission paths, reviews, and sharing come with their features.

**Content, built 2026-10-02:** In the course builder a video lesson can take an unlisted YouTube link or a Google Drive video instead of an upload, and a new **Document** lesson shows a Google Drive PDF, slide deck, or document; the editor explains how to share the file and shows the source with an "open to check" link. Learners watch inside Oxinov: YouTube's privacy-enhanced embed or Drive's preview in a sandboxed frame, the learner's email repeated faintly across it, and no download control; those lessons are finished with **Mark as complete**, because Oxinov cannot see playback inside YouTube or Drive. Teachers schedule **live classes** on the course's teach page (title, Nepal time, length, link, free or subscribers) and can cancel them; learners see them beside the course with a **Join class** button from 15 minutes before the start, subscribers-only classes show their time but no link until the learner has access, and the public offering page lists upcoming classes without links.

**Account centre, built 2026-10-02:** The header's **Account** opens `/account` in the Studio's Windows Settings layout: a profile card (initials, name, email, member since) and a menu of My subscriptions, Payments and receipts, Certificates, Activity, Invite friends, and Profile and privacy; below 1024 px the menu becomes a scrolling strip. Subscriptions list active ones first with a status (Active, Ends in N days, Lifetime, Free, Ended) and **Open** or **Renew**. Privacy offers sign-out here, the Oxinov sign-in account page for name, email, and "sign out of all devices", and email requests to support for a copy of the data or deletion; deletion opens only after typing DELETE and explains what is removed and kept.

**Notifications, built 2026-10-02:** Account › Notifications lists payment results, plans ending, access ended, and notices from Oxinov, newest first, with a glowing marker on unread items, an unread badge in the menu, **Mark all as read**, and **Open**, which marks the item read and goes to its page inside Oxinov Edu (never another site). The store home shows a "You have N new notifications" banner to signed-in learners. The Studio dashboard has **Send a notice** (title, message, optional link) for an in-app notice to every member. Renewal reminders arrive by email and in-app 7 days and 1 day before a plan ends, with a **Renew my plan** button to the offering page.

**Checkout and receipt, built 2026-10-02:** The bank QR page follows design screens 3 and 15 at Calm intensity: a step bar (Plan, Pay, Review), the QR with **Save QR to gallery**, the account name and number, large Amount and Remarks tiles with copy buttons, the order summary, the receipt form, a WhatsApp help button when the help contact is a WhatsApp number, and a "card payment coming soon" row. In review, needs a fix, approved, and closed each have their own panel. An approved payment links to a printable white **Payment receipt** (design screen 26) that prints without the site header, marked "not a tax invoice" until tax details are confirmed.

**Share kit, built 2026-10-02:** Studio › Marketing (design screen 19) picks a published offering and shows its post image in three sizes (Facebook 1200×630, Instagram square 1080×1080, story or WhatsApp status 1080×1920), drawn on the server in the store style with **Download image**; a ready caption from the offering's own words and price, editable, with an optional active coupon; and a tracked link per channel (Facebook, WhatsApp, Telegram, LinkedIn, Viber open with the post ready; Instagram and TikTok get the image and a link to copy). The Facebook-size image is also the Open Graph preview of every offering page, so a pasted link shows the picture. AI-written captions wait for the AI gateway (ADR-014).

**Team and roles, built 2026-10-02:** Studio › Team and roles (design screen 22) lists every member with a role selector, Save, and Suspend or Restore (your own row is locked), a table of what each role can do, and the audit log in plain English ("Approved a payment of NPR 15,000", "Changed a member from Teacher to Administrator").

**Free access, built 2026-10-02:** Studio › Free access (design screen 8, "Give free access") takes a learner email, a published offering, a length (7 days to lifetime), and a required reason; recent grants show their end date with **End access** and a reason.

**Media library, built 2026-10-02:** Studio › Media library (design screen 9) lists every YouTube video, Google Drive file, and upload with the lessons that use it, filters (All, YouTube, Google Drive, Uploads, Not used) with counts, search, **Open**, and **Copy link**; lessons link to the course builder. The lesson editor adds **Or reuse an earlier upload** for video and audio lessons. Link-health flags wait for the YouTube and Drive API connection.

**Quiz editor, restyled 2026-10-02:** the quiz editor follows design screen 10: the title with status and publish actions, settings in one strip (type, time limit, pass mark, attempts, answer release, random order), the question list on the left grouped by section with written and drawn counts, and the selected question or a new one on the right (`?q=` and `?add=` keep the selection across saves). Section titles and draw counts are under **Sections**. The AI question drafts and the learner preview button wait for the AI gateway and a preview mode.

**Reviews, built 2026-10-03:** the offering page shows the "// Learner reviews" box (design screen 2) only when approved reviews exist: the average, star bars, and the newest reviews; the hero and store cards show the rating. Learners rate from the course page (stars and optional text, with a note that it waits for approval). Studio › Reviews lists Waiting, Shown, and Hidden reviews with **Approve** and **Hide** (private reason), and the side menu counts waiting reviews.

**Download and deletion, built 2026-10-03:** Profile and privacy offers **Download my data** (a JSON file) and **Delete my account…**: typing DELETE schedules deletion in 14 days and emails the date with a cancel link; while scheduled, the panel and a banner on every account page say the date with **Cancel the deletion**.

**Messages and OXI, built 2026-10-03:** Account › Messages (design screen 15) lists OXI, Oxinov support, and Notices (a link to Notifications). OXI answers in the page with picks as offering cards, the chips Free courses for me, Learn Japanese, Learn programming, and Compare plans, and **Talk to a human**; its footnote says it is a simple advisor that keeps no record. Support shows the thread with a message box. Studio › Inbox lists conversations with unread dots beside the open one and a reply box. The design's teacher conversations and Report button wait for course chat. The pink accent token was misspelled (`--ox-color-brand2`) across the web app, so menu badges and pink accents had no colour; it is now `--ox-color-brand-2`.

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
