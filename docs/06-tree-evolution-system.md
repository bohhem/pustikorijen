# Tree Evolution System - Root Ancestor Changes

## Overview

Genealogical research is an ongoing process. Families may discover older ancestors over time, requiring the family tree to "grow upward." This document describes how the Pustikorijen system handles root ancestor changes while maintaining data integrity.

## Core Principle: Stable Identifiers, Flexible Metadata

Our system is designed to evolve:
- **Person UUIDs** never change (stable)
- **Branch IDs** remain constant (stable)
- **Generation codes** are recalculated as needed (flexible)
- **Relationships** can be updated with proper approval (flexible)

This architecture allows trees to grow in any direction while preserving all references and history.

---

## Scenario: Discovering an Older Root Ancestor

### Example Timeline

**Current State:**
```
Branch: FB-SA-HODZIC-001
Root: Mehmed Hodžić (b.1890) [G1]
      └─ Ahmed (b.1920) [G2]
         └─ Nermin (b.1955) [G3]
```

**New Discovery:**
"We found church baptism records showing Mehmed's father was Ibrahim (b.1860)!"

**Desired State:**
```
Branch: FB-SA-HODZIC-001 (same ID!)
Root: Ibrahim Hodžić (b.1860) [G1] ← NEW ROOT
      └─ Mehmed (b.1890) [G2] ← shifted from G1
         └─ Ahmed (b.1920) [G3] ← shifted from G2
            └─ Nermin (b.1955) [G4] ← shifted from G3
```

### What Changes vs What Stays Stable

#### ✅ Remains Stable (No Change)

1. **Branch ID:** `FB-SA-HODZIC-001`
   - URLs continue to work
   - External references preserved
   - Branch remains searchable with same ID

2. **Person UUIDs:** All person IDs unchanged
   - Mehmed: `P-mehmed-uuid` (same)
   - Ahmed: `P-ahmed-uuid` (same)
   - Nermin: `P-nermin-uuid` (same)
   - No broken relationships

3. **Branch Metadata:**
   - Geographic origin: Sarajevo (unchanged)
   - Surname: Hodžić (unchanged)
   - Branch sequence: 001 (unchanged)

4. **Family Members & Roles:**
   - All members remain in branch
   - Guru roles preserved
   - Editor permissions unchanged
   - Access levels maintained

5. **Historical Data:**
   - Complete audit trail preserved
   - All previous edits visible
   - Document uploads intact
   - Stories and photos preserved

6. **Reference Codes:** Mostly stable
   - Format: `FB-SA-HODZIC-001/AH-1920`
   - No generation in reference code
   - Continues to work after shift

#### ⚠️ Changes Required

1. **Generation Codes:** All shift down
   - Old G1 → New G2
   - Old G2 → New G3
   - Old G3 → New G4
   - Pattern continues for all descendants

2. **Branch Statistics:**
   - Total generations increases
   - Oldest ancestor birth year changes
   - Timeline extends further back
   - Generation counts update

3. **Tree Visualization:**
   - Root position changes
   - Tree "grows upward"
   - May need UI adjustments for display

4. **Relationship Distances:**
   - Degree calculations update
   - "3rd cousin" might become "4th cousin"
   - Common ancestor distance increases

---

## Root Change Workflow

### Phase 1: Proposal Submission

Any verified family member can propose a root change, but it requires strong evidence.

#### Proposal Form

```
╔══════════════════════════════════════════════════════════════════════╗
║  🌳 Propose New Root Ancestor                                        ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  Current Root: Mehmed Hodžić (b.1890, Sarajevo)                     ║
║  Branch: FB-SA-HODZIC-001                                            ║
║                                                                       ║
║  ┌────────────────────────────────────────────────────────────────┐  ║
║  │ Proposed New Root Ancestor                                      │  ║
║  │                                                                 │  ║
║  │ Full Name: [Ibrahim Hodžić_________________]                    │  ║
║  │ Birth Year: [1860] Birth Place: [Sarajevo__]                   │  ║
║  │ Death Year: [1925] Death Place: [Sarajevo__]                   │  ║
║  │                                                                 │  ║
║  │ Relationship to Current Root:                                   │  ║
║  │ Ibrahim is the [father ▼] of Mehmed Hodžić                      │  ║
║  │                                                                 │  ║
║  │ Additional Parent (Optional):                                   │  ║
║  │ Mother's Name: [Fatima____] Birth Year: [1865]                 │  ║
║  │                                                                 │  ║
║  │ Supporting Evidence: ⚠️ REQUIRED (Minimum 2 sources)             │  ║
║  │ [📄 Church baptism record - Mehmed.pdf] ★★★★☆                   │  ║
║  │ [📄 Ottoman census 1895.pdf] ★★★☆☆                              │  ║
║  │ [➕ Add more evidence]                                           │  ║
║  │                                                                 │  ║
║  │ Detailed Explanation:                                           │  ║
║  │ ┌────────────────────────────────────────────────────────────┐ │  ║
║  │ │ Found Ibrahim's name in church baptism records for Mehmed  │ │  ║
║  │ │ dated 1890. Record shows father as "Ibrahim sin Hasana"    │ │  ║
║  │ │ from Sarajevo. Cross-referenced with 1895 Ottoman census   │ │  ║
║  │ │ which lists Ibrahim (age 35) with wife Fatima and son     │ │  ║
║  │ │ Mehmed (age 5) in Stari Grad mahala.                       │ │  ║
║  │ └────────────────────────────────────────────────────────────┘ │  ║
║  │                                                                 │  ║
║  │ ⚠️  IMPACT WARNING                                               │  ║
║  │ This change will affect ALL 234 people in the branch:          │  ║
║  │ • Current G1 (Mehmed) → becomes G2                             │  ║
║  │ • Current G2 (5 people) → become G3                            │  ║
║  │ • Current G3 (18 people) → become G4                           │  ║
║  │ • Current G4-G6 (210 people) → shift accordingly               │  ║
║  │                                                                 │  ║
║  │ Branch ID (FB-SA-HODZIC-001) will NOT change ✓                 │  ║
║  │ All person IDs (UUIDs) will remain the same ✓                  │  ║
║  │                                                                 │  ║
║  │ This proposal requires:                                         │  ║
║  │ • High-quality evidence (Level 3+ sources)                     │  ║
║  │ • Family Guru approval (2/3 if multiple Gurus)                 │  ║
║  │ • 14-day family review period                                  │  ║
║  │ • Majority family support (or no major objections)             │  ║
║  │                                                                 │  ║
║  │ [Submit Proposal] [Save as Draft] [Cancel]                     │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
```

