# Governance & Quality Management System

## 1. Audit System

### Complete Change History

Every modification to the family tree is tracked with the following information:

#### Audit Log Entry Structure
```
{
  "audit_id": "AUD-12345",
  "timestamp": "2025-10-15T14:32:00Z",
  "user_id": "U-abc123",
  "user_name": "Nermin Hodžić",
  "user_location": "Chicago, USA",
  "action_type": "UPDATE",
  "entity_type": "PERSON",
  "entity_id": "P-xyz789",
  "field_changed": "birth_year",
  "old_value": "1918",
  "new_value": "1920",
  "source_documentation": "birth-certificate-001.pdf",
  "source_type": "OFFICIAL_DOCUMENT",
  "reason": "Found original birth certificate with correct date",
  "verification_status": "DISPUTED",
  "disputed_by": ["U-def456"],
  "approved_by": [],
  "quality_score": 85
}
```

### Audit Features

#### Change Tracking
- Who made the change
- What was changed (field-level granularity)
- When it was changed
- Why it was changed (reason/justification)
- Source of information (document, testimony, etc.)
- IP address and location (security)

#### Reversion Capability
- Revert individual changes
- Revert to specific point in time
- Approval workflow for reversions
- Maintain reversion history

#### Audit Search & Filtering
- Filter by user
- Filter by date range
- Filter by field type
- Filter by verification status
- Filter by dispute status
- Export audit logs

### Source Documentation

#### Document Types
- Official certificates (birth, death, marriage)
- Census records
- Military records
- Photos with date stamps
- Historical documents
- Family testimony
- DNA evidence
- Published genealogies

#### Source Quality Levels
- **Level 5:** Official government documents
- **Level 4:** Church/religious records
- **Level 3:** Published genealogies
- **Level 2:** Family documents (photos, letters)
- **Level 1:** Oral testimony

---

## 2. Quality Management System

### Quality Metrics Dashboard

#### Branch Quality Score (0-100)

Calculated based on:
- **Completeness (40%):** Percentage of required fields filled
- **Verification (30%):** Percentage of verified data points
- **Documentation (20%):** Percentage of claims with sources
- **Accuracy (10%):** Low dispute rate, high consensus

#### Profile Quality Indicators

**5-Star Rating System:**
- ⭐ Unverified (user input only, no sources)
- ⭐⭐ Community verified (2+ family members confirm)
- ⭐⭐⭐ Document verified (official documents provided)
- ⭐⭐⭐⭐ Expert verified (genealogist reviewed)
- ⭐⭐⭐⭐⭐ Multi-source verified (3+ independent sources)

### Data Quality Issues

#### Automated Detection

**Missing Data:**
- Missing birth years
- Missing birth locations
- Missing parent connections
- Missing photos
- Incomplete profiles (<50% fields)

**Data Conflicts:**
- Birth date after death date
- Parent younger than child
- Marriage before birth
- Duplicate person detection
- Conflicting sources

**Inconsistencies:**
- Name spelling variations
- Location name changes
- Date format inconsistencies
- Relationship loops/errors

### AI-Powered Suggestions

#### Duplicate Detection
```
Suggestion #1 (Confidence: 95%)
"Mehmed Hodžić (b.1890, Sarajevo)" might be the same person as
"Meho Hodžić (b.1890, Sarajevo)"

Similarities:
- Same birth year and location
- Same generation in family tree
- 2 family members mention both names
- Common nickname pattern (Mehmed → Meho)

Actions:
[Review Details] [Merge Profiles] [Mark as Different People]
```

#### Missing Connection Suggestions
```
Suggestion #2 (Confidence: 78%)
"Ahmed Hodžić" and "Hasan Hodžić" might be brothers

Evidence:
- Same parents (Mehmed & Fatima)
- Similar birth years (1920, 1925)
- Both from Sarajevo
- Multiple family stories mention them together

Actions:
[Add Sibling Relationship] [Request Verification] [Dismiss]
```

### Quality Improvement Workflows

#### Verification Queue
- Pending changes awaiting approval
- New profiles requiring verification
- Disputed information needing resolution
- Documents needing review

#### Gamification (Optional)
- Contribution points
- Quality badges
- Recognition for verified contributions
- Leaderboards (monthly contributors)

---

## 3. Dispute Resolution System

### Three-Tier Resolution Process

### Level 1: Family Discussion (Days 1-7)

#### Initiation
- Any verified family member can raise a dispute
- Must provide specific claim and counter-claim
- Must include evidence (if available)

