# Identifier System & Access Control

## 1. Multi-Level Identifier System

### Identifier Hierarchy

The system uses multiple identifier types for different purposes:

#### 1.1 Person ID (System Primary Key)

**Format:** `P-{UUID}`

**Example:** `P-a3f2b8c9-4d5e-6f7a-8b9c-0d1e2f3a4b5c`

**Purpose:**
- Immutable database primary key
- Never changes, even if person details change
- Used in all internal system references
- Not displayed to end users

**Generation:** Automatically created on person creation using UUID v4

#### 1.2 Family Branch ID

**Format:** `FB-{CITY_CODE}-{SURNAME}-{SEQ}`

**Examples:**
- `FB-SA-HODZIC-001` (Sarajevo Hodžić family, branch 1)
- `FB-MO-HODZIC-001` (Mostar Hodžić family, branch 1)
- `FB-TZ-MEHMEDOVIC-001` (Tuzla Mehmedović family, branch 1)

**Components:**
- `FB`: Fixed prefix (Family Branch)
- `CITY_CODE`: 2-letter city/region code
- `SURNAME`: Normalized surname (ASCII, uppercase, no diacritics)
- `SEQ`: 3-digit sequential number (001, 002, etc.)

**Purpose:**
- Human-readable branch identification
- Disambiguate families with same surname
- Geographic origin tracking
- Used in UI, URLs, discussions

**City Codes Reference:**
```
SA = Sarajevo          BL = Banja Luka       TZ = Tuzla
MO = Mostar            ZE = Zenica           BI = Bihać
PR = Prijedor          TR = Travnik          CA = Cazin
VI = Visoko            GO = Goražde          FO = Foča
BR = Brčko             TE = Tešanj           GR = Gračanica
DO = Doboj             VG = Visegrád         SR = Srebrenica
```

#### 1.3 Person Reference Code (Human-Readable)

**Format:** `{BRANCH_ID}/{INITIALS}-{BIRTH_YEAR}`

**Examples:**
- `FB-SA-HODZIC-001/AH-1920` (Ahmed Hodžić, born 1920)
- `FB-MO-HODZIC-001/MH-1890` (Mehmed Hodžić, born 1890)

**Purpose:**
- Easy reference in discussions, disputes, emails
- Unique within branch
- Human-friendly
- Visible in audit logs

**Display Format:**
```
Short: AH-1920
Full:  FB-SA-HODZIC-001/AH-1920
```

#### 1.4 Generation Code

**Format:** `G{NUMBER}` (relative to branch root)

**Examples:**
- `G1` = Root ancestor(s)
- `G2` = Children of root
- `G3` = Grandchildren of root
- `G4` = Great-grandchildren, etc.

**Purpose:**
- Tree navigation
- Relationship calculations
- Generation-based filtering
- Statistical analysis

#### 1.5 URL Slug (SEO-Friendly)

**Format:** `{normalized-full-name}-{birth-year}`

**Example:** `ahmed-hodzic-1920`

**Purpose:**
- SEO-friendly URLs
- Shareable links
- Not guaranteed unique (uses Person ID as fallback)

**URL Examples:**
```
/person/ahmed-hodzic-1920
/branch/fb-sa-hodzic-001
/branch/fb-sa-hodzic-001/tree
/branch/fb-sa-hodzic-001/person/ahmed-hodzic-1920
```

### Complete Person Record Example

```json
{
  "system_id": "P-a3f2b8c9-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "branch_id": "FB-SA-HODZIC-001",
  "reference_code": "FB-SA-HODZIC-001/AH-1920",
  "generation": "G2",
  "url_slug": "ahmed-hodzic-1920",

  "full_name": "Ahmed Hodžić",
  "given_name": "Ahmed",
  "surname": "Hodžić",
  "birth_year": 1920,
  "birth_location": "Sarajevo, Bosnia",
  "death_year": 1995,
  "death_location": "Sarajevo, Bosnia",

  "father_id": "P-b4e3c9d0-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "mother_id": "P-c5f4d0e1-6f7a-8b9c-0d1e-2f3a4b5c6d7e",
  "spouse_ids": ["P-d6g5e1f2-7a8b-9c0d-1e2f-3a4b5c6d7e8f"],
  "children_ids": ["P-e7h6f2g3-8b9c-0d1e-2f3a-4b5c6d7e8f9a", "..."],

  "display_name": "Ahmed Hodžić (1920-1995)",
  "quality_score": 85,
  "verification_level": 3
}
```

---

## 2. Family Guru System

### What is a Family Guru?