#### Proposal Validation

System automatically checks:
- ✅ Evidence quality score (minimum Level 3 required)
- ✅ Minimum 2 independent sources
- ✅ No logical conflicts (birth dates, death dates)
- ✅ Proposer has permission (verified family member)
- ⚠️ Check for similar proposals (prevent duplicates)

If validation passes, proposal enters review phase.

---

### Phase 2: Family Review Period (14 Days)

#### Review Dashboard

```
╔══════════════════════════════════════════════════════════════════════╗
║  📋 ROOT CHANGE PROPOSAL #RC-00123                                   ║
╠══════════════════════════════════════════════════════════════════════╣
║  Status: 🟡 Under Family Review                                      ║
║  Submitted: 2025-10-20 by Nermin Hodžić                             ║
║  Deadline: 7 days remaining                                          ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  ┌─ Proposed Change ──────────────────────────────────────────────┐  ║
║  │                                                                 │  ║
║  │  Current Root:  Mehmed Hodžić (b.1890, Sarajevo) [G1]          │  ║
║  │                                                                 │  ║
║  │        ↓ CHANGE TO ↓                                            │  ║
║  │                                                                 │  ║
║  │  New Root:      Ibrahim Hodžić (b.1860, Sarajevo) [NEW G1]     │  ║
║  │                 └─ Mehmed Hodžić (b.1890) [→G2]                │  ║
║  │                                                                 │  ║
║  │  Relationship:  Ibrahim is father of Mehmed                     │  ║
║  │  Impact:        234 people (all generations shift down by 1)   │  ║
║  │                                                                 │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  ┌─ Evidence Review ──────────────────────────────────────────────┐  ║
║  │                                                                 │  ║
║  │ 📄 Church Baptism Record - Mehmed (1890)                        │  ║
║  │    Source Quality: ★★★★☆ (Level 4 - Church records)            │  ║
║  │    Shows: Father listed as "Ibrahim sin Hasana Hodžić"         │  ║
║  │    [View Document] [Verify Authenticity]                        │  ║
║  │    Expert Opinion: "Record appears authentic, consistent with   │  ║
║  │                     period documentation style." - Dr. Kovač    │  ║
║  │                                                                 │  ║
║  │ 📄 Ottoman Census Record (1895)                                 │  ║
║  │    Source Quality: ★★★☆☆ (Level 3 - Government records)        │  ║
║  │    Shows: Ibrahim (35) + Fatima (30) + son Mehmed (5)          │  ║
║  │    Address: Stari Grad mahala, Sarajevo                        │  ║
║  │    [View Document]                                              │  ║
║  │                                                                 │  ║
║  │ 💬 Family Testimony (2 sources)                                 │  ║
║  │    Source Quality: ★★☆☆☆ (Level 2 - Oral testimony)            │  ║
║  │    "My grandmother mentioned Ibrahim..." - Lejla H.            │  ║
║  │    "Old family stories reference Ibrahim..." - Amir H.         │  ║
║  │                                                                 │  ║
║  │ Overall Evidence Score: 85/100 (Strong) ✅                      │  ║
║  │                                                                 │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  ┌─ Family Discussion (24 comments) ──────────────────────────────┐  ║
║  │                                                                 │  ║
║  │ 👤 Lejla H. · 2 days ago                                        │  ║
║  │ "This makes perfect sense! My grandmother always mentioned     │  ║
║  │  Ibrahim as Mehmed's father. The church records confirm it."   │  ║
║  │ [👍 15] [💬 Reply]                                               │  ║
║  │                                                                 │  ║
║  │ 👤 Amir H. · 2 days ago                                         │  ║
║  │ "Can we verify the authenticity of the church records?         │  ║
║  │  They look old but I want to be sure."                         │  ║
║  │ [❓ 8] [💬 Reply]                                                │  ║
║  │   └─ 👤 Expert Genealogist · 1 day ago                          │  ║
║  │      "I've examined the records. Paper, ink, and handwriting   │  ║
║  │       are consistent with 1890s church documentation from      │  ║
║  │       Sarajevo. High confidence in authenticity."              │  ║
║  │      [✓ Verified] [👍 23]                                        │  ║
║  │                                                                 │  ║
║  │ 👤 Senad M. · 1 day ago                                         │  ║
║  │ "Does this mean we're now connected to the Hodžić family       │  ║
║  │  from Bistrik? Ibrahim's father Hasan was from there..."       │  ║
║  │ [🤔 6] [💬 Reply]                                                │  ║
║  │                                                                 │  ║
║  │ [View All Comments] [Add Comment]                               │  ║
║  │                                                                 │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  ┌─ Family Vote (Optional) ───────────────────────────────────────┐  ║
║  │                                                                 │  ║
║  │  ✅ Support:  48 members (81%)  [████████████░░] 81%            │  ║
║  │  ❌ Oppose:   3 members (5%)    [█░░░░░░░░░░░░░] 5%             │  ║
║  │  ⚪ Neutral:  8 members (14%)   [██░░░░░░░░░░░░] 14%            │  ║
║  │                                                                 │  ║
║  │  Total Votes: 59/156 eligible members (38% participation)      │  ║
║  │  Threshold: >60% support OR <20% opposition ✅                  │  ║
║  │                                                                 │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  ┌─ Guru Review ──────────────────────────────────────────────────┐  ║
║  │                                                                 │  ║
║  │  Primary Guru - Nermin H.    ✅ Approved (Proposer)             │  ║
║  │  "Evidence is compelling. Supports family oral history."       │  ║
║  │                                                                 │  ║
║  │  Co-Guru - Lejla H.          ✅ Approved                         │  ║
║  │  "Church records are authentic. I support this change."        │  ║
║  │                                                                 │  ║
║  │  Co-Guru - Amir H.           ⏳ Reviewing...                     │  ║
║  │  Last activity: 6 hours ago                                    │  ║
║  │                                                                 │  ║
║  │  Status: 2/3 Guru Approval (Pending final vote) ⚠️              │  ║
║  │                                                                 │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  ┌─ Actions ──────────────────────────────────────────────────────┐  ║
║  │                                                                 │  ║
║  │  For Gurus:                                                     │  ║
║  │  [✅ Approve] [❌ Reject] [❓ Request More Evidence]             │  ║
║  │  [⏰ Extend Review Period] [📧 Notify Expert]                   │  ║
║  │                                                                 │  ║
║  │  For Family Members:                                            │  ║
║  │  [👍 Support] [👎 Oppose] [⚪ Abstain] [💬 Comment]              │  ║
║  │  [📧 Subscribe to Updates]                                      │  ║
║  │                                                                 │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
```

