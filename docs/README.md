# Pustikorijen - Documentation

> **Pustikorijen** (meaning "roots" in Bosnian) - A family genealogy platform connecting Bosnian diaspora with their homeland.

## Documentation Index

This folder contains comprehensive design and planning documentation for the Pustikorijen project, created during the initial brainstorming phase.

### 📋 Documents

1. **[01-project-overview.md](./01-project-overview.md)**
   - Project vision and goals
   - Target users (homeland & diaspora)
   - Key differentiators
   - Project phases (MVP to full platform)
   - Success metrics

2. **[02-ui-mockups.md](./02-ui-mockups.md)**
   - ASCII wireframe mockups for all major views
   - Homepage/landing page
   - Interactive family tree view
   - Person profile view
   - Diaspora map view
   - Stories/community feed
   - Design principles and color schemes

3. **[03-core-features.md](./03-core-features.md)**
   - Detailed feature specifications
   - Phase 1: Foundation (MVP)
     - Family tree builder
     - User management
     - Search & discovery
     - Basic location tracking
   - Phase 2: Diaspora Connection
     - Interactive diaspora map
     - Stories & memories
     - Multilingual support
   - Phase 3: Community Growth
     - Events & reunions
     - Document archive
     - DNA/heritage integration

4. **[04-governance-system.md](./04-governance-system.md)**
   - Comprehensive audit system
   - Quality management & metrics
   - 3-tier dispute resolution process
   - Family branch management
   - Role-based access control (RBAC)
   - Privacy & data protection (GDPR)

5. **[05-identifier-access-control.md](./05-identifier-access-control.md)**
   - Multi-level identifier system
     - Person IDs (UUID)
     - Branch IDs (FB-CITY-SURNAME-SEQ)
     - Reference codes
     - Generation tracking
   - Family Guru governance model
   - Joining/hook-in processes
   - 6-level trust/verification system
   - Privacy settings & cross-branch visibility

6. **[06-tree-evolution-system.md](./06-tree-evolution-system.md)**
   - Root ancestor change workflow
   - Discovering older ancestors over time
   - Generation shifting mechanism
   - Multiple root changes (tree evolution)
   - Branch merger scenarios
   - Disputed root changes
   - Database schema for evolution
   - Complete audit trail system

7. **[07-technical-architecture.md](./07-technical-architecture.md)**
   - Modular monolith architecture
   - Technology stack proposal (Node.js/React)
   - Complete database schema (PostgreSQL)
   - RESTful API design
   - Deployment architecture
   - Security measures
   - Performance optimization
   - Monitoring & logging
   - Development workflow & CI/CD

8. **[08-implementation-roadmap.md](./08-implementation-roadmap.md)** ⭐
   - Precise task breakdown (50+ GitHub issues)
   - Phase-by-phase implementation plan
   - GitHub project management structure
   - Issue templates and workflows
   - Continuity checklist for developers/AI
   - Context preservation strategy

## Quick Reference

### Key Concepts

**Family Branch**: A distinct family lineage with the same surname, identified by geographic origin
- Format: `FB-SA-HODZIC-001` (Sarajevo Hodžić family, branch 1)
- Allows multiple unrelated families with same surname to coexist

**Family Guru**: Guardian/administrator of a family branch
- 1-3 Gurus per branch
- Elected or appointed
- Responsible for data quality and dispute resolution

**Verification Levels**:
- ⭐ Unverified (user input)
- ⭐⭐ Community verified (2+ confirmations)
- ⭐⭐⭐ Document verified (certificates)
- ⭐⭐⭐⭐ Expert verified (genealogist)
- ⭐⭐⭐⭐⭐ Multi-source verified (3+ sources)

**Dispute Resolution**:
- Level 1: Family Discussion (7 days)
- Level 2: Family Guru Review (7 days)
- Level 3: Admin/Genealogist Panel (15 days)

### Trust Levels

| Level | Role | Key Permissions |
|-------|------|-----------------|
| 0 | Guest | View public profiles only |
| 1 | Registered User | Request to join branches |
| 2 | Pending Member | Preview branch tree |
| 3 | Verified Family Member ⭐ | Suggest edits, vote, comment |
| 4 | Trusted Editor ⭐⭐ | Make auto-approved edits |
| 5 | Family Guru ⭐⭐⭐ | Final approval authority |
| 6 | Site Admin/Expert | System-wide authority |

## Design Principles

1. **Cultural Sensitivity**
   - Respect Bosnian naming conventions
   - Religious diversity awareness
   - War displacement sensitivity

2. **Privacy First**
   - Living persons protected by default
   - Granular privacy controls
   - GDPR compliant

3. **Data Quality**
   - Comprehensive audit trails
   - Source documentation required
   - Dispute resolution mechanisms

4. **Diaspora Connection**
   - Multilingual interface (BSC, English, German)
   - Geographic visualization
   - Stories and memories sharing

5. **Scalability**
   - Start with single city
   - Expand to regional/national
   - Bridge to global diaspora

## Project Status

**Phase:** Design & Architecture Complete ✅

**Completed:**
- ✅ Project vision and feature specification
- ✅ UI/UX design (ASCII mockups)
- ✅ Governance system design
- ✅ Identity & access control system
- ✅ Tree evolution system
- ✅ Technical architecture proposal
- ✅ Database schema design
- ✅ API design
- ✅ Technology stack selection

**Next Steps:**
- [ ] Project initialization & setup
- [ ] Development environment configuration
- [ ] Backend implementation (MVP)
- [ ] Frontend implementation (MVP)
- [ ] Testing & deployment

## Contact & Collaboration

This is an open documentation project. Contributions and feedback welcome!

---

*Documentation created: October 2025*
*Last updated: October 2025*