A **Family Guru** is the guardian/administrator of a family branch. They ensure data quality, approve changes, resolve disputes, and represent the branch in site-wide matters.

### Guru Selection & Appointment

#### Method 1: Branch Founder (Automatic)

When someone creates a new family branch, they automatically become the **Primary Guru**.

**Requirements:**
- Create branch with root ancestor information
- Verify email address
- Provide initial family tree data (minimum 3 people)
- Accept Guru responsibilities agreement

**Verification:**
- Site admin may request identity verification
- May request evidence of family connection
- Phone/video verification for large branches

#### Method 2: Appointed by Current Guru

**Process:**
1. Primary Guru selects trusted family member
2. Invites them to Co-Guru role (max 2 co-gurus)
3. Nominee accepts invitation
4. 14-day notice period to branch members
5. Can be vetoed by 2/3 family vote (if 20+ active members)
6. If no veto, co-guru activated

**Requirements for Nominee:**
- Verified family member (in branch for 3+ months)
- Good contribution history (no disputes)
- Recommended: 10+ approved contributions

#### Method 3: Family Election

**Triggered by:**
- Guru inactive for 6+ months (no logins)
- Guru voluntarily resigns
- Guru removed by site admin (TOS violation)
- Branch has no Guru (orphaned)

**Election Process:**
```
Week 1-2: Nomination Period
  - Any verified member can nominate themselves or others
  - Nominees must accept nomination
  - Nominees post brief statement/qualifications

Week 3-4: Voting Period
  - All verified family members can vote
  - One vote per member
  - Simple plurality wins
  - Minimum 50% of active members must vote
  - Winner needs 60%+ of votes (if not met, runoff)

Week 5: Transition
  - Winner announced
  - 7-day transition period with outgoing Guru (if available)
  - New Guru assumes full responsibilities
```

#### Method 4: Site Admin Intervention (Emergency)

**Only used when:**
- Branch completely orphaned (no active members)
- Guru violating terms of service
- Fraud/abuse detected
- Legal requirement

**Process:**
1. Site admin investigates
2. Temporary admin-appointed Guru assigned
3. Family election scheduled within 30 days
4. Temporary Guru cannot make major decisions

### Guru Responsibilities

#### Daily/Weekly Tasks
- Review and approve pending changes (target: <48 hours)
- Respond to join requests (target: <7 days)
- Monitor quality issues
- Answer family member questions

#### Monthly Tasks
- Review branch quality metrics
- Check for duplicate profiles
- Review audit logs for suspicious activity
- Post branch updates/announcements

#### As Needed
- Resolve disputes (Level 2)
- Approve/deny editor role requests
- Manage branch privacy settings
- Coordinate branch mergers
- Represent branch in cross-branch matters

### Guru Powers & Limitations

#### Can Do (Single Guru Authority)

✅ **Minor Edits Approval:**
- Approve/reject name corrections
- Approve/reject date corrections
- Approve/reject photo uploads
- Approve/reject story submissions

✅ **Member Management:**
- Approve join requests
- Invite new family members
- Grant/revoke Family Editor role
- Remove spam accounts

✅ **Branch Settings:**
- Adjust privacy settings (within limits)
- Set branch description
- Pin important announcements
- Enable/disable features

✅ **Dispute Resolution:**
- Moderate Level 2 disputes
- Request additional evidence
- Make binding decisions (for minor disputes)

#### Requires 2/3 Guru Consensus (if multiple Gurus)

⚠️ **Major Changes:**
- Remove legitimate family members from branch
- Merge with another family branch
- Delete entire person profiles (except duplicates)
- Appoint new Co-Guru
- Change branch to "Private" visibility
- Resolve major disputes (conflicting high-quality evidence)

#### Requires Family Vote (60% approval)

🗳️ **Structural Changes:**
- Split branch into separate families
- Transfer Primary Guru role (involuntarily)
- Change branch origin city/region
- Merge with unrelated family

#### Cannot Do (Site Admin Only)

❌ **Prohibited Actions:**
- Access other family branches without permission
- Override site-wide dispute escalations (Level 3)
- Delete audit logs
- Transfer data to external systems
- Modify system-generated IDs
- Bypass security controls

### Multiple Guru Governance

When a branch has 2-3 Gurus (Primary + Co-Gurus):

**Consensus Requirements:**
```
Action Type                    Votes Required
─────────────────────────────────────────────
Minor approvals                1/3 (any Guru)
Major decisions                2/3 consensus
Critical changes               3/3 unanimous
Emergency actions              1/3 + notify others
```

