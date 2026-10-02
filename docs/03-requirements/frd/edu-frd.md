# Functional Requirements Document: Oxinov Edu

**Version:** 2.3  
**Date:** 2026-10-01  
**Status:** Active product requirements with mixed implementation state; every requirement carries Priority, Status, Access, Source, and acceptance statements; owner review remains open for unapproved scope, priority, and release sequencing  
**Scope:** Oxinov Edu (`edu.oxinov.com`), the first Oxinov product plane  
**Technical slug:** `edu` (ADR-027)  
**Audience:** Product, design, engineering, and QA  
**Standard:** [Oxinov requirements standard](../README.md). Number block **101–1799** (17 areas; see the [area registry](../README.md#area-registry)). IDs in this document are permanent and are cited by code, migrations, and tests.

## Implementation status (2026-09-26)

Built and verified in CI and live at `edu.oxinov.com` (details in the [Edu web README](../../../frontend/products/edu-web/README.md#what-works-today) and [current state](../../04-architecture/current-state.md)). Requirements not listed are not built yet. Each requirement's *Status* attribute follows this table; [open decisions](#4-open-decisions) explains how those values were set.

| Requirement | State | Notes |
| --- | --- | --- |
| FR-TENANT (spaces, membership, isolation) | Implemented | Spaces with roles; RLS; two-tenant denial tests. Branding, plans, and custom domains open |
| FR-AUTH-102 Tenant roles | Partly | Join codes and member list; instructor-approval requests open |
| FR-CATALOG-301 Catalogue and search | Implemented | With "Continue learning" |
| FR-CATALOG-302 Course page | Implemented | Outcomes, curriculum, locked and preview lessons |
| FR-CATALOG-303 Purchase and enrollment | Partly | Free enrollment; one-time purchase of Oxinov's own NPR courses with Khalti or eSewa, granted only after server-side verification (ADR-023). Subscriptions, coupons, refunds, and reconciliation open |
| FR-COURSE-201, FR-COURSE-203 Authoring and review | Implemented | Chapters, lessons, reordering, review, publishing |
| FR-COURSE-202, FR-COURSE-204, FR-COURSE-205 Lesson content, resources, media | Implemented | Text, video, audio, transcripts; PDF, EPUB, Office, images, ZIP, links (S3, ADR-021) |
| FR-PLAYER-401 to FR-PLAYER-404 Player, progress, notes | Implemented | Speed, resume, completion (text lessons by confirmation, media at 90% played); course completion rule; private notes with video moments |
| FR-ASSESS-501, FR-ASSESS-502 Quizzes and exams | Implemented | Four question types, random sections, timed attempts with autosave and auto-submit, results, answer review |
| FR-ASSESS-503 Assignments | Implemented | Text, links, files, deadlines, grading, revisions |
| FR-EXAM-1204 Mock exam attempts | Implemented | Timed practice and mock exams |
| FR-COMM-701, FR-COMM-702 Class stream and Q&A | Implemented | Announcements, lesson questions, best answers, votes, moderation |
| FR-ANALYTICS-801 Learner progress | Partly | "Continue learning"; dashboards open |
| FR-CERT-601, FR-CERT-602 Certificates | Implemented | Issued once when the completion rule holds (approved mock exams must be passed; practice quizzes never block), print layout for saving as PDF, Add to LinkedIn, public `/verify/{id}`, revocation with a reason |

### Acceptance baseline for every Edu requirement

The older Edu requirements keep their permanent IDs and compact prose, and each now also carries the current [requirements standard](../README.md)'s Priority, Status, Access, Source, and acceptance statements. Every implementation and test for a requirement below must additionally apply all relevant baseline statements below, on top of the behavior and per-requirement acceptance written in that requirement:

- **Allowed path:** an authenticated actor with the stated role, active tenant membership, entitlement, and object ownership can complete the behavior and receives only fields in that scope.
- **Denied path:** a missing role, expired entitlement, suspended membership, guessed identifier, or object from another tenant is refused; protected resources outside the caller's scope answer "not found" and cross-tenant attempts emit `tenant.cross_access.denied` without personal data.
- **Retry path:** externally triggered writes, payments, uploads, submissions, certificate issuance, notifications, and background jobs are idempotent; retrying the same operation cannot create a second durable result.
- **State path:** invalid or stale state transitions are refused. Accepted transitions record the actor, UTC time, previous state, new state, and reason where the action affects access, publication, grading, money, moderation, or ownership.
- **File path:** uploads are type- and size-checked, malware-scanned, stored privately, and unavailable until checks finish; rejected content is deleted.
- **Money and time path:** prices and totals use integer minor units plus currency; deadlines use stored UTC instants and render in the reader's time zone. Amount, currency, provider, and final provider state are verified server-side before access changes.
- **Accessibility and recovery path:** the behavior works at phone width, by keyboard and assistive technology where applicable, explains validation errors, preserves safe user input after a recoverable failure, and has a non-AI path.

Tests cite the requirement ID plus the baseline path they prove. A happy-path test alone is never sufficient for a protected, tenant-scoped, financial, upload, or state-changing requirement.

## Platform dependencies

Oxinov Edu runs on the shared Oxinov Platform. Sign-in, sessions, trust levels, policy acceptance, organizations, plans, entitlements, payments ledger, KYC, notifications, and privacy requests are defined in the [Platform FRD](platform-frd.md) and are not redefined here. Edu tenant memberships, roles, instructor approval, courses, learning, exams, and results remain in this document and in the Edu database boundary. Where an Edu requirement below conflicts with a platform requirement, the platform requirement wins and the Edu requirement is marked **Superseded**.

## 1. Purpose and scope

Build a cloud-hosted, multi-tenant web and mobile learning platform. A customer creates and customizes an Edu workspace; its instructors create and sell courses, learners complete lessons and assessments, and its administrators govern publication, students, results, and payments. The catalog covers Japanese language and exam preparation, Specified Skilled Worker (SSW) preparation, other languages, and information technology. Every numbered requirement is in product scope unless marked optional. Release sequencing is still a product decision; this document does not imply that every course or module ships on day one.

The baseline supports multiple customer Edu workspaces on one platform, each with its own members, courses, branding, settings, and financial records. It includes a responsive web app and native Android and iOS apps. Organization Manager and bulk seat licensing within a workspace are optional B2B scope. Live classes are outside this document; instructors can create or upload recorded lessons. Offline video downloads require a separate product decision.

### Shared terms and rules

| Term | Definition |
| --- | --- |
| Course | A free or priced product containing ordered sections and lessons. |
| Enrollment | A learner's access record for one course. A learner has at most one active enrollment per course. |
| Entitlement | The reason access is allowed: free enrollment, one-time purchase, active subscription, or assigned B2B seat. |
| Required item | A lesson, quiz, or assignment that must be completed to finish a course. |
| Published version | The course content visible to learners. Changes remain in a separate draft until approved. |
| Program | A curriculum track such as JLPT N5, an SSW skill field, English, or cybersecurity; it contains courses and practice exams. |
| Mock exam | A platform practice exam. Its score is a practice result, not a result issued by the official exam organizer. |
| Tenant / Edu workspace | One customer's logically isolated learning platform, identified by an immutable tenant ID; it can have multiple admins, instructors, and learners. |
| Membership | A user's role within one tenant. One verified email account can belong to multiple tenants with different roles. |

Store timestamps in UTC and display dates in the user's selected time zone. Store prices as currency plus integer minor units. Run authorization checks on the server for every protected read and write. Resolve the active tenant from an authenticated membership and tenant address or explicit workspace selection, never from email text alone.

## 2. Roles and access

One account may be a learner or instructor in one tenant and an administrator in another. Instructor privileges require approval from that tenant's administrator. Ownership and tenant checks apply in addition to role checks. In the requirements below, “administrator” means tenant administrator unless “platform operator” is stated.

| Role | Allowed actions | Restrictions |
| --- | --- | --- |
| Visitor | Browse published courses and verify certificates. | Cannot view paid lessons or private learner data. |
| Learner | Enroll, purchase, study entitled courses, take mock exams, submit work, chat where enabled, and view own progress and results. | Cannot edit course content or see another learner's submissions or notes. |
| Approved instructor | Manage own courses, recorded media, question banks, assignments, student rosters, results, course chat, announcements, and analytics. | Cannot publish without review or manage another instructor's course. |
| Tenant administrator | Approve instructors and courses, customize the workspace, manage its programs, students, exams, moderation, refunds, subscriptions, payouts, and tenant reports. | Cannot manage another tenant; sensitive actions must be audited. |
| Tenant owner | Has tenant-administrator permissions plus ownership transfer and Edu subscription control. | Cannot remove the last active owner or claim another tenant. |
| Platform operator | Provision and suspend tenants, manage platform plans and global operations, and provide audited support access when explicitly authorized. | Cannot browse a tenant's private learning or payment data by default. |
| Organization Manager (optional) | Buy and assign seats, manage own cohorts, and view aggregate progress. | Cannot view another organization's data or private learner notes. |

## 3. Functional requirements

### 3.1 Accounts and access

**FR-AUTH-101 — Registration and sign-in.** This requirement is **Superseded** by FR-ID-2201, FR-ID-2202, FR-ID-2203, FR-ID-2204, and FR-ID-2206 (ADR-011). Edu uses Oxinov single sign-on with Google or email one-time codes and no customer passwords. Historical behavior—email/password plus Google, GitHub, and Microsoft sign-in—is retained here only to explain the supersession and must not be implemented.
*Priority:* Must. *Status:* Superseded. *Access:* T0 → T1 through the platform only. *Source:* ADR-011; Platform FRD.
- Acceptance: Given a valid Oxinov session with the Edu audience, when the member opens Edu, then Edu uses that identity without a product-specific registration step.
- Acceptance: Given any Edu screen or API, when a customer looks for password registration or reset, then no such flow is offered.

**FR-AUTH-102 — Tenant roles and instructor approval.** A learner can request instructor status in a tenant. Its administrator can approve or reject with a recorded reason and time. Only approved instructors can submit that tenant's courses for review. A tenant administrator can invite or promote another tenant administrator but cannot grant the platform-operator role. Denied requests reveal no protected data.
*Priority:* Must. *Status:* Proposed; partially implemented as recorded above. *Access:* active tenant member requests; tenant administrator decides. *Source:* product scope; FR-TENANT-1604.
- Acceptance: Given an active member requests instructor status and the tenant administrator approves it, when the next protected request runs, then that member can submit only that tenant's courses for review.
- Acceptance: Given an instructor or tenant administrator tries to grant platform-operator access, when the role change is processed, then it is refused and audited.

**FR-AUTH-103 — Product profile and immediate authorization changes.** Sign-in methods, MFA, sessions, and sign-out follow FR-ID-2206, FR-ID-2208, and FR-ID-2209; the former password behavior is **Superseded** and must not be implemented. Edu members can edit their product avatar, headline, bio, and safe social links. Tenant role, membership, suspension, and account changes take effect on the next protected request, including requests made from an existing session.
*Priority:* Must. *Status:* Proposed; platform-owned parts superseded. *Access:* member edits own profile; platform and tenant administrators change only their scoped authorization records. *Source:* ADR-011; FR-ID-2206/2208/2209; FR-TENANT-1604.
- Acceptance: Given a member saves valid profile fields, when the profile reloads, then only their Edu product profile changes and platform identity data remains platform-owned.
- Acceptance: Given a role is removed or a membership suspended, when an existing session makes its next protected request, then the removed permission is refused.

**FR-AUTH-104 — Learner account centre.** A signed-in learner has one account centre, on web and phone, with: their subscriptions (every offering they can open with its kind, plan, price paid, status, and end date or "Lifetime", plus renew or open), payment history with receipts, activity, notifications, messages, certificates, invite friends, profile and notification settings, and privacy controls. Privacy controls are: sign out of this device, sign out of all devices (FR-ID-2208), download my data (FR-PRIV-3201), and delete my account (FR-PRIV-3202), which explains what is removed and what payment records are kept and requires typing a confirmation word.
*Priority:* Must. *Status:* Partly implemented (2026-10-02): the account centre at `/account` lists subscriptions (kind, plan, price paid, status, end date or Lifetime, Open or Renew), payments with their state, certificates with verification links, activity (payments, new access, certificates), invite and recommend links with share buttons, and profile and privacy: sign out here, sign out of all devices and name or email on the Oxinov sign-in account page, and requests to Oxinov support for a copy of the data or deletion after typing DELETE. Notifications, messages, notification settings, counted invite links, and self-service export and deletion (FR-PRIV-3201, FR-PRIV-3202) remain. *Access:* T1 learner, own account only. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-ID-2208, FR-PRIV-3201, FR-PRIV-3202.
- Acceptance: Given a learner with a time-limited plan, a lifetime plan, a free class, and a payment in review, when they open the account centre, then each appears with its correct status and end date and an action that matches it.
- Acceptance: Given a learner starts account deletion, when they have not typed the confirmation word, then nothing is deleted; and another learner's subscriptions, payments, or activity are never shown.

**FR-AUTH-105 — Goal setup after sign-up.** After the welcome step, Edu asks three skippable questions (goal, starting level, time per week) and shows a suggested path that starts with free items. The answers are stored on the learner's Edu profile, can be changed in the account centre, and feed the store's "Recommended for me" order and OXI (FR-AI-1705).
*Priority:* Should. *Status:* Proposed. *Access:* T1 learner, own profile. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given a new learner answers the three questions, when they finish, then a path with at least one free item is shown and the store sorts by those answers.
- Acceptance: Given a learner chooses Skip, when they continue, then they reach the store with the default order and no answers stored.

### 3.2 Course authoring and publishing

**FR-COURSE-201 — Structure.** An instructor can create a course with title, summary, description, program, category, applicable language and level or SSW field or IT pathway, learning outcomes, cover image, price, sections, and lessons. A course needs at least one section and one lesson per section before review. Reordering persists in the course page and player.
*Priority:* Must. *Status:* Implemented. *Access:* Approved instructor, own course. *Source:* Edu product scope.
- Acceptance: Given an approved instructor with an owned draft course, when they add at least one section and lesson per section and reorder them, then the order persists identically in the course page and player.
- Acceptance: Given a course missing a section or a lesson in a section, when the instructor submits it for review, then submission is refused with a field-specific reason and the course remains in draft.

**FR-COURSE-202 — Content and resources.** A lesson may contain video, formatted text, or both. Text supports headings, links, code blocks, math, and embedded diagrams. Instructors may attach resources. Direct videos are processed to adaptive streaming; the authoring screen shows processing, ready, and failed states. External embeds are limited to an approved provider list. Validate file type and size and scan uploads. Require captions or a text alternative before publishing video lessons.
*Priority:* Must. *Status:* Implemented. *Access:* Approved instructor, own course. *Source:* ADR-021.
- Acceptance: Given an instructor uploads a supported video within size limits, when processing completes, then the authoring screen shows a ready state and the lesson carries captions or a text alternative before it can be published.
- Acceptance: Given an unsupported file type, an oversized upload, a failed malware scan, or a video lesson missing captions and a text alternative, when the instructor attempts to publish, then publication is refused and the failing item is identified.

**FR-COURSE-203 — Lifecycle.** States are `DRAFT`, `IN_REVIEW`, `PUBLISHED`, and `ARCHIVED`. An administrator approves or rejects a submitted draft and records feedback. Rejection returns it to draft. Editing a published course creates a separate draft; only approval replaces the learner-visible version. Archive removes a course from discovery and new enrollment while preserving existing learner access and records unless an administrator explicitly revokes access with a reason. Log actor and time for publication and moderation actions.
*Priority:* Must. *Status:* Implemented. *Access:* Approved instructor submits; tenant administrator approves, rejects, or archives. *Source:* Edu product scope.
- Acceptance: Given a submitted draft, when a tenant administrator approves it, then the learner-visible published version updates, the actor and time are logged, and rejection instead returns the course to draft with recorded feedback.
- Acceptance: Given a published course being edited, when the instructor saves changes, then only a separate draft is affected and learners keep the prior published version until a later approval replaces it.

**FR-COURSE-204 — Learning gates.** An instructor may require sequential progression and set lesson availability by date or days since enrollment. The server blocks locked lessons and shows why and when they unlock. Preview lessons may be viewed without enrollment but expose no paid resources or private discussions.
*Priority:* Must. *Status:* Implemented. *Access:* Approved instructor sets gates for own course; entitled learner and visitor are subject to them. *Source:* Edu product scope.
- Acceptance: Given a sequential-progression or date-based unlock rule is configured, when a learner has not met the prerequisite, then the server blocks the locked lesson and states why and when it unlocks.
- Acceptance: Given a preview lesson viewed without enrollment, when the visitor requests a paid resource or private discussion attached to that lesson, then the request is refused.

**FR-COURSE-205 — Recorded video and audio library.** Instructors can record video or audio with a permitted device camera or microphone, upload existing recordings, add title, language, captions or transcript, thumbnail, and chapter markers, and attach recordings to lessons. Audio-only lessons require a transcript or equivalent text alternative before publication. Interrupted uploads can resume or be retried without creating duplicate lessons. Only processed and approved recordings are playable. Instructors can replace a recording through the course version workflow while existing learner progress remains traceable to the earlier version.
*Priority:* Must. *Status:* Implemented. *Access:* Approved instructor, own course. *Source:* ADR-021.
- Acceptance: Given a recording is processed and approved, when a learner opens the attached lesson, then only that processed, approved recording is playable.
- Acceptance: Given an upload is interrupted, when the instructor resumes or retries it, then no duplicate lesson or recording is created, and an unprocessed or unapproved recording remains unplayable.

**FR-COURSE-206 — Externally hosted lessons and materials.** An approved instructor can attach to a lesson an unlisted YouTube video (by URL or video ID) or a Google Drive file (PDF, slides, document, spreadsheet, or image), besides Oxinov-hosted media, files, and links. The server accepts only `youtube.com`, `youtu.be`, `drive.google.com`, and `docs.google.com` addresses, stores only the parsed video or file ID, and refuses other hosts and playlist addresses. Material kinds shown to learners are video, PDF book, notes, slides, image, quiz, link, and social link.
*Priority:* Must. *Status:* Partly implemented (2026-10-02): video lessons take an unlisted YouTube or Google Drive link and the new document lessons a Google Drive file; only the provider and ID are stored, and the API returns the player address after the lesson's access check. Drive files as lesson materials remain. *Access:* Approved instructor, own offering. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given an instructor pastes an unlisted YouTube or Google Drive address, when the lesson is saved, then only the parsed ID and kind are stored and the lesson plays or previews inside Oxinov.
- Acceptance: Given an address on another host or a malformed ID, when the instructor saves it, then it is refused with a field-specific reason and nothing is stored.

**FR-COURSE-207 — Free and subscriber visibility.** Every lesson, material, and live session is marked `FREE` or `SUBSCRIBERS`. The offering's introduction and syllabus are always free. Signed-in learners without access see free items in full and subscriber items as locked titles with the plans that unlock them. The API never returns a subscriber item's video ID, file ID, URL, meeting link, or body to a caller without an active entitlement, including in page source, previews, sitemaps, and search results.
*Priority:* Must. *Status:* Partly implemented (2026-10-02): lessons are free (preview) or for subscribers, and live sessions are `FREE` or `SUBSCRIBERS`; materials follow their lesson's access. *Access:* T0 visitor sees the public offering page; T1 learner sees free items; entitled learner sees all. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-COURSE-204.
- Acceptance: Given an item is marked `FREE`, when a signed-in learner without a plan opens it, then it plays or opens in full.
- Acceptance: Given an item is marked `SUBSCRIBERS`, when a learner without an active entitlement requests it by any route, then no video ID, file ID, URL, link, or body is returned and the plans that unlock it are shown.

**FR-COURSE-208 — Live class links.** An approved instructor can schedule live sessions for an offering with a title, start time, duration, and a Google Meet, Microsoft Teams, or Zoom link, each `FREE` or `SUBSCRIBERS`. Learners see upcoming sessions in their time zone with a join button that is active from 15 minutes before the start until the end. Only `meet.google.com`, `teams.microsoft.com`, `teams.live.com`, and `zoom.us` (with its subdomains) links are accepted. Oxinov does not host or record calls.
*Priority:* Should. *Status:* Implemented (2026-10-02): teachers schedule and cancel live classes with an https Google Meet, Zoom, or Teams link in Nepal time; learners see them in their own time zone (Nepal time first, then the browser's zone) with a join button from 15 minutes before the start, and the link only where they may join. *Access:* Approved instructor, own offering; learners per FR-COURSE-207. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given a subscriber session starts in 10 minutes, when an entitled learner opens the offering, then the session shows in their time zone with an active join button.
- Acceptance: Given a learner without access, or a link on another host, when the session is requested or saved, then the meeting link is not returned or the save is refused.

**FR-COURSE-209 — Fast course building.** The course builder shows the outline beside the lesson editor and settings, saves drafts automatically, and lets authors reorder chapters and lessons by dragging or with keyboard controls. Authors can paste many YouTube or Google Drive links at once (one per line, with an optional title) to create lessons in order; the builder reports how many links it recognised and refused and why. An offering can be duplicated as a template without its learners, payments, or reviews. A publish checklist shows what is missing (empty chapters, lessons without captions or text, unset plans) before review.
*Priority:* Must. *Status:* Proposed. *Access:* Owner, content editor, or the offering's instructor. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-COURSE-201, FR-COURSE-206.
- Acceptance: Given an author pastes five valid links and one link on another host, when they add them, then five lessons are created in order and the sixth line is refused with its reason.
- Acceptance: Given an offering is duplicated as a template, when the copy opens, then it is a draft with the same structure and none of the original's learners, payments, reviews, or certificates.

**FR-COURSE-210 — Media library and link health.** Administrators see every YouTube video, Google Drive file, upload, and link used by their offerings, with where each is used, and can reuse an item in another lesson. Where the provider's interface allows, Oxinov checks linked items daily and flags a YouTube video that became public, private, or deleted and a Drive file that allows downloading, on the library and the dashboard.
*Priority:* Should. *Status:* Proposed. *Access:* Owner and content editor of the seller workspace. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given a linked video is made public on YouTube, when the next daily check runs, then the item is flagged with the lessons that use it.
- Acceptance: Given an instructor without the content editor role, when they open the media library, then they see only the items of their own offerings.

**FR-COURSE-211 — Master copies of hosted material.** Because lessons can live on YouTube and Google Drive, the owner can keep a master copy of every video and document in Oxinov's private storage (not served to learners) and see which items have no master copy. If a YouTube channel or Google account becomes unavailable, an administrator can switch an item to its Oxinov copy without rebuilding the course.
*Priority:* Should. *Status:* Proposed. *Access:* Owner and content editor. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given a video has a master copy, when its YouTube video is deleted, then the administrator can switch the lesson to the Oxinov copy and learners keep their progress.
- Acceptance: Given a learner, when they request a master copy directly, then it is not served.

### 3.3 Catalog, enrollment, and payment

**FR-CATALOG-301 — Discovery.** Search published programs and courses by title, description, instructor, language, exam, and skill field. Filter by program, language, JLPT level or other applicable level, SSW field, IT topic, price, rating, and duration. Paginate and sort results. Exclude archived and unapproved courses and show a useful empty state.
*Priority:* Must. *Status:* Implemented. *Access:* T0 visitor and above. *Source:* Edu product scope.
- Acceptance: Given a query and filter combination, when a visitor searches, then only published, approved courses matching the filters are returned with pagination and sorting applied.
- Acceptance: Given no course matches, when the visitor searches, then a useful empty state is shown and no archived or unapproved course appears.

**FR-CATALOG-302 — Course page.** Show the program and applicable exam level or skill field, current description, outcomes, instructor, price and currency, curriculum, duration, preview, rating summary, and access terms. Show the final payable amount after a coupon before checkout.
*Priority:* Must. *Status:* Implemented. *Access:* T0 visitor and above. *Source:* Edu product scope.
- Acceptance: Given an active coupon context, when a visitor opens a published course page, then the final payable amount after the coupon is shown before checkout alongside outcomes, curriculum, and access terms.
- Acceptance: Given a course is archived or not yet published, when a visitor requests its page directly, then no paid curriculum or price detail is exposed.

**FR-CATALOG-303 — Enrollment and payment.** Free courses enroll immediately. Paid courses support one-time purchase and subscription access. Validate coupons against course, dates, and customer eligibility. Grant paid entitlement only after a verified provider event; a checkout redirect alone grants nothing. Duplicate or delayed events must not create duplicate enrollments or entitlements. A failed or canceled initial purchase grants no access. Subscription cancellation retains access through its paid-through date; failed renewal follows the configured grace period. A full refund or chargeback removes only the entitlement created by that transaction, unless another valid entitlement exists. Record provider transaction IDs and access changes.
*Priority:* Must. *Status:* Proposed; free enrollment and one-time NPR purchase with Khalti or eSewa implemented as recorded above; subscriptions, coupons, refunds, and reconciliation open. *Access:* T1 learner. *Source:* ADR-023.
- Acceptance: Given a learner completes checkout for a paid course, when the provider event is verified server-side, then the entitlement and enrollment are granted exactly once even if the checkout redirect or provider event is retried or delayed.
- Acceptance: Given a failed, canceled, or unverified payment, when the learner returns from checkout, then no entitlement or enrollment is created; a subsequent full refund or chargeback removes only the entitlement created by that transaction unless another valid entitlement exists.

**FR-CATALOG-304 — Ratings and reviews.** An enrolled learner may leave one rating and review per course and edit it. The rating summary uses visible reviews only. Administrators can hide abusive reviews with a recorded reason.
*Priority:* Should. *Status:* Proposed. *Access:* T1 enrolled learner writes own review; tenant administrator moderates. *Source:* Edu product scope.
- Acceptance: Given an enrolled learner has not yet reviewed a course, when they submit a rating and review, then it is saved once and only that learner can later edit it.
- Acceptance: Given a review is hidden by an administrator with a recorded reason, when the rating summary is computed, then the hidden review is excluded and the moderation reason is not shown to other users.

**FR-CATALOG-305 — Access plans.** Each paid offering has up to four active plans: one month, six months, one year, and lifetime, each with an NPR price in minor units. New offerings start with the owner's defaults (NPR 5,000, 10,000, 15,000, and 20,000), and a tenant administrator can change or deactivate a plan per offering. A paid plan grants access until its end time; lifetime access has no end. Buying a plan while access is active extends from the current end time. The plan, duration, price, and currency are copied onto the payment at checkout, so a later price change never alters an open or completed payment.
*Priority:* Must. *Status:* Implemented (API with integration tests; web pages built, end-to-end browser check pending). *Access:* T1 learner buys; tenant administrator manages plans. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given a learner whose access ends on 10 March buys a one-month plan on 1 March, when the payment is approved, then access ends on 10 April.
- Acceptance: Given an administrator changes a plan price after a learner opened checkout, when that payment is approved, then it is recorded at the price shown at checkout, and a deactivated plan cannot start a new checkout.

**FR-CATALOG-306 — Oxinov store.** `edu.oxinov.com` opens on the store of the seller workspace (ADR-023): featured offerings, categories (Languages, Technology, Ideas and research), offering kinds (course, training, idea, think tank, skill), search, "Continue learning", and "My learning". An offering page shows the kind, category, introduction, syllabus, free items, locked items, instructor, upcoming live sessions, and the plans with their prices and end dates before checkout. School workspaces and join codes are not shown in learner navigation.
*Priority:* Must. *Status:* Partly implemented (2026-10-02): the public store home (hero, plan prices, kind filter, search, "Free to learn" and category rails, "Continue learning"), the offering page (kind, category, introduction, syllabus with free and locked items, plans with end dates, questions), joining the store without a join code, and "My learning" at `/spaces`; instructor, live sessions, and hiding school workspaces from navigation remain. *Access:* T0 visitor and above. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-CATALOG-301, FR-CATALOG-302.
- Acceptance: Given a visitor opens `edu.oxinov.com`, when the page loads, then published offerings of the seller workspace appear grouped by category with their lowest plan price.
- Acceptance: Given an offering is draft, archived, or belongs to a workspace that is not a seller, when a visitor requests the store or its page, then it does not appear and no price or curriculum is exposed.

**FR-CATALOG-307 — Bank QR payment with review.** At checkout the learner chooses a plan and "Bank QR". The page shows the seller's bank QR image, account name, the exact amount, and a unique payment reference, then asks for the bank transaction ID and a screenshot (JPEG, PNG, or PDF up to 5 MB). Submission creates one `PENDING_REVIEW` payment and grants nothing. A tenant administrator approves or rejects it with a reason; approval grants the entitlement exactly once in the same transaction and notifies the learner (FR-COMM-703). A bank transaction ID can belong to one payment only per seller. A learner can have one open review per offering; resubmitting replaces the evidence without creating a second payment.
*Priority:* Must. *Status:* Implemented (API with integration tests; web pages built, end-to-end browser check pending). *Access:* T1 learner submits own payment; tenant administrator of the seller workspace reviews. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-PAY-2701, FR-PAY-2702.
- Acceptance: Given a learner submits a transaction ID and screenshot, when an administrator approves the payment, then exactly one entitlement with the plan's end time is created and a repeated approval changes nothing.
- Acceptance: Given a transaction ID already used by another payment, or a payment that is rejected or still in review, when the ID is reused or access is checked, then the reuse is refused and no access is granted.

**FR-CATALOG-308 — International card payment.** Learners outside Nepal can pay a plan by card through a card-acquiring gateway's hosted page in the gateway's settlement currency. Oxinov never receives, stores, or logs card numbers or security codes. Access is granted only after the server verifies the gateway result for the exact amount and currency (FR-PAY-2701). The adapter is built once the owner has a gateway merchant account.
*Priority:* Should. *Status:* Proposed. *Access:* T1 learner. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-PAY-2701.
- Acceptance: Given the gateway confirms a captured payment for the expected amount and currency, when the server verifies it, then the plan's entitlement is granted exactly once.
- Acceptance: Given a redirect without verification, a declined card, or an amount or currency mismatch, when the learner returns, then no access is granted and a mismatch raises a security event.

**FR-CATALOG-309 — Access expiry and renewal.** When a time-limited plan ends, subscriber items lock again while free items, progress, notes, results, and certificates remain. The learner sees the end date on "My learning" and the offering page and can renew from either. Expiry is evaluated on every protected request, not by a background job.
*Priority:* Must. *Status:* Proposed. *Access:* T1 learner, own access. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given a plan ended yesterday, when the learner opens a subscriber lesson, then it is locked with the renewal plans and their earlier progress is still shown.
- Acceptance: Given access is still active, when the learner opens "My learning", then the offering shows its end date or "Lifetime".

**FR-CATALOG-310 — Free classes, ideas, and skills.** An administrator can publish any offering kind as free (no plan). Free offerings appear in a "Free to learn" section of the store and in recommendations, open immediately after sign-in without checkout, and still issue certificates when completed. Making a paid offering free later does not refund or change existing paid access.
*Priority:* Must. *Status:* Partly implemented (2026-10-02): free offerings appear under "Free to learn" and open after sign-in through the store; recommendations remain. *Access:* T0 visitor browses; T1 learner opens. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given a free skill is published, when a signed-in learner opens it, then every item opens without a plan and the store lists it under "Free to learn".
- Acceptance: Given a visitor is not signed in, when they open a free item, then they are asked to sign in first and returned to the item afterwards.

**FR-CATALOG-311 — Share and recommend.** A learner can share Oxinov or a specific offering through a personal invite link, a QR code, and share buttons for WhatsApp, Facebook, Messenger, Viber, and email, and can copy the link. Sign-ups through the link are attributed to the inviter, who sees how many friends joined. The link carries only an opaque code, never the inviter's email or name. Rewards for inviting are off unless the owner defines them.
*Priority:* Should. *Status:* Proposed. *Access:* T1 learner, own link. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given a friend signs up through a learner's link, when the account is created, then the inviter's joined count increases by one and only once.
- Acceptance: Given a link with an unknown or tampered code, when it is opened, then the store opens normally and nothing is attributed.

**FR-CATALOG-312 — Mission paths and bundles.** An administrator can group offerings into an ordered path for a goal (for example "Work in Japan"). The path page shows each step's state for the learner (complete, in progress, free, locked) and their overall progress. A path may be sold as a bundle plan whose price and length the owner sets; buying it grants an entitlement for every paid offering in the path for that length.
*Priority:* Should. *Status:* Proposed; bundle prices are an owner decision. *Access:* T0 visitor sees the path; T1 learner sees own progress; tenant administrator manages. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given a learner completed step 1 and is halfway through step 2, when they open the path, then step 1 shows complete, step 2 in progress with its percentage, and later paid steps locked with their plans.
- Acceptance: Given a bundle payment is approved, when access is checked, then every paid offering in the path is open until the bundle's end, and offerings outside the path stay locked.

**FR-CATALOG-313 — Idea and research licensing.** Idea and think-tank offerings show an abstract, a table of contents, free sample pages, a version and last-updated date, the author, and plain "you may / you may not" license terms. Access plans grant a personal-use license; a commercial license is requested through a message and priced by agreement. Before first opening, the learner accepts the license; the acceptance records the license version and time. Every view carries the buyer's watermark (FR-PLAYER-405).
*Priority:* Must. *Status:* Proposed. *Access:* T0 visitor sees the page and samples; entitled learner opens the full content. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given a learner with an active plan opens an idea for the first time, when they accept the license, then the acceptance with license version and time is stored and the full content opens.
- Acceptance: Given a learner has not accepted the current license version, when they request the full content, then it does not open and the license is shown.

**FR-CATALOG-314 — Phone-friendly bank payment.** On a phone, checkout offers "Save QR to gallery" so the learner can use "scan from gallery" in their bank app, a copy button for the amount, the reference, and the account number, a help link to Oxinov's support chat or WhatsApp, and the expected review time. Free items of the offering stay open while the payment is in review.
*Priority:* Must. *Status:* Implemented (2026-10-02): "Save QR to gallery", copy buttons for the amount, the reference, and the account number, the review time, and "Message us on WhatsApp" when the help contact is a WhatsApp number, in the design's step layout. *Access:* T1 learner. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-CATALOG-307.
- Acceptance: Given a learner checks out on a phone, when they choose "Save QR to gallery", then the QR image is saved with the amount and reference shown beside it.
- Acceptance: Given a payment is in review, when the learner opens a subscriber item, then it stays locked and the page says the payment is in review.

**FR-CATALOG-315 — Trust on offering pages.** Every paid offering page shows what is included, the monthly cost of each plan, a certificate preview when the offering issues one, frequently asked questions with the owner's refund or change policy, and the instructor or author. Learner reviews appear only when real reviews exist (FR-CATALOG-304); the page never shows invented ratings, counts, or testimonials.
*Priority:* Must. *Status:* Proposed. *Access:* T0 visitor and above. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given a published paid offering, when a visitor opens it, then the included list, each plan's monthly cost, the FAQ with the policy, and the instructor are shown.
- Acceptance: Given an offering has no visible reviews, when its page loads, then no rating, count, or review area is shown.

**FR-CATALOG-316 — Marketing share kit.** For a published offering, administrators with the marketing or owner role can create social posts: images generated from the offering's title, kind, free items, and plan prices in Facebook post, Instagram square, story, and WhatsApp status sizes; an editable caption, which AI may draft (FR-AI-1702); and a tracked link per channel (Facebook, WhatsApp, Instagram, TikTok, LinkedIn, Viber). The dashboard attributes clicks, sign-ups, and approved payments to each tracked link. Sharing opens each network's own share page; posting straight to a Facebook Page needs a separate decision and Meta's app review. Generated posts never promise jobs, visas, or exam results.
*Priority:* Should. *Status:* Proposed. *Access:* Owner and marketing role of the seller workspace. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given a sign-up arrives through the WhatsApp tracked link and later pays, when the funnel is viewed, then the sign-up and the approved payment are counted for WhatsApp once.
- Acceptance: Given an offering is a draft or archived, when someone opens its share kit or tracked link, then no post is generated and the link opens the store home.

**FR-CATALOG-317 — Coupons.** The owner can create coupon codes with a percentage or fixed NPR discount, the offerings and plans they apply to, start and end dates, and a use limit. Learners enter a code at checkout on web or phone; the amount, QR reference, and receipt show the discounted price before payment. The server checks the coupon again at approval, records it on the payment, and counts a use only for approved payments. Expired, used-up, or non-matching codes are refused with a reason.
*Priority:* Should. *Status:* Implemented (API with integration tests; web pages built, end-to-end browser check pending). *Access:* Owner creates; T1 learner applies. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-CATALOG-302.
- Acceptance: Given a 25% coupon for all offerings, when a learner applies it to the 1-year plan, then checkout asks for NPR 11,250 and the approved payment records the coupon and that amount.
- Acceptance: Given a coupon reached its use limit before approval, when the payment is reviewed, then the reviewer sees the coupon is no longer valid and the payment cannot be approved at the discounted amount.

### 3.4 Learning experience

**FR-PLAYER-401 — Player.** Entitled learners can play video with pause, seek, volume, captions, 0.5×–2× speed, theater mode, picture-in-picture where supported, and keyboard controls. Support desktop and mobile layouts. Issue a short-lived playback token only after an entitlement check.
*Priority:* Must. *Status:* Implemented. *Access:* T1 entitled learner. *Source:* Edu product scope.
- Acceptance: Given an entitled learner opens a video lesson, when playback starts, then a short-lived playback token is issued only after the entitlement check succeeds.
- Acceptance: Given a learner without a current entitlement, when they request playback, then no playback token is issued and the video does not play.

**FR-PLAYER-402 — Resume and completion.** Save hosted video and audio position locally during playback and to the server at most every five seconds and when playback pauses or closes. Resume from the latest valid position across devices. Complete a hosted video or audio lesson after at least 90% of its unique duration has been played; seeking ahead alone does not count. Complete a text-only or approved external-embed lesson on learner confirmation because embedded playback may not expose reliable watch data. Completed lessons remain complete on replay. Course completion requires all required lessons plus passes on required quizzes, mock exams, and assignments; optional items do not block it.
*Priority:* Must. *Status:* Implemented. *Access:* T1 entitled learner, own progress. *Source:* Edu product scope.
- Acceptance: Given a learner has played at least 90% of a hosted lesson's unique duration, when playback ends, then the lesson is marked complete and stays complete on replay.
- Acceptance: Given a learner only seeks ahead without watching, when completion is evaluated, then the lesson is not marked complete, and course completion is refused while any required lesson, quiz, mock exam, or assignment remains incomplete.

**FR-PLAYER-403 — Notes.** Learners can create, edit, delete, and export private notes linked to a lesson and video timestamp. Only the note owner can see them. Export supports Markdown and PDF.
*Priority:* Must. *Status:* Implemented. *Access:* Note owner only. *Source:* Edu product scope.
- Acceptance: Given a learner exports their notes, when the export runs, then it contains only that learner's own notes in Markdown or PDF.
- Acceptance: Given another learner or an instructor requests someone else's notes, when the request is made, then it is refused regardless of course role.

**FR-PLAYER-404 — Audio lessons and practice.** Learners can play audio-only lessons with seek, speed, captions or transcript where available, and cross-device resume. Language exercises can ask a learner to record a spoken response using microphone permission; the learner can preview and re-record before submission. Store submitted audio privately for instructor feedback and apply the same access checks as assignments.
*Priority:* Must. *Status:* Implemented. *Access:* T1 entitled learner records; approved instructor reviews own course. *Source:* Edu product scope.
- Acceptance: Given a learner previews and re-records before submitting, when they submit, then only the final take is stored privately for instructor feedback.
- Acceptance: Given a learner lacks microphone permission or course entitlement, when they attempt the exercise, then no recording flow starts and no submission is created.

**FR-PLAYER-405 — View-only material.** Videos, PDFs, slides, documents, and images open inside Oxinov's player or viewer with no download, print, or open-in-new-tab control. YouTube uses the privacy-enhanced embed, Google Drive its preview frame, and Oxinov files short-lived signed URLs served inline. A watermark with the learner's email and the current date overlays the viewer. The protection is a deterrent: the product does not claim to prevent screen recording.
*Priority:* Must. *Status:* Partly implemented (2026-10-02): YouTube lessons use the privacy-enhanced embed and Drive files the preview frame, inside a sandboxed frame with the viewer's email as a watermark and no download control, and the web app's Content Security Policy allows only those two frame sources. Oxinov-hosted files keep their current player. *Access:* Entitled learner, or any signed-in learner for `FREE` items. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-PLAYER-401.
- Acceptance: Given an entitled learner opens a PDF or video, when the viewer loads, then no download or print control is shown and the watermark shows their email.
- Acceptance: Given a signed URL past its lifetime, when it is used, then the file is not served.

**FR-PLAYER-406 — Levels and progress rewards.** Learners earn experience points for completed lessons, passed quizzes, and attended live classes, and see a level and progress bar in the account centre and "My learning". Points have no money value, cannot be bought, and never unlock paid content. Repeating an item does not earn points twice.
*Priority:* Could. *Status:* Proposed. *Access:* T1 learner, own progress. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given a learner completes a lesson for the first time, when progress is saved, then their points and level update once.
- Acceptance: Given the same lesson is completed again or completion is retried, when progress is saved, then no extra points are added.

**FR-PLAYER-407 — Data saver.** Learners can turn on a data saver that plays videos at the lowest offered quality (for example 360p) and loads document pages one at a time. The choice is remembered per device.
*Priority:* Should. *Status:* Proposed. *Access:* T1 learner. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given data saver is on, when a video lesson starts, then it starts at the lowest offered quality.
- Acceptance: Given data saver is off, when a video starts, then quality follows the player's automatic choice.

### 3.5 Quizzes and assignments

**FR-ASSESS-501 — Quiz authoring.** Support single-choice, multiple-choice, true/false, and fill-in-the-blank questions. Configure pass score, time limit, attempt limit, question pool, and randomization. Freeze the question set and settings for an attempt once it starts; record start time, deadline, and attempt number.
*Priority:* Must. *Status:* Implemented. *Access:* Approved instructor, own course. *Source:* Edu product scope.
- Acceptance: Given a learner starts an attempt, when it is created, then the question set and settings are frozen for that attempt with a recorded start time, deadline, and attempt number.
- Acceptance: Given an instructor edits quiz settings after a learner's attempt has started, when the attempt continues, then the change does not alter the already-frozen attempt.

**FR-ASSESS-502 — Quiz grading.** Grade objective questions on the server and record score, pass/fail, submission time, and attempt number. Auto-submit an attempt at its deadline. Show explanations only after submission and under the instructor's release rule. When attempts are exhausted, another attempt requires an instructor or administrator reset that is logged.
*Priority:* Must. *Status:* Implemented. *Access:* Learner, own attempts; approved instructor or tenant administrator resets. *Source:* Edu product scope.
- Acceptance: Given an attempt reaches its deadline, when the deadline passes, then the server auto-submits it and records score, pass/fail, and submission time.
- Acceptance: Given a learner has exhausted the attempt limit, when they try to start another attempt, then it is refused unless an instructor or administrator issues a logged reset.

**FR-ASSESS-503 — Assignments.** Learners can submit an allowed file or URL before a deadline and replace a draft until final submission. Instructors can grade only their course's submissions, leave feedback, mark required work passed or failed, and request revision. Preserve each revision and its feedback. Administrators configure file limits and late-submission policy.
*Priority:* Must. *Status:* Implemented. *Access:* Learner, own submission; approved instructor grades own course only. *Source:* Edu product scope.
- Acceptance: Given a learner replaces a draft before the deadline, when they finalize, then only the final submission is graded and each earlier revision and its feedback is preserved.
- Acceptance: Given an instructor attempts to grade a submission from a course they do not own, when the request is made, then it is refused.

### 3.6 Certificates

**FR-CERT-601 — Issuance.** When the completion rule in FR-PLAYER-402 becomes true, issue one certificate per learner and course. Include learner name, course title, issue date, instructor name or approved signature, and unguessable certificate ID. Re-running issuance returns the same certificate. Offer a print-quality PDF download and a shareable verification URL suitable for a LinkedIn profile.
*Priority:* Must. *Status:* Implemented. *Access:* Learner owns the certificate; issuance is system-triggered. *Source:* FR-PLAYER-402.
- Acceptance: Given the FR-PLAYER-402 completion rule becomes true for a learner and course, when issuance runs, then exactly one certificate is created, and re-running issuance for the same pair returns the same certificate.
- Acceptance: Given the completion rule is not met, when issuance is attempted, then no certificate is created.

**FR-CERT-602 — Verification.** `/verify/{certificateId}` displays only holder name, course, issue date, and validity status. Invalid or revoked IDs reveal no private account data. Administrators can revoke with a recorded reason; verification reflects the change.
*Priority:* Must. *Status:* Implemented. *Access:* T0 public reads verification status only; tenant administrator revokes. *Source:* Edu product scope.
- Acceptance: Given a valid, non-revoked certificate ID, when a visitor opens `/verify/{certificateId}`, then only holder name, course, issue date, and validity status are shown.
- Acceptance: Given an invalid or revoked certificate ID, when a visitor opens the verification URL, then no private account data is revealed and a revocation is reflected immediately.

### 3.7 Discussion and announcements

**FR-COMM-701 — Lesson Q&A.** Enrolled learners can post questions and answers in accessible lessons. Course instructors and administrators can answer. An instructor can mark one accepted answer per question. Users can upvote once per answer and undo the vote. Authors can edit their posts; administrators can hide posts with a recorded reason.
*Priority:* Must. *Status:* Implemented. *Access:* Enrolled learner; approved instructor and tenant administrator answer or moderate. *Source:* Edu product scope.
- Acceptance: Given an instructor marks an answer accepted, when the question is viewed, then exactly one accepted answer is shown per question and each user's upvote counts once and can be undone.
- Acceptance: Given a learner is not enrolled in the course, when they attempt to post or vote, then the action is refused.

**FR-COMM-702 — Announcements.** Approved instructors can post announcements to their enrolled learners. Announcements appear in the course and are emailed. Send browser push notifications to learners who have opted in and whose browser supports them; optional email digests respect notification preferences. Track delivery and prevent duplicate sends on retries.
*Priority:* Must. *Status:* Implemented. *Access:* Approved instructor, own course; enrolled learners receive. *Source:* Edu product scope.
- Acceptance: Given an instructor posts an announcement, when delivery runs, then it appears in the course and is emailed, and a delivery retry does not create a duplicate send.
- Acceptance: Given a learner has not opted into push notifications or is not enrolled, when the announcement is sent, then that learner does not receive it on the non-opted-in channel.

**FR-COMM-703 — Purchase and access notifications.** Edu sends, by email and as an in-app notice: "Thank you for subscribing to <offering> (<plan>)" with the end date, what to do next, and the support address when a payment is approved or verified; the reason and next step when a payment is rejected; and a renewal reminder seven days and one day before a time-limited plan ends. Each notice is sent once per event, and transaction notices cannot be turned off (FR-NOTIF-2902).
*Priority:* Must. *Status:* Implemented, live delivery to be confirmed by the owner's first approved payment (2026-10-02): approval sends the thank-you email and an in-app notice with the end date; rejection sends the reason and the fix link by email and in-app; an hourly sweep sends the 7-day and 1-day renewal reminders by email and in-app, once each per course and end date, and an in-app notice when access ends. *Access:* The paying learner only. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-NOTIF-2901, FR-NOTIF-2902.
- Acceptance: Given a payment is approved, when the approval commits, then the learner receives one thank-you email and one in-app notice naming the offering, plan, and end date, and a retried approval sends nothing more.
- Acceptance: Given a payment is rejected, when the rejection commits, then the learner is told the reason and no thank-you notice is sent.

**FR-COMM-704 — Notification centre and admin notices.** Learners have a notification centre with unread markers, filters (From Oxinov, Payments, Live classes, Courses), and "mark all as read"; a bell shows the unread count. Administrators can send a notice with a title and plain-English message to all learners, the learners of one offering, learners with free access, or learners whose plans end within 7 days, now or at a scheduled time, in-app and optionally by email. Notices are read-only, sent once per learner, and respect notification preferences except for transaction and security notices (FR-NOTIF-2902).
*Priority:* Must. *Status:* Partly implemented (2026-10-02): a notification centre under Account with unread markers, "mark all as read", and links that stay inside Oxinov Edu; a header bell with the unread count across workspaces; a "new notifications" banner on the store home; administrators send an in-app notice to everyone or to the learners of one offering. Filters, the free-access and plans-ending audiences, and scheduling remain. *Access:* T1 learner reads own notifications; tenant administrator sends. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-NOTIF-2901, FR-NOTIF-2902.
- Acceptance: Given an administrator sends a notice to one offering's learners, when delivery runs, then each of those learners gets exactly one in-app notice and, if email was chosen and allowed, one email, and no one else receives it.
- Acceptance: Given a learner or instructor, when they try to send a notice to all learners, then the request is refused.

**FR-COMM-705 — Email allowance.** Sign-in codes and payment and security emails always go first. Notices and reminders use at most a configured share of the daily email allowance (for example 150 of Brevo's free 300 a day); the rest are delivered in-app and the email part waits for the next day. Administrators see the allowance before sending a notice.
*Priority:* Must. *Status:* Proposed. *Access:* System; tenant administrator sees the allowance. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-NOTIF-2901.
- Acceptance: Given today's notice share is used up, when a learner requests a sign-in code, then the code is still sent.
- Acceptance: Given a notice to 400 learners with 150 emails left in the notice share, when it is sent, then all 400 get the in-app notice and 150 get the email today and the rest the next day.

### 3.8 Dashboards and reporting

**FR-ANALYTICS-801 — Learner.** Show enrolled courses, completion percentage, next required item, deadlines, watched time, and certificates. Exclude optional items from the progress denominator and label the deadline time zone.
*Priority:* Must. *Status:* Proposed; "Continue learning" implemented as recorded above, remaining dashboard views open. *Access:* Learner, own data only. *Source:* Edu product scope.
- Acceptance: Given a learner has required and optional items, when the dashboard renders, then completion percentage excludes optional items and the next required item's deadline is shown in the learner's time zone.
- Acceptance: Given a learner requests another learner's dashboard, when the request is made, then it is refused.

**FR-ANALYTICS-802 — Instructor.** For owned courses, show enrollment count, completions, lesson drop-off, average quiz score, gross sales, refunds, fees, and net earnings by date range and currency. Define drop-off as learners who start a lesson but do not complete it within seven days. Money reports must reconcile to transactions.
*Priority:* Should. *Status:* Proposed. *Access:* Approved instructor, own courses. *Source:* Edu product scope.
- Acceptance: Given an instructor owns a course with sales and refunds, when the report is generated for a date range and currency, then gross sales, refunds, fees, and net earnings reconcile to the underlying transactions.
- Acceptance: Given an instructor requests analytics for a course they do not own, when the request is made, then it is refused.

**FR-ANALYTICS-803 — Tenant and platform reports.** A tenant administrator sees only its monthly active users (unique signed-in members with a meaningful action during the calendar month), gross merchandise value, refunds, net revenue, media storage and bandwidth usage, and payout status. A platform operator sees aggregate tenant counts, subscription revenue, and infrastructure usage; tenant-level personal or financial detail requires separately authorized, audited support access. Allow date filtering and authorized CSV export.
*Priority:* Should. *Status:* Proposed. *Access:* Tenant administrator, own tenant; platform operator sees aggregates only. *Source:* FR-TENANT-1605.
- Acceptance: Given a tenant administrator requests its monthly report, when it is generated, then it includes only that tenant's MAU, GMV, refunds, net revenue, storage or bandwidth usage, and payout status.
- Acceptance: Given a platform operator lacks separately authorized, audited support access, when they request tenant-level personal or financial detail, then the request is refused.

**FR-ANALYTICS-804 — Learner activity history.** A learner can see their own activity, newest first: lessons completed, quiz and exam results, live classes joined, payments submitted, approved, or rejected, certificates issued, and sign-ins on new devices with browser and country. Security-relevant entries link to "sign out of all devices".
*Priority:* Should. *Status:* Proposed. *Access:* T1 learner, own activity. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-ID-2208.
- Acceptance: Given a learner signs in on a new device, when they open Activity, then the sign-in is listed with browser and country.
- Acceptance: Given any other user, when they request a learner's activity, then the request is refused.

**FR-ANALYTICS-805 — Admin dashboard.** The seller workspace's administrators see revenue this month (approved and verified payments), payments waiting for review, active plans, new learners in the last 7 days, plans ending in the next 7 days, and certificates issued, plus a "Needs you" list (payments waiting, unanswered messages, lessons missing captions or text, live classes without a link). Figures come only from recorded data.
*Priority:* Should. *Status:* Proposed. *Access:* Tenant administrator of the seller workspace. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given two payments are waiting and one is approved today, when the dashboard loads, then it shows 2 waiting and includes the approved amount in this month's revenue.
- Acceptance: Given an instructor or learner, when they open the dashboard, then the request is refused.

**FR-ANALYTICS-806 — Sales funnel.** Seller-workspace administrators see, per offering and for all offerings, the last 30 days of: store visits, offering page views, free items started, checkouts started, payments submitted, and payments approved, with the largest drop highlighted. Counts come from events without personal data.
*Priority:* Should. *Status:* Proposed. *Access:* Tenant administrator of the seller workspace. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md).
- Acceptance: Given 10 checkouts started and 4 payments submitted for an offering, when the funnel loads for it, then those two steps show 10 and 4.
- Acceptance: Given an instructor or learner, when they request the funnel, then the request is refused.

### 3.9 Language, SSW, and IT programs

**FR-LANG-901 — Japanese JLPT pathway.** Provide separate Japanese programs for JLPT N5, N4, N3, N2, and N1, ordered from beginner to advanced. Each level can contain chapter-based lessons, vocabulary, kanji, grammar, reading, and listening practice, revision sets, and level-specific mock exams. Show progress by level and skill area. Speaking and writing lessons may be offered as supplementary learning but must not be presented as official JLPT test sections.
*Priority:* Should. *Status:* Proposed. *Access:* T0 discovery; T1 entitled learner for lessons. *Source:* [Official JLPT levels and sections](https://www.jlpt.jp/sp/e/guideline/testsections.html).
- Acceptance: Given a learner is entitled to an N5–N1 program, when they view progress, then it is shown by level and skill area and any speaking or writing lesson is labeled supplementary, not an official JLPT section.
- Acceptance: Given content presents a supplementary speaking or writing lesson as an official JLPT test section, when it is reviewed, then it is treated as a defect and corrected before publication.

**FR-LANG-902 — Other language pathways.** Support Korean, Chinese, Nepali, English, Russian, Arabic, and Spanish programs, with administrator-configurable levels and curricula rather than forcing JLPT levels onto them. Support native scripts, Unicode search, optional transliteration, and audio pronunciation. Chinese content can specify Simplified or Traditional script; Arabic course content and its controls must render correctly right-to-left. The app interface language is independent of the language being studied.
*Priority:* Should. *Status:* Proposed. *Access:* Approved instructor authors; T1 entitled learner studies. *Source:* Edu product scope; ADR-020.
- Acceptance: Given a Chinese course is authored, when the instructor selects Simplified or Traditional script, then learner-facing content renders in the selected script, and Arabic content renders correctly right-to-left independent of the app interface language.
- Acceptance: Given a language has no administrator-configured levels, when a learner opens its catalog, then no JLPT-specific level is forced onto that language.

**FR-LANG-903 — Language exercises.** Authors can build vocabulary, reading, listening, speaking, and writing activities using text, images, audio, and recorded learner responses. Objective questions can be auto-graded; spoken and written submissions can be graded with instructor feedback. A learner can review incorrect answers and repeat practice without changing a locked mock-exam result.
*Priority:* Should. *Status:* Proposed. *Access:* Approved instructor authors; T1 entitled learner attempts. *Source:* Edu product scope.
- Acceptance: Given a learner reviews an incorrect answer and repeats practice, when they resubmit, then a locked mock-exam result is unchanged by the practice retry.
- Acceptance: Given a spoken or written submission awaiting instructor feedback, when an unauthorized user requests it, then access is refused.

**FR-SSW-1001 — SSW field catalog.** Support training for every SSW skill field currently published by Japan's Immigration Services Agency, for SSW (i) and SSW (ii) where applicable. The administrator maintains a versioned field registry with field name, applicable status, official source URL, and last-reviewed date; fields can be added, renamed, or retired without code changes. This includes fields such as care, cleaning, manufacturing, construction, transport, agriculture, food service, and any newly listed official field. Do not hard-code a field count.
*Priority:* Should. *Status:* Proposed. *Access:* Tenant administrator maintains the registry; T0 reads published fields. *Source:* [Japan Immigration Services Agency SSW field information](https://www.moj.go.jp/isa/policies/ssw/sswfield.html).
- Acceptance: Given the Immigration Services Agency publishes a new or renamed field, when an administrator updates the registry with a source URL and reviewed date, then the field becomes available without a code change.
- Acceptance: Given a field is retired, when a learner opens it, then it is marked retired rather than silently removed from historical records.

**FR-SSW-1002 — Field-specific preparation.** Each SSW field can have its own curriculum, workplace vocabulary, safety or practical modules, skill questions, current language prerequisites where applicable, chapter practice, and exam-style mock tests. Link to relevant Japanese preparation, such as JLPT or JFT-Basic practice where appropriate. Label the field and exam version on course and result pages. Changes to an official exam pattern create a new version without rewriting historical attempts.
*Priority:* Should. *Status:* Proposed. *Access:* Approved instructor authors per field; T1 entitled learner studies. *Source:* FR-SSW-1001; [SSW test information](https://www.ssw.go.jp/en/about/sswv/exam/).
- Acceptance: Given an official exam pattern changes for a field, when the change is applied, then a new version is created and historical attempts are not rewritten.
- Acceptance: Given a course or result page is shown, when a learner views it, then the field and exam version used are labeled.

**FR-IT-1101 — Technology catalog.** Provide administrator-managed pathways for programming, robotics, Internet of Things (IoT), cybersecurity, networking, cloud computing, and additional IT topics. Organize each pathway by topic, prerequisite, difficulty, chapter, course, and project so new technologies and courses can be added without a code release.
*Priority:* Should. *Status:* Proposed. *Access:* Tenant administrator manages pathways; T0 reads published pathways. *Source:* Edu product scope.
- Acceptance: Given a new IT topic and its prerequisites are added, when published, then it is organized by topic, prerequisite, difficulty, chapter, course, and project without a code release.
- Acceptance: Given a course has an unmet stated prerequisite, when a learner attempts to enroll, then the prerequisite gap is disclosed before enrollment completes.

**FR-IT-1102 — Practical work.** IT courses can assign code repositories, files, diagrams, lab URLs, simulations, or video demonstrations. Instructors can grade with a rubric and return revision feedback. Any future automatic code execution or cybersecurity lab must run in an isolated, authorized environment with time and resource limits; uploading code alone does not execute it on the application server.
*Priority:* Should. *Status:* Proposed. *Access:* Approved instructor grades own course; T1 learner submits. *Source:* Security baseline.
- Acceptance: Given a learner uploads code as a lab submission, when it is stored, then it is not automatically executed on the application server.
- Acceptance: Given a future automatic code-execution or lab feature runs untrusted input, when it executes, then it is isolated with time and resource limits and cannot affect another tenant.

### 3.10 Question banks, mock exams, and results

**FR-EXAM-1201 — Question bank and blueprint.** Authors can tag questions by program, course, chapter, exam, level, skill field, topic, difficulty, and version. Questions can include reading passages, images, audio clips, and answer explanations. An exam blueprint specifies sections, question counts, time limits, order, marks, pass rule, and whether answers are released. An administrator approves a blueprint before it becomes available to learners.
*Priority:* Should. *Status:* Proposed. *Access:* Approved instructor authors questions; tenant administrator approves blueprints. *Source:* Edu product scope.
- Acceptance: Given an approved blueprint, when a learner starts a mock exam, then only that approved blueprint's sections, counts, and pass rule are used.
- Acceptance: Given a blueprint has not been approved, when a learner attempts to start an exam from it, then the attempt is refused.

**FR-EXAM-1202 — Chapter-wise practice.** A learner can start practice for a selected chapter or topic, receive feedback according to the practice configuration, retry, and see progress and weak areas. Practice attempts are separate from final or mock-exam attempts.
*Priority:* Should. *Status:* Proposed. *Access:* T1 entitled learner, own attempts. *Source:* Edu product scope.
- Acceptance: Given a learner retries chapter practice, when the retry is submitted, then it is recorded separately from any mock-exam attempt and does not alter a locked mock-exam result.
- Acceptance: Given a learner requests another learner's practice progress, when the request is made, then it is refused.

**FR-EXAM-1203 — Exam-wise mock tests.** A learner can take a full mock exam or a section-only test for a selected program and level. The server creates a fixed attempt from the approved blueprint, applies a server-side timer, autosaves answers, and submits on expiry. Reconnecting resumes the same unexpired attempt without creating a second one. Mock mode can hide hints and answers until the configured release time. Store the blueprint and question versions used by each attempt.
*Priority:* Should. *Status:* Proposed. *Access:* T1 entitled learner, own attempts. *Source:* FR-EXAM-1201.
- Acceptance: Given a learner reconnects during an unexpired attempt, when they resume, then the same attempt continues and no second attempt is created.
- Acceptance: Given an attempt reaches its server-side timer expiry, when expiry occurs, then the attempt auto-submits with the autosaved answers and cannot accept further changes.

**FR-EXAM-1204 — Results and review.** Show score, maximum score, pass/fail under the configured practice rule, section breakdown, correct and incorrect answers when released, time spent, attempt history, and recommended chapters to revisit. Label JLPT and SSW mock scores as platform practice scores, not official exam scores or certificates. Do not claim that raw mock scores reproduce an official scaled scoring method.
*Priority:* Must. *Status:* Implemented. *Access:* T1 entitled learner, own results. *Source:* Edu product scope.
- Acceptance: Given a learner completes a mock exam, when results are shown, then JLPT and SSW scores are labeled as platform practice scores, not official exam scores or certificates.
- Acceptance: Given a learner requests another learner's results, when the request is made, then it is refused.

**FR-EXAM-1205 — Result management.** An instructor can view results for learners in owned courses; an administrator can search and export authorized results by program, course, level, cohort, and date. Manual grading or a corrected answer key recalculates affected results through an audited revision, preserving the original result, actor, reason, and time. Notify affected learners when a published result changes.
*Priority:* Should. *Status:* Proposed. *Access:* Approved instructor, own course results; tenant administrator, tenant-scoped export. *Source:* Edu product scope.
- Acceptance: Given a corrected answer key recalculates a published result, when the revision is applied, then the original result, actor, reason, and time are preserved and the affected learner is notified.
- Acceptance: Given an instructor requests results outside their owned courses, when the request is made, then it is refused.

### 3.11 Student chat and messaging

**FR-CHAT-1301 — Conversations.** Provide learner-to-instructor and learner-to-support direct chat plus enrollment-gated course group chat on web and mobile. Administrators may enable learner-to-learner direct chat per course. Messages support text and approved attachments or voice notes, appear across devices, show unread counts, and preserve send order. A learner who loses enrollment cannot send new messages in that course.
*Priority:* Should. *Status:* Proposed. *Access:* Enrolled learner, approved instructor, and support; tenant administrator enables learner-to-learner chat. *Source:* FR-MSG-3001–3002.
- Acceptance: Given a learner is enrolled in a course, when they send a message in its group chat, then it appears in send order across their devices with an accurate unread count.
- Acceptance: Given a learner's enrollment ends, when they attempt to send a new message in that course, then the attempt is refused.

**FR-CHAT-1302 — Safety and moderation.** Users can report messages and block direct contacts. Instructors can moderate their course groups; administrators can review reports, remove content, suspend chat access, and retain an audit record. Restrict who can read private conversations, define a retention period, and give users controls for chat notifications. Mock-exam rules can disable chat during an active attempt.
*Priority:* Should. *Status:* Proposed. *Access:* Conversation participants; approved instructor moderates own course groups; tenant administrator reviews reports. *Source:* Threat model.
- Acceptance: Given a learner reports a message, when an administrator reviews it, then a removal or suspension action is retained in an audit record with actor and reason.
- Acceptance: Given a learner is in an active mock-exam attempt with chat disabled by rule, when they attempt to send a message, then it is refused for the duration of the attempt.

### 3.12 Student and payment management

**FR-MGMT-1401 — Student records.** Administrators can search students, view account and enrollment status, assign or revoke course access with a reason, suspend or restore accounts, and view progress, submissions, and results according to role permissions. Instructors see only their enrolled students and cannot read private notes or unrelated purchases. Maintain an audit trail for manual changes and support CSV export of authorized roster data.
*Priority:* Should. *Status:* Proposed. *Access:* Tenant administrator, own tenant; approved instructor, own enrolled students only. *Source:* Edu product scope.
- Acceptance: Given an administrator revokes course access with a reason, when the change is applied, then it is recorded in the audit trail with actor, reason, and time.
- Acceptance: Given an instructor requests a student's private notes or an unrelated purchase, when the request is made, then it is refused.

**FR-MGMT-1402 — Payment operations.** Administrators can search orders, provider transactions, refunds, disputes, subscriptions, coupon usage, instructor earnings, and payout status. Authorized staff can initiate a refund or cancel a subscription through the payment provider and see the resulting entitlement change after a verified event. Reconcile provider totals to the platform ledger and export transaction reports. Record actor, amount, currency, provider ID, and reason for manual financial actions.
*Priority:* Should. *Status:* Proposed. *Access:* Authorized tenant administrator, own tenant financial records. *Source:* FR-PAY-2701–2703.
- Acceptance: Given authorized staff initiate a refund, when the provider event is verified, then the resulting entitlement change is shown and the action records actor, amount, currency, provider ID, and reason.
- Acceptance: Given a manual financial action is attempted without the required authorized role, when it is submitted, then it is refused.

**FR-MGMT-1403 — Payment review queue.** Tenant administrators of the seller workspace see bank QR payments awaiting review, oldest first, with learner, offering, plan, amount, reference, transaction ID, submission time, and the screenshot (viewed inline, never public). They approve or reject with a reason; every decision records actor, time, previous state, new state, and reason.
*Priority:* Must. *Status:* Implemented (API with integration tests; web pages built, end-to-end browser check pending). *Access:* Tenant administrator of the seller workspace only. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-CATALOG-307.
- Acceptance: Given three payments await review, when an administrator opens the queue, then the oldest appears first with its evidence, and approving one records the decision in the audit trail.
- Acceptance: Given an instructor, a learner, or an administrator of another workspace, when they open the queue or a screenshot, then the request is refused and reveals nothing.

**FR-MGMT-1404 — Free access grants.** A tenant administrator of the seller workspace can give a learner access to an offering for 7 days, 1, 6, or 12 months, or lifetime, for example as a scholarship or prize, with a required reason. The grant is an `ADMIN_GRANT` entitlement, never a payment, is audited, and can be revoked with a reason.
*Priority:* Should. *Status:* Proposed. *Access:* Tenant administrator of the seller workspace. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-MGMT-1401.
- Acceptance: Given an administrator grants one month with a reason, when the learner opens the offering, then subscriber items open until the grant ends and the audit log records actor, learner, offering, length, and reason.
- Acceptance: Given a grant without a reason, or by someone who is not an administrator of the seller workspace, when it is submitted, then it is refused.

**FR-MGMT-1405 — Payment match checks.** The payment review screen shows automatic checks for each bank QR payment: whether the amount the learner entered matches the plan price, whether the reference was given, and whether the bank transaction ID was already used on another payment (which blocks approval). Checks help the reviewer but never approve a payment on their own.
*Priority:* Should. *Status:* Proposed. *Access:* Tenant administrator of the seller workspace. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-CATALOG-307.
- Acceptance: Given a transaction ID already used on another payment, when the reviewer opens the payment, then the check shows the other payment and Approve is disabled.
- Acceptance: Given all checks pass, when no reviewer acts, then the payment stays in review.

**FR-MGMT-1406 — Team roles.** The seller workspace's owner can invite team members by email with one of these roles: owner, content editor, instructor, payment reviewer, support agent, or marketing. Each role's permissions are shown as a table and enforced on the server (for example, only the owner sets prices; owner and payment reviewer approve payments; support agents reply to messages but cannot change access). Every team member must use 2-step sign-in. The last owner cannot be removed. The audit log shows who did what and when.
*Priority:* Must. *Status:* Proposed. *Access:* Owner manages; every role acts only within its permissions. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-TENANT-1604, FR-ID-2208.
- Acceptance: Given a support agent, when they try to change a plan price or approve a payment, then the request is refused and audited.
- Acceptance: Given a team member without 2-step sign-in, when they open Oxinov Studio, then they must set it up before any action.

**FR-MGMT-1407 — Learner management at scale.** Administrators can find learners by name, email, or payment reference, filter by segment (active plans, ending in 7 days, free only, payment in review, inactive 30 days) and offering, and select many learners to message, send a notice, give access, extend access, or export a CSV. A learner detail view shows profile, access with end dates, payments, progress, level, and history, with message, give or extend access, and suspend actions. Staff never see learners' private notes.
*Priority:* Must. *Status:* Proposed; extends FR-MGMT-1401. *Access:* Roles per FR-MGMT-1406. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-MGMT-1401.
- Acceptance: Given an administrator selects 20 learners ending in 7 days and extends access by 7 days with a reason, when it completes, then each of the 20 gets one audited extension and no one else changes.
- Acceptance: Given a support agent opens a learner's detail, when the page loads, then private notes are not shown and access-changing actions are not offered.

**FR-MGMT-1408 — Store settings.** The owner manages, in one Settings area: payment details (bank QR image upload, account name and number, bank, payment reference prefix, the review time promised to learners, and a payment help contact), automatic payment methods (on only when keys exist), default plan prices, coupons, the refund or change policy, the versioned content license, the email sender and support address, and the store's look. Checkout, offering pages, emails, and receipts read these settings; checkout is unavailable until a QR image and account details are set. Every change is audited; only the owner changes payment details and prices.
*Priority:* Must. *Status:* Implemented (API with integration tests; web pages built, end-to-end browser check pending). *Access:* Owner; other roles read only what their screens need. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-CATALOG-307.
- Acceptance: Given no bank QR image is set, when a learner chooses a paid plan, then checkout explains that payment is not available yet instead of showing an empty QR.
- Acceptance: Given a content editor, when they try to change the account number, then the request is refused and audited.

### 3.13 Native mobile apps

**FR-MOBILE-1501 — Android and iOS parity.** Provide native Android and iOS apps using the same accounts, tenant memberships, permissions, catalog, enrollments, course content, video and audio progress, chapter practice, mock exams, results, assignments, chat, and certificates as the web app. Users can choose among their workspaces and see each workspace's branding. Instructor course, grading, student, and announcement workflows and tenant-administrator review, student, customization, and payment-management workflows must be available in the apps. Changes made on one platform appear on the others after synchronization.
*Priority:* Should. *Status:* Proposed. *Access:* Same role-based access as the web app. *Source:* Edu product scope.
- Acceptance: Given a learner completes a lesson on the web app, when they open the mobile app after synchronization, then the same progress and entitlement state are shown.
- Acceptance: Given a user has no membership in a workspace, when they open the mobile app, then that workspace does not appear in their selection list.

**FR-MOBILE-1502 — Device capabilities.** Use camera and microphone permission only when recording content or a response. Support recording and upload retry, adaptive playback, background audio where the operating system permits, and opt-in push notifications for messages, deadlines, results, and announcements. An interrupted connection must not duplicate an assignment, exam attempt, message, or purchase.
*Priority:* Should. *Status:* Proposed. *Access:* T1 entitled learner; approved instructor for recording features. *Source:* Edu product scope.
- Acceptance: Given an upload is interrupted and retried, when it completes, then no duplicate assignment, exam attempt, message, or purchase is created.
- Acceptance: Given a user has not granted camera or microphone permission, when a feature needing it is opened, then the permission is requested only at that point and the feature is unavailable until granted.

**FR-MOBILE-1503 — Mobile purchases.** The purchase flow must select a permitted billing method for the app store, country, and digital product. Verify store receipts or payment-provider events on the server before granting the same course entitlement used by the web app. Show subscription terms and restore eligible purchases. Finalize in-app purchase and external-link behavior against current Apple and Google policies for each launch region before submission to their stores.
*Priority:* Should. *Status:* Proposed. *Access:* T1 learner. *Source:* [Google Play payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en).
- Acceptance: Given a store receipt or payment-provider event is verified server-side, when verification succeeds, then the same course entitlement used by the web app is granted exactly once.
- Acceptance: Given a receipt or event fails verification or is duplicated, when the purchase flow completes, then no entitlement is granted or duplicated.

**FR-MOBILE-1504 — Installable web app first.** `edu.oxinov.com` can be installed on a phone's home screen (web app manifest, icons, theme color, and an offline page explaining that learning needs a connection). Every learner journey, including checkout and viewing, works at 360 px width with touch targets of at least 44 px. Purchases happen on the web; the native app shows access bought on the web and follows FR-MOBILE-1503 for store rules.
*Priority:* Must. *Status:* Proposed. *Access:* Same as the web app. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); ADR-003.
- Acceptance: Given a learner opens the store on an Android phone, when they choose "Add to home screen", then Oxinov Edu opens full screen from its icon.
- Acceptance: Given the phone is offline, when the installed app opens, then the offline page explains the problem instead of a browser error.

### 3.14 Customer Edu workspaces (multi-tenancy)

**FR-TENANT-1601 — Self-service Edu workspace creation.** A user with a verified email can create an Edu workspace, choose a unique address, name it, select a starter template, and become its first tenant owner. Creation is idempotent: a retry cannot make duplicate tenants or duplicate plan charges. The user can also accept an invitation to an existing tenant. Signing in shows only workspaces in which the user has an active membership; the same email may own or join more than one workspace.
*Priority:* Must. *Status:* Implemented. *Access:* T1 verified user becomes tenant owner. *Source:* Edu product scope.
- Acceptance: Given a verified user submits a unique workspace address and name, when creation completes, then they become the tenant's first owner and a retried request does not create a duplicate tenant or plan charge.
- Acceptance: Given a user has no active membership in a workspace, when they sign in, then that workspace does not appear in their workspace list.

**FR-TENANT-1602 — Workspace routing and discovery.** Web users can open a workspace by its platform subdomain or verified custom domain; mobile users select from their membership list and return to their last workspace. A domain must be verified before activation and cannot be claimed by two tenants. An email domain alone does not grant access or ownership. Unknown, suspended, or unauthorized tenant addresses reveal no private course or member data.
*Priority:* Must. *Status:* Proposed; platform-subdomain routing implemented as recorded above, verified custom domains open. *Access:* T0 for public routing; membership required for private data. *Source:* Edu product scope.
- Acceptance: Given a custom domain has completed verification, when it is activated, then it resolves to exactly one tenant and cannot be claimed by a second tenant.
- Acceptance: Given a tenant address is unknown, suspended, or unauthorized for the requester, when it is opened, then no private course or member data is revealed.

**FR-TENANT-1603 — Customization.** Tenant administrators can edit and preview workspace name, logo, colors, typography, landing-page content, navigation, enabled course categories, language, time zone, email templates, and certificate branding. Changes are saved as drafts and published by an authorized administrator; the previous published configuration remains available for rollback. Validate contrast, file types, and URL destinations. Customization cannot inject arbitrary scripts or change the platform's security and payment controls.
*Priority:* Should. *Status:* Proposed. *Access:* Tenant administrator, own tenant. *Source:* Edu product scope.
- Acceptance: Given an administrator publishes a customization draft, when publication completes, then the previous published configuration remains available for rollback.
- Acceptance: Given a customization attempts to inject a script or alter security or payment controls, when it is submitted, then it is rejected.

**FR-TENANT-1604 — Members and ownership.** Tenant administrators can invite, remove, suspend, and assign tenant roles to members; invitations expire and must be accepted by the addressed account. Roles are scoped to one tenant, and changing a role in one tenant does not alter another. The last active owner cannot be removed until ownership is transferred and accepted. Record invitations, role changes, and tenant switches in the audit trail.
*Priority:* Must. *Status:* Implemented. *Access:* Tenant administrator or owner, own tenant. *Source:* Edu product scope.
- Acceptance: Given a role change is applied in one tenant, when the same member is checked in another tenant, then that other tenant's role is unaffected.
- Acceptance: Given the last active owner attempts to leave or be removed without a completed ownership transfer, when the action is submitted, then it is refused.

**FR-TENANT-1605 — Isolation.** Course content, questions, media, chat, students, results, payment records, configuration, search results, exports, jobs, caches, and AI context belong to one tenant. Every tenant-owned record carries an immutable tenant ID, and every access path enforces tenant membership and role permissions. Attempts to use another tenant's object ID, URL, webhook reference, or storage key must be denied. Platform operators use time-limited, reasoned, audited support access when tenant data access is necessary.
*Priority:* Must. *Status:* Implemented. *Access:* Active tenant member for own tenant; platform operator only with time-limited, audited support access. *Source:* Edu product scope.
- Acceptance: Given an authenticated member of one tenant, when they request another tenant's object ID, URL, webhook reference, or storage key, then the request is denied and answers "not found".
- Acceptance: Given a platform operator without a reasoned, time-limited, audited support grant, when they request tenant data, then the request is refused.

**FR-TENANT-1606 — Edu subscription and lifecycle.** Track the customer's subscription to Oxinov Edu separately from a learner's purchase of a course. A tenant can see its plan, usage, invoices, renewal date, and enabled limits. Trial, active, past-due, suspended, and canceled states have documented effects on authoring, learner access, payments, and data export. Suspension must not erase tenant data; deletion follows the approved retention and export policy.
*Priority:* Should. *Status:* Proposed. *Access:* Tenant owner, own tenant. *Source:* Edu product scope.
- Acceptance: Given a tenant enters the suspended state, when a tenant owner requests its data export, then the export still succeeds because suspension does not erase tenant data.
- Acceptance: Given a tenant's subscription is past-due or canceled, when a learner or instructor takes an action gated by that state, then the documented effect for that state applies rather than default access.

### 3.15 AI-assisted setup and authoring

**FR-AI-1701 — Prompt-based workspace setup.** A tenant administrator can describe the Edu workspace they want in natural language, for example “Create a Japanese N5 school with blue branding and beginner courses.” The assistant proposes a structured tenant configuration and course outline, displays a preview and the exact changes, and saves an editable draft only after confirmation. The administrator can revise the draft by further prompts.
*Priority:* Should. *Status:* Proposed. *Access:* Tenant administrator, own tenant. *Source:* AI governance baseline.
- Acceptance: Given an administrator confirms a proposed configuration, when confirmation is submitted, then an editable draft limited to that tenant is saved and no change applies before confirmation.
- Acceptance: Given the assistant proposes a change outside the administrator's tenant or role, when the proposal is generated, then it is not offered for execution.

**FR-AI-1702 — Content creation commands.** An authorized instructor or administrator can use prompts to draft course structures, chapters, lesson text, vocabulary lists, assignment rubrics, quizzes, mock-exam blueprints, transcripts, translations, and announcements within their tenant. Generated content records the prompt owner, generation time, source inputs, and review status. Instructors review factual accuracy, language quality, answer keys, and content rights before submitting it to the normal publication workflow. AI output never becomes learner-visible solely because it was generated.
*Priority:* Should. *Status:* Proposed. *Access:* Approved instructor or tenant administrator, own tenant. *Source:* AI governance baseline.
- Acceptance: Given AI-generated content is created, when it is saved, then it records the prompt owner, generation time, source inputs, and review status.
- Acceptance: Given generated content has not passed instructor review and the normal publication workflow, when a learner requests the course, then that content is not learner-visible.

**FR-AI-1703 — Safe command execution.** The assistant can call only documented, tenant-scoped application actions allowed to the requesting role. Before a command changes data, show a human-readable plan and affected records; high-impact actions such as publication, bulk messages, refunds, payouts, user-role changes, and deletion require explicit confirmation. Reject instructions that request arbitrary SQL, shell execution, secrets, cross-tenant data, or bypass of approval. Record executed actions and support undo for reversible changes.
*Priority:* Must when the AI assistant is enabled. *Status:* Proposed. *Access:* Requesting role's own tenant scope only. *Source:* AI governance baseline; FR-TENANT-1605.
- Acceptance: Given a high-impact action such as a refund, payout, role change, or deletion is proposed, when the assistant presents it, then it executes only after explicit confirmation and is recorded with support for undo where reversible.
- Acceptance: Given a prompt requests arbitrary SQL, shell execution, secrets, or cross-tenant data, when it is processed, then the request is rejected and not executed.

**FR-AI-1704 — AI quality, privacy, and cost.** Keep AI provider integrations replaceable. Do not send private learner data, payment details, or another tenant's content to a model without a documented purpose and tenant permission. Apply per-tenant usage limits and show consumption to administrators. Provide a non-AI manual path for every core authoring and administration workflow. Test generated question banks for duplicates, unsupported claims of official exam affiliation, and missing answers before review.
*Priority:* Must when the AI assistant is enabled. *Status:* Proposed. *Access:* Tenant administrator sees own tenant's consumption. *Source:* AI governance baseline.
- Acceptance: Given a tenant reaches its usage limit, when a further AI request is made, then it is refused and the administrator can see the consumption that caused the limit.
- Acceptance: Given a core authoring or administration workflow has no non-AI manual path, when the workflow is reviewed, then it does not ship until a manual path exists.

**FR-AI-1705 — OXI course advisor.** Learners can ask OXI, from Messages and course pages, what to learn for a goal. OXI recommends only published offerings and free items of the store, explains why in one line, links to each offering, and offers "Talk to a human", which hands the conversation to support. Until the AI gateway exists (AI roadmap), OXI is rule-based (goal, language, level, and budget matched to offerings) with no model call. The model-backed version is labeled as AI that can make mistakes, never receives payment data, and stops at the owner's monthly budget.
*Priority:* Should. *Status:* Proposed. *Access:* T1 learner; tenant administrator configures. *Source:* [ADR-028](../../04-architecture/adr/adr-028-edu-knowledge-store.md); FR-AI-1704; ADR-014.
- Acceptance: Given a learner says they want to work in Japan, when OXI answers, then every recommendation is a published offering or free item with a working link.
- Acceptance: Given the learner chooses "Talk to a human" or the AI budget is used up, when they send the next message, then it goes to the support inbox and OXI does not answer.

## 4. Open decisions

- Every legacy requirement now carries Priority, Status, Access, Source, and at least one allowed and one denied acceptance statement. Status reflects only what the implementation table above and [current state](../../04-architecture/current-state.md) already record as verified (**Implemented**, or **Proposed** noting partial delivery); everything else defaults to **Proposed**. Priority defaults to **Must** for requirements already implemented or partly implemented, and **Should** for requirements not yet built, so that none of this normalization asserts a release commitment the owner has not made.
- These defaults are a documentation baseline, not an approval: the owner still sets release sequencing, and may reprioritize, defer, or withdraw any **Proposed** requirement before it is built.
- ADR-028 (2026-10-01) makes Edu Oxinov's own knowledge store: access plans, bank QR payments with review, externally hosted YouTube and Google Drive material, free and subscriber visibility, live class links, view-only display, purchase notifications, and an installable web app (FR-COURSE-206 to 208, FR-CATALOG-305 to 309, FR-PLAYER-405, FR-COMM-703, FR-MGMT-1403, FR-MOBILE-1504). The owner then added the learner account centre, free offerings, sharing, levels, activity, notices, the admin dashboard, free access grants, and the OXI advisor (FR-AUTH-104, FR-CATALOG-310 and 311, FR-PLAYER-406, FR-ANALYTICS-804 and 805, FR-COMM-704, FR-MGMT-1404, FR-AI-1705). An expert UX review added goal setup, mission paths and bundles, idea licensing, phone-friendly bank payment, trust content on offering pages, data saver, the sales funnel, and payment match checks (FR-AUTH-105, FR-CATALOG-312 to 315, FR-PLAYER-407, FR-ANALYTICS-806, FR-MGMT-1405); bundle prices and the refund or change policy are owner decisions. The admin tools then added the course builder, media library, marketing share kit, team roles, and learner management (FR-COURSE-209 and 210, FR-CATALOG-316, FR-MGMT-1406 and 1407); the AI course designer, AI captions, AI lesson notes, and AI quiz drafts use FR-AI-1702 and wait for the AI gateway. A chain audit then added store settings, coupons, the email allowance, and master copies (FR-MGMT-1408, FR-CATALOG-317, FR-COMM-705, FR-COURSE-211); receipts follow FR-PAY-2705. The card gateway (FR-CATALOG-308) waits for the owner's merchant account.
- Native mobile release scope, offline media, Organization Manager, AI features, subscriptions, tenant self-service, and provider choices remain product decisions even where this document describes their required behavior.
- The implementation table and [current state](../../04-architecture/current-state.md) describe verified behavior today; requirement text in this document that is broader than the running product remains unimplemented until separately approved and verified.

## Related documents

- Platform requirements: [Platform FRD](platform-frd.md)
- Requirements rules: [requirements standard](../README.md) and [non-functional requirements](../nfr.md)
- Architecture and delivery rules: [Edu architecture](../../02-products/edu/edu-architecture.md) and [coding standards](../../08-engineering/coding-standards.md)
- End-to-end journeys: [Edu acceptance criteria](../../02-products/edu/edu-acceptance-criteria.md)

## Subject and platform references

- [Official JLPT levels and sections](https://www.jlpt.jp/sp/e/guideline/testsections.html)
- [Japan Immigration Services Agency SSW field information](https://www.moj.go.jp/isa/policies/ssw/sswfield.html)
- [SSW test information](https://www.ssw.go.jp/en/about/sswv/exam/)
- [JLPT sample-question rights](https://www.jlpt.jp/e/policy.html)
- [Google Play payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en)