#### Review Period Activities

**Automatic Actions:**
1. Email notification to all family members
2. In-app notification banner on branch pages
3. Discussion thread opened automatically
4. Evidence uploaded to secure storage
5. Expert genealogist notified (if needed)

**Family Activities:**
- Review evidence documents
- Discuss in comment thread
- Vote (support/oppose/neutral)
- Raise concerns or objections
- Submit additional evidence

**Guru Activities:**
- Review evidence quality
- Consult with experts if needed
- Request additional documentation
- Monitor family discussion
- Address concerns and objections
- Make approval decision

---

### Phase 3: Approval Decision

#### Approval Criteria

For a root change proposal to be approved:

**Required (All Must Be True):**
- ✅ Evidence quality score ≥70/100
- ✅ Minimum 2 independent sources (Level 3+)
- ✅ Guru approval: 2/3 consensus (if multiple Gurus)
- ✅ No logical conflicts or errors

**Plus One of:**
- ✅ Family support: >60% of voting members, OR
- ✅ Family opposition: <20% of voting members, OR
- ✅ Expert genealogist endorsement

**If Disputed:**
- Enter standard dispute resolution process (3-tier)
- Proposal paused until dispute resolved
- May require Level 3 (Admin panel) review

#### Decision Outcomes

**1. APPROVED ✅**
```
Decision: APPROVED
Date: 2025-11-03
Approved by: Lejla H. (Co-Guru), Amir H. (Co-Guru)
Family Vote: 81% support (48/59 votes)
Evidence Score: 85/100

Reasoning:
- Church baptism record is authentic (expert verified)
- Ottoman census corroborates relationship
- Strong family support and oral tradition alignment
- No credible opposing evidence presented

Next Steps:
- Proposal enters execution queue
- Estimated execution time: 5 minutes
- All family members will be notified when complete
```

**2. REJECTED ❌**
```
Decision: REJECTED
Date: 2025-11-03
Rejected by: Amir H. (Co-Guru)
Reason: Insufficient Evidence

Reasoning:
- Birth certificate date conflicts with census data
- Church records could not be authenticated
- Insufficient independent corroboration
- Recommend gathering additional evidence

Next Steps:
- Proposer notified of rejection with detailed feedback
- Can resubmit with additional evidence
- Original proposal archived for reference
```

