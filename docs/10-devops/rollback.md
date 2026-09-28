# Rollback

**Automatic (ADR-018):** every production release is a Helm upgrade with `--rollback-on-failure`. If a
workload does not become healthy, the node's public checks fail, or the public smoke test fails, the
previous Helm revision is restored without anyone acting, and the deploy run fails with the reason.

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

**By hand:** `bash devops/scripts/oxctl rollback` returns to the previous revision (`oxctl history` lists
them); to go further back, run **Deploy production** from an older commit. Images and chart versions in ECR
are immutable and the last ten (thirty for charts) are kept.

**Migrations** only move forward and must stay compatible with the previous image (expand, then contract:
add columns and tables first, remove them in a later release once no running code uses them), because a
rollback swaps images but never reverses schema. A bad migration is fixed forward in a new commit;
restoring a database dump is the last resort (see the production runbook).

Mobile store releases cannot be instantly rolled back for every user, so keep backend API compatibility
with the last released app and use staged rollouts and feature flags.