**Conflict Resolution:**
- If Gurus disagree, initiate family discussion
- If no resolution after 14 days, family vote
- Site admin can mediate if requested

**Primary Guru Privileges:**
- Can appoint co-gurus (with family approval)
- Represents branch in official matters
- Has final say in 2/3 ties (if 2 gurus only)

---

## 3. Joining a Family Branch ("Hook-In" Process)

### Method 1: Invitation by Family Member

#### Process Flow
```
Step 1: Current member clicks "Invite Family Member"
   ↓
Step 2: Enters invitee's email and relationship
   ↓
Step 3: System sends invitation email with unique link
   ↓
Step 4: Invitee clicks link, creates account (or logs in)
   ↓
Step 5: Invitee specifies exact relationship to inviter
   ↓
Step 6: Approval workflow:
   - If invited by Guru/Editor → Auto-approve
   - If invited by regular member → Guru approval required
   ↓
Step 7: New member added to branch
   ↓
Step 8: Welcome email with branch information
```

#### Invitation Data
```json
{
  "invitation_id": "INV-12345",
  "branch_id": "FB-SA-HODZIC-001",
  "inviter_id": "P-abc123",
  "inviter_name": "Nermin Hodžić",
  "invitee_email": "amir@example.com",
  "proposed_relationship": "cousin",
  "invitation_sent": "2025-10-15T10:00:00Z",
  "expires": "2025-11-15T10:00:00Z",
  "status": "pending",
  "unique_token": "a1b2c3d4e5f6g7h8i9j0"
}
```

### Method 2: Search & Join Request

#### Process Flow
```
Step 1: User searches "Hodžić Sarajevo"
   ↓
Step 2: Finds branch FB-SA-HODZIC-001
   ↓
Step 3: Clicks "Request to Join Family"
   ↓
Step 4: Fills out connection form:
   ┌──────────────────────────────────────┐
   │ Your Connection Information          │
   ├──────────────────────────────────────┤
   │ Your Full Name: [_________________]  │
   │ Your Birth Year: [____]              │
   │                                      │
   │ Father's Name: [_________________]   │
   │ Father's Birth Year: [____]          │
   │                                      │
   │ Mother's Maiden Name: [__________]   │
   │ Mother's Birth Year: [____]          │
   │                                      │
   │ Connection Point (if known):         │
   │ "I believe I'm descended from        │
   │  Mehmed Hodžić through his son       │
   │  Ahmed..."                           │
   │ [_________________________________]  │
   │                                      │
   │ Supporting Documents:                │
   │ [Upload Birth Certificate]           │
   │ [Upload Family Photo]                │
   │                                      │
   │ [Submit Request]                     │
   └──────────────────────────────────────┘
   ↓
Step 5: Guru receives notification
   ↓
Step 6: Guru reviews request and can:
   - Approve → specify connection point in tree
   - Request more information
   - Reject with reason
   - Forward to family member for verification
   ↓
Step 7: If approved, user added to branch
```

#### Join Request Data
```json
{
  "request_id": "JR-67890",
  "branch_id": "FB-SA-HODZIC-001",
  "requester_id": "U-def456",
  "requester_name": "Amir Hodžić",
  "requester_birth_year": 1985,
  "father_name": "Hasan Hodžić",
  "father_birth_year": 1960,
  "mother_maiden_name": "Fatima Mehmedović",
  "mother_birth_year": 1962,
  "connection_explanation": "I believe I'm descended from Mehmed...",
  "documents": ["birth-cert-001.pdf", "family-photo.jpg"],
  "submitted": "2025-10-15T14:30:00Z",
  "status": "pending_review",
  "reviewed_by": null,
  "guru_notes": null
}
```

### Method 3: DNA Match Suggestion (Future Feature)

#### Process
1. User uploads DNA results (23andMe, AncestryDNA, etc.)
2. System compares with other users who uploaded DNA
3. Suggests potential family matches with confidence score
4. User sends connection request to suggested branches
5. Guru reviews DNA match data + family connection claim
6. Approval process similar to Method 2

**Privacy Note:** DNA data is opt-in only, never shared without explicit consent

### Method 4: Create New Branch

When a user cannot find their family:

#### Process Flow
```
Step 1: User searches for family, no results
   ↓
Step 2: Clicks "My family isn't listed - Create new branch"
   ↓
Step 3: Fills out branch creation form:
   ┌──────────────────────────────────────┐
   │ New Family Branch Creation           │
   ├──────────────────────────────────────┤
   │ Surname: [HODŽIĆ_____________]       │
   │ Geographic Origin:                   │
   │   City: [Tuzla_______] 🇧🇦           │
   │   Region: [________________]         │
   │                                      │
   │ Root Ancestor Information:           │
   │ Full Name: [Hasan Hodžić_______]     │
   │ Birth Year: [1920] (approx. OK)      │
   │ Birth Place: [Tuzla____________]     │
   │                                      │
   │ Your Connection to Root:             │
   │ [X] I am the root ancestor           │
   │ [ ] I am a direct descendant         │
   │     Relationship: [son/daughter]     │
   │                                      │
   │ Initial Family Members (optional):   │
   │ [+ Add family member]                │
   │                                      │
   │ [Create Branch]                      │
   └──────────────────────────────────────┘
   ↓
Step 4: System checks for potential duplicates:
   ┌──────────────────────────────────────┐
   │ ⚠️  Similar Branch Found              │
   ├──────────────────────────────────────┤
   │ You're creating:                     │
   │ FB-TZ-HODZIC-001                     │
   │ Root: Hasan Hodžić (b.1920, Tuzla)   │
   │                                      │
   │ Similar existing branch:             │
   │ FB-TZ-HODZIC-001 (already exists!)   │
   │ Root: Hasan Hodžić (b.1918, Tuzla)   │
   │                                      │
   │ These might be the same family!      │
   │                                      │
   │ [Review Existing] [Request to Join]  │
   │ [Create Anyway - I'm sure different] │
   └──────────────────────────────────────┘
   ↓
Step 5: If unique (or user confirms different):
   - Create branch with generated ID
   - User becomes Primary Guru
   - Welcome email with Guru responsibilities
   - Onboarding tutorial
```

---

## 4. Verification & Trust Levels

### 6-Level Trust System

#### Level 0: Guest (Public Visitor)
**Permissions:**
- Browse public profiles (deceased persons)
- Search surnames (limited results)
- View public stories
- View diaspora map (aggregated data)

**Cannot:**
- View living persons
- View family-only content
- Comment or interact
- Request to join families

---

#### Level 1: Registered User
**How to achieve:**
- Create account
- Verify email address

**Permissions:**
- All Level 0 permissions, plus:
- Request to join family branches
- Create own user profile
- Search all public branches
- Save favorite profiles/stories

**Cannot:**
- View family-only content (until approved)
- Make any edits
- Vote in disputes

---

#### Level 2: Pending Family Member
**How to achieve:**
- Submit join request to a branch
- Awaiting Guru approval

**Permissions:**
- All Level 1 permissions, plus:
- View branch tree preview (names only, limited details)
- View branch statistics
- Contact Guru with questions

**Cannot:**
- View full profiles
- Suggest edits
- Access photos/documents

---

#### Level 3: Verified Family Member ⭐
**How to achieve:**
- Approved by Family Guru
- Connection verified by at least 1 existing member
- Accepted community guidelines

**Permissions:**
- All Level 2 permissions, plus:
- View full branch tree (all generations)
- View all family-only content
- Suggest edits (requires approval)
- Add photos/stories (requires approval)
- Comment on profiles
- Vote in disputes
- Create own profile within branch
- Invite new members (requires Guru approval)

**Cannot:**
- Make direct edits without approval
- Approve others' changes
- Change branch settings

---

#### Level 4: Trusted Editor ⭐⭐
**How to achieve:**
- Appointed by Family Guru
- Minimum 3 months as Family Member
- Minimum 10 approved contributions
- No disputes or violations
- Guru recommendation

**Permissions:**
- All Level 3 permissions, plus:
- Make auto-approved edits (within scope):
  - Add photos
  - Add stories
  - Minor corrections (typos, dates)
  - Add new family members (with documentation)
- Review other members' suggestions
- Help moderate discussions
- Assist Guru with quality control

**Scope Limitations:**
- Can only edit within assigned generations (e.g., G3-G5)
- Cannot delete profiles
- Cannot resolve disputes
- Major changes still require Guru approval

**Cannot:**
- Approve/deny join requests
- Grant roles to others
- Change branch settings
- Override Guru decisions

---

#### Level 5: Family Guru ⭐⭐⭐
**How to achieve:**
- Branch founder (automatic)
- Appointed by current Guru (with family approval)
- Elected by family vote
- Site admin appointment (emergency only)

**Permissions:**
- All Level 4 permissions, plus:
- Final approval authority on all changes
- Approve/deny join requests
- Grant/revoke Editor roles
- Resolve Level 2 disputes
- Manage branch privacy settings
- Merge/split branches (with consensus)
- Represent branch officially
- Delete duplicate profiles
- Access full audit logs
- Pin announcements