**3. REQUEST MORE EVIDENCE ❓**
```
Status: ON HOLD - Additional Evidence Requested
Date: 2025-11-03
Requested by: Lejla H. (Co-Guru)

Evidence Needed:
1. Verification of church record authenticity
2. Additional census or civil records
3. DNA evidence from related branches (optional)

Extended Review Period: +14 days
New Deadline: 2025-11-17

Family members can continue discussion and submit evidence.
```

---

### Phase 4: Execution

Once approved, the system executes the root change automatically.

#### Execution Process

```
╔══════════════════════════════════════════════════════════════════════╗
║  ⚙️  Executing Root Change #RC-00123                                 ║
╠══════════════════════════════════════════════════════════════════════╣
║  Branch: FB-SA-HODZIC-001                                            ║
║  Started: 2025-11-03 15:30:00                                        ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  Step 1/8: Creating new root person (Ibrahim)        [████████] 100% ║
║    ✓ Person record created: P-ibrahim-uuid                           ║
║    ✓ Profile populated from proposal data                            ║
║    ✓ Evidence documents linked                                       ║
║                                                                       ║
║  Step 2/8: Updating parent relationships             [████████] 100% ║
║    ✓ Ibrahim set as father of Mehmed                                 ║
║    ✓ Fatima set as mother of Mehmed (if provided)                    ║
║    ✓ Ibrahim & Fatima linked as spouses                              ║
║                                                                       ║
║  Step 3/8: Shifting generation codes (234 people)    [██████░░]  75% ║
║    ✓ G6 → G7 (45 people)                                             ║
║    ✓ G5 → G6 (67 people)                                             ║
║    ✓ G4 → G5 (89 people)                                             ║
║    ⏳ G3 → G4 (21 people)... processing                               ║
║    ⏳ G2 → G3 (10 people)... pending                                  ║
║    ⏳ G1 → G2 (1 person)... pending                                   ║
║                                                                       ║
║  Step 4/8: Updating reference codes                  [░░░░░░░░]   0% ║
║  Step 5/8: Recalculating relationship distances      [░░░░░░░░]   0% ║
║  Step 6/8: Updating branch statistics                [░░░░░░░░]   0% ║
║  Step 7/8: Notifying family members                  [░░░░░░░░]   0% ║
║  Step 8/8: Creating audit trail                      [░░░░░░░░]   0% ║
║                                                                       ║
║  Estimated time remaining: 2 minutes                                 ║
║                                                                       ║
║  [View Detailed Log] [Cancel Execution]                              ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
```

#### Technical Steps

**Step 1: Create New Root Person**
```sql
INSERT INTO persons (
  person_id,
  branch_id,
  full_name,
  birth_year,
  birth_place,
  generation,
  generation_number,
  is_branch_root,
  created_from_root_change
) VALUES (
  'P-ibrahim-uuid',
  'FB-SA-HODZIC-001',
  'Ibrahim Hodžić',
  1860,
  'Sarajevo, Bosnia',
  'G1',
  1,
  true,
  'RC-00123'
);
```

**Step 2: Update Old Root**
```sql
UPDATE persons
SET
  is_branch_root = false,
  father_id = 'P-ibrahim-uuid',
  mother_id = 'P-fatima-uuid'  -- if mother provided
WHERE
  person_id = 'P-mehmed-uuid'
  AND branch_id = 'FB-SA-HODZIC-001';
```

**Step 3: Shift All Generations**
```sql
-- Process in reverse order (oldest generation first)
-- to avoid constraint violations

UPDATE persons
SET
  generation = CONCAT('G', generation_number + 1),
  generation_number = generation_number + 1
WHERE
  branch_id = 'FB-SA-HODZIC-001'
ORDER BY generation_number DESC;
```

**Step 4: Update Reference Codes**
```sql
-- Regenerate reference codes (if they include generation)
UPDATE persons
SET reference_code = generate_reference_code(person_id)
WHERE branch_id = 'FB-SA-HODZIC-001';
```

**Step 5: Recalculate Relationship Distances**
```sql
-- Rebuild relationship matrix
CALL recalculate_relationships('FB-SA-HODZIC-001');
```

**Step 6: Update Branch Statistics**
```sql
UPDATE family_branches
SET
  total_generations = (
    SELECT MAX(generation_number)
    FROM persons
    WHERE branch_id = 'FB-SA-HODZIC-001'
  ),
  oldest_ancestor_year = 1860,
  root_person_id = 'P-ibrahim-uuid',
  last_major_update = NOW()
WHERE branch_id = 'FB-SA-HODZIC-001';
```

**Step 7: Notify Family Members**
```sql
INSERT INTO notifications (type, recipients, message)
SELECT
  'root_changed',
  person_id,
  'The branch root has been updated. Ibrahim Hodžić is now the root ancestor.'
FROM branch_members
WHERE branch_id = 'FB-SA-HODZIC-001';

-- Also send emails
CALL send_email_notification('root_changed', 'FB-SA-HODZIC-001');
```

