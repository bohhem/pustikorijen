# Implementation Roadmap & Task Management

## Overview

This document provides a precise, step-by-step implementation roadmap for Pustikorijen. It's designed to allow **any developer or AI assistant** to pick up work at any point without starting from scratch.

**Project Management:** GitHub Issues, GitHub Projects, and GitHub Milestones

---

## GitHub Project Management Structure

### Repository Setup

```
Repository: pustikorijen/pustikorijen
Structure: Monorepo

Branches:
- main (production)
- staging (pre-production)
- develop (active development)
- feature/* (feature branches)
- bugfix/* (bug fixes)
- hotfix/* (production hotfixes)
```

### GitHub Projects Board

**Project Name:** Pustikorijen MVP Development

**Columns:**
1. **📋 Backlog** - All planned work
2. **🎯 Ready** - Ready to start (no blockers)
3. **🚧 In Progress** - Currently being worked on
4. **👀 In Review** - Code review/testing
5. **✅ Done** - Completed and merged

**Labels:**
- `priority: critical` 🔴
- `priority: high` 🟠
- `priority: medium` 🟡
- `priority: low` 🟢
- `type: feature` - New feature
- `type: bug` - Bug fix
- `type: docs` - Documentation
- `type: refactor` - Code refactoring
- `type: test` - Testing
- `area: backend` - Backend work
- `area: frontend` - Frontend work
- `area: database` - Database work
- `area: devops` - DevOps/Infrastructure
- `status: blocked` - Blocked by dependency
- `good first issue` - Good for newcomers

---

## Implementation Phases

### Phase 0: Project Setup (Week 1)

**Goal:** Create development environment and project structure

**Milestone:** `v0.1-project-setup`

#### Issue #1: Initialize Project Repository
**Labels:** `priority: critical`, `type: setup`, `area: devops`

**Description:**
Set up Git repository with proper structure and initial configuration.

**Tasks:**
- [ ] Initialize Git repository in `/home/bohhem/Workspace/pustikorijen`
- [ ] Create `.gitignore` file (Node.js, Python, IDEs, OS files)
- [ ] Create `README.md` with project description
- [ ] Create `LICENSE` file (choose license)
- [ ] Create `CONTRIBUTING.md` guidelines
- [ ] Create `.editorconfig` for consistent formatting
- [ ] Create `.nvmrc` or `.node-version` file (Node.js 20)
- [ ] Push to GitHub repository

**Acceptance Criteria:**
- Repository is initialized with all config files
- `.gitignore` excludes node_modules, .env, dist, etc.
- README.md contains project description and setup instructions
- Repository is pushed to GitHub

**Files to Create:**
```
/home/bohhem/Workspace/pustikorijen/
├── .gitignore
├── .editorconfig
├── .nvmrc
├── README.md
├── LICENSE
└── CONTRIBUTING.md
```

---

#### Issue #2: Create Project Folder Structure
**Labels:** `priority: critical`, `type: setup`, `area: devops`

**Description:**
Create monorepo folder structure for backend, frontend, and shared code.

**Tasks:**
- [ ] Create `backend/` directory
- [ ] Create `frontend/` directory
- [ ] Create `docs/` directory (move existing docs)
- [ ] Create `scripts/` directory (deployment, utilities)
- [ ] Create `docker/` directory (Dockerfiles, compose files)
- [ ] Create root `package.json` for workspace management
- [ ] Document folder structure in README.md

**Acceptance Criteria:**
- All directories created
- Root `package.json` configured for workspace
- README.md documents folder structure

**Expected Structure:**
```
pustikorijen/
├── backend/               # Backend application
│   ├── src/
│   ├── prisma/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── frontend/              # Frontend application
│   ├── src/
│   ├── public/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── docs/                  # Documentation (existing)
│   ├── README.md
│   ├── 01-project-overview.md
│   └── ...
├── docker/                # Docker configurations
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   └── Dockerfile.*
├── scripts/               # Utility scripts
│   ├── setup-dev.sh
│   ├── deploy.sh
│   └── seed-db.sh
├── .github/               # GitHub workflows
│   ├── workflows/
│   └── ISSUE_TEMPLATE/
├── package.json           # Root workspace config
└── README.md
```

