# Connected Families View — Design Sketch

## Goals
1. Give Gurus/SuperGurus a bird’s‑eye view of every branch that has an approved person link with the current branch.
2. Surface context at multiple levels:
   - Quantitative: how many linked people, pending requests, last activity.
   - Qualitative: who the bridging relatives are, where they live, notes.
3. Provide launch points to manage links (approve/deny) and jump to the partner branch or person profiles.

## Data Model & API Contract

### New Endpoint
`GET /api/v1/branches/:branchId/linked-families`

**Auth:** Requires authentication; response filtered to Gurus of the branch or SuperGurus/Admins. Members without guru rights receive 403.

**Response:**
```json
{
  "branchId": "FB-TES-AJANOVIC-001",
  "connectedFamilies": [
    {
      "branch": {
        "id": "FB-SAR-LIVNJAK-001",
        "surname": "Livnjak",
        "cityName": "Sarajevo",
        "region": "Sarajevo Canton",
        "country": "Bosnia and Herzegovina",
        "isVerified": true,
        "visibility": "family_only"
      },
      "stats": {
        "approvedLinks": 4,
        "pendingLinks": 1,
        "lastLinkAt": "2025-10-15T12:44:30.000Z",
        "firstLinkAt": "2025-03-02T09:11:00.000Z"
      },
      "bridgePersons": [
        {
          "id": "person-123",
          "fullName": "Melisa Ajanović",
          "role": "target",             // target = lives in current branch, source = from other branch
          "linkStatus": "approved",
          "linkedPerson": {
            "id": "person-456",
            "fullName": "Salih Livnjak",
            "homeBranchSurname": "Livnjak"
          },
          "notes": "Confirmed by Jasmin (Guru)",
          "approvedAt": "2025-10-21T15:01:12.000Z"
        }
      ]
    }
  ]
}
```

### Backend Implementation Notes
- Query `branch_person_links` for the given branch where `status != 'rejected'`.
- Group by the opposing branch (`source_branch_id` when current branch is target, `branch_id` when current branch is source).
- For each group:
  - Resolve branch metadata via `family_branches`.
  - Aggregate counts for `status = 'approved'` and `status = 'pending'`.
  - Track min/max of timestamps for timeline.
  - Fetch the latest N (default 5) bridge persons: include both sides’ person names + optional notes.
- Caching: respond quickly by caching per branch for ~60 seconds (simple in-memory map in service layer).

## Frontend UX Sketch

### Placement
Add a new card on `BranchDetail` under the placeholders section (only visible to Gurus/SuperGurus).

### Layout
```
┌ Connected Families ────────────────┐
│ [Legend: ● Approved  ○ Pending ]   │
│                                     │
│ ┌ Branch Card ─ Livnjak ─────────┐ │
│ │ Sarajevo, Bosnia ▸ View branch │ │
│ │                                 │ │
│ │ Stats: 4 approved • 1 pending   │ │
│ │ Timeline: Linked since Mar 2025 │ │
│ │                                 │ │
│ │ Bridges:                        │ │
│ │  - Melisa (target) ⇄ Salih (src)│ │
│ │    notes…                       │ │
│ │  - Faruk (pending)              │ │
│ │                                 │ │
│ │ Action buttons:                 │ │
│ │  [Review pending links] [Open]  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Interaction Details
1. **Filter Chips:** (All | Approved | Pending) to slice the cards.
2. **Bridge list:** collapsible; show first 3 connections with “+2 more” link to open modal listing all.
3. **Review Pending** button deep-links to `/branches/:id/person-links?branch=otherBranch`.
4. **Graph Mode (Phase 2):** add optional mini force-chart showing current branch in center with nodes sized by number of links. (For now, keep to cards.)

### Component Structure
- `ConnectedFamiliesSection` (fetches data, handles loading/empty states).
- `ConnectedFamilyCard` (renders one branch + stats + actions).
- `BridgeList` (subcomponent handling show more + modal).
- `ConnectedFamiliesModal` (optional extended list).

### Empty/Error States
- Empty: “No connected families yet. Approve link requests to start building bridges.”
- Error: inline alert with retry button (calls `refetch()`).

### Permissions
- Visible only if `canModerateBranch` (Guru) or `isSuperGuru`.
- API call includes auth header; handle 403 by showing “Only branch Gurus can view connected families.”

## Roadmap / Phases
1. **Phase 1 (MVP)** – Implement endpoint, cards, filters, and pending-action button (1–2 days).
2. **Phase 2** – Add graph visualization & caching refinements.
3. **Phase 3** – Integrate notifications (“Livnjak branch added two new bridge requests”).

## Open Questions
- Should mutual approval automatically create reciprocal cards on both branches? (Current plan: yes—API can be reused on either branch.)
- Do we expose this to non-Guru members in read-only mode? (Out of scope for MVP.)

---
*Prepared for implementation – October 26, 2025*