#### Process
1. Dispute automatically posted to branch discussion
2. Email notifications sent to:
   - All Family Gurus
   - All Family Editors
   - Person who made the original change
   - Direct relatives of affected person
3. Open comment period (7 days)
4. Evidence submission period
5. Family member voting (optional)

#### Resolution
- **Auto-resolve:** If 75% consensus reached
- **Guru decision:** If clear evidence presented
- **Escalate:** If no consensus after 7 days

### Level 2: Family Moderator Review (Days 8-14)

#### Assignment
- Assigned to Family Guru (or Co-Guru if conflict of interest)
- Guru reviews all evidence and discussion
- Can request additional documentation
- Can consult with family elders

#### Process
1. Guru evaluates evidence quality using source hierarchy
2. Guru makes preliminary recommendation
3. 5-day comment period for objections
4. Guru makes final decision

#### Powers
- Accept one version as correct
- Mark both versions as "disputed" (no consensus)
- Request expert genealogist review (escalate to Level 3)
- Lock field from further changes

#### Binding Authority
- Decision is binding for minor disputes (single field, clear evidence)
- Can be appealed to Level 3 within 7 days

### Level 3: Admin/Genealogist Panel (Days 15-30)

#### Escalation Triggers
- Appeal from Level 2 decision
- High-impact dispute (affects multiple people/branches)
- Cross-branch conflict
- Suspected fraud or malicious activity

#### Panel Composition
- 3-5 site administrators
- 1-2 expert genealogists (if needed)
- Independent (not from involved branches)

#### Process
1. Document verification (authenticity check)
2. Cross-reference with external sources
3. Historical context research
4. Expert genealogist consultation
5. Panel discussion and majority vote

#### Final Decision
- **Binding and permanent**
- Cannot be appealed
- Documented with full reasoning
- Published to both branches

### Resolution Actions

#### Data Updates
- Update profile with verified data
- Add source documentation reference
- Mark field as "verified" or "disputed"
- Update quality score

#### Field Locking
- Lock disputed field (prevent changes without admin approval)
- Add "under dispute" badge visible to family
- Maintain all versions in history

#### Conflict Documentation
```
DISPUTE RESOLUTION RECORD
Dispute ID: DSP-00045
Person: Ahmed Hodžić (P-xyz789)
Field: birth_year
Claim 1: 1918 (by Lejla H.)
Claim 2: 1920 (by Nermin H.)

Resolution: CLAIM 2 ACCEPTED
Decided by: Level 2 - Family Guru
Date: 2025-10-22
Reasoning: Birth certificate provided by Nermin H. is official
government document (Quality Level 5), while Lejla's census
record shows age as "3 years" in 1921, which could be approximate.

Evidence Review:
- Birth Certificate (1920) - Quality: 5/5
- Census Record (implies 1918) - Quality: 3/5
- Family testimony: 2 sources for 1920, 1 source for 1918

Final Value: 1920
Status: VERIFIED ⭐⭐⭐
Field Locked: Yes (admin approval required for changes)
```

---

## 4. Family Branch Management

### Branch Disambiguation

#### Branch Identification System

**Branch ID Format:** `FB-{CITY_CODE}-{SURNAME}-{SEQ}`

Examples:
- FB-SA-HODZIC-001 (Sarajevo Hodžić, Branch 1)
- FB-SA-HODZIC-002 (Sarajevo Hodžić, Branch 2 - different family)
- FB-MO-HODZIC-001 (Mostar Hodžić, Branch 1)
- FB-TZ-HODZIC-001 (Tuzla Hodžić, Branch 1)

#### City Codes (Bosnia)
- SA = Sarajevo
- MO = Mostar
- TZ = Tuzla
- BL = Banja Luka
- ZE = Zenica
- BI = Bihać
- PR = Prijedor
- TR = Travnik
- etc.

### Branch Creation

#### Requirements
- Unique root ancestor (name + birth year + location)
- Geographic origin specified
- Minimum initial data (root ancestor + 1 descendant)
- Creator becomes initial Family Guru

#### Duplicate Prevention
```
WARNING: Similar Branch Detected

You're creating: FB-SA-HODZIC-003
Root ancestor: Mehmed Hodžić (b.1890, Sarajevo)

Similar existing branch: FB-SA-HODZIC-001
Root ancestor: Mehmed Hodžić (b.1890, Sarajevo)

These might be the same family!

Actions:
[Review Existing Branch] [Request to Join] [Create Anyway]
```

