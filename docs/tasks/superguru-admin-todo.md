# SuperGuru Admin Module - TODO

> Scope: Design/implement the "SuperGuru" administration area, regional oversight workflows, and backup/import tooling.

## Roles & Permissions

- [ ] Extend role model to support `super_guru` scoped by region/place.
- [ ] Define capabilities matrix (invite gurus, suspend users, invoke backups, etc.).
- [ ] Update JWT/guards to permit SuperGuru actions across assigned regions.
- [ ] Seed initial SuperGuru account + migration for new role.

## Backend API

- [ ] `/admin/regions` endpoints to list/manage regions + assigned gurus.
- [ ] Invite workflow: issue/email invites, track status, allow acceptance.
- [ ] User assistance endpoints (password reset trigger, manual verification, impersonation guardrails).
- [ ] Backup/restore API hooks (trigger snapshots, list backups, restore).
- [ ] Data import/export endpoints (CSV/JSON/GEDCOM), queued via job runner.
- [ ] Scheduling engine: cron-like definitions stored in DB, REST endpoints to manage.
- [ ] Audit logging for every admin action (who, when, target, result).

## Frontend (Admin Console)

- [ ] New `AdminLayout` with sidebar (Regions, Users, Backups, Schedules, Imports/Exports, Activity Log).
- [ ] Dashboard cards: upcoming scheduled jobs, recent failures, pending invites, unresolved user help tickets.
- [ ] Region overview table w/ assign/unassign gurus, create new region, search/filter.
- [ ] Invite form & status board (resend, revoke).
- [ ] User support drawer: search users, view status, actions (reset 2FA, resend verification, deactivate).
- [ ] Backup & restore flow: manual trigger, scheduled job card, restore confirmation wizard.
- [ ] Import/Export wizard with validations, mapping preview, dry run, progress indicator.
- [ ] Activity log view w/ filters, export.

## Infrastructure

- [ ] Job runner / queue selection (BullMQ? custom) for long-running admin tasks.
- [ ] Storage strategy for backups & imports (S3 bucket, naming convention, retention policy).
- [ ] Notification hooks (email/Slack) for job results & critical alerts.
- [ ] Environment variable additions for admin endpoints + cron secrets.

## Documentation & Support

- [ ] Update AUTH/roles docs to describe SuperGuru powers & responsibilities.
- [ ] Runbooks for backup/restore, import/export, user assistance.
- [ ] Update STATUS.md roadmap to include admin module milestones.
- [ ] Security review checklist for new endpoints.

