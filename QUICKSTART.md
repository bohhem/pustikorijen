# Pustikorijen - Quick Start Guide

> **For developers and AI assistants picking up this project**

## Project Overview

**Pustikorijen** is a family genealogy platform connecting Bosnian diaspora with their homeland. Built with Node.js + React + PostgreSQL.

📁 **Repository:** Will be at `github.com/[your-username]/pustikorijen`
📋 **Project Board:** GitHub Projects (to be created)
📚 **Full Documentation:** `docs/` folder

---

## Current Status: Phase 0 - Project Setup

**What's Done:**
✅ Complete design documentation (8 documents)
✅ Technical architecture defined
✅ Database schema designed
✅ Implementation roadmap created

**What's Next:**
🎯 Initialize Git repository
🎯 Create GitHub repo and project board
🎯 Set up development environment
🎯 Begin Phase 0 implementation

---

## 🚀 Quick Start for New Contributors

### Prerequisites

```bash
# Required
Node.js 20+    (check: node --version)
Docker         (check: docker --version)
Git            (check: git --version)

# Optional but recommended
GitHub CLI     (check: gh --version)
```

### First-Time Setup (10 minutes)

```bash
# 1. Clone repository (after it's created on GitHub)
git clone https://github.com/[username]/pustikorijen.git
cd pustikorijen

# 2. Install dependencies (when project is initialized)
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your local configuration

# 4. Start development services
docker-compose -f docker/docker-compose.dev.yml up -d

# 5. Run database migrations
cd backend
npm run db:migrate
npm run db:seed

# 6. Start development servers
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# 7. Open browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# MailHog: http://localhost:8025
```

---

## 📋 Finding Work to Do

### Option 1: GitHub Projects Board (Recommended)

1. Go to repository's **Projects** tab
2. Look at **"Ready"** column
3. Pick an issue that interests you
4. Assign yourself
5. Move to **"In Progress"**

### Option 2: GitHub Issues

1. Go to **Issues** tab
2. Filter by label: `good first issue` or `help wanted`
3. Read issue description
4. Comment "I'll work on this"
5. Get assigned

### Option 3: Current Todo List

See the **current todo list** below for immediate next steps.

---

## 📝 Current Todo List (Phase 0)

**These are the immediate next steps to get the project started:**

### Setup Tasks

- [ ] **Task 1:** Initialize Git repository
  - Create `.gitignore` file
  - Create initial README.md
  - Create LICENSE file
  - Commit and push

- [ ] **Task 2:** Create GitHub repository
  - Create repo on GitHub
  - Connect local repo to GitHub
  - Push initial commit

- [ ] **Task 3:** Set up GitHub Projects board
  - Create project board
  - Add columns (Backlog, Ready, In Progress, Review, Done)
  - Create labels
  - Create milestones

- [ ] **Task 4:** Create project folder structure
  - Create backend/ frontend/ docker/ scripts/ folders
  - Set up monorepo structure
  - Create root package.json

- [ ] **Task 5:** Initialize backend
  - Run `npm init` in backend/
  - Install dependencies (Express, Prisma, TypeScript)
  - Create basic folder structure
  - Create tsconfig.json

- [ ] **Task 6:** Initialize frontend
  - Run `npm create vite` in frontend/
  - Install dependencies (React, Tailwind, etc.)
  - Configure Tailwind
  - Create basic routing

- [ ] **Task 7:** Create Docker Compose
  - Create docker-compose.dev.yml
  - Add PostgreSQL service
  - Add Redis service
  - Add MinIO service
  - Add MailHog service

- [ ] **Task 8:** Set up Prisma schema
  - Create schema.prisma
  - Define all 11 database tables
  - Run migrations
  - Generate Prisma Client

- [ ] **Task 9:** Create .env files
  - Create .env.example for backend
  - Create .env.example for frontend
  - Document all environment variables

- [ ] **Task 10:** Write DEVELOPMENT.md
  - Document setup process
  - Document npm scripts
  - Document database operations
  - Add troubleshooting section

**Estimated Time:** 1-2 days for full Phase 0 completion

---

## 🤖 For AI Assistants

### Context to Load

**Before starting work, read these files:**

1. `docs/README.md` - Documentation overview
2. `docs/08-implementation-roadmap.md` - Full task breakdown
3. `docs/07-technical-architecture.md` - Tech stack and architecture
4. `docs/DEVELOPMENT.md` - Development guide (when created)

### Key Information

**Tech Stack:**
- Backend: Node.js 20 + TypeScript + Express + Prisma
- Frontend: React 18 + TypeScript + Tailwind + Vite
- Database: PostgreSQL 15
- Cache: Redis
- Storage: S3/MinIO

