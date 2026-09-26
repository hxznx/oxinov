# Oxinov user-centred product research and usability standard

## Company decision

Research is the evidence base of every Oxinov product. Product strategy, requirements, design, delivery, and improvement must start from observed user needs and continue learning after launch.

Every product uses two linked evidence streams:

1. **User and product research** establishes who has the problem, what outcome they need, the context and constraints around that outcome, whether the proposed service is understandable and useful, and how the live journey performs.
2. **Technical R&D** establishes whether an uncertain capability can be built safely, reproducibly, affordably, and within the Oxinov architecture.

Not all user research is R&D under the OECD Frascati definition. It is still mandatory product evidence. A feature does not enter delivery merely because the technology works, a stakeholder requests it, or the interface looks attractive.

## What user-friendly means at Oxinov

A product is user-friendly when intended users can reach the right outcome accurately, safely, and confidently in their real context, with reasonable effort and without avoidable support.

| Dimension | Oxinov meaning | Example evidence |
| --- | --- | --- |
| Useful | Solves an observed, important user problem | Interviews, observation, support evidence, demand or behavior |
| Effective | Users complete the correct task and receive the intended outcome | Unassisted task success, correct outcome, no false completion |
| Efficient | The journey needs no unnecessary steps, time, data, or repeated entry | Completion time, step count, abandonment, repeated-field rate |
| Learnable | A first-time user understands what to do without training | First-attempt success, comprehension, time to first value |
| Memorable | A returning user can resume without relearning the product | Returning-user success, navigation errors, resume success |
| Accessible | Disabled people can perceive, understand, navigate, and operate it | WCAG 2.2 AA, assistive-technology and manual testing |
| Inclusive | Works across language, literacy, device, bandwidth, age, location, and support needs | Segment coverage and comparative outcomes |
| Trustworthy | Price, data use, identity checks, status, consequences, and responsibility are clear | Comprehension, confidence, dispute and surprise-cost rate |
| Forgiving | Prevents errors and helps users recover without duplicate or lost work | Recovery success, preserved drafts, idempotency, undo |
| Responsive | Feels fast and stable on devices and networks people actually use | Core Web Vitals, API latency, crash-free use, low-bandwidth tests |
| Supportable | A person can get help and operations can resolve the whole problem | Contact rate, first-contact resolution, escalation time |

Visual style supports these dimensions but does not replace them. The cyberpunk brand is a presentation layer, not the interaction model. Reduce or remove glow, grid, animation, HUD labels, or other effects wherever research shows they distract, slow comprehension, reduce accessibility, or weaken trust.

## Research-to-product lifecycle

Every material feature, journey, and new product moves through the following evidence loop. Small changes may combine gates, but none may omit the required decision evidence.

| Gate | Question | Required evidence |
| --- | --- | --- |
| U0 Observe | Who is trying to achieve what outcome, in what context? | Named segments, observed journey, current alternatives, barriers, and source evidence |
| U1 Define | Which user need and business outcome should Oxinov address? | Evidence-backed user-need statement, exclusions, risks, baseline, and success measure |
| U2 Explore | Which concepts appear understandable and valuable? | Several low-cost alternatives, content and journey tests, accessibility considerations, and selected hypothesis |
| U3 Validate | Can representative users complete the prototype's critical tasks? | Usability sessions, task results, severity-ranked findings, iteration, and unresolved risks |
| U4 Build | Does the implemented journey preserve the validated behavior? | Design-to-build review, automated checks, manual accessibility, device/network tests, and analytics plan |
| U5 Beta | Does the whole service work with realistic users and operations? | End-to-end benchmark, support rehearsal, consent/privacy review, failure recovery, and release decision |
| U6 Live | Is the product improving real outcomes without excluding or harming users? | Funnel and cohort data, support/search feedback, reliability, recurring research, and change decisions |

Every gate ends with `continue`, `revise`, `pause`, or `stop`. A release is not successful merely because it ships.

## Evidence traceability

Use these identifiers:

- `UN-<PRODUCT>-NNN` for a stable user need;
- `UR-YYYY-NNN` for a research study;
- `UXH-<PRODUCT>-NNN` for a testable experience hypothesis; and
- the existing FR, NFR, ADR, risk, and R&D identifiers for requirements and technical evidence.

Each product requirement or delivery issue must link to at least one user need. The link chain is:

`research evidence -> user need -> journey and hypothesis -> FR/NFR -> design -> implementation -> acceptance evidence -> live outcome`

Repository documents contain safe findings, decisions, and metadata. Consent forms, participant identities, recordings, transcripts, raw analytics, support conversations, and sensitive research data remain in approved restricted storage with access and deletion dates.