**Step 8: Create Audit Trail**
```sql
INSERT INTO audit_log (
  action_type,
  entity_type,
  entity_id,
  details,
  performed_by,
  root_change_id
)
VALUES (
  'ROOT_CHANGED',
  'BRANCH',
  'FB-SA-HODZIC-001',
  JSON_BUILD_OBJECT(
    'old_root', 'P-mehmed-uuid',
    'new_root', 'P-ibrahim-uuid',
    'people_affected', 234,
    'generation_shift', 1,
    'proposal_id', 'RC-00123'
  ),
  'SYSTEM',
  'RC-00123'
);

-- Mark proposal as executed
UPDATE root_change_proposals
SET
  status = 'executed',
  executed_at = NOW()
WHERE proposal_id = 'RC-00123';
```

#### Execution Completion

```
╔══════════════════════════════════════════════════════════════════════╗
║  ✅ Root Change Complete!                                            ║
╠══════════════════════════════════════════════════════════════════════╣
║  Proposal: RC-00123                                                  ║
║  Executed: 2025-11-03 15:35:27 (5 minutes, 27 seconds)              ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  Summary:                                                            ║
║  ✓ New root: Ibrahim Hodžić (b.1860) created                         ║
║  ✓ Previous root: Mehmed Hodžić (b.1890) → now G2                    ║
║  ✓ 234 people updated (generations shifted)                          ║
║  ✓ All relationships preserved                                       ║
║  ✓ Branch statistics updated                                         ║
║  ✓ 156 family members notified                                       ║
║  ✓ Complete audit trail created                                      ║
║                                                                       ║
║  Branch Details:                                                     ║
║  • Branch ID: FB-SA-HODZIC-001 (unchanged ✓)                         ║
║  • Total Generations: 7 (was 6)                                      ║
║  • Oldest Ancestor: 1860 (was 1890)                                  ║
║  • Total People: 234 (unchanged)                                     ║
║                                                                       ║
║  All person UUIDs remain unchanged ✓                                 ║
║  All document uploads preserved ✓                                    ║
║  All photos and stories intact ✓                                     ║
║                                                                       ║
║  [View Updated Tree] [View Audit Log] [Notify Proposer]             ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Multiple Root Changes Over Time

Genealogical research is ongoing. A branch may experience multiple root changes as older ancestors are discovered.

### Historical Example

```
┌─────────────────────────────────────────────────────────────────────┐
│              BRANCH EVOLUTION: FB-SA-HODZIC-001                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  2025-09-01: Branch Created                                          │
│  ┌───────────────────┐                                               │
│  │ Mehmed (b.1890)   │ [G1] ← Initial root                          │
│  └───────────────────┘                                               │
│                                                                      │
│  2026-02-10: Root Change #1                                          │
│  ┌───────────────────┐                                               │
│  │ Ibrahim (b.1860)  │ [G1] ← New root                              │
│  └────────┬──────────┘                                               │
│           │                                                          │
│  ┌────────▼──────────┐                                               │
│  │ Mehmed (b.1890)   │ [G2] ← Shifted down                          │
│  └───────────────────┘                                               │
│                                                                      │
│  2028-07-22: Root Change #2                                          │
│  ┌───────────────────┐                                               │
│  │ Hasan (b.1830)    │ [G1] ← Newer root                            │
│  └────────┬──────────┘                                               │
│           │                                                          │
│  ┌────────▼──────────┐                                               │
│  │ Ibrahim (b.1860)  │ [G2] ← Shifted down again                    │
│  └────────┬──────────┘                                               │
│           │                                                          │
│  ┌────────▼──────────┐                                               │
│  │ Mehmed (b.1890)   │ [G3] ← Shifted down again                    │
│  └───────────────────┘                                               │
│                                                                      │
│  2030-03-15: Root Change #3                                          │
│  ┌───────────────────┐                                               │
│  │ Ahmed (b.1800)    │ [G1] ← Oldest root found                     │
│  └────────┬──────────┘                                               │
│           │                                                          │
│  ┌────────▼──────────┐                                               │
│  │ Hasan (b.1830)    │ [G2] ← Shifted down                          │
│  └────────┬──────────┘                                               │
│           │                                                          │
│  ┌────────▼──────────┐                                               │
│  │ Ibrahim (b.1860)  │ [G3] ← Shifted down                          │
│  └────────┬──────────┘                                               │
│           │                                                          │
│  ┌────────▼──────────┐                                               │
│  │ Mehmed (b.1890)   │ [G4] ← Shifted down                          │
│  └───────────────────┘                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

