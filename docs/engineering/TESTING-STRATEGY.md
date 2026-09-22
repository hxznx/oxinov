# Testing strategy

Unit-test scoring, entitlements, role rules, and AI command validation. Integration-test migrations, transactions, webhook idempotency, PostgreSQL RLS, and cross-tenant denial using real PostgreSQL containers. Contract-test OpenAPI and web/mobile clients. End-to-end-test tenant creation, purchase, lesson progress, mock exam, chat, and admin refund.

Mobile release checks cover Android/iOS login, tenant switching, playback, exams, notifications, and purchase restoration. Load and recovery tests use an agreed traffic profile and restore target. CI should avoid tests that merely mirror implementation internals.