---

#### Issue #3: Set Up Development Environment (Docker)
**Labels:** `priority: critical`, `type: setup`, `area: devops`

**Description:**
Create Docker Compose configuration for local development with all services.

**Tasks:**
- [ ] Create `docker/docker-compose.dev.yml`
- [ ] Add PostgreSQL service (version 15)
- [ ] Add Redis service (version 7)
- [ ] Add MinIO service (S3-compatible storage)
- [ ] Add MailHog service (email testing)
- [ ] Create `.env.example` file
- [ ] Write setup documentation
- [ ] Test: `docker-compose up` works

**Acceptance Criteria:**
- `docker-compose.dev.yml` starts all services
- Services are accessible on documented ports
- `.env.example` contains all required variables
- Setup documentation is clear

**File:** `docker/docker-compose.dev.yml`

---

#### Issue #4: Initialize Backend Project
**Labels:** `priority: critical`, `type: setup`, `area: backend`

**Description:**
Initialize Node.js backend project with TypeScript and dependencies.

**Tasks:**
- [ ] `cd backend && npm init -y`
- [ ] Install TypeScript and Node.js types
- [ ] Install Express.js and types
- [ ] Install Prisma ORM
- [ ] Install development dependencies (tsx, ts-node-dev, eslint, prettier)
- [ ] Create `tsconfig.json`
- [ ] Create `.eslintrc.json` and `.prettierrc`
- [ ] Create basic folder structure (src/, tests/)
- [ ] Create `src/index.ts` with Hello World server
- [ ] Test: `npm run dev` starts server

**Acceptance Criteria:**
- `npm install` succeeds
- TypeScript compiles without errors
- Dev server starts on port 5000
- ESLint and Prettier configured

**File:** `backend/package.json`

---

#### Issue #5: Initialize Frontend Project
**Labels:** `priority: critical`, `type: setup`, `area: frontend`

**Description:**
Initialize React frontend project with Vite and TypeScript.

**Tasks:**
- [ ] `cd frontend && npm create vite@latest . -- --template react-ts`
- [ ] Install Tailwind CSS and PostCSS
- [ ] Install shadcn/ui dependencies (@radix-ui)
- [ ] Install React Router, React Query, Zustand
- [ ] Install D3.js for tree visualization
- [ ] Configure Tailwind CSS
- [ ] Create basic folder structure (components/, pages/, lib/, hooks/)
- [ ] Create initial routing structure
- [ ] Test: `npm run dev` starts dev server
- [ ] Test: Build process (`npm run build`) works

**Acceptance Criteria:**
- Vite dev server runs on port 3000
- Tailwind CSS works
- TypeScript compiles without errors
- Initial routing works

**File:** `frontend/package.json`

---

#### Issue #6: Set Up Prisma Schema
**Labels:** `priority: critical`, `type: setup`, `area: database`

**Description:**
Create Prisma schema with all database tables from architecture document.

**Tasks:**
- [ ] `cd backend && npx prisma init`
- [ ] Create `schema.prisma` with all tables (see 07-technical-architecture.md)
- [ ] Define `users` table
- [ ] Define `family_branches` table
- [ ] Define `persons` table
- [ ] Define `relationships` table
- [ ] Define `branch_members` table
- [ ] Define `audit_log` table
- [ ] Define `disputes` table
- [ ] Define `root_change_proposals` table
- [ ] Define `stories` table
- [ ] Define `documents` table
- [ ] Define `notifications` table
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Test: Database tables created successfully

**Acceptance Criteria:**
- All 11 tables defined in schema
- Prisma Client generated
- Migration succeeds
- Can query database with Prisma

**File:** `backend/prisma/schema.prisma`

---

#### Issue #7: Create GitHub Project Board
**Labels:** `priority: high`, `type: setup`, `area: devops`

**Description:**
Set up GitHub Projects board for task management.

