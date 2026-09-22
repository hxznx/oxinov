# Rollback

Tag application images immutably. On a failed release, stop promotion, restore the previous frontend/API/worker/chat image set, and run smoke tests. Database migrations must be forward-compatible so image rollback works; use a reviewed forward fix when schema rollback would risk data loss.

Mobile store releases cannot be instantly rolled back for every user, so keep backend API compatibility with the last released app and use staged rollouts and feature flags.
