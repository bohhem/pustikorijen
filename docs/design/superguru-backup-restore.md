# SuperGuru Backup & Restore Console Plan

## Purpose
Create a first-class "Backups" section inside the SuperGuru Console so regional/global administrators can trigger, monitor, and restore trusted snapshots without leaving the app. The section must expose real-time status, guardrails for destructive operations, and hooks to long-running infrastructure jobs.

## Goals
- Allow SuperGurus/Admins to create on-demand encrypted database + media snapshots with a single action.
- Surface existing backups with metadata (age, size, scope, initiator, location) and health indicators.
- Provide a guided multi-step restore flow with environment safety checks and audit logging.
- Expose scheduled backup jobs (cron) including last/next run, retention, and ability to pause/resume.
- Centralize notifications, logs, and download links for compliance requests.

## Non-Goals
- Replacing the existing infra-level disaster recovery pipeline (this UI layers on top of API/job runner).
- Managing non-relational services (Redis, search) in v1—link out to runbooks instead.
- Offering fine-grained table-level restore; only full instance or scoped tenant restores for now.

## Personas & Permissions
| Persona | Access | Notes |
| --- | --- | --- |
| SuperGuru (global) | Full read/write | Can trigger backups, configure schedules, and initiate restores for any region/tenant. |
| Admin (internal staff) | Full read/write | Same as SuperGuru but may bypass confirmation key if `isInternal` flag. |
| Regional Guru | Read-only summary | Can view backup timestamps for their region but cannot trigger actions. |

Auth layer: gate the `/admin/backups` route via `SuperGuruRoute` with `allowedRoles=['SUPER_GURU','ADMIN']` for write access; render read-only view for `REGIONAL_GURU` (pending backend support) or hide entirely.

## Experience Overview
1. **Snapshot Health Header** – KPI cards summarizing last successful backup, next scheduled run, retention drift, outstanding restores.
2. **Manual Backup Drawer** – form to choose scope (full DB vs. regional subset), include media assets, label snapshot, optional notes. Action triggers API and enters "queued" state.
3. **Restore Wizard** – 3-step modal: select snapshot → simulate impact (records count, downtime estimate) → require typed confirmation + 2FA/OTP before API call.
4. **Schedules Card** – list cron definitions with toggle, retention policy, destinations (S3 bucket & path). Provide "Edit" slide-over tied to scheduling API.
5. **Backup History Table** – paginated log with filters (status, initiator, type) plus actions: download manifest, copy S3 URI, trigger restore, view logs.
6. **Activity & Alerts** – inline toast + persistent log linking to `admin/activity` once built; send email/slack webhooks via backend events.

## Page Layout & Components
- Reuse `AdminLayout`; enable nav item once MVP ships.
- Compose page with stacked sections inside `space-y-6` container.
- Components needed:
  - `BackupStatsCards` – derived from `/admin/backups/summary`.
  - `ManualBackupCard` – CTA to open `ManualBackupDrawer` (controlled component with form state + validation via `react-hook-form` + `zod`).
  - `BackupSchedulesCard` – table of schedules with inline status pill & "Edit" button.
  - `BackupHistoryTable` – uses virtualized list for long history, includes `StatusBadge`, `ActionMenu`.
  - `RestoreWizardModal` – `StepIndicator`, `ImpactPreview`, `ConfirmationInput`, `DangerAlert`.
  - `LogAccordion` – collapsible panel showing latest log lines returned from `/admin/backups/{id}/logs`.

State management: leverage TanStack Query keys such as `['backups','summary']`, `['backups','list',filters]`, `['backups','schedules']`. Mutations (`createBackup`, `restoreBackup`, `updateSchedule`) should optimistically update or refetch relevant queries. Use `useToast` for success/failure messaging.