**Tasks:**
- [ ] Create new GitHub Project (Projects tab)
- [ ] Set up board columns (Backlog, Ready, In Progress, Review, Done)
- [ ] Create labels (priority, type, area)
- [ ] Create issue templates (.github/ISSUE_TEMPLATE/)
  - Feature request template
  - Bug report template
  - Task template
- [ ] Create pull request template
- [ ] Create milestones for each phase
- [ ] Document project management workflow

**Acceptance Criteria:**
- Project board is created and configured
- Issue templates work
- Milestones created for v0.1, v0.2, v1.0

**Files:** `.github/ISSUE_TEMPLATE/*.md`, `.github/pull_request_template.md`

---

#### Issue #8: Write Development Guide
**Labels:** `priority: high`, `type: docs`, `area: docs`

**Description:**
Create comprehensive development guide for onboarding new developers or AI assistants.

**Tasks:**
- [ ] Create `docs/DEVELOPMENT.md`
- [ ] Document prerequisites (Node.js, Docker, etc.)
- [ ] Document setup steps (clone, install, docker-compose)
- [ ] Document npm scripts (dev, build, test)
- [ ] Document database operations (migrate, seed, reset)
- [ ] Document code style and conventions
- [ ] Document branching strategy
- [ ] Document commit message format
- [ ] Document pull request process
- [ ] Document testing approach
- [ ] Create troubleshooting section

**Acceptance Criteria:**
- New developer can follow guide to set up environment
- All common operations documented
- Troubleshooting section covers common issues

**File:** `docs/DEVELOPMENT.md`

---

#### Issue #9: Set Up CI/CD Pipeline
**Labels:** `priority: medium`, `type: setup`, `area: devops`

**Description:**
Create GitHub Actions workflows for automated testing and deployment.

**Tasks:**
- [ ] Create `.github/workflows/ci.yml`
- [ ] Configure linting job (ESLint)
- [ ] Configure type checking job (TypeScript)
- [ ] Configure test job (Jest/Vitest)
- [ ] Configure build job (backend + frontend)
- [ ] Create `.github/workflows/deploy-staging.yml`
- [ ] Create `.github/workflows/deploy-production.yml`
- [ ] Test: CI runs on pull requests
- [ ] Test: Failing tests block merge

**Acceptance Criteria:**
- CI runs on every pull request
- All jobs pass for main branch
- Failed tests block PR merge
- Deployment workflows configured (not yet active)

**Files:** `.github/workflows/*.yml`

---

#### Issue #10: Create Seed Data Script
**Labels:** `priority: medium`, `type: setup`, `area: database`

**Description:**
Create script to populate database with sample data for development.

**Tasks:**
- [ ] Create `backend/prisma/seed.ts`
- [ ] Create sample users (3-5)
- [ ] Create sample family branches (2-3)
- [ ] Create sample persons (20-30)
- [ ] Create sample relationships
- [ ] Create sample stories (5-10)
- [ ] Create sample documents
- [ ] Add seed script to package.json
- [ ] Test: `npm run seed` populates database
- [ ] Document seed data in DEVELOPMENT.md

**Acceptance Criteria:**
- Seed script runs successfully
- Database populated with realistic data
- Different user roles represented
- Family trees have multiple generations

**File:** `backend/prisma/seed.ts`

---

### Phase 1: Authentication & User Management (Week 2)

**Goal:** Implement user registration, login, and profile management

**Milestone:** `v0.2-auth`

#### Issue #11: Design Authentication API
**Labels:** `priority: critical`, `type: feature`, `area: backend`

**Description:**
Define authentication API endpoints and data flow.

**Tasks:**
- [ ] Define authentication endpoints (register, login, refresh, logout)
- [ ] Design JWT token structure (access + refresh tokens)
- [ ] Define user session management strategy
- [ ] Create API documentation (OpenAPI/Swagger)
- [ ] Define error responses
- [ ] Define rate limiting strategy

**Acceptance Criteria:**
- API endpoints documented
- Token flow diagram created
- Security measures defined

**Deliverable:** `docs/api/authentication.md`

