# Backup & Restore Runbook

## Overview
- Backups are queued from **Admin → Backups** and processed by the `backup-worker`.
- Restore requests are queued from the same UI and executed by the new `restore-worker`.
- Both workers run automatically when the backend boots; ensure the server log contains `BackupWorker` and `RestoreWorker` start lines.

## Restore Workflow
1. **Pick Snapshot** – Open Admin → Backups → History and click **Restore** on a completed snapshot.
2. **Select Target** – Choose one of the configured environments (derived from `RESTORE_TARGET_<ENV>_URL` env vars) and optionally toggle dry-run.
3. **Impact Review** – The wizard fetches `/admin/backups/:id/impact` to display snapshot size, estimated downtime, and a checklist that must be acknowledged.
4. **Confirmation** – Type the confirmation phrase shown in the modal (`RESTORE <backupId>` by default) and optionally enter the OTP code. Submit to queue the restore.
5. **Worker Execution** – The restore worker streams the snapshot (`database.sql.gz`) into `psql` using the configured target connection string. Dry-run requests simply validate archive readability.
6. **Monitoring** – The latest restore status per snapshot is shown in the history table. Detailed status records live in the `backup_restores` table (including logs, metadata, and failure reasons).

## Environment Variables
- `BACKUP_STORAGE_DIR` – Base directory for snapshot archives (defaults to `../backups`).
- `RESTORE_WORKER_ENABLED` – Set to `false` to disable the restore worker.
- `RESTORE_WORKER_POLL_MS` – Polling interval for pending restores (default `5000`).
- `RESTORE_TARGET_<ENV>_URL` – Connection string for each allowed restore target (e.g. `RESTORE_TARGET_STAGING_URL=postgres://...`).
- `BACKUP_RESTORE_CONFIRM_TEMPLATE` – Format for the confirmation phrase (default `RESTORE {backupId}`).

## Safety Checks
- Only `SUPER_GURU`/`ADMIN` roles can access restore endpoints.
- Confirm phrase must match exactly; requests are rejected if the snapshot isn’t completed.
- Only one restore per target environment can run at a time; attempts to queue another restore for the same env while one is `QUEUED/RUNNING` will fail.
- Dry-run requests mark the job complete without applying SQL, useful to validate artifacts.

## Manual Recovery
If the automated worker isn’t available:
1. Download the manifest + `database.sql.gz` from the Admin UI.
2. Validate checksum from the manifest.
3. Run `gunzip -c database.sql.gz | psql "$TARGET_URL"` manually after putting the target DB into maintenance.
4. Record the action with a manual entry inside `backup_restores` (e.g. `INSERT ... status='COMPLETED'`).
