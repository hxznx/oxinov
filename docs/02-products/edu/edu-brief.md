# Oxinov Edu brief

Why Oxinov Edu exists, who it serves, and where its boundaries are. Read it before the [PRD](edu-prd.md) or the [FRD](../../03-requirements/frd/edu-frd.md); it describes the Edu product, not every Oxinov business objective.

**Status:** Current · **Owner:** Edu product owner · **Last reviewed:** 2026-09-28

Oxinov Edu is the first product on the wider [Oxinov company platform](../../01-company/platform-blueprint.md). It is live at `edu.oxinov.com`; what already works is listed in [current state](../../04-architecture/current-state.md) and the implementation table of the [FRD](../../03-requirements/frd/edu-frd.md).

## Vision

A customer creates a branded learning platform in the cloud, teaches specialized subjects, manages learners and payments, and reaches students through web and mobile apps. People use their Oxinov identity, and access follows their product entitlement.

## Problem

Training providers need one system for:

- recorded lessons and chapter practice
- full mock exams, assignments, and results
- chat and student administration
- sales

JLPT (Japanese-Language Proficiency Test) and SSW (Specified Skilled Worker) preparation also need exam content that is updated often and clearly labeled.

## Customers and learners

| Group | What they do |
| --- | --- |
| Tenant owners and administrators | Run an Edu workspace |
| Instructors | Create courses and assess work |
| Learners | Study Japanese N5–N1, SSW fields, Korean, Chinese, Nepali, English, Russian, Arabic, Spanish, and IT subjects |
| Platform operators | Run the service without unrestricted access to tenant data |

## Product boundaries

- **One codebase, many workspaces.** One Edu codebase serves logically isolated tenant workspaces as an independent product plane.
- **One source of truth.** PostgreSQL is Edu's transactional source of truth.
- **One backend.** Web and native Android and iOS apps use one Edu backend. The web app is live; the native apps are planned.
- **Shared platform.** Identity, organizations, catalogue, subscriptions, and entitlements belong to the company control plane and integrate through versioned APIs and events.
- **Separate decisions.** Live teaching and offline video downloads need their own product decisions.

## Success measures

These measures are to be agreed before launch. Their numerical targets are an open decision for the Edu product owner, set after the launch market and traffic assumptions are approved.

- Time to create a tenant and publish its first course
- Completion of paid enrollment
- Mock-exam completion
- Mobile crash-free sessions
- Tenant-isolation test coverage
- Course and tenant retention