---

#### Issue #12: Implement User Registration
**Labels:** `priority: critical`, `type: feature`, `area: backend`

**Description:**
Implement user registration with email verification.

**Tasks:**
- [ ] Create `POST /api/auth/register` endpoint
- [ ] Validate email format (Zod schema)
- [ ] Hash password with bcrypt
- [ ] Generate email verification token
- [ ] Save user to database (Prisma)
- [ ] Send verification email
- [ ] Implement `GET /api/auth/verify-email/:token`
- [ ] Write tests (Jest/Supertest)
- [ ] Handle duplicate email errors
- [ ] Add rate limiting

**Acceptance Criteria:**
- User can register with email and password
- Verification email sent
- Password is hashed (never stored plain)
- Tests pass (unit + integration)
- Duplicate emails rejected

**Files:**
- `backend/src/routes/auth.routes.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/services/auth.service.ts`
- `backend/tests/auth.test.ts`

---

#### Issue #13: Implement User Login
**Labels:** `priority: critical`, `type: feature`, `area: backend`

**Description:**
Implement login with JWT token generation.

**Tasks:**
- [ ] Create `POST /api/auth/login` endpoint
- [ ] Validate credentials
- [ ] Check if email is verified
- [ ] Generate access token (15 min expiry)
- [ ] Generate refresh token (7 day expiry)
- [ ] Save refresh token to database or Redis
- [ ] Return tokens + user info
- [ ] Write tests
- [ ] Handle failed login attempts (rate limiting)

**Acceptance Criteria:**
- User can login with email and password
- Access + refresh tokens generated
- Unverified users cannot login
- Tests pass

**Files:**
- `backend/src/controllers/auth.controller.ts`
- `backend/src/services/auth.service.ts`
- `backend/src/utils/jwt.ts`

---

#### Issue #14: Implement Token Refresh
**Labels:** `priority: high`, `type: feature`, `area: backend`

**Description:**
Implement refresh token flow for seamless authentication.

**Tasks:**
- [ ] Create `POST /api/auth/refresh` endpoint
- [ ] Validate refresh token
- [ ] Check if token is revoked
- [ ] Generate new access token
- [ ] Optionally rotate refresh token
- [ ] Write tests
- [ ] Handle expired refresh tokens

**Acceptance Criteria:**
- Access token can be refreshed
- Expired/invalid tokens rejected
- Tests pass

---

#### Issue #15: Implement Password Reset
**Labels:** `priority: medium`, `type: feature`, `area: backend`

**Description:**
Implement forgot password and reset password flow.

**Tasks:**
- [ ] Create `POST /api/auth/forgot-password` endpoint
- [ ] Generate reset token (expires in 1 hour)
- [ ] Send password reset email
- [ ] Create `POST /api/auth/reset-password` endpoint
- [ ] Validate reset token
- [ ] Update password (hashed)
- [ ] Invalidate reset token
- [ ] Write tests

**Acceptance Criteria:**
- User can request password reset
- Reset email sent with token
- Password can be reset with valid token
- Tests pass

---

#### Issue #16: Create Authentication Middleware
**Labels:** `priority: critical`, `type: feature`, `area: backend`

**Description:**
Create middleware to protect routes requiring authentication.

**Tasks:**
- [ ] Create `auth.middleware.ts`
- [ ] Verify JWT access token
- [ ] Attach user to request object
- [ ] Handle expired tokens
- [ ] Handle missing tokens
- [ ] Create role-based middleware (optional: for later)
- [ ] Write tests

**Acceptance Criteria:**
- Protected routes require valid token
- User object available in controllers
- Expired tokens rejected
- Tests pass

**File:** `backend/src/middleware/auth.middleware.ts`

---

#### Issue #17: Build Registration Page (Frontend)
**Labels:** `priority: critical`, `type: feature`, `area: frontend`

**Description:**
Create user registration page with form validation.