## Priority users and contexts

Research must cover behavior and context rather than relying only on demographic personas. Include the people who receive, provide, administer, and support the service.

### Shared platform segments

- first-time visitor deciding whether Oxinov is relevant and trustworthy;
- new member using Google or email one-time-code sign-in;
- returning member moving between several Oxinov products;
- individual who needs phone, identity, or business verification for the next action;
- organization owner or administrator managing people, access, billing, and support;
- user who needs help, recovery, export, correction, appeal, or deletion;
- Oxinov operator performing audited support, moderation, or verification; and
- partner or third party involved in payment, delivery, inspection, training, or service completion.

### Context variants

Every critical journey considers:

- new and experienced users;
- Android, iOS, and relevant desktop browsers on representative low- and mid-range devices;
- intermittent or throttled mobile networks and limited data budgets;
- English (the only interface language, ADR-020), use through browser translation, and the product's required content languages;
- low digital confidence, limited literacy, and assisted-digital use;
- screen reader, keyboard, zoom, reduced motion, dynamic text, color-vision, hearing, motor, cognitive, and time-accommodation needs;
- individual versus organization use and switching between workspaces or roles; and
- high-stress contexts such as payment, timed exams, identity verification, disputes, job applications, and lost connectivity.

Do not recruit only staff, developers, urban power users, existing enthusiasts, or people using high-end devices.

## Research methods by decision

Choose the smallest method that can reliably inform the decision. Preferences and feature requests are inputs, not proof of need.

| Decision | Suitable methods | Main output |
| --- | --- | --- |
| Understand the problem | Contextual interview, observation, service safari, support-log review, search analysis | Needs, constraints, current journey, failure demand |
| Prioritize outcomes | Opportunity mapping, survey with behavioral evidence, journey analysis, market evidence | Ranked problems and explicit exclusions |
| Organize information | Card sorting, tree testing, first-click testing, terminology testing | Navigation and labels users understand |
| Compare concepts | Sketch or prototype testing, concept comprehension, co-design where appropriate | Preferred direction and reasons, not a popularity vote |
| Improve a task | Moderated usability testing, accessibility testing, cognitive walkthrough | Observed failures, severity, and design changes |
| Benchmark usability | Repeatable task study with task success, time, ease, confidence, and false-completion measures | Comparable baseline and trend |
| Validate live behavior | Privacy-preserving analytics, funnel and cohort review, search/support analysis, interviews | Actual outcomes, abandonment, exclusion, and next hypotheses |
| Evaluate learning or AI | Controlled study, non-AI or current-product baseline, blinded review where useful | Effect, uncertainty, limitations, cost, and risk |

Start qualitative rounds small enough to learn and iterate quickly, but recruit across the important context variants. Do not report percentages from a small qualitative sample as population estimates. Use a larger, planned benchmark or experiment when the decision needs quantitative confidence.

## Continuous research cadence

- Each active product team maintains a current research-question backlog and runs a learning activity at least once per delivery cycle.
- Test material changes to critical journeys with intended users before release, not only after code is finished.
- Each team observes users directly and joins evidence-analysis sessions; research is not outsourced understanding.
- Review live product evidence monthly and the cross-product experience quarterly.
- Re-run stable benchmark tasks after material journey changes and at least before each major release.
- Give accessibility and assisted-digital participants continuing representation, not a final compliance session.

## Shared user-friendly interaction rules

### Make the next action obvious

- Each screen has one clear purpose and one visually dominant primary action.
- Use familiar nouns and verbs from user research. Do not expose architecture, entitlement keys, internal status codes, or provider jargon.
- Show progress, requirements, time, price, and documents before a multi-step task starts.
- Use progressive disclosure; do not ask for phone, KYC, payment, organization, or advanced settings before the action needs them.

### Preserve context and work

- Keep the current product, tenant or organization, role, and record visible when confusion would cause harm.
- Autosave long work, preserve drafts, show the last saved state, and make retry safe.
- After sign-in, verification, policy acceptance, payment, or reconnect, return the person to the action they intended.
- Never duplicate an order, payment, enrollment, submission, exam attempt, message, or role change because the user retried.

### Prevent and recover from errors

- Validate near the field using plain language and keep valid entries.
- Explain what happened, what was preserved, and the next safe action.
- Confirm destructive, financial, publishing, permission, and bulk actions using the affected product, tenant, records, amount, and consequence.
- Offer undo for reversible changes. For irreversible changes, provide review and a clear recovery or appeal path.
- Never use color, motion, or a toast as the only indication of status or error.