Key Points:
• Branch ID never changed: FB-SA-HODZIC-001 ✓
• Mehmed's UUID never changed: P-mehmed-uuid ✓
• Mehmed's generation changed: G1 → G2 → G3 → G4
• All descendants shifted automatically
• Complete history preserved in audit log
```

### Branch Evolution History View

```
╔══════════════════════════════════════════════════════════════════════╗
║  📜 Branch Evolution History                                         ║
╠══════════════════════════════════════════════════════════════════════╣
║  Branch: FB-SA-HODZIC-001 (Sarajevo Hodžić Family)                  ║
║  Current Root: Ahmed Hodžić (b.1800) [G1]                            ║
║  Total Generations: 8                                                ║
║  Total People: 312                                                   ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  🌳 Root Change #3 - 2030-03-15                                      ║
║  ┌────────────────────────────────────────────────────────────────┐  ║
║  │ New Root: Ahmed Hodžić (b.1800, Sarajevo)                       │  ║
║  │ Previous Root: Hasan Hodžić (b.1830) → shifted to G2            │  ║
║  │                                                                 │  ║
║  │ Reason: Found church baptism records showing Ahmed as Hasan's  │  ║
║  │         father. Record dated 1830 from Sarajevo Cathedral.     │  ║
║  │                                                                 │  ║
║  │ Impact: 312 people affected (all generations shifted)           │  ║
║  │ Evidence Score: 92/100                                          │  ║
║  │ Approved by: 3/3 Gurus, 89% family support (112/126 votes)     │  ║
║  │ Expert Review: Dr. Marković (Genealogist) - Verified            │  ║
║  │                                                                 │  ║
║  │ [View Proposal] [View Evidence] [View Audit Log]                │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  🌳 Root Change #2 - 2028-07-22                                      ║
║  ┌────────────────────────────────────────────────────────────────┐  ║
║  │ New Root: Hasan Hodžić (b.1830, Sarajevo)                       │  ║
║  │ Previous Root: Ibrahim Hodžić (b.1860) → shifted to G2          │  ║
║  │                                                                 │  ║
║  │ Reason: Ottoman census records discovered in Turkish archives   │  ║
║  │                                                                 │  ║
║  │ Impact: 267 people affected                                     │  ║
║  │ Evidence Score: 81/100                                          │  ║
║  │ Approved by: 2/3 Gurus, 76% family support (89/117 votes)      │  ║
║  │                                                                 │  ║
║  │ [View Proposal] [View Evidence] [View Audit Log]                │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  🌳 Root Change #1 - 2026-02-10                                      ║
║  ┌────────────────────────────────────────────────────────────────┐  ║
║  │ New Root: Ibrahim Hodžić (b.1860, Sarajevo)                     │  ║
║  │ Previous Root: Mehmed Hodžić (b.1890) → shifted to G2           │  ║
║  │                                                                 │  ║
║  │ Reason: Church baptism records analysis for Mehmed showed      │  ║
║  │         father as Ibrahim. Cross-referenced with 1895 census.  │  ║
║  │                                                                 │  ║
║  │ Impact: 234 people affected                                     │  ║
║  │ Evidence Score: 85/100                                          │  ║
║  │ Approved by: 2/3 Gurus, 78% family support (59/76 votes)       │  ║
║  │                                                                 │  ║
║  │ [View Proposal] [View Evidence] [View Audit Log]                │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  🏁 Branch Created - 2025-09-01                                      ║
║  ┌────────────────────────────────────────────────────────────────┐  ║
║  │ Initial Root: Mehmed Hodžić (b.1890, Sarajevo)                  │  ║
║  │ Created by: Nermin Hodžić                                       │  ║
║  │ Initial Size: 45 people                                         │  ║
║  │                                                                 │  ║
║  │ [View Creation Details]                                         │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  Total Root Changes: 3                                               ║
║  Branch Age: 4 years, 6 months                                       ║
║  Growth: 45 → 312 people (593% growth)                               ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Special Scenarios

### Scenario 1: Discovering Both Parents

**Situation:** Current root has no parents listed. Discovery shows both father and mother.

```
Current:
  Root: Mehmed (b.1890) [G1]
  Father: unknown
  Mother: unknown

Discovery:
  Father: Ibrahim (b.1860)
  Mother: Fatima (b.1865)
```

**Solution:**
- Create both Ibrahim and Fatima as G1 (co-roots)
- Link them as spouses
- Link both as parents of Mehmed
- Mehmed becomes G2
- All descendants shift down

**Display:**
```
[G1]  Ibrahim (b.1860) ━━❤━━ Fatima (b.1865)
                     │
[G2]           Mehmed (b.1890)
```

---

### Scenario 2: Root Change Connects Two Branches

**Situation:** Two separate branches discover they share a common ancestor.

```
Branch A: FB-SA-HODZIC-001
  Root: Mehmed (b.1890)

Branch B: FB-SA-HODZIC-002 (thought unrelated)
  Root: Hasan (b.1892)

Discovery:
  Both Mehmed and Hasan are sons of Ibrahim (b.1860)!
```

**Solution: Branch Merger Proposal**

