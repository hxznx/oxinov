# Project brief

## Vision

A customer can create a branded LMS in the cloud, teach specialized subjects, manage learners and payments, and reach students through web and mobile apps.

## Problem

Training providers need one system for recorded lessons, chapter practice, full mock exams, assignments, chat, results, student administration, and sales. JLPT and SSW preparation also require frequently updated, clearly labeled exam content.

## Customers and learners

Tenant owners and administrators run an LMS. Instructors create courses and assess work. Learners study Japanese N5–N1, SSW fields, Korean, Chinese, Nepali, English, Russian, Arabic, Spanish, and IT subjects. Platform operators run the SaaS without unrestricted tenant-data access.

## Product boundaries

One shared codebase serves logically isolated tenant workspaces. PostgreSQL is the transactional source of truth. Web and native Android/iOS apps use one backend. Live teaching and offline video downloads require separate decisions.

## Success measures to agree before launch

Time to create a tenant and publish its first course; completion of paid enrollment; mock-exam completion; mobile crash-free sessions; tenant-isolation test coverage; and course/tenant retention. Set numerical targets after launch market and traffic assumptions are approved.
