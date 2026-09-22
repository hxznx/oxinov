# Backup and recovery

Back up containerized PostgreSQL daily to encrypted storage outside the host and test restoration at least quarterly. Back up tenant configuration and object-storage metadata; verify media/provider references after restore. Proposed RPO: 24 hours; proposed RTO: 4 hours, subject to budget and launch-region review.

Record backup age, checksum, restore duration, and operator. Never treat a Docker named volume alone as a backup. See [data retention](../data/DATA-RETENTION.md).
