# Acceptance criteria

**Source:** FRD v1.3. Each journey must pass on relevant web and mobile clients; tenant isolation must fail closed.

## End-to-end acceptance journeys

1. **Paid learner:** A visitor registers and verifies email, buys a course, receives access only after a verified payment event, finishes required work, then downloads a certificate whose public verification page is valid.
2. **Instructor publication:** An administrator approves an instructor and a submitted course. Later edits stay hidden until the next approved version. Existing progress stays associated with the content on which it was earned.
3. **Payment recovery:** A payment event arrives twice or late. Processing grants at most one entitlement. A refund or chargeback removes only the transaction's entitlement.
4. **Access control:** A visitor, learner, other instructor, and administrator attempt to view a private lesson, submission, notes, and financial report. Only authorized roles and owners receive data.
5. **Cross-device learning:** A learner watches part of a video on one device and resumes on another. Seeking to the end does not complete it; watching the required unique duration does.
6. **JLPT pathway:** A learner opens N5, studies chapter vocabulary and listening, takes chapter practice and an N5 mock exam, sees section results, and continues through N4, N3, N2, and N1 programs without mixing the levels' question banks.
7. **SSW field:** An administrator activates a current official SSW field, an instructor publishes field-specific chapters and a mock exam, and a learner sees the field and exam version on the result. Retiring the field preserves past attempts.
8. **IT project:** A learner studies an IoT, programming, or cybersecurity course, submits a file or repository, receives rubric feedback, and sees the grade on web and mobile.
9. **Mobile and chat:** A learner signs in on Android or iOS, plays a recorded lesson, sends an instructor message, submits a recorded speaking response, resumes an exam after losing connectivity, and sees the same results on web.
10. **Administration:** An administrator reviews a student account, changes access with a reason, handles a refund through the provider, and sees the entitlement, transaction report, and audit event update once.
11. **Self-service SaaS:** A verified user creates a branded LMS, invites an instructor, publishes a course, and signs in on mobile to see that tenant. The same user joins a second LMS and can switch workspaces without seeing either tenant's private data in the other.
12. **AI-assisted setup:** A tenant administrator asks for an N5 course and theme by prompt, previews the exact proposed records, confirms draft creation, edits the draft, and submits it for normal review. A prompt to expose another tenant's students or issue a refund without confirmation is denied and audited.
13. **Container release:** CI starts frontend, backend, worker, chat, PostgreSQL, and Redis containers; runs migrations and isolation tests; publishes versioned images; deploys staging; and proves a database restart does not erase enrollments or results.
14. **Google Play build:** The Android release pipeline produces a signed `.aab`, installs it on the internal testing track, verifies login, tenant switching, video, exam, chat, and permitted purchase behavior, and checks the target API and store declarations before release.