```
╔══════════════════════════════════════════════════════════════════════╗
║  🔗 Branch Merger Proposal                                           ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  Proposal Type: ROOT-TRIGGERED MERGER                                ║
║                                                                       ║
║  ┌────────────────────────────────────────────────────────────────┐  ║
║  │ Branch A: FB-SA-HODZIC-001 (234 people)                         │  ║
║  │ Current Root: Mehmed Hodžić (b.1890)                            │  ║
║  │                                                                 │  ║
║  │ Branch B: FB-SA-HODZIC-002 (189 people)                         │  ║
║  │ Current Root: Hasan Hodžić (b.1892)                             │  ║
║  │                                                                 │  ║
║  │              ↓ MERGE TO ↓                                        │  ║
║  │                                                                 │  ║
║  │ Combined Branch: FB-SA-HODZIC-001 (423 people total)            │  ║
║  │ New Root: Ibrahim Hodžić (b.1860)                               │  ║
║  │           ├─ Mehmed (b.1890) [G2] + 233 descendants             │  ║
║  │           └─ Hasan (b.1892) [G2] + 188 descendants              │  ║
║  │                                                                 │  ║
║  │ Branch B will be marked as "merged" and redirect to Branch A    │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  Evidence:                                                           ║
║  • Church records showing Ibrahim with sons Mehmed and Hasan         ║
║  • Census data from 1895 listing all three                           ║
║  • DNA match between Branch A and Branch B members (98% confidence)  ║
║                                                                       ║
║  Approval Required:                                                  ║
║  • Branch A Gurus: 2/3 approval                                      ║
║  • Branch B Gurus: 2/3 approval                                      ║
║  • Both family votes: >60% support                                   ║
║  • Site admin final approval (structural change)                     ║
║                                                                       ║
║  Impact:                                                             ║
║  ✓ 423 people total (234 + 189)                                      ║
║  ✓ All person UUIDs preserved                                        ║
║  ✓ All generations shift in both branches                            ║
║  ✓ Branch B members transferred to Branch A                          ║
║  ⚠️  Branch B ID redirects to Branch A permanently                    ║
║                                                                       ║
║  [Submit Merger Proposal] [Cancel]                                   ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
```

**Merger Process:**
1. Both branches review evidence
2. Both sets of Gurus must approve (2/3 each)
3. Family votes from both branches (>60% support)
4. Site admin reviews and approves (prevents abuse)
5. System merges:
   - Create new root (Ibrahim)
   - Transfer all Branch B people to Branch A
   - Preserve all UUIDs
   - Update all generations
   - Branch B ID redirects to Branch A
   - Notify all members from both branches

---

### Scenario 3: Disputed Root Change

**Situation:** Conflicting evidence about who the root ancestor is.

```
Proposal: Ibrahim (b.1860) is father of Mehmed
Objection: "No! Ahmed (b.1855) is the father of Mehmed!"

Evidence:
• Church record A: Shows "Ibrahim sin Hasana" as father
• Church record B: Shows "Ahmed sin Ibrahima" as father
• Both records dated 1890
• Different handwriting, different priests
```

**Solution: Dispute Resolution**

Enter standard 3-tier dispute resolution:

**Level 1: Family Discussion (14 days)**
- Present both pieces of evidence
- Family members discuss and vote
- Look for additional evidence
- If 75% consensus → proceed
- If not → escalate to Level 2

**Level 2: Guru Decision (7 days)**
- Guru examines evidence quality
- May request expert authentication
- May request additional documents
- Guru makes decision based on:
  - Document authenticity
  - Source quality levels
  - Supporting evidence
  - Expert opinions

**Level 3: Expert Panel (if appealed)**
- Genealogist examines original documents
- Historical context analysis
- Cross-reference with other sources
- Panel vote (3-5 experts)
- Final binding decision

**Possible Outcomes:**
1. **Accept Proposal:** Ibrahim is father → proceed with root change
2. **Reject Proposal:** Current root (Mehmed) remains, Ahmed evidence insufficient
3. **Alternative Solution:** Find that Ahmed and Ibrahim are the SAME PERSON (naming variations)
4. **Mark as Disputed:** Not enough evidence either way → keep current root, add "disputed ancestry" flag

---

### Scenario 4: Root Discovery Goes Back Centuries

**Situation:** Branch discovers extensive ancestry going back 10+ generations.

```
Current Root: Mehmed (b.1890) [G1]

Discovery: Complete lineage back to 1600s!

Proposed New Root: Mustafa (b.1620)
  10 generations of ancestors discovered
```

**Challenge:** Shifting 10 generations affects potentially thousands of people.

**Solution: Staged Root Changes**

Instead of one massive change, propose intermediate roots:

```
Stage 1: Add Ibrahim (b.1860) as root
  Shift: 1 generation
  Impact: 234 people
  Timeline: 2 weeks review

Stage 2: Add Hasan (b.1830) as root
  Shift: 1 generation
  Impact: 267 people
  Timeline: 2 weeks review

Stage 3: Add Ahmed (b.1800) as root
  Shift: 1 generation
  Impact: 312 people
  Timeline: 2 weeks review

... continue for older generations
```

**Benefits:**
- Easier to verify each generation
- Family can review evidence incrementally
- Lower risk of errors
- Better performance (smaller data updates)
- Can pause if issues discovered

**Alternative: Bulk Root Change**

For well-documented lineages (e.g., nobility, published genealogies):

```
Proposal: Add 10 generations at once
Evidence: Published genealogy book + primary sources
Review: Extended 30-day period + expert verification
Approval: Requires unanimous Guru approval + site admin
```

---

## Database Schema

### New Table: root_change_proposals

