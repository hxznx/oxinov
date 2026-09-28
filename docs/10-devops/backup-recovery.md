# Backup and recovery

This document outlines the standard backup procedures, retention policies, and recovery objectives for the Oxinov infrastructure, including PostgreSQL and S3.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

## 1. Objectives

- **RPO (Recovery Point Objective)**: 24 hours. (This defines the maximum acceptable amount of data loss).
- **RTO (Recovery Time Objective)**: 4 hours, subject to budget and launch-region review. (This defines the maximum acceptable downtime).

## 2. Backup strategy

- **PostgreSQL**: Back up containerized PostgreSQL databases daily to encrypted storage outside the host. Never treat a Docker named volume alone as a backup.
- **Tenant Data**: Back up tenant configuration and object-storage metadata.
- **Media and Files**: Ensure media and file storage buckets are versioned and properly protected (e.g., S3).
- **Retention**: See the [data retention](../05-data/data-retention.md) standard for details on how long backups are kept.

## 3. Recovery and verification

- **Restoration Testing**: Test database and object restoration at least quarterly.
- **Verification**: After a restore, thoroughly verify media and provider references, as well as cross-tenant isolation guarantees.
- **Audit Logging**: Record the backup age, checksum, restore duration, and the operator who performed the action.
