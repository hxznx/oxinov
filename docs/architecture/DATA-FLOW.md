# Data flow

## Sign-in and tenant choice

Identity provider verifies the account -> API loads active tenant memberships from PostgreSQL -> user selects a workspace -> each request validates the membership, role, and tenant address -> PostgreSQL RLS and application rules scope reads/writes.

## Purchase

API creates a tenant-scoped checkout -> provider returns a signed event -> API stores the event ID and queues fulfillment -> worker updates payment and entitlement in one transaction -> learner receives access. A browser redirect never grants access.

## Learning and exams

Web/mobile requests short-lived media access -> player reports progress -> API stores tenant-scoped progress. Exam attempt freezes blueprint and questions, autosaves answers, then server grades and records a result version.

## AI draft

Authorized prompt -> tenant-scoped input retrieval -> structured proposal -> preview -> explicit approval -> draft creation -> human publication review. No direct SQL, shell, refund, or cross-tenant action.

## Security operations

Identity, application, cloud, database-audit, and runtime sources emit normalized security events -> collector validates and enriches the schema -> access-controlled SIEM stores events -> Sigma rules and correlation create findings -> severity routing opens a SOC runbook -> responders record actions and protected evidence outside Git.