**Project Structure (will be):**
```
pustikorijen/
├── backend/      # Node.js backend
├── frontend/     # React frontend
├── docs/         # Documentation (exists)
├── docker/       # Docker configs
├── scripts/      # Utility scripts
└── .github/      # GitHub workflows
```

**Important Conventions:**
- All code in TypeScript
- Use Prisma for database
- Use Zod for validation
- Follow REST API conventions
- Write tests for all features

### Working on Tasks

1. **Check current state:**
   - Read GitHub Projects board
   - Look at recent commits
   - Check current branch

2. **Before coding:**
   - Read issue description
   - Check acceptance criteria
   - Check for related issues
   - Ask questions if unclear

3. **During coding:**
   - Follow existing code patterns
   - Write self-documenting code
   - Add comments for complex logic
   - Write tests

4. **Before submitting:**
   - Run all tests: `npm test`
   - Run linter: `npm run lint`
   - Self-review your code
   - Update documentation if needed

---

## 🔑 Key Design Decisions

### Family Branch System
- Multiple families with same surname can coexist
- Each branch identified by: `FB-{CITY}-{SURNAME}-{SEQ}`
- Example: `FB-SA-HODZIC-001` (Sarajevo Hodžić family, branch 1)

### Identifier System
- **Person ID:** UUID (never changes)
- **Branch ID:** Human-readable (FB-CITY-SURNAME-SEQ)
- **Generation:** Flexible (can shift when older ancestors found)

### Governance Model
- **Family Guru:** 1-3 guardians per branch
- **Verification Levels:** 1-5 stars based on evidence quality
- **Dispute Resolution:** 3-tier process (Family → Guru → Admin)

### Tree Evolution
- Trees can grow upward (older ancestors discovered)
- Generation codes recalculate automatically
- Complete audit trail maintained

---

## 📚 Essential Reading

**Start here:**
1. [Project Overview](docs/01-project-overview.md) - Vision and goals
2. [Technical Architecture](docs/07-technical-architecture.md) - How it's built
3. [Implementation Roadmap](docs/08-implementation-roadmap.md) - What to build

**Reference docs:**
4. [Core Features](docs/03-core-features.md) - What features to implement
5. [Governance System](docs/04-governance-system.md) - How disputes work
6. [Identifier System](docs/05-identifier-access-control.md) - How IDs work
7. [Tree Evolution](docs/06-tree-evolution-system.md) - How trees grow

---

## 🆘 Getting Help

### Questions About Design?
→ Read the docs in `docs/` folder

### Questions About Implementation?
→ Check `docs/08-implementation-roadmap.md` for detailed tasks

### Questions About Setup?
→ Read `docs/DEVELOPMENT.md` (when created)

### Technical Questions?
→ Create a GitHub Discussion or Issue

### Blocked?
→ Add `status: blocked` label to your issue and explain why

---

## ✅ Success Checklist

**You're ready to contribute when you can:**

- [ ] Clone the repository
- [ ] Start development services (Docker)
- [ ] Run backend dev server
- [ ] Run frontend dev server
- [ ] Access the application in browser
- [ ] Run tests
- [ ] Understand the project structure
- [ ] Know where to find tasks (GitHub Projects)
- [ ] Know how to submit a PR

---

## 🎯 Next Milestone: v0.1 - Project Setup

**Goal:** Get development environment working

**Key Deliverables:**
- ✅ Git repository initialized
- ✅ GitHub repo created with Projects board
- ✅ Docker development environment
- ✅ Backend + Frontend scaffolded
- ✅ Database schema implemented
- ✅ Development guide written
- ✅ CI/CD pipeline configured

**When complete:**
- Anyone can clone and run the project
- Ready to start building features
- All documentation updated

---

## 💡 Tips for Success

**For Developers:**
- Start with "good first issue" labeled tasks
- Read the acceptance criteria carefully
- Write tests as you code
- Ask questions early
- Submit PRs frequently (small is better)

**For AI Assistants:**
- Always check the latest GitHub Projects board
- Read issue descriptions thoroughly
- Follow existing code patterns
- Include tests in your implementation
- Update documentation when needed
- Reference issue numbers in commits: `feat(auth): add login (#13)`

---

## 📞 Project Contacts

**Maintainer:** [To be added]
**Repository:** [To be created]
**Project Board:** [To be created]
**Discussions:** [GitHub Discussions]

---

**Last Updated:** 2025-10-17
**Status:** Phase 0 - Project Setup (Not Started)
**Next Action:** Initialize Git repository and create GitHub repo