**Tasks:**
- [ ] Create `pages/Register.tsx`
- [ ] Create registration form (React Hook Form + Zod)
- [ ] Implement form validation (email, password strength)
- [ ] Connect to API (`POST /api/auth/register`)
- [ ] Show success message (check email)
- [ ] Show error messages
- [ ] Add loading state
- [ ] Write tests (React Testing Library)

**Acceptance Criteria:**
- User can fill registration form
- Validation works (client-side)
- API integration works
- Success/error messages shown
- Tests pass

**Files:**
- `frontend/src/pages/Register.tsx`
- `frontend/src/components/auth/RegisterForm.tsx`
- `frontend/tests/Register.test.tsx`

---

#### Issue #18: Build Login Page (Frontend)
**Labels:** `priority: critical`, `type: feature`, `area: frontend`

**Description:**
Create login page with form validation and token management.

**Tasks:**
- [ ] Create `pages/Login.tsx`
- [ ] Create login form (React Hook Form + Zod)
- [ ] Connect to API (`POST /api/auth/login`)
- [ ] Store tokens (localStorage or secure cookies)
- [ ] Redirect to dashboard on success
- [ ] Show error messages
- [ ] Add "Forgot password?" link
- [ ] Write tests

**Acceptance Criteria:**
- User can login
- Tokens stored securely
- Redirect works
- Tests pass

**Files:**
- `frontend/src/pages/Login.tsx`
- `frontend/src/components/auth/LoginForm.tsx`
- `frontend/src/lib/auth.ts`

---

#### Issue #19: Create Auth Context (Frontend)
**Labels:** `priority: high`, `type: feature`, `area: frontend`

**Description:**
Create React context for global authentication state.

**Tasks:**
- [ ] Create `contexts/AuthContext.tsx`
- [ ] Implement login/logout functions
- [ ] Implement token refresh logic
- [ ] Store current user state
- [ ] Create `useAuth()` hook
- [ ] Implement `ProtectedRoute` component
- [ ] Handle token expiration
- [ ] Write tests

**Acceptance Criteria:**
- Auth state accessible globally
- Automatic token refresh works
- Protected routes redirect to login
- Tests pass

