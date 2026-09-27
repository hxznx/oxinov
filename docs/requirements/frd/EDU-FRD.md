# Functional Requirements Document: Oxinov Edu

**Version:** 2.1
**Date:** 2026-09-28
**Status:** Active product requirements with mixed implementation state; owner review remains open for unapproved scope
**Audience:** Product, design, engineering, and QA
**Product:** Oxinov Edu (`edu.oxinov.com`), the first Oxinov product plane
**Standard:** [Oxinov requirements standard](../README.md). IDs in this document are permanent and are cited by code, migrations, and tests.

## Implementation status (2026-09-26)

Built and verified in CI and live at `edu.oxinov.com` (details in the [Edu web README](../../../frontend/products/lms-web/README.md#what-works-today) and [current state](../../architecture/CURRENT-STATE.md)). Requirements not listed are not built yet; the per-requirement *Status* lines move to **Implemented** once the owner approves each FR.

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

The older Edu requirements keep their permanent IDs and compact prose, but they are not exempt from the current [requirements standard](../README.md). Every implementation and test for a requirement below must apply all relevant baseline statements in addition to the behavior written in that requirement:

- **Allowed path:** an authenticated actor with the stated role, active tenant membership, entitlement, and object ownership can complete the behavior and receives only fields in that scope.
- **Denied path:** a missing role, expired entitlement, suspended membership, guessed identifier, or object from another tenant is refused; protected resources outside the caller's scope answer "not found" and cross-tenant attempts emit `tenant.cross_access.denied` without personal data.
- **Retry path:** externally triggered writes, payments, uploads, submissions, certificate issuance, notifications, and background jobs are idempotent; retrying the same operation cannot create a second durable result.
- **State path:** invalid or stale state transitions are refused. Accepted transitions record the actor, UTC time, previous state, new state, and reason where the action affects access, publication, grading, money, moderation, or ownership.
- **File path:** uploads are type- and size-checked, malware-scanned, stored privately, and unavailable until checks finish; rejected content is deleted.
- **Money and time path:** prices and totals use integer minor units plus currency; deadlines use stored UTC instants and render in the reader's time zone. Amount, currency, provider, and final provider state are verified server-side before access changes.
- **Accessibility and recovery path:** the behavior works at phone width, by keyboard and assistive technology where applicable, explains validation errors, preserves safe user input after a recoverable failure, and has a non-AI path.

Tests cite the requirement ID plus the baseline path they prove. A happy-path test alone is never sufficient for a protected, tenant-scoped, financial, upload, or state-changing requirement.

## 0. Platform dependencies

Oxinov Edu runs on the shared Oxinov Platform. Sign-in, sessions, trust levels, policy acceptance, organizations, plans, entitlements, payments ledger, KYC, notifications, and privacy requests are defined in the [Platform FRD](PLATFORM-FRD.md) and are not redefined here. LMS tenant memberships, roles, instructor approval, courses, learning, exams, and results remain in this document and in the LMS database boundary. Where an LMS requirement below conflicts with a platform requirement, the platform requirement wins and the LMS requirement is marked **Superseded**.

## 1. Purpose and scope

Build a cloud-hosted, multi-tenant web and mobile learning platform. A customer creates and customizes an LMS workspace; its instructors create and sell courses, learners complete lessons and assessments, and its administrators govern publication, students, results, and payments. The catalog covers Japanese language and exam preparation, Specified Skilled Worker (SSW) preparation, other languages, and information technology. Every numbered requirement is in product scope unless marked optional. Release sequencing is still a product decision; this document does not imply that every course or module ships on day one.

The baseline supports multiple customer LMS workspaces on one platform, each with its own members, courses, branding, settings, and financial records. It includes a responsive web app and native Android and iOS apps. Organization Manager and bulk seat licensing within a workspace are optional B2B scope. Live classes are outside this document; instructors can create or upload recorded lessons. Offline video downloads require a separate product decision.

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
| Tenant / LMS workspace | One customer's logically isolated LMS, identified by an immutable tenant ID; it can have multiple admins, instructors, and learners. |
| Membership | A user's role within one tenant. One verified email account can belong to multiple tenants with different roles. |

Store timestamps in UTC and display dates in the user's selected time zone. Store prices as currency plus integer minor units. Run authorization checks on the server for every protected read and write. Resolve the active tenant from an authenticated membership and tenant address or explicit workspace selection, never from email text alone.

## 2. Roles and permissions

One account may be a learner or instructor in one tenant and an administrator in another. Instructor privileges require approval from that tenant's administrator. Ownership and tenant checks apply in addition to role checks. In the requirements below, “administrator” means tenant administrator unless “platform operator” is stated.

| Role | Allowed actions | Restrictions |
| --- | --- | --- |
| Visitor | Browse published courses and verify certificates. | Cannot view paid lessons or private learner data. |
| Learner | Enroll, purchase, study entitled courses, take mock exams, submit work, chat where enabled, and view own progress and results. | Cannot edit course content or see another learner's submissions or notes. |
| Approved instructor | Manage own courses, recorded media, question banks, assignments, student rosters, results, course chat, announcements, and analytics. | Cannot publish without review or manage another instructor's course. |
| Tenant administrator | Approve instructors and courses, customize the workspace, manage its programs, students, exams, moderation, refunds, subscriptions, payouts, and tenant reports. | Cannot manage another tenant; sensitive actions must be audited. |
| Tenant owner | Has tenant-administrator permissions plus ownership transfer and LMS subscription control. | Cannot remove the last active owner or claim another tenant. |
| Platform operator | Provision and suspend tenants, manage platform plans and global operations, and provide audited support access when explicitly authorized. | Cannot browse a tenant's private learning or payment data by default. |
| Organization Manager (optional) | Buy and assign seats, manage own cohorts, and view aggregate progress. | Cannot view another organization's data or private learner notes. |

## 3. Functional requirements

### 3.1 Accounts and access

**FR-AUTH-101 — Registration and sign-in.** This requirement is **Superseded** by FR-ID-2201, FR-ID-2202, FR-ID-2203, FR-ID-2204, and FR-ID-2206 (ADR-011). LMS uses Oxinov single sign-on with Google or email one-time codes and no customer passwords. Historical behavior—email/password plus Google, GitHub, and Microsoft sign-in—is retained here only to explain the supersession and must not be implemented.
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

### 3.2 Course authoring and publishing

**FR-COURSE-201 — Structure.** An instructor can create a course with title, summary, description, program, category, applicable language and level or SSW field or IT pathway, learning outcomes, cover image, price, sections, and lessons. A course needs at least one section and one lesson per section before review. Reordering persists in the course page and player.

**FR-COURSE-202 — Content and resources.** A lesson may contain video, formatted text, or both. Text supports headings, links, code blocks, math, and embedded diagrams. Instructors may attach resources. Direct videos are processed to adaptive streaming; the authoring screen shows processing, ready, and failed states. External embeds are limited to an approved provider list. Validate file type and size and scan uploads. Require captions or a text alternative before publishing video lessons.

**FR-COURSE-203 — Lifecycle.** States are `DRAFT`, `IN_REVIEW`, `PUBLISHED`, and `ARCHIVED`. An administrator approves or rejects a submitted draft and records feedback. Rejection returns it to draft. Editing a published course creates a separate draft; only approval replaces the learner-visible version. Archive removes a course from discovery and new enrollment while preserving existing learner access and records unless an administrator explicitly revokes access with a reason. Log actor and time for publication and moderation actions.

**FR-COURSE-204 — Learning gates.** An instructor may require sequential progression and set lesson availability by date or days since enrollment. The server blocks locked lessons and shows why and when they unlock. Preview lessons may be viewed without enrollment but expose no paid resources or private discussions.

**FR-COURSE-205 — Recorded video and audio library.** Instructors can record video or audio with a permitted device camera or microphone, upload existing recordings, add title, language, captions or transcript, thumbnail, and chapter markers, and attach recordings to lessons. Audio-only lessons require a transcript or equivalent text alternative before publication. Interrupted uploads can resume or be retried without creating duplicate lessons. Only processed and approved recordings are playable. Instructors can replace a recording through the course version workflow while existing learner progress remains traceable to the earlier version.

### 3.3 Catalog, enrollment, and payment

**FR-CATALOG-301 — Discovery.** Search published programs and courses by title, description, instructor, language, exam, and skill field. Filter by program, language, JLPT level or other applicable level, SSW field, IT topic, price, rating, and duration. Paginate and sort results. Exclude archived and unapproved courses and show a useful empty state.

**FR-CATALOG-302 — Course page.** Show the program and applicable exam level or skill field, current description, outcomes, instructor, price and currency, curriculum, duration, preview, rating summary, and access terms. Show the final payable amount after a coupon before checkout.

**FR-CATALOG-303 — Enrollment and payment.** Free courses enroll immediately. Paid courses support one-time purchase and subscription access. Validate coupons against course, dates, and customer eligibility. Grant paid entitlement only after a verified provider event; a checkout redirect alone grants nothing. Duplicate or delayed events must not create duplicate enrollments or entitlements. A failed or canceled initial purchase grants no access. Subscription cancellation retains access through its paid-through date; failed renewal follows the configured grace period. A full refund or chargeback removes only the entitlement created by that transaction, unless another valid entitlement exists. Record provider transaction IDs and access changes.

**FR-CATALOG-304 — Ratings and reviews.** An enrolled learner may leave one rating and review per course and edit it. The rating summary uses visible reviews only. Administrators can hide abusive reviews with a recorded reason.

### 3.4 Learning experience

**FR-PLAYER-401 — Player.** Entitled learners can play video with pause, seek, volume, captions, 0.5×–2× speed, theater mode, picture-in-picture where supported, and keyboard controls. Support desktop and mobile layouts. Issue a short-lived playback token only after an entitlement check.

**FR-PLAYER-402 — Resume and completion.** Save hosted video and audio position locally during playback and to the server at most every five seconds and when playback pauses or closes. Resume from the latest valid position across devices. Complete a hosted video or audio lesson after at least 90% of its unique duration has been played; seeking ahead alone does not count. Complete a text-only or approved external-embed lesson on learner confirmation because embedded playback may not expose reliable watch data. Completed lessons remain complete on replay. Course completion requires all required lessons plus passes on required quizzes, mock exams, and assignments; optional items do not block it.

**FR-PLAYER-403 — Notes.** Learners can create, edit, delete, and export private notes linked to a lesson and video timestamp. Only the note owner can see them. Export supports Markdown and PDF.

**FR-PLAYER-404 — Audio lessons and practice.** Learners can play audio-only lessons with seek, speed, captions or transcript where available, and cross-device resume. Language exercises can ask a learner to record a spoken response using microphone permission; the learner can preview and re-record before submission. Store submitted audio privately for instructor feedback and apply the same access checks as assignments.

### 3.5 Quizzes and assignments

**FR-ASSESS-501 — Quiz authoring.** Support single-choice, multiple-choice, true/false, and fill-in-the-blank questions. Configure pass score, time limit, attempt limit, question pool, and randomization. Freeze the question set and settings for an attempt once it starts; record start time, deadline, and attempt number.

**FR-ASSESS-502 — Quiz grading.** Grade objective questions on the server and record score, pass/fail, submission time, and attempt number. Auto-submit an attempt at its deadline. Show explanations only after submission and under the instructor's release rule. When attempts are exhausted, another attempt requires an instructor or administrator reset that is logged.

**FR-ASSESS-503 — Assignments.** Learners can submit an allowed file or URL before a deadline and replace a draft until final submission. Instructors can grade only their course's submissions, leave feedback, mark required work passed or failed, and request revision. Preserve each revision and its feedback. Administrators configure file limits and late-submission policy.

### 3.6 Certificates

**FR-CERT-601 — Issuance.** When the completion rule in FR-PLAYER-402 becomes true, issue one certificate per learner and course. Include learner name, course title, issue date, instructor name or approved signature, and unguessable certificate ID. Re-running issuance returns the same certificate. Offer a print-quality PDF download and a shareable verification URL suitable for a LinkedIn profile.

**FR-CERT-602 — Verification.** `/verify/{certificateId}` displays only holder name, course, issue date, and validity status. Invalid or revoked IDs reveal no private account data. Administrators can revoke with a recorded reason; verification reflects the change.

### 3.7 Discussion and announcements

**FR-COMM-701 — Lesson Q&A.** Enrolled learners can post questions and answers in accessible lessons. Course instructors and administrators can answer. An instructor can mark one accepted answer per question. Users can upvote once per answer and undo the vote. Authors can edit their posts; administrators can hide posts with a recorded reason.

**FR-COMM-702 — Announcements.** Approved instructors can post announcements to their enrolled learners. Announcements appear in the course and are emailed. Send browser push notifications to learners who have opted in and whose browser supports them; optional email digests respect notification preferences. Track delivery and prevent duplicate sends on retries.

### 3.8 Dashboards and reporting

**FR-ANALYTICS-801 — Learner.** Show enrolled courses, completion percentage, next required item, deadlines, watched time, and certificates. Exclude optional items from the progress denominator and label the deadline time zone.

**FR-ANALYTICS-802 — Instructor.** For owned courses, show enrollment count, completions, lesson drop-off, average quiz score, gross sales, refunds, fees, and net earnings by date range and currency. Define drop-off as learners who start a lesson but do not complete it within seven days. Money reports must reconcile to transactions.

**FR-ANALYTICS-803 — Tenant and platform reports.** A tenant administrator sees only its monthly active users (unique signed-in members with a meaningful action during the calendar month), gross merchandise value, refunds, net revenue, media storage and bandwidth usage, and payout status. A platform operator sees aggregate tenant counts, subscription revenue, and infrastructure usage; tenant-level personal or financial detail requires separately authorized, audited support access. Allow date filtering and authorized CSV export.

### 3.9 Language, SSW, and IT programs

**FR-LANG-901 — Japanese JLPT pathway.** Provide separate Japanese programs for JLPT N5, N4, N3, N2, and N1, ordered from beginner to advanced. Each level can contain chapter-based lessons, vocabulary, kanji, grammar, reading, and listening practice, revision sets, and level-specific mock exams. Show progress by level and skill area. Speaking and writing lessons may be offered as supplementary learning but must not be presented as official JLPT test sections.

**FR-LANG-902 — Other language pathways.** Support Korean, Chinese, Nepali, English, Russian, Arabic, and Spanish programs, with administrator-configurable levels and curricula rather than forcing JLPT levels onto them. Support native scripts, Unicode search, optional transliteration, and audio pronunciation. Chinese content can specify Simplified or Traditional script; Arabic course content and its controls must render correctly right-to-left. The app interface language is independent of the language being studied.

**FR-LANG-903 — Language exercises.** Authors can build vocabulary, reading, listening, speaking, and writing activities using text, images, audio, and recorded learner responses. Objective questions can be auto-graded; spoken and written submissions can be graded with instructor feedback. A learner can review incorrect answers and repeat practice without changing a locked mock-exam result.

**FR-SSW-1001 — SSW field catalog.** Support training for every SSW skill field currently published by Japan's Immigration Services Agency, for SSW (i) and SSW (ii) where applicable. The administrator maintains a versioned field registry with field name, applicable status, official source URL, and last-reviewed date; fields can be added, renamed, or retired without code changes. This includes fields such as care, cleaning, manufacturing, construction, transport, agriculture, food service, and any newly listed official field. Do not hard-code a field count.

**FR-SSW-1002 — Field-specific preparation.** Each SSW field can have its own curriculum, workplace vocabulary, safety or practical modules, skill questions, current language prerequisites where applicable, chapter practice, and exam-style mock tests. Link to relevant Japanese preparation, such as JLPT or JFT-Basic practice where appropriate. Label the field and exam version on course and result pages. Changes to an official exam pattern create a new version without rewriting historical attempts.

**FR-IT-1101 — Technology catalog.** Provide administrator-managed pathways for programming, robotics, Internet of Things (IoT), cybersecurity, networking, cloud computing, and additional IT topics. Organize each pathway by topic, prerequisite, difficulty, chapter, course, and project so new technologies and courses can be added without a code release.

**FR-IT-1102 — Practical work.** IT courses can assign code repositories, files, diagrams, lab URLs, simulations, or video demonstrations. Instructors can grade with a rubric and return revision feedback. Any future automatic code execution or cybersecurity lab must run in an isolated, authorized environment with time and resource limits; uploading code alone does not execute it on the application server.

### 3.10 Question banks, mock exams, and results

**FR-EXAM-1201 — Question bank and blueprint.** Authors can tag questions by program, course, chapter, exam, level, skill field, topic, difficulty, and version. Questions can include reading passages, images, audio clips, and answer explanations. An exam blueprint specifies sections, question counts, time limits, order, marks, pass rule, and whether answers are released. An administrator approves a blueprint before it becomes available to learners.

**FR-EXAM-1202 — Chapter-wise practice.** A learner can start practice for a selected chapter or topic, receive feedback according to the practice configuration, retry, and see progress and weak areas. Practice attempts are separate from final or mock-exam attempts.

**FR-EXAM-1203 — Exam-wise mock tests.** A learner can take a full mock exam or a section-only test for a selected program and level. The server creates a fixed attempt from the approved blueprint, applies a server-side timer, autosaves answers, and submits on expiry. Reconnecting resumes the same unexpired attempt without creating a second one. Mock mode can hide hints and answers until the configured release time. Store the blueprint and question versions used by each attempt.

**FR-EXAM-1204 — Results and review.** Show score, maximum score, pass/fail under the configured practice rule, section breakdown, correct and incorrect answers when released, time spent, attempt history, and recommended chapters to revisit. Label JLPT and SSW mock scores as platform practice scores, not official exam scores or certificates. Do not claim that raw mock scores reproduce an official scaled scoring method.

**FR-EXAM-1205 — Result management.** An instructor can view results for learners in owned courses; an administrator can search and export authorized results by program, course, level, cohort, and date. Manual grading or a corrected answer key recalculates affected results through an audited revision, preserving the original result, actor, reason, and time. Notify affected learners when a published result changes.

### 3.11 Student chat and messaging

**FR-CHAT-1301 — Conversations.** Provide learner-to-instructor and learner-to-support direct chat plus enrollment-gated course group chat on web and mobile. Administrators may enable learner-to-learner direct chat per course. Messages support text and approved attachments or voice notes, appear across devices, show unread counts, and preserve send order. A learner who loses enrollment cannot send new messages in that course.

**FR-CHAT-1302 — Safety and moderation.** Users can report messages and block direct contacts. Instructors can moderate their course groups; administrators can review reports, remove content, suspend chat access, and retain an audit record. Restrict who can read private conversations, define a retention period, and give users controls for chat notifications. Mock-exam rules can disable chat during an active attempt.

### 3.12 Student and payment management

**FR-MGMT-1401 — Student records.** Administrators can search students, view account and enrollment status, assign or revoke course access with a reason, suspend or restore accounts, and view progress, submissions, and results according to role permissions. Instructors see only their enrolled students and cannot read private notes or unrelated purchases. Maintain an audit trail for manual changes and support CSV export of authorized roster data.

**FR-MGMT-1402 — Payment operations.** Administrators can search orders, provider transactions, refunds, disputes, subscriptions, coupon usage, instructor earnings, and payout status. Authorized staff can initiate a refund or cancel a subscription through the payment provider and see the resulting entitlement change after a verified event. Reconcile provider totals to the platform ledger and export transaction reports. Record actor, amount, currency, provider ID, and reason for manual financial actions.

### 3.13 Native mobile apps

**FR-MOBILE-1501 — Android and iOS parity.** Provide native Android and iOS apps using the same accounts, tenant memberships, permissions, catalog, enrollments, course content, video and audio progress, chapter practice, mock exams, results, assignments, chat, and certificates as the web app. Users can choose among their workspaces and see each workspace's branding. Instructor course, grading, student, and announcement workflows and tenant-administrator review, student, customization, and payment-management workflows must be available in the apps. Changes made on one platform appear on the others after synchronization.

**FR-MOBILE-1502 — Device capabilities.** Use camera and microphone permission only when recording content or a response. Support recording and upload retry, adaptive playback, background audio where the operating system permits, and opt-in push notifications for messages, deadlines, results, and announcements. An interrupted connection must not duplicate an assignment, exam attempt, message, or purchase.

**FR-MOBILE-1503 — Mobile purchases.** The purchase flow must select a permitted billing method for the app store, country, and digital product. Verify store receipts or payment-provider events on the server before granting the same course entitlement used by the web app. Show subscription terms and restore eligible purchases. Finalize in-app purchase and external-link behavior against current Apple and Google policies for each launch region before submission to their stores.

### 3.14 Customer LMS workspaces (multi-tenancy)

**FR-TENANT-1601 — Self-service LMS creation.** A user with a verified email can create an LMS workspace, choose a unique address, name it, select a starter template, and become its first tenant owner. Creation is idempotent: a retry cannot make duplicate tenants or duplicate plan charges. The user can also accept an invitation to an existing tenant. Signing in shows only workspaces in which the user has an active membership; the same email may own or join more than one workspace.

**FR-TENANT-1602 — Workspace routing and discovery.** Web users can open a workspace by its platform subdomain or verified custom domain; mobile users select from their membership list and return to their last workspace. A domain must be verified before activation and cannot be claimed by two tenants. An email domain alone does not grant access or ownership. Unknown, suspended, or unauthorized tenant addresses reveal no private course or member data.

**FR-TENANT-1603 — Customization.** Tenant administrators can edit and preview workspace name, logo, colors, typography, landing-page content, navigation, enabled course categories, language, time zone, email templates, and certificate branding. Changes are saved as drafts and published by an authorized administrator; the previous published configuration remains available for rollback. Validate contrast, file types, and URL destinations. Customization cannot inject arbitrary scripts or change the platform's security and payment controls.

**FR-TENANT-1604 — Members and ownership.** Tenant administrators can invite, remove, suspend, and assign tenant roles to members; invitations expire and must be accepted by the addressed account. Roles are scoped to one tenant, and changing a role in one tenant does not alter another. The last active owner cannot be removed until ownership is transferred and accepted. Record invitations, role changes, and tenant switches in the audit trail.

**FR-TENANT-1605 — Isolation.** Course content, questions, media, chat, students, results, payment records, configuration, search results, exports, jobs, caches, and AI context belong to one tenant. Every tenant-owned record carries an immutable tenant ID, and every access path enforces tenant membership and role permissions. Attempts to use another tenant's object ID, URL, webhook reference, or storage key must be denied. Platform operators use time-limited, reasoned, audited support access when tenant data access is necessary.

**FR-TENANT-1606 — LMS subscription and lifecycle.** Track the customer's subscription to the LMS platform separately from a learner's purchase of a course. A tenant can see its plan, usage, invoices, renewal date, and enabled limits. Trial, active, past-due, suspended, and canceled states have documented effects on authoring, learner access, payments, and data export. Suspension must not erase tenant data; deletion follows the approved retention and export policy.

### 3.15 AI-assisted setup and authoring

**FR-AI-1701 — Prompt-based workspace setup.** A tenant administrator can describe the LMS they want in natural language, for example “Create a Japanese N5 school with blue branding and beginner courses.” The assistant proposes a structured tenant configuration and course outline, displays a preview and the exact changes, and saves an editable draft only after confirmation. The administrator can revise the draft by further prompts.

**FR-AI-1702 — Content creation commands.** An authorized instructor or administrator can use prompts to draft course structures, chapters, lesson text, vocabulary lists, assignment rubrics, quizzes, mock-exam blueprints, transcripts, translations, and announcements within their tenant. Generated content records the prompt owner, generation time, source inputs, and review status. Instructors review factual accuracy, language quality, answer keys, and content rights before submitting it to the normal publication workflow. AI output never becomes learner-visible solely because it was generated.

**FR-AI-1703 — Safe command execution.** The assistant can call only documented, tenant-scoped application actions allowed to the requesting role. Before a command changes data, show a human-readable plan and affected records; high-impact actions such as publication, bulk messages, refunds, payouts, user-role changes, and deletion require explicit confirmation. Reject instructions that request arbitrary SQL, shell execution, secrets, cross-tenant data, or bypass of approval. Record executed actions and support undo for reversible changes.

**FR-AI-1704 — AI quality, privacy, and cost.** Keep AI provider integrations replaceable. Do not send private learner data, payment details, or another tenant's content to a model without a documented purpose and tenant permission. Apply per-tenant usage limits and show consumption to administrators. Provide a non-AI manual path for every core authoring and administration workflow. Test generated question banks for duplicates, unsupported claims of official exam affiliation, and missing answers before review.

## Open decisions and normalization work

- The owner must assign current-standard Priority, Status, Access, and Source attributes to the 52 legacy compact requirements that predate the company requirement template. Their absence must not be interpreted as approval or first-release priority.
- Native mobile release scope, offline media, Organization Manager, AI features, subscriptions, tenant self-service, and provider choices remain product decisions even where this document describes their required behavior.
- The implementation table and [current state](../../architecture/CURRENT-STATE.md) describe verified behavior today; prose below that is broader than the running product remains unimplemented until separately approved and verified.

## Related documents

Platform requirements: [Platform FRD](PLATFORM-FRD.md). Requirements standard: [requirements/README.md](../README.md). Non-functional requirements: [NFR.md](../NFR.md). Architecture and delivery rules: [architecture](../../architecture/ARCHITECTURE.md) and [engineering](../../engineering/CODING-STANDARDS.md). Acceptance journeys: [ACCEPTANCE-CRITERIA.md](../../planning/ACCEPTANCE-CRITERIA.md).

## Subject and platform references

- [Official JLPT levels and sections](https://www.jlpt.jp/sp/e/guideline/testsections.html)
- [Japan Immigration Services Agency SSW field information](https://www.moj.go.jp/isa/policies/ssw/sswfield.html)
- [SSW test information](https://www.ssw.go.jp/en/about/sswv/exam/)
- [JLPT sample-question rights](https://www.jlpt.jp/e/policy.html)
- [Google Play payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en)
