# ADR-001: PostgreSQL as system of record

**Date:** 2026-09-24. **Status:** Accepted. Use PostgreSQL for transactional platform and LMS data. PostgreSQL runs in Docker for local development and CI; production uses Amazon RDS for PostgreSQL with encryption, backups, isolated data subnets, and Multi-AZ according to the environment availability target. Default to shared tenant-scoped LMS tables with RLS and API authorization; offer a dedicated database only for a justified customer tier. Redis and object storage are supporting systems.