## User Flows
### Manual Backup
1. User clicks "Create Backup" → Drawer opens prefilled (scope defaults to "Full platform").
2. Validate form: name (<= 60 chars), optional region filter, includeMedia boolean, retention override (# of days) and notification recipients.
3. Submit hits `POST /admin/backups`. Backend enqueues job (BullMQ) and returns snapshot record with `status='QUEUED'` + `trackingToken`.
4. UI displays inline progress pill; page polls `GET /admin/backups/{id}` every 10s until `COMPLETED`/`FAILED` or websocket update.
5. Completion surfaces download link (signed URL) + ability to copy manifest.

### Restore Flow
1. From history table, user clicks "Restore" (disabled unless status completed + environment is restorable).
2. Wizard step 1: select target environment (staging/prod) & scope; show warnings (restores disallowed directly on prod without `--force` flag & 2nd approval).
3. Step 2: fetch `/admin/backups/{id}/impact` to compute downtime estimate + diff summary (row counts, media size). Display checkboxes to confirm prerequisites (maintenance window, notifications sent).
4. Step 3: require typed phrase `RESTORE <backupCode>` + OTP code; hitting Confirm calls `POST /admin/backups/{id}/restore` with payload { targetEnv, dryRun?: boolean }.
5. Backend emits job ID; UI shows progress timeline (Queued → Validating → Uploading → Applying → Verifying). Provide "Abort" only in validating/uploading phases.

### Schedule Management
- Display upcoming jobs from `/admin/backup-schedules` (id, cron, scope, retentionDays, targetBucket, lastRunAt, status).
- Provide inline toggle to pause/resume (PATCH endpoint) with confirmation.
- "Edit" opens slide-over allowing cron expression validation and test preview (next 5 runs) using `cronstrue`.

### Audit & Notifications
- Every action writes to `/admin/activity` log with metadata (actorId, ip, context).
- Backend pushes notifications to email/slack (webhook stored in env or DB) when backup fails or restore completes.
- UI should surface unread alerts count next to Backups nav (badge) once underlying events API exists.

## Backend & API Contract (proposal)
| Endpoint | Method | Purpose | Notes |
| --- | --- | --- | --- |
| `/admin/backups/summary` | GET | KPIs for cards | cached 30s. |
| `/admin/backups` | GET | Paginated list, filters (`status,type,region,initiator`) | query params. |
| `/admin/backups` | POST | Create on-demand backup | payload: { scope:'FULL'|'REGION', regionId?, includeMedia, label, retentionDays, notifyEmails[] }. |
| `/admin/backups/{id}` | GET | Detail incl. status timeline, asset URIs | used for polling. |
| `/admin/backups/{id}/logs` | GET | Latest job logs | stream/log tail for debugging. |
| `/admin/backups/{id}/restore` | POST | Trigger restore | payload: { targetEnv:'STAGING'|'PROD', dryRun?:boolean, confirmPhrase, otp }. |
| `/admin/backups/{id}/abort` | POST | Cancel restore (pre-apply) | optional for v2. |
| `/admin/backups/{id}/impact` | GET | Pre-restore diff summary | ensures user sees scale. |
| `/admin/backup-schedules` | GET | List cron definitions | includes nextRun, lastRun, owner. |
| `/admin/backup-schedules/{id}` | PATCH | Update cron, scope, retention, status | server validates. |

Data model additions (Prisma):
- `BackupSnapshot` table (id, scope, regionId?, label, includeMedia, status enum, storagePath, checksum, sizeBytes, startedAt, completedAt, initiatedById, retentionDays, metadata JSON).
- `BackupAsset` child table for chunked files (type: DB/Media/Manifest, size, storagePath, signedUrl TTL).
- `RestoreJob` table referencing `BackupSnapshot` with targetEnv, initiatedById, status, timeline JSON, impactSummary JSON.

Jobs run through BullMQ queue `admin-backups`; worker ensures sequential restore per environment, emits progress events via Redis pub/sub → WebSocket `/ws/admin` channel.

## Storage & Security
- Store backups in S3-compatible bucket `pustikorijen-backups` with prefix `{env}/{scope}/{timestamp}-{id}`.
- Encrypt at rest (SSE-KMS) and enforce signed URL download expiry (default 15 min) from API.
- Enforce retention policy (default 30 days) and background job to purge expired snapshots after verifying no restore jobs reference them.
- Keep manifest (JSON) describing schema version, app version, migrations hash for compatibility checks.
- Restore requests must verify that backup schema version <= current app version before proceeding; else require manual DBA flag.
- Introduce a dedicated **restore service account** per environment with scoped credentials (RDS snapshot + S3 object access). Backend workers assume this role when running restore jobs instead of using the caller's user token, and they log the impersonation chain for auditing.
- Map each backup to the environment it came from (`sourceEnv`) and require that restores target either the same environment or a compatible lower environment (e.g., prod → staging for incident drills). Cross-environment restores (dev ↔ prod) demand explicit confirmation plus `ALLOW_PROD_RESTORE`.
- Dev/staging restores run under a non-privileged restore account that lacks production data-plane rights, preventing accidental overwrite of live systems.
- Local dev worker implementation: use `pg_dump` to stream the configured `DATABASE_URL` into a compressed artifact under `BACKUP_STORAGE_DIR` (default `../backups`), record SHA-256 checksum + byte size, and store that information inside the manifest JSON. If media backup is requested in dev, capture a placeholder manifest note until the real media pipeline is wired in.
- Local dev worker implementation: use `pg_dump` to stream the configured `BACKUP_DATABASE_URL` (falls back to `DATABASE_URL` minus query params) into a compressed artifact under `BACKUP_STORAGE_DIR` (default `../backups`), record SHA-256 checksum + byte size, and store that information inside the manifest JSON. If media backup is requested in dev, capture a placeholder manifest note until the real media pipeline is wired in.

## Frontend Implementation Notes
- Place page at `frontend/src/pages/admin/AdminBackups.tsx`; register route in `App.tsx` and enable nav item once ready.
- Break down components under `frontend/src/components/admin/backups/` to keep codebase organized.
- Define shared types in `frontend/src/types/admin.ts`: `BackupSnapshot`, `BackupStatus`, `RestoreStatus`, `BackupSchedule`.
- API helpers in `frontend/src/api/admin.ts` for each endpoint with typed responses.
- Use `react-hook-form` + `zodResolver` for manual backup and schedule forms; centralize validation schema in `frontend/src/utils/validation/backups.ts`.
- For progress, use `useEffect` polling with exponential backoff plus optional WebSocket hook `useAdminEvents` when backend ready.

## Observability & UX Safeguards
- Disable destructive buttons while action pending; show spinner inside CTA.
- Display `DangerAlert` component with red background for restore step; include checklist of prerequisites (DB snapshot, user comms, etc.).
- Track metrics: time to complete backup, failure count (Prometheus) to surface on page.
- Provide `Download Manifest` action as simple link (calls API to fetch signed URL) with fallback instructions.
- In case of failure, show "Retry" CTA that spawns new job referencing same config.

## Risks & Mitigations
- **Long-running jobs**: mitigate via chunked streaming to S3 + progress events; UI must handle offline by resuming polling.
- **Accidental prod restore**: require typed confirmation + OTP + optional second approver (phase 2). Block restore if there is a newer backup created within last 10 min unless `force` flag.
- **Cost growth**: enforce retention and surface estimated monthly storage usage per schedule.
- **Job saturation**: limit concurrent backups via queue concurrency = 1 per environment; display warning if queue length >1.

## Milestones
1. **MVP (Sprint 1)** – Backend summary/list/create endpoints + manual backup UI (no restore). Enable history table and stats.
2. **Restore Beta (Sprint 2)** – Implement restore wizard, impact preview, OTP, job timeline, notifications.
3. **Schedules & Alerts (Sprint 3)** – CRUD for schedules, nav badge counts, Slack/email hooks, retention enforcement UI.
4. **Enterprise Hardening (Sprint 4)** – Abort flow, regional-guru read-only, per-tenant scopes, download manifest improvements.

## Open Questions
- Should restores be limited to staging in MVP? (recommended) – require feature flag `ALLOW_PROD_RESTORE`.
- Do we need differential/back-incremental backups or is full snapshot acceptable initially?
- Where are OTP secrets managed? (Reuse existing MFA service vs. short-lived email token.)
- What is the SLA for backup completion? Determine spinner timeout + escalate warnings if >15 min.
- How do we surface dependency backups (Redis, object storage) – out-of-scope but link to runbook?