### Branch Merging

#### Merge Request Process
1. Guru of Branch A requests merge with Branch B
2. Guru of Branch B receives notification
3. Both Gurus review proposed connection point
4. Evidence review period (14 days)
5. Both Gurus must approve (2/2 required)
6. Family members notified (7-day objection period)
7. Merge executed (automated + manual review)

#### Merge Actions
- Combine family trees at connection point
- Merge duplicate person profiles
- Combine photo albums
- Merge stories and memories
- Update all person IDs and references
- Create audit trail of merge
- Notify all affected members

### Branch Splitting

#### Split Scenarios
- Branch too large (500+ people)
- Geographic subdivision (Sarajevo → subdivide by mahala)
- Identified incorrect merger
- Different family lines discovered

#### Split Process
1. Family vote required (60% approval)
2. Identify split point in tree
3. Assign people to new branches
4. Duplicate shared ancestors (root to split point)
5. Assign Gurus to each new branch
6. Maintain cross-references

---

## 5. Role-Based Access Control

### Role Hierarchy

```
┌─────────────────────────────────────────────┐
│ Site Administrator                          │ (Super admin)
├─────────────────────────────────────────────┤
│ Expert Genealogist                          │ (Verification authority)
├─────────────────────────────────────────────┤
│ Site Moderator                              │ (Cross-branch disputes)
├─────────────────────────────────────────────┤
│ Family Guru ⭐⭐⭐                            │ (Branch guardian)
├─────────────────────────────────────────────┤
│ Family Editor ⭐⭐                           │ (Trusted contributor)
├─────────────────────────────────────────────┤
│ Verified Family Member ⭐                   │ (Can suggest)
├─────────────────────────────────────────────┤
│ Registered User                             │ (Can view, request join)
├─────────────────────────────────────────────┤
│ Guest/Public                                │ (Limited view)
└─────────────────────────────────────────────┘
```

### Permission Matrix

| Action | Guest | Registered | Family Member | Editor | Guru | Site Admin |
|--------|-------|------------|---------------|--------|------|------------|
| View public profiles | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View family-only profiles | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Search all branches | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Suggest edits | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Make direct edits | ✗ | ✗ | ✗ | ✓* | ✓ | ✓ |
| Approve changes | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Invite members | ✗ | ✗ | ✓** | ✓ | ✓ | ✓ |
| Grant editor role | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Resolve disputes L1 | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |
| Resolve disputes L2 | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Resolve disputes L3 | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Merge branches | ✗ | ✗ | ✗ | ✗ | ✓*** | ✓ |
| Delete profiles | ✗ | ✗ | ✗ | ✗ | ✓*** | ✓ |
| Access audit logs | ✗ | ✗ | ✓**** | ✓ | ✓ | ✓ |
| Manage site settings | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

*Editor: Auto-approved for minor edits, requires Guru approval for major changes
**Family Member: Invitations require Guru approval
***Guru: Requires 2/3 Guru consensus or family vote
****Family Member: Can view audit log for profiles they have access to

---

## 6. Privacy & Data Protection

### Privacy Levels

#### Profile Visibility Settings
- **Public:** Visible to everyone (internet search engines)
- **Registered Users:** Visible to all logged-in users
- **Family Only:** Visible only to verified branch members
- **Private:** Visible only to Gurus and the person themselves

#### Automatic Privacy Rules
- Living persons (born < 100 years ago): Default to Family Only
- Deceased persons: Default to Public
- Children (< 18 years): Default to Family Only
- Contact information: Always private

### GDPR Compliance

#### User Rights
- Right to access (download all your data)
- Right to rectification (correct your information)
- Right to erasure ("right to be forgotten")
- Right to data portability
- Right to object to processing

#### Data Retention
- Active profiles: Retained indefinitely
- Deleted accounts: Personal data removed after 30 days
- Audit logs: Retained for 7 years (compliance)
- Photos: Deleted with profile (unless shared by others)

### Security Measures

#### Access Control
- Role-based permissions
- Two-factor authentication (optional)
- Session timeout (30 minutes inactivity)
- IP-based rate limiting

#### Data Protection
- Encryption at rest (database)
- Encryption in transit (HTTPS/TLS)
- Regular security audits
- Penetration testing (annually)
- Secure password storage (bcrypt/Argon2)

#### Audit & Monitoring
- Login attempt logging
- Failed authentication alerts
- Suspicious activity detection
- Admin action logging
- Regular backup (daily)