### Build trust

- Show the final price, currency, fees, renewal behavior, cancellation, refund, and delivery conditions before commitment.
- Explain why data or verification is required, who can see it, and how long it is kept.
- Distinguish platform, seller, provider, employer, instructor, inspector, and partner responsibility.
- Show truthful status and realistic next steps; never simulate urgency, scarcity, social proof, or progress.
- Make support, report, dispute, appeal, export, and deletion routes easy to find.

### Design for Nepal and wider markets

- Treat mobile and unstable connectivity as normal contexts, not edge cases.
- Keep critical pages and actions usable on throttled 4G and able to recover after interruption.
- Format NPR and other approved currencies, names, phone numbers, addresses, dates, and local units clearly.
- Write interface content in plain English that browser translation handles well (ADR-020); the English text of legal and safety content is binding, and its meaning is checked through translation in the main reader languages.
- Keep the Daylight theme easy to select and remember for bright outdoor use. Dark-first branding must not make outdoor, low-vision, or long-reading tasks harder.

### Keep high-risk journeys calm

Exams, payments, KYC, permissions, disputes, applications, checkout, and long forms always use the Calm visual intensity. No glitch, scanline, continuous glow, surprise animation, moving background, or decorative sound is allowed. Time pressure must come only from a real, clearly explained deadline.

## Critical journey catalogue

Every release identifies which of these journeys changed and attaches research and acceptance evidence.

| Area | Critical journeys |
| --- | --- |
| Company site | Understand what Oxinov offers, distinguish launched products from research, find pricing, policies, security, and contact |
| Shared account | Sign in, first-time welcome, launch a product, switch product or organization, step up trust, manage plan, get support, export or delete data |
| Oxinov Edu | Discover a course, understand price and access, enroll/pay, resume learning, complete practice/exam/assignment, understand results, verify certificate |
| LMS creator/admin | Create workspace, invite staff, author and submit, review/publish, support learner, understand payments and tenant status |
| Commodity Market | Discover and compare an item, understand seller/condition/inspection, list, order, verify payment or escrow state, arrange completion, dispute and review |
| Oxinov Jobs | Discover a suitable job, create profile, understand match, apply, track status, message safely; employer verifies, posts, reviews, and decides |
| Services Market | Discover a provider, post a need, compare quote, book, pay, track completion, dispute and review; provider verifies and responds |
| AI-assisted work | Understand what AI will do, inspect sources and uncertainty, preview exact changes, confirm or reject, edit manually, report a problem |

## Product experience measures

Measure behavior by journey and segment. Company-wide averages can hide exclusion.

| Outcome | Measure | Initial release expectation |
| --- | --- | --- |
| Correct completion | Unassisted task success and false completion | Set a baseline before build; target at least 90% for core tasks in a planned benchmark and zero unresolved critical failures in release testing |
| Ease and confidence | Post-task ease and confidence, 1-5 | Median at least 4; investigate segment gaps even when the total passes |
| Efficiency | Completion time, steps, repeated entry | Improve against the documented baseline without trading away accuracy or trust |
| First value | Time from entry or sign-in to the user's first meaningful outcome | Product-specific target approved with the user need; no unnecessary onboarding |
| Recovery | Successful retry/resume after validation, network, provider, or session failure | Work preserved and no duplicate side effect in every tested critical failure path |
| Accessibility | WCAG and assistive-technology outcomes | WCAG 2.2 AA for web; no blocker in manual keyboard, screen-reader, zoom, text-size, contrast, caption, focus, and reduced-motion tests |
| Web responsiveness | LCP, INP, CLS at the 75th percentile, mobile and desktop | LCP at most 2.5 seconds, INP at most 200 ms, CLS at most 0.1 for relevant pages |
| Reliability | Crash-free sessions, failed actions, duplicate actions, lost work | Product target approved before beta; financial, identity, exam, and submission duplication is zero |
| Trust | Price/status/data-use comprehension and unexpected-outcome reports | Participants can explain the commitment and next state before confirmation |
| Supportability | Contact rate, first-contact resolution, repeat contact, time to resolution | Baseline and improve; a reduction is good only when outcomes and accessibility do not worsen |
| Retention and outcome | Return, completion, successful transaction or learning outcome | Cohort measure linked to the product's intended value, not engagement for its own sake |

These are proposed starting thresholds. Confirm them using baseline research, product risk, launch market, traffic, and sample plan. A serious safety, privacy, security, financial, tenant-isolation, accessibility, or false-completion problem blocks release even if averages pass.

## Finding severity and response

