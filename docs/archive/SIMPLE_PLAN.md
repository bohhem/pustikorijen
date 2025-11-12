# Minimal Ledger & Diaspora Hook-up Plan

## Backend
- Add `share_in_ledger` flag + `estimated_birth_year` to `persons`.
- `GET /geo/regions/:id/people-ledger` returns minimal public rows (personId, name, approxAge, branch).
- `branch_placeholders` table + CRUD (`POST/GET /branches/:id/placeholders`, claim endpoint).
- Connection/poke endpoint (`POST /connections/request`) leveraging existing person-link approvals.
- Optional public lookup (`GET /public/ledger/search`) with rate limiting.

## Frontend
- Regional dashboard ledger table (name, age, branch, “I’m this person”).
- Dedup panel in branch creation reuse ledger data.
- Placeholder management UI on branch detail + “Claim this slot” modal.
- Claim flow: login -> confirm -> submit request; show status in dashboard.
- Guru settings to toggle ledger visibility per person or branch-wide.

## Order
1. Backend migrations + ledger endpoints.
2. Frontend ledger panel + dedup integration.
3. Placeholder UI + claim modal.
4. Public lookup widget + privacy controls.
5. Notifications/polish.

## Verification
- API tests for ledger privacy.
- UI tests for claim/poke flow.
- Monitor poke volume; alert on spikes.