**Files:**
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/hooks/useAuth.ts`
- `frontend/src/components/auth/ProtectedRoute.tsx`

---

#### Issue #20: Build User Profile Page
**Labels:** `priority: medium`, `type: feature`, `area: frontend`

**Description:**
Create user profile page to view and edit profile.

**Tasks:**
- [ ] Create `pages/Profile.tsx`
- [ ] Create `GET /api/users/me` endpoint (backend)
- [ ] Create `PATCH /api/users/me` endpoint (backend)
- [ ] Fetch and display user data
- [ ] Create edit profile form
- [ ] Allow updating name, location, language
- [ ] Allow changing password
- [ ] Write tests

**Acceptance Criteria:**
- User can view profile
- User can edit profile
- Password change works
- Tests pass

---

### Phase 2: Family Branch Management (Week 3)

**Goal:** Implement family branch creation and management

**Milestone:** `v0.3-branches`

#### Issue #21: Create Family Branch
**Labels:** `priority: critical`, `type: feature`, `area: backend`

**Description:**
Implement API to create family branches.

**Tasks:**
- [ ] Create `POST /api/branches` endpoint
- [ ] Generate branch ID (FB-CITY-SURNAME-SEQ)
- [ ] Validate surname and city
- [ ] Check for duplicate branches (duplicate detection)
- [ ] Create branch in database
- [ ] Set creator as primary Guru
- [ ] Create audit log entry
- [ ] Write tests

**Acceptance Criteria:**
- Branch can be created
- Branch ID generated correctly
- Creator is Guru
- Duplicate detection works
- Tests pass

---

#### Issue #22: List and Search Branches
**Labels:** `priority: high`, `type: feature`, `area: backend`

**Description:**
Implement API to list and search family branches.

**Tasks:**
- [ ] Create `GET /api/branches` endpoint
- [ ] Implement pagination
- [ ] Implement filtering (city, surname)
- [ ] Implement search (full-text)
- [ ] Implement sorting (newest, oldest, most members)
- [ ] Return branch statistics
- [ ] Write tests

**Acceptance Criteria:**
- Branches can be listed
- Pagination works
- Search/filter works
- Tests pass

---

#### Issue #23: Join Branch Request
**Labels:** `priority: high`, `type: feature`, `area: backend`

**Description:**
Implement join request workflow.

**Tasks:**
- [ ] Create `POST /api/branches/:id/join` endpoint
- [ ] Create join request in database
- [ ] Notify Gurus
- [ ] Create `GET /api/branches/:id/join-requests` (for Gurus)
- [ ] Create `PATCH /api/join-requests/:id/approve` (Guru action)
- [ ] Create `PATCH /api/join-requests/:id/reject` (Guru action)
- [ ] Add user to branch on approval
- [ ] Write tests

**Acceptance Criteria:**
- User can request to join
- Gurus notified
- Gurus can approve/reject
- User added to branch on approval
- Tests pass

---

#### Issue #24: Branch Detail Page (Frontend)
**Labels:** `priority: high`, `type: feature`, `area: frontend`

**Description:**
Create page to display family branch details and tree.

**Tasks:**
- [ ] Create `pages/BranchDetail.tsx`
- [ ] Fetch branch data from API
- [ ] Display branch info (surname, city, statistics)
- [ ] Show "Join Branch" button (if not member)
- [ ] Show member list (if member)
- [ ] Add loading and error states
- [ ] Write tests

**Acceptance Criteria:**
- Branch details displayed
- Join button works
- Tests pass

---

### Phase 3: Family Tree & Person Management (Week 4-5)

**Goal:** Implement person CRUD and family tree visualization

**Milestone:** `v0.4-persons`

#### Issue #25: Create Person API
**Labels:** `priority: critical`, `type: feature`, `area: backend`

**Description:**
Implement API to create and manage persons.

**Tasks:**
- [ ] Create `POST /api/branches/:id/persons` endpoint
- [ ] Validate person data (Zod schema)
- [ ] Generate person UUID
- [ ] Calculate generation number
- [ ] Create person in database
- [ ] Link to parents (if provided)
- [ ] Create audit log entry
- [ ] Require Guru approval workflow
- [ ] Write tests

**Acceptance Criteria:**
- Person can be created
- Parent links work
- Generation calculated correctly
- Approval workflow works
- Tests pass

---

#### Issue #26: Family Tree Visualization (Frontend)
**Labels:** `priority: critical`, `type: feature`, `area: frontend`

**Description:**
Create interactive family tree visualization using D3.js or React Flow.

**Tasks:**
- [ ] Research D3.js vs React Flow for genealogy trees
- [ ] Create `components/FamilyTree/TreeView.tsx`
- [ ] Fetch tree data from API
- [ ] Render tree with D3.js or React Flow
- [ ] Implement zoom and pan
- [ ] Show person cards on nodes
- [ ] Allow clicking person to view details
- [ ] Handle large trees (performance)
- [ ] Write tests

**Acceptance Criteria:**
- Tree renders correctly
- Multiple generations displayed
- Interactive (zoom, pan, click)
- Performance acceptable (100+ people)
- Tests pass

---

### Subsequent Phases

**Phase 4: Stories & Documents (Week 6)**
- Issue #30-35: Story creation, document upload, gallery

**Phase 5: Disputes & Governance (Week 7)**
- Issue #36-40: Dispute workflow, audit logs, quality management

**Phase 6: Root Changes (Week 8)**
- Issue #41-45: Root change proposals, voting, execution

**Phase 7: Testing & Polish (Week 9-10)**
- Issue #46-50: Integration tests, bug fixes, performance optimization

---

## GitHub Issue Templates

### Feature Request Template

```markdown
## Feature Description
Brief description of the feature

## User Story
As a [user type], I want [goal] so that [benefit]

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests pass

## Related Issues
- #XX (blocks this)
- #YY (related)

## Design References
- Link to design doc
- Link to mockup

## Technical Notes
Any technical considerations
```

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS:
- Browser:
- Version:

## Screenshots
If applicable

## Error Logs
```