| Severity | Meaning | Required response |
| --- | --- | --- |
| Critical | Causes unsafe, unauthorized, irreversible, financially wrong, cross-tenant, or impossible completion for a critical journey | Block release; fix and retest |
| High | Many intended users cannot complete or understand a core task without help | Fix before release unless an accountable owner approves a time-limited exception and support path |
| Medium | Task completes with avoidable delay, confusion, repeated work, or segment-specific exclusion | Plan and prioritize; retest the affected journey |
| Low | Cosmetic or minor friction with little effect on outcome | Backlog with evidence; do not let repeated low issues accumulate into a confusing journey |

## User-research ethics and privacy

- Recruit voluntarily with understandable informed consent and a clear recording choice.
- Explain purpose, session activities, incentives, data use, access, retention, withdrawal, and contact route.
- Collect the minimum participant data and separate identity/contact data from research findings.
- Do not use customer support access, tenant data, private messages, exam answers, KYC, payment details, or employment information for research without an approved purpose and access path.
- Avoid coercion when recruiting employees, learners, sellers, providers, candidates, or people dependent on Oxinov decisions.
- Protect minors and vulnerable participants through the approved age, consent, safeguarding, and escalation procedure.
- Report findings by behavior and context; do not stereotype a country, language, disability, occupation, education level, or user group.
- Compensate fairly where incentives are used, without making participation feel compulsory.

## Product usability gate

A material journey is ready for implementation or release only when the evidence package shows:

- [ ] A real user need and priority segment are linked to the requirement.
- [ ] Current behavior, alternatives, barriers, and baseline are documented.
- [ ] Scope exclusions and the user outcome are explicit.
- [ ] More than one concept was considered where the solution was uncertain.
- [ ] Intended users evaluated the content or prototype before build.
- [ ] The implemented end-to-end journey was tested on representative devices and networks.
- [ ] Disabled and assisted-digital users were included or an accountable, dated coverage plan is approved.
- [ ] English meaning, browser-translated meaning in the main reader languages, and required content-language meaning are validated where applicable.
- [ ] Task success, time, ease, confidence, false completion, recovery, and support impact are recorded.
- [ ] No unresolved critical usability, accessibility, safety, privacy, security, payment, or tenant-isolation issue remains.
- [ ] Analytics and feedback measure outcomes without collecting unnecessary personal data or unbounded identifiers.
- [ ] A named owner, live review date, rollback or disable path, and next research question exist.

## First 90 days

### Days 1-30: establish the evidence base

1. Appoint a product-research owner and a research contact for each active product or platform area.
2. Create the first user-need register and identify the ten highest-risk shared and LMS journeys.
3. Review existing analytics, support evidence, requirements, and assumptions; mark unsupported assumptions clearly.
4. Recruit an initial panel that covers learners, tenant owners/instructors, mobile/low-bandwidth users, people reading through browser translation, disability, and support needs.
5. Baseline five stable tasks: sign in, find and understand a course, enroll, resume learning, and complete/view an assessment result.

### Days 31-60: test and simplify

1. Run recurring observation and prototype/usability sessions on the highest-risk tasks.
2. Convert findings into linked user needs, experience hypotheses, requirements, and severity-ranked issues.
3. Remove unnecessary onboarding, fields, jargon, effects, and repeated entry.
4. Test interruption and recovery on a low- or mid-range phone and throttled connection.
5. Conduct manual accessibility tests and include disabled participants in the next research round.

### Days 61-90: institutionalize product learning

1. Repeat the benchmark and compare task success, time, ease, confidence, and failure reasons.
2. Add the usability gate to product and release reviews.
3. Publish a safe internal findings digest and a decision log; keep raw participant data restricted.
4. Establish monthly live-evidence reviews and a quarterly cross-product experience review.
5. Select the next research questions from the largest observed user failure or strategic uncertainty, not from the longest feature list.

## Reference basis

This is an Oxinov operating standard, not a claim of external certification. It is informed by:

- [ISO 9241-210:2019](https://www.iso.org/standard/77520.html), confirmed current in 2025, for human-centred design throughout the interactive-system lifecycle;
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) for web accessibility;
- [GOV.UK user research guidance](https://www.gov.uk/service-manual/user-research/how-user-research-improves-service-design) for inclusive, continuous research with real users;
- [GOV.UK usability benchmarking guidance](https://www.gov.uk/service-manual/measuring-success/usability-benchmarking-a-website-or-whole-service) for task success, time, ease, confidence, and repeated benchmarking; and
- [Google's Web Vitals guidance](https://web.dev/articles/vitals) for current LCP, INP, and CLS responsiveness thresholds.