```sql
CREATE TABLE root_change_proposals (
  -- Primary Key
  proposal_id VARCHAR(50) PRIMARY KEY,  -- Format: RC-00123

  -- Branch Information
  branch_id VARCHAR(50) NOT NULL,
  old_root_person_id VARCHAR(50),  -- Current root
  new_root_person_id VARCHAR(50),  -- Proposed new root (NULL until created)

  -- Proposer
  proposed_by VARCHAR(50) NOT NULL,  -- User ID
  proposed_at TIMESTAMP DEFAULT NOW(),

  -- New Root Details (before person created)
  new_root_data JSONB,  -- Stores all new root information
  /*
    {
      "full_name": "Ibrahim Hodžić",
      "birth_year": 1860,
      "birth_place": "Sarajevo",
      "death_year": 1925,
      "death_place": "Sarajevo",
      "mother_name": "Fatima",  -- optional
      "mother_birth_year": 1865  -- optional
    }
  */

  -- Relationship
  relationship_type VARCHAR(20),  -- 'father', 'mother', 'both_parents'

  -- Evidence
  evidence_documents JSONB,  -- Array of document IDs
  evidence_score INTEGER,  -- 0-100
  explanation TEXT,

  -- Review Status
  status VARCHAR(20),  -- 'draft', 'pending', 'approved', 'rejected', 'executed'
  review_deadline TIMESTAMP,

  -- Approvals
  guru_votes JSONB,  -- {user_id: 'approve'|'reject'|'pending', ...}
  family_votes JSONB,  -- {user_id: 'support'|'oppose'|'neutral', ...}
  expert_reviews JSONB,  -- {expert_id: {opinion, verified}, ...}

  -- Execution
  executed_at TIMESTAMP,
  execution_log JSONB,  -- Detailed log of execution steps

  -- Impact
  people_affected INTEGER,
  generations_shifted INTEGER,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (branch_id) REFERENCES family_branches(branch_id),
  FOREIGN KEY (proposed_by) REFERENCES users(user_id)
);

CREATE INDEX idx_root_proposals_branch ON root_change_proposals(branch_id);
CREATE INDEX idx_root_proposals_status ON root_change_proposals(status);
```

### Updated Table: persons

```sql
ALTER TABLE persons ADD COLUMN created_from_root_change VARCHAR(50);
-- References the root_change_proposal that created this person

ALTER TABLE persons ADD COLUMN is_branch_root BOOLEAN DEFAULT FALSE;
-- Explicitly mark current root(s)

CREATE INDEX idx_persons_is_root ON persons(branch_id, is_branch_root);
```

### Updated Table: family_branches

```sql
ALTER TABLE family_branches ADD COLUMN root_person_id VARCHAR(50);
-- Quick reference to current root

ALTER TABLE family_branches ADD COLUMN root_change_count INTEGER DEFAULT 0;
-- Track how many times root has changed

ALTER TABLE family_branches ADD COLUMN oldest_ancestor_year INTEGER;
-- Quick stats for display

CREATE INDEX idx_branches_root ON family_branches(root_person_id);
```

### New Table: root_change_history

```sql
CREATE TABLE root_change_history (
  history_id VARCHAR(50) PRIMARY KEY,
  branch_id VARCHAR(50) NOT NULL,
  proposal_id VARCHAR(50) NOT NULL,

  old_root_person_id VARCHAR(50),
  new_root_person_id VARCHAR(50),

  change_date TIMESTAMP,
  people_affected INTEGER,
  generations_shifted INTEGER,

  evidence_summary TEXT,
  approval_summary JSONB,

  FOREIGN KEY (branch_id) REFERENCES family_branches(branch_id),
  FOREIGN KEY (proposal_id) REFERENCES root_change_proposals(proposal_id)
);

CREATE INDEX idx_root_history_branch ON root_change_history(branch_id);
```

---

## Conclusion

### System Readiness: ✅ YES!

Our identifier and architecture design is fully prepared for tree evolution:

| Capability | Status | Implementation |
|------------|--------|----------------|
| Stable person IDs | ✅ Ready | UUIDs never change |
| Stable branch IDs | ✅ Ready | Independent of root |
| Flexible generations | ✅ Ready | Recalculated on demand |
| Parent relationships | ✅ Ready | Can be updated |
| Audit trail | ✅ Ready | All changes logged |
| Approval workflow | ✅ Ready | Guru + family vote |
| Evidence support | ✅ Ready | Document uploads |
| Dispute resolution | ✅ Ready | 3-tier process |
| Multiple changes | ✅ Ready | History tracking |
| Branch mergers | ✅ Ready | Common root handling |

### Key Design Principles Validated

1. **Immutable Identifiers**
   - Person UUIDs never change → relationships preserved
   - Branch IDs stable → external references work

2. **Flexible Metadata**
   - Generation codes recalculated → tree can grow upward
   - Reference codes regenerated → always current

3. **Comprehensive Auditing**
   - Every root change fully documented
   - Complete history preserved
   - Reversion possible (if needed)

4. **Democratic Governance**
   - Family involvement required
   - Evidence-based decisions
   - Dispute resolution built-in

5. **Scalable Architecture**
   - Handles single generation shifts
   - Handles multi-generation discoveries
   - Handles branch mergers
   - Performance optimized

### The Tree Can Evolve! 🌳

Our system supports:
- ✅ Growing **upward** (older ancestors)
- ✅ Growing **sideways** (new siblings/branches discovered)
- ✅ Growing **downward** (new descendants)
- ✅ **Merging** (common ancestors found)
- ✅ **Splitting** (errors corrected)
- ✅ **Multiple iterations** (continuous discovery)

The genealogical journey continues, and our system evolves with it!