---

## Context File for AI Assistants

Create `.ai/context.md` for AI assistant continuity:

```markdown
# AI Assistant Context

## Project: Pustikorijen
Bosnian family genealogy platform connecting diaspora with homeland.

## Current Status
Check GitHub Projects board: [link]
Current milestone: [milestone name]

## Key Documents
- Architecture: docs/07-technical-architecture.md
- Database: docs/07-technical-architecture.md (schema section)
- Features: docs/03-core-features.md
- Roadmap: docs/08-implementation-roadmap.md

## Tech Stack
- Backend: Node.js + TypeScript + Express + Prisma + PostgreSQL
- Frontend: React + TypeScript + Tailwind + Vite
- Database: PostgreSQL 15
- Cache: Redis

## Important Conventions
- Branch naming: feature/description, bugfix/description
- Commit format: type(scope): message
- All code in TypeScript
- Prisma for database access
- Zod for validation

## Current Work
See GitHub Projects board for current sprint

## How to Start
1. Read docs/DEVELOPMENT.md
2. Check GitHub Projects board for "Ready" issues
3. Assign yourself to an issue
4. Create feature branch
5. Implement + test
6. Submit PR with reference to issue

## Questions?
Check docs/ folder or ask in GitHub Discussions
```

---

## Continuity Checklist

For **any developer or AI assistant** picking up work:

### First Time Setup
1. ✅ Read `README.md`
2. ✅ Read `docs/DEVELOPMENT.md`
3. ✅ Read architecture docs (docs/07-technical-architecture.md)
4. ✅ Clone repository
5. ✅ Run `npm install` in root
6. ✅ Copy `.env.example` to `.env` and fill values
7. ✅ Run `docker-compose up -d`
8. ✅ Run database migrations: `npm run db:migrate`
9. ✅ Seed database: `npm run db:seed`
10. ✅ Start dev server: `npm run dev`
11. ✅ Verify everything works

### Starting New Work
1. ✅ Check GitHub Projects board
2. ✅ Pick issue from "Ready" column
3. ✅ Read issue description thoroughly
4. ✅ Check acceptance criteria
5. ✅ Check related issues (dependencies)
6. ✅ Assign yourself to issue
7. ✅ Move issue to "In Progress"
8. ✅ Create feature branch: `git checkout -b feature/issue-XX-description`
9. ✅ Implement feature
10. ✅ Write tests
11. ✅ Update documentation if needed
12. ✅ Self-review code
13. ✅ Run all tests: `npm test`
14. ✅ Run linter: `npm run lint`
15. ✅ Commit with message: `feat(scope): description (#XX)`
16. ✅ Push branch
17. ✅ Create PR referencing issue
18. ✅ Move issue to "In Review"
19. ✅ Address review comments
20. ✅ Merge when approved
21. ✅ Move issue to "Done"
22. ✅ Delete branch

### Resuming Work After Break
1. ✅ Pull latest from develop: `git checkout develop && git pull`
2. ✅ Check GitHub Projects board for status
3. ✅ Review recent commits: `git log --oneline -10`
4. ✅ Check your assigned issues
5. ✅ Read issue comments for updates
6. ✅ Continue from last checkpoint

---

## Summary

**This roadmap provides:**

✅ **Precise task breakdown** - 50+ granular GitHub issues
✅ **Clear dependencies** - Each issue lists what blocks it
✅ **Acceptance criteria** - No ambiguity about "done"
✅ **File-level specificity** - Exact files to create/modify
✅ **Context for AI** - Any LLM can pick up any issue
✅ **Project management** - GitHub Projects as single source of truth
✅ **Continuity** - Checklists for starting/resuming work

**Next Steps:**
1. Create GitHub repository
2. Create all issues from this roadmap
3. Set up GitHub Projects board
4. Start with Phase 0 issues
5. Progress through milestones

Any developer or AI assistant can now:
- Understand the project state
- Pick up any issue and complete it
- Know exactly what "done" means
- Continue work without restarting from scratch

GitHub becomes the **single source of truth** for project status.