**Limitations:**
- Cannot access other branches without permission
- Cannot override Level 3 dispute decisions
- Major actions require consensus (if multiple Gurus)
- Subject to site-wide policies

---

#### Level 6: Site Roles (Special)

**Site Moderator:**
- Cross-branch dispute resolution
- Level 3 dispute panel member
- Mediate inter-branch conflicts
- Enforce community guidelines
- Cannot access private branch data

**Expert Genealogist:**
- Verify documentary evidence
- Consult on complex disputes
- Certify high-value contributions
- Educational content creation
- Cannot make direct edits without permission

**Site Administrator:**
- Full system access
- Security and maintenance
- Legal compliance
- Emergency interventions
- User support escalation
- Subject to audit and oversight

---

## 5. Privacy & Cross-Branch Visibility

### Branch Privacy Settings

#### Public (Recommended)
✅ Best for diaspora connection

**Visibility:**
- Branch appears in search results
- Public can view deceased persons (died >20 years ago OR born >100 years ago)
- Living persons only visible to family members
- Stories/photos marked "public" are visible
- Contact information always private
- Family discussions private

**Join Requests:**
- Open to anyone
- Guru approval required

---

#### Family Only (Semi-Private)

**Visibility:**
- Branch appears in search, but only name and origin
- Profile details only visible to verified family members
- Public can see "This family branch exists" but no details
- Join requests allowed

**Join Requests:**
- Open, but Guru must approve
- May require more verification

---

#### Private (Invitation Only)

**Visibility:**
- Branch hidden from all searches
- Completely invisible to non-members
- URL access shows "private branch" message

**Join Requests:**
- No public join requests
- Only Guru can invite members via direct email

**Use Cases:**
- Sensitive family situations
- High-profile individuals
- Security concerns
- Temporary privacy during disputes

---

#### Custom (Advanced)

**Per-Generation Visibility:**
- G1-G3: Public
- G4-G5: Family Only
- G6+: Private

**Per-Field Privacy:**
- Hide birth locations (but show country)
- Hide current addresses
- Hide occupations
- Show only birth/death years (not exact dates)

**Use Cases:**
- Partial public presence
- Protect recent generations
- Security for specific individuals

---

## 6. Access Control Examples

### Scenario 1: Public Visitor Views Branch

```
User: Not logged in
Branch: FB-SA-HODZIC-001 (Public)
Action: Views Mehmed Hodžić (b.1890, d.1965)

✅ Can see:
- Name: Mehmed Hodžić
- Birth: 1890, Sarajevo
- Death: 1965, Sarajevo
- Father: Ibrahim Hodžić (name only)
- Mother: Fatima (name only)
- Spouse: Amira (name only)
- Children: 3 children (names only)
- Public stories about Mehmed

❌ Cannot see:
- Detailed life story (family-only)
- Photos (family-only)
- Contact info of living descendants
- Living descendants' details
- Family discussions
```

### Scenario 2: Family Member Suggests Edit

```
User: Nermin H. (Level 3 - Verified Family Member)
Branch: FB-SA-HODZIC-001
Action: Suggests changing Ahmed's birth year

Workflow:
1. Nermin clicks "Edit" on Ahmed's profile
2. Changes birth year from 1918 to 1920
3. Adds reason: "Found birth certificate"
4. Uploads birth certificate scan
5. Submits change

System:
- Change marked "Pending Approval"
- Notification sent to Guru
- Ahmed's profile shows pending change badge (to family)
- Audit log entry created

Guru (Lejla):
- Reviews change and evidence
- Can: Approve, Reject, Request more info, Flag as dispute
- Approves change
- System updates profile
- Nermin gets notification "Your change was approved"
```

### Scenario 3: Editor Makes Auto-Approved Edit

```
User: Amir H. (Level 4 - Trusted Editor, scope: G3-G5)
Branch: FB-SA-HODZIC-001
Action: Adds photo to Nermin (G4)

Workflow:
1. Amir uploads photo to Nermin's profile (G4)
2. Adds caption: "Nermin in Chicago, 2010"
3. Tags Nermin
4. Submits

System:
- ✅ Auto-approved (within scope, minor change)
- Photo immediately visible
- Audit log entry: "Auto-approved by Editor"
- Guru gets daily digest notification

If Amir tries to edit Mehmed (G1):
- ❌ Blocked (outside scope G3-G5)
- Message: "You can only edit generations G3-G5. Request Guru approval for this change."
```

This completes the identifier and access control system documentation!
