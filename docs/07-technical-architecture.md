# Technical Architecture & Technology Stack

## Architecture Overview

Pustikorijen will use a **modern, scalable monolith architecture** for MVP, with a clear path to microservices if needed as the platform grows.

### Why Monolith First?

**Advantages for MVP:**
- ✅ Faster initial development
- ✅ Simpler deployment and operations
- ✅ Easier debugging and testing
- ✅ Lower infrastructure costs
- ✅ Better for small team
- ✅ Can refactor to microservices later

**Our Approach: "Modular Monolith"**
- Code organized in clear domain boundaries
- Loose coupling between modules
- Clear interfaces between components
- Easy to extract services later if needed

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐│
│  │  Web Browser     │   │  Mobile Browser  │   │  Mobile App      ││
│  │  (React/Vue)     │   │  (PWA)           │   │  (Future)        ││
│  └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘│
│           │                      │                      │           │
│           └──────────────────────┼──────────────────────┘           │
│                                  │                                   │
└──────────────────────────────────┼───────────────────────────────────┘
                                   │
                            HTTPS/REST API
                                   │
┌──────────────────────────────────┼───────────────────────────────────┐
│                         API GATEWAY / LOAD BALANCER                  │
│                         (Nginx / Traefik)                            │
└──────────────────────────────────┼───────────────────────────────────┘
                                   │
┌──────────────────────────────────┼───────────────────────────────────┐
│                      APPLICATION LAYER                               │
├──────────────────────────────────┼───────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              Backend Application Server                         │ │
│  │              (Node.js / Python / Go)                            │ │
│  │                                                                 │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │ │
│  │  │   Auth     │  │   Family   │  │   Person   │  │  Story   │ │ │
│  │  │  Module    │  │   Tree     │  │  Profile   │  │  Module  │ │ │
│  │  │            │  │   Module   │  │   Module   │  │          │ │ │
│  │  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │ │
│  │                                                                 │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │ │
│  │  │   Dispute  │  │   Audit    │  │   Search   │  │  Notify  │ │ │
│  │  │ Resolution │  │   & QA     │  │  & Index   │  │  Module  │ │ │
│  │  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │ │
│  │                                                                 │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐               │ │
│  │  │   File     │  │   Email    │  │    Map     │               │ │
│  │  │  Storage   │  │  Service   │  │  Service   │               │ │
│  │  └────────────┘  └────────────┘  └────────────┘               │ │
│  │                                                                 │ │
│  └─────────────────────────────┬───────────────────────────────────┘ │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
┌────────────────────────────────┼─────────────────────────────────────┐
│                        DATA LAYER                                    │
├────────────────────────────────┼─────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐│
│  │   PostgreSQL     │   │     Redis        │   │   Elasticsearch  ││
│  │ (Primary DB)     │   │ (Cache/Session)  │   │  (Search Index)  ││
│  └──────────────────┘   └──────────────────┘   └──────────────────┘│
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────┐                       │
│  │   S3/MinIO       │   │   Message Queue  │                       │
│  │ (File Storage)   │   │ (RabbitMQ/Redis) │                       │
│  └──────────────────┘   └──────────────────┘                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                                │
├──────────────────────────────────────────────────────────────────────┤
│  • Email (SendGrid/AWS SES)                                          │
│  • Maps (Mapbox/Google Maps)                                         │
│  • CDN (CloudFlare)                                                  │
│  • Analytics (Plausible/Matomo)                                      │
│  • Monitoring (Sentry/Prometheus/Grafana)                            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Proposal

### Option A: Node.js Stack (Recommended for MVP)

**Best for:** Rapid development, JavaScript everywhere, large ecosystem

#### Frontend
```
Framework:    React 18+ with TypeScript
State:        Zustand or Redux Toolkit
Routing:      React Router v6
UI Library:   Tailwind CSS + shadcn/ui
Forms:        React Hook Form + Zod validation
Charts:       D3.js (for family tree visualization)
Maps:         Mapbox GL JS or Leaflet
i18n:         react-i18next
Build:        Vite
Testing:      Vitest + React Testing Library
```

**Why React?**
- ✅ Large ecosystem and community
- ✅ Excellent performance with tree rendering
- ✅ Great libraries for complex UI (family trees)
- ✅ TypeScript support is excellent
- ✅ Team likely familiar with it

**Alternative: Vue 3** would also work well, especially for simpler component structure.

#### Backend
```
Runtime:      Node.js 20+ LTS
Framework:    Express.js or Fastify
Language:     TypeScript
ORM:          Prisma (modern, type-safe)
Validation:   Zod
Auth:         Passport.js + JWT
File Upload:  Multer
Email:        Nodemailer
Jobs:         BullMQ (Redis-based queue)
Testing:      Jest + Supertest
API Docs:     OpenAPI/Swagger
```

**Why Node.js + Express?**
- ✅ Fast development cycle
- ✅ JavaScript/TypeScript everywhere (share types)
- ✅ Huge ecosystem of packages
- ✅ Good for real-time features (WebSockets)
- ✅ Easy to deploy

**Alternative: Fastify** - Faster than Express, great TypeScript support.

#### Database & Storage
```
Primary DB:    PostgreSQL 15+
Cache:         Redis 7+
Search:        Elasticsearch 8+ or MeiliSearch
File Storage:  S3-compatible (AWS S3 or MinIO)
Message Queue: BullMQ (Redis-based) or RabbitMQ
```

**Why PostgreSQL?**
- ✅ Excellent for relational genealogy data
- ✅ JSONB for flexible metadata
- ✅ Full-text search built-in
- ✅ Great transaction support (ACID)
- ✅ Mature, reliable, well-documented
- ✅ Recursive queries (CTE) for tree traversal

#### DevOps
```
Containerization:  Docker + Docker Compose
Orchestration:     Kubernetes (later) or Docker Swarm
CI/CD:             GitHub Actions or GitLab CI
Monitoring:        Prometheus + Grafana
Logging:           Winston + Loki
Error Tracking:    Sentry
Hosting:           VPS (DigitalOcean/Hetzner) or AWS
```

---

### Option B: Python Stack (Alternative)

**Best for:** Data processing, ML features, scientific computing

#### Frontend
```
Same as Option A (React/Vue)
```

#### Backend
```
Framework:    FastAPI (modern, async, fast)
Language:     Python 3.11+
ORM:          SQLAlchemy 2.0 + Alembic
Validation:   Pydantic
Auth:         FastAPI Security + JWT
File Upload:  FastAPI UploadFile
Email:        FastAPI-Mail
Jobs:         Celery + Redis
Testing:      Pytest + httpx
API Docs:     Built-in OpenAPI (FastAPI)
```

**Why Python/FastAPI?**
- ✅ Excellent for data processing
- ✅ Great ML/AI libraries (future features)
- ✅ FastAPI is very fast (async)
- ✅ Type hints with Pydantic
- ✅ Great for scientific computing

**When to choose Python:**
- If team has Python expertise
- If planning heavy ML/AI features soon
- If need strong data analysis tools

---

### Option C: Go Stack (High Performance)

**Best for:** High performance, low resource usage, scalability

#### Backend
```
Language:     Go 1.21+
Framework:    Gin or Echo
ORM:          GORM or sqlx
Validation:   validator/v10
Auth:         jwt-go
Jobs:         asynq (Redis-based)
Testing:      testify
API Docs:     swaggo/swag
```

**Why Go?**
- ✅ Extremely fast and efficient
- ✅ Low memory footprint
- ✅ Great for high-traffic scenarios
- ✅ Built-in concurrency
- ✅ Single binary deployment

**When to choose Go:**
- If performance is critical from day 1
- If team has Go expertise
- If planning high traffic immediately

---

## Recommended Stack: Node.js (Option A)

**For Pustikorijen MVP, I recommend Option A (Node.js):**

### Reasoning:

1. **Developer Velocity** ⚡
   - Fastest time to market
   - Huge package ecosystem
   - Easy to find developers
   - Great tooling and IDE support

2. **Full-Stack TypeScript** 🎯
   - Share types between frontend/backend
   - Compile-time safety
   - Better refactoring
   - Single language for entire stack

3. **Rich Ecosystem** 📦
   - D3.js for family tree visualization
   - Great auth libraries (Passport.js)
   - Excellent testing frameworks
   - Many genealogy-related packages

4. **Real-Time Capabilities** 🔄
   - WebSockets for live updates
   - Server-Sent Events for notifications
   - Easy to implement collaborative features

5. **Cost-Effective** 💰
   - Can run on modest hardware for MVP
   - Many free hosting options
   - Scales well with caching

---

## Detailed Technology Choices

### Frontend Stack

```javascript
// package.json (frontend)
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "typescript": "^5.3.0",

    // State Management
    "zustand": "^4.4.7",

    // UI & Styling
    "tailwindcss": "^3.3.0",
    "@radix-ui/react-*": "latest",  // shadcn/ui components
    "lucide-react": "^0.300.0",     // Icons

    // Forms & Validation
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.2",

    // Data Visualization
    "d3": "^7.8.5",
    "@types/d3": "^7.4.3",
    "reactflow": "^11.10.0",  // For interactive tree diagrams

    // Maps
    "mapbox-gl": "^3.0.0",
    "react-map-gl": "^7.1.0",

    // Internationalization
    "react-i18next": "^13.5.0",
    "i18next": "^23.7.0",

    // HTTP Client
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.12.0",  // Data fetching & caching

    // Utilities
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0"
  }
}
```

### Backend Stack

```javascript
// package.json (backend)
{
  "dependencies": {
    "express": "^4.18.2",
    "typescript": "^5.3.0",

    // Database & ORM
    "@prisma/client": "^5.7.0",
    "prisma": "^5.7.0",

    // Authentication & Security
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.0",

    // Validation
    "zod": "^3.22.4",

    // File Upload
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.0",  // Image processing

    // Email
    "nodemailer": "^6.9.7",

    // Jobs & Queues
    "bullmq": "^5.0.0",
    "ioredis": "^5.3.2",

    // Utilities
    "date-fns": "^2.30.0",
    "uuid": "^9.0.1",

    // Logging
    "winston": "^3.11.0",
    "morgan": "^1.10.0",

    // Environment
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/express": "^4.17.21",
    "tsx": "^4.7.0",  // TypeScript execution
    "jest": "^29.7.0",
    "@types/jest": "^29.5.10",
    "supertest": "^6.3.3",
    "ts-node-dev": "^2.0.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0"
  }
}
```

---

## Database Schema Design

### Core Tables

#### 1. Users & Authentication

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,

  -- Profile
  birth_year INTEGER,
  current_location VARCHAR(255),
  preferred_language VARCHAR(10) DEFAULT 'bs',  -- bs, en, de

  -- Verification
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),

  -- Security
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

#### 2. Family Branches

```sql
CREATE TABLE family_branches (
  branch_id VARCHAR(50) PRIMARY KEY,  -- FB-SA-HODZIC-001

  -- Identity
  surname VARCHAR(100) NOT NULL,
  surname_normalized VARCHAR(100) NOT NULL,  -- ASCII, uppercase

  -- Geographic Origin
  city_code VARCHAR(10) NOT NULL,  -- SA, MO, TZ, etc.
  city_name VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Bosnia and Herzegovina',

  -- Root Ancestor
  root_person_id UUID,
  oldest_ancestor_year INTEGER,

  -- Statistics
  total_people INTEGER DEFAULT 0,
  total_generations INTEGER DEFAULT 0,

  -- Metadata
  description TEXT,
  founded_by UUID REFERENCES users(user_id),

  -- Privacy
  visibility VARCHAR(20) DEFAULT 'public',  -- public, family_only, private

  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP,

  -- Evolution
  root_change_count INTEGER DEFAULT 0,
  last_major_update TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_branches_surname ON family_branches(surname_normalized);
CREATE INDEX idx_branches_city ON family_branches(city_code);
CREATE INDEX idx_branches_visibility ON family_branches(visibility);
```

#### 3. Persons

```sql
CREATE TABLE persons (
  person_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id VARCHAR(50) NOT NULL REFERENCES family_branches(branch_id),

  -- Identity
  full_name VARCHAR(255) NOT NULL,
  given_name VARCHAR(100),
  surname VARCHAR(100),
  maiden_name VARCHAR(100),  -- For married individuals
  nickname VARCHAR(100),

  -- Core Dates & Places
  birth_year INTEGER,
  birth_date DATE,
  birth_place VARCHAR(255),
  birth_place_coords POINT,  -- PostGIS extension

  death_year INTEGER,
  death_date DATE,
  death_place VARCHAR(255),
  death_place_coords POINT,

  is_living BOOLEAN,

  -- Current Info (for living)
  current_location VARCHAR(255),
  current_country VARCHAR(100),

  -- Additional Info
  gender VARCHAR(20),
  occupation VARCHAR(255),
  education TEXT,
  biography TEXT,

  -- Photos
  profile_photo_url VARCHAR(500),

  -- Tree Structure
  generation VARCHAR(10),  -- G1, G2, G3, etc.
  generation_number INTEGER,
  is_branch_root BOOLEAN DEFAULT FALSE,

  -- Relationships (foreign keys)
  father_id UUID REFERENCES persons(person_id),
  mother_id UUID REFERENCES persons(person_id),

  -- Reference Codes
  reference_code VARCHAR(100),  -- FB-SA-HODZIC-001/AH-1920
  url_slug VARCHAR(255),

  -- Quality & Verification
  quality_score INTEGER DEFAULT 0,  -- 0-100
  verification_level INTEGER DEFAULT 1,  -- 1-5 stars
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(user_id),
  verified_at TIMESTAMP,

  -- Metadata
  created_from_root_change VARCHAR(50),  -- Root change proposal ID
  created_by UUID REFERENCES users(user_id),

  -- Privacy
  visibility VARCHAR(20) DEFAULT 'family_only',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CHECK (birth_year <= death_year),
  CHECK (is_living = FALSE OR (death_year IS NULL AND death_date IS NULL)),
  CHECK (quality_score BETWEEN 0 AND 100),
  CHECK (verification_level BETWEEN 1 AND 5)
);

CREATE INDEX idx_persons_branch ON persons(branch_id);
CREATE INDEX idx_persons_generation ON persons(branch_id, generation_number);
CREATE INDEX idx_persons_name ON persons(surname, given_name);
CREATE INDEX idx_persons_father ON persons(father_id);
CREATE INDEX idx_persons_mother ON persons(mother_id);
CREATE INDEX idx_persons_root ON persons(branch_id, is_branch_root);
CREATE INDEX idx_persons_birth_year ON persons(birth_year);

-- Full-text search index
CREATE INDEX idx_persons_fulltext ON persons
  USING gin(to_tsvector('simple', full_name || ' ' || COALESCE(biography, '')));
```

#### 4. Relationships (Spouses, Siblings)

```sql
CREATE TABLE relationships (
  relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  person1_id UUID NOT NULL REFERENCES persons(person_id),
  person2_id UUID NOT NULL REFERENCES persons(person_id),

  relationship_type VARCHAR(50) NOT NULL,  -- spouse, sibling, adopted_parent, etc.

  -- Marriage Details (for spouses)
  marriage_date DATE,
  marriage_place VARCHAR(255),
  divorce_date DATE,

  -- Order (for multiple spouses)
  order_number INTEGER DEFAULT 1,

  -- Status
  is_current BOOLEAN DEFAULT TRUE,

  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES users(user_id),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CHECK (person1_id != person2_id),
  CHECK (relationship_type IN ('spouse', 'sibling', 'half_sibling',
         'adopted_parent', 'adopted_child', 'step_parent', 'step_child'))
);

CREATE INDEX idx_relationships_person1 ON relationships(person1_id);
CREATE INDEX idx_relationships_person2 ON relationships(person2_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);
CREATE UNIQUE INDEX idx_relationships_unique ON relationships(person1_id, person2_id, relationship_type);
```

#### 5. Branch Members (Access Control)

```sql
CREATE TABLE branch_members (
  member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  branch_id VARCHAR(50) NOT NULL REFERENCES family_branches(branch_id),
  user_id UUID NOT NULL REFERENCES users(user_id),

  -- Role
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  -- guest, member, editor, guru

  -- Person Link
  person_id UUID REFERENCES persons(person_id),  -- Which person they are in tree

  -- Permissions (for editors)
  can_edit_generations VARCHAR(50),  -- e.g., "G3-G5"
  auto_approve_photos BOOLEAN DEFAULT FALSE,
  auto_approve_stories BOOLEAN DEFAULT FALSE,

  -- Status
  status VARCHAR(20) DEFAULT 'pending',  -- pending, active, suspended
  invited_by UUID REFERENCES users(user_id),
  approved_by UUID REFERENCES users(user_id),
  approved_at TIMESTAMP,

  -- Activity
  contribution_count INTEGER DEFAULT 0,
  last_contribution TIMESTAMP,

  -- Timestamps
  joined_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(branch_id, user_id),
  CHECK (role IN ('guest', 'member', 'editor', 'guru')),
  CHECK (status IN ('pending', 'active', 'suspended', 'removed'))
);

CREATE INDEX idx_branch_members_branch ON branch_members(branch_id);
CREATE INDEX idx_branch_members_user ON branch_members(user_id);
CREATE INDEX idx_branch_members_role ON branch_members(branch_id, role);
CREATE INDEX idx_branch_members_status ON branch_members(branch_id, status);
```

---

### Audit & Governance Tables

#### 6. Audit Log

```sql
CREATE TABLE audit_log (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What Changed
  entity_type VARCHAR(50) NOT NULL,  -- person, branch, relationship, etc.
  entity_id VARCHAR(100) NOT NULL,
  action_type VARCHAR(50) NOT NULL,  -- create, update, delete, etc.

  -- Change Details
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,

  -- Context
  branch_id VARCHAR(50) REFERENCES family_branches(branch_id),
  person_id UUID REFERENCES persons(person_id),

  -- Source
  source_type VARCHAR(50),  -- manual, import, api, system
  source_documentation TEXT,  -- Document reference

  -- Who & Why
  user_id UUID REFERENCES users(user_id),
  reason TEXT,

  -- Quality
  quality_score INTEGER,
  verification_status VARCHAR(50) DEFAULT 'unverified',

  -- Disputes
  is_disputed BOOLEAN DEFAULT FALSE,
  disputed_by UUID REFERENCES users(user_id),
  dispute_id VARCHAR(50),

  -- Special Events
  root_change_id VARCHAR(50),  -- If part of root change
  merge_id VARCHAR(50),  -- If part of branch merge

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  CHECK (action_type IN ('create', 'update', 'delete', 'merge', 'split',
         'verify', 'dispute', 'resolve'))
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_branch ON audit_log(branch_id);
CREATE INDEX idx_audit_person ON audit_log(person_id);
CREATE INDEX idx_audit_timestamp ON audit_log(created_at DESC);
CREATE INDEX idx_audit_disputed ON audit_log(is_disputed) WHERE is_disputed = TRUE;
```

#### 7. Disputes

```sql
CREATE TABLE disputes (
  dispute_id VARCHAR(50) PRIMARY KEY,  -- DSP-00001

  -- What's Disputed
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  field_name VARCHAR(100),

  -- Claims
  current_value TEXT,
  proposed_value TEXT,

  -- Parties
  raised_by UUID NOT NULL REFERENCES users(user_id),
  affected_branch VARCHAR(50) REFERENCES family_branches(branch_id),

  -- Resolution
  status VARCHAR(50) DEFAULT 'pending',
  -- pending, level1_discussion, level2_review, level3_panel, resolved, rejected
  level INTEGER DEFAULT 1,  -- 1, 2, or 3

  -- Timeline
  deadline TIMESTAMP,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(user_id),

  -- Evidence & Discussion
  evidence JSONB,  -- Array of evidence documents
  explanation TEXT,
  resolution_reasoning TEXT,

  -- Votes
  family_votes JSONB,  -- {user_id: vote, ...}
  guru_votes JSONB,
  expert_reviews JSONB,

  -- Final Decision
  final_decision TEXT,
  accepted_value TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CHECK (status IN ('pending', 'level1_discussion', 'level2_review',
         'level3_panel', 'resolved', 'rejected')),
  CHECK (level IN (1, 2, 3))
);

CREATE INDEX idx_disputes_entity ON disputes(entity_type, entity_id);
CREATE INDEX idx_disputes_branch ON disputes(affected_branch);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_raised_by ON disputes(raised_by);
```

#### 8. Root Change Proposals

```sql
CREATE TABLE root_change_proposals (
  proposal_id VARCHAR(50) PRIMARY KEY,  -- RC-00001

  branch_id VARCHAR(50) NOT NULL REFERENCES family_branches(branch_id),

  -- Current vs Proposed
  old_root_person_id UUID REFERENCES persons(person_id),
  new_root_person_id UUID REFERENCES persons(person_id),  -- NULL until created

  -- New Root Data (before creation)
  new_root_data JSONB,
  relationship_type VARCHAR(50),  -- father, mother, both_parents

  -- Proposer
  proposed_by UUID NOT NULL REFERENCES users(user_id),

  -- Evidence
  evidence_documents JSONB,
  evidence_score INTEGER,
  explanation TEXT,

  -- Review Status
  status VARCHAR(50) DEFAULT 'pending',
  -- draft, pending, approved, rejected, executed
  review_deadline TIMESTAMP,

  -- Approvals
  guru_votes JSONB,
  family_votes JSONB,
  expert_reviews JSONB,

  -- Execution
  executed_at TIMESTAMP,
  execution_log JSONB,

  -- Impact
  people_affected INTEGER,
  generations_shifted INTEGER,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'executed')),
  CHECK (evidence_score BETWEEN 0 AND 100)
);

CREATE INDEX idx_root_proposals_branch ON root_change_proposals(branch_id);
CREATE INDEX idx_root_proposals_status ON root_change_proposals(status);
CREATE INDEX idx_root_proposals_proposed_by ON root_change_proposals(proposed_by);
```

---

### Content Tables

#### 9. Stories & Memories

```sql
CREATE TABLE stories (
  story_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  branch_id VARCHAR(50) NOT NULL REFERENCES family_branches(branch_id),
  author_id UUID NOT NULL REFERENCES users(user_id),

  -- Content
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  story_type VARCHAR(50) DEFAULT 'memory',
  -- memory, recipe, historical_event, photo_album, interview

  -- Tags
  tags TEXT[],

  -- People Tagged
  tagged_people UUID[],  -- Array of person_ids

  -- Location
  location VARCHAR(255),
  location_coords POINT,

  -- Date Context
  story_date DATE,
  story_year INTEGER,

  -- Media
  photos JSONB,  -- Array of photo URLs
  videos JSONB,
  audio JSONB,

  -- Engagement
  views_count INTEGER DEFAULT 0,
  reactions JSONB DEFAULT '{}'::jsonb,  -- {heart: 10, like: 5, ...}
  comments_count INTEGER DEFAULT 0,

  -- Moderation
  status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected
  approved_by UUID REFERENCES users(user_id),
  approved_at TIMESTAMP,

  -- Privacy
  visibility VARCHAR(50) DEFAULT 'family_only',  -- public, family_only, private

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CHECK (story_type IN ('memory', 'recipe', 'historical_event',
         'photo_album', 'interview', 'document')),
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  CHECK (visibility IN ('public', 'family_only', 'private'))
);

CREATE INDEX idx_stories_branch ON stories(branch_id);
CREATE INDEX idx_stories_author ON stories(author_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_visibility ON stories(visibility);
CREATE INDEX idx_stories_type ON stories(story_type);
CREATE INDEX idx_stories_created ON stories(created_at DESC);

-- Full-text search
CREATE INDEX idx_stories_fulltext ON stories
  USING gin(to_tsvector('simple', title || ' ' || content));
```

#### 10. Documents & Photos

```sql
CREATE TABLE documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Associations
  branch_id VARCHAR(50) NOT NULL REFERENCES family_branches(branch_id),
  person_id UUID REFERENCES persons(person_id),  -- Associated person
  story_id UUID REFERENCES stories(story_id),  -- Associated story

  -- File Info
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(100) NOT NULL,  -- image/jpeg, application/pdf, etc.
  file_size INTEGER NOT NULL,  -- bytes
  file_url VARCHAR(1000) NOT NULL,  -- S3 URL
  thumbnail_url VARCHAR(1000),  -- For images

  -- Document Type
  document_type VARCHAR(100),
  -- birth_certificate, death_certificate, marriage_certificate,
  -- photo, historical_document, letter, military_record, etc.

  -- Metadata
  title VARCHAR(500),
  description TEXT,
  document_date DATE,

  -- OCR & Search
  extracted_text TEXT,  -- From OCR

  -- Quality
  quality_score INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(user_id),

  -- Uploader
  uploaded_by UUID NOT NULL REFERENCES users(user_id),

  -- Privacy
  visibility VARCHAR(50) DEFAULT 'family_only',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CHECK (file_size > 0),
  CHECK (quality_score BETWEEN 0 AND 100),
  CHECK (visibility IN ('public', 'family_only', 'private'))
);

CREATE INDEX idx_documents_branch ON documents(branch_id);
CREATE INDEX idx_documents_person ON documents(person_id);
CREATE INDEX idx_documents_uploader ON documents(uploaded_by);
CREATE INDEX idx_documents_type ON documents(document_type);

-- Full-text search on OCR text
CREATE INDEX idx_documents_ocr ON documents
  USING gin(to_tsvector('simple', COALESCE(extracted_text, '')));
```

---

### Notification & Communication Tables

#### 11. Notifications

```sql
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(user_id),

  -- Type & Content
  type VARCHAR(100) NOT NULL,
  -- join_request, change_approved, dispute_raised, root_changed, etc.
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,

  -- Links
  entity_type VARCHAR(50),
  entity_id VARCHAR(100),
  action_url VARCHAR(500),

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,

  -- Priority
  priority VARCHAR(20) DEFAULT 'normal',  -- low, normal, high, urgent

  -- Channel
  sent_via_email BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;
```

---

## API Design

### RESTful API Structure

```
Base URL: https://api.pustikorijen.ba/v1

Authentication: JWT Bearer Token
Rate Limiting: 100 req/min per user, 1000 req/hour
```

### Core Endpoints

```typescript
// Authentication
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /auth/verify-email/:token

// User Profile
GET    /users/me
PATCH  /users/me
DELETE /users/me
GET    /users/:userId

// Family Branches
GET    /branches                         // List/search branches
POST   /branches                         // Create new branch
GET    /branches/:branchId               // Get branch details
PATCH  /branches/:branchId               // Update branch
DELETE /branches/:branchId               // Delete branch (admin only)

GET    /branches/:branchId/tree          // Get family tree data
GET    /branches/:branchId/statistics    // Branch statistics
GET    /branches/:branchId/members       // List members
POST   /branches/:branchId/members       // Invite member
GET    /branches/:branchId/join-requests // List join requests
POST   /branches/:branchId/join          // Request to join

// Persons
GET    /branches/:branchId/persons       // List people in branch
POST   /branches/:branchId/persons       // Add person
GET    /persons/:personId                // Get person details
PATCH  /persons/:personId                // Update person
DELETE /persons/:personId                // Delete person

GET    /persons/:personId/ancestors      // Get ancestors
GET    /persons/:personId/descendants    // Get descendants
GET    /persons/:personId/relatives      // Get relatives (cousins, etc.)
GET    /persons/:personId/timeline       // Life timeline

// Relationships
POST   /persons/:personId/relationships  // Add relationship (spouse, etc.)
GET    /persons/:personId/relationships  // List relationships
PATCH  /relationships/:relationshipId    // Update relationship
DELETE /relationships/:relationshipId    // Delete relationship

// Stories & Memories
GET    /branches/:branchId/stories       // List stories
POST   /branches/:branchId/stories       // Create story
GET    /stories/:storyId                 // Get story
PATCH  /stories/:storyId                 // Update story
DELETE /stories/:storyId                 // Delete story
POST   /stories/:storyId/comments        // Add comment
POST   /stories/:storyId/reactions       // Add reaction

// Documents & Photos
POST   /documents/upload                 // Upload document
GET    /documents/:documentId            // Get document
PATCH  /documents/:documentId            // Update metadata
DELETE /documents/:documentId            // Delete document

GET    /persons/:personId/photos         // Get person's photos
POST   /persons/:personId/photos         // Add photo to person

// Disputes
POST   /disputes                         // Raise dispute
GET    /disputes/:disputeId              // Get dispute details
PATCH  /disputes/:disputeId              // Update dispute
POST   /disputes/:disputeId/vote         // Vote on dispute
POST   /disputes/:disputeId/comments     // Add comment
POST   /disputes/:disputeId/evidence     // Submit evidence

// Root Changes
POST   /branches/:branchId/root-changes  // Propose root change
GET    /root-changes/:proposalId         // Get proposal
PATCH  /root-changes/:proposalId         // Update proposal
POST   /root-changes/:proposalId/vote    // Vote on proposal
POST   /root-changes/:proposalId/approve // Guru approval
POST   /root-changes/:proposalId/execute // Execute (system)

// Search
GET    /search/branches?q=...            // Search branches
GET    /search/persons?q=...             // Search people
GET    /search/stories?q=...             // Search stories
GET    /search/global?q=...              // Global search

// Notifications
GET    /notifications                    // List notifications
PATCH  /notifications/:id/read           // Mark as read
DELETE /notifications/:id                // Dismiss notification
PATCH  /notifications/read-all           // Mark all as read

// Audit & History
GET    /persons/:personId/history        // Person change history
GET    /branches/:branchId/history       // Branch history
GET    /branches/:branchId/root-history  // Root change history

// Admin
GET    /admin/users                      // List users (admin)
PATCH  /admin/users/:userId/role         // Change role
GET    /admin/statistics                 // Platform statistics
GET    /admin/moderation/queue           // Moderation queue
```

### Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-10-16T10:30:00Z",
    "version": "1.0"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-16T10:30:00Z",
    "requestId": "req_abc123"
  }
}

// Pagination
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 245,
    "totalPages": 13,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.yml (development)
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: pustikorijen_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

volumes:
  postgres_data:
  minio_data:
```

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                     CloudFlare CDN                          │
│                  (SSL, DDoS Protection)                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────────┐
│                 Nginx (Load Balancer)                       │
│              (SSL Termination, Rate Limiting)               │
└─────────────────┬───────────────────────────────────────────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
┌─────▼────┐ ┌────▼────┐ ┌───▼─────┐
│  App     │ │  App    │ │  App    │  (Auto-scaling)
│ Server 1 │ │Server 2 │ │Server 3 │
└─────┬────┘ └────┬────┘ └───┬─────┘
      │           │           │
      └───────────┼───────────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
┌─────▼────┐ ┌────▼────┐ ┌───▼─────┐
│PostgreSQL│ │  Redis  │ │   S3    │
│(Primary) │ │ Cluster │ │Storage  │
└────┬─────┘ └─────────┘ └─────────┘
     │
┌────▼─────┐
│PostgreSQL│
│(Replica) │
└──────────┘
```

### Hosting Recommendations

**For MVP (Budget: ~$50-100/month):**
- **DigitalOcean Droplets** or **Hetzner Cloud**
  - 1x App Server: $24/month (4GB RAM, 2 vCPUs)
  - 1x PostgreSQL: $24/month (4GB RAM)
  - 1x Redis: $12/month (1GB RAM)
  - S3 Storage: ~$5/month (100GB)
  - CloudFlare: Free tier

**For Growth (Budget: ~$200-500/month):**
- **DigitalOcean Kubernetes** or **AWS EKS**
  - 3x App Servers (auto-scaling)
  - Managed PostgreSQL with replicas
  - Managed Redis cluster
  - CDN (CloudFlare Pro)

---

## Performance Considerations

### Caching Strategy

```
1. API Response Caching (Redis)
   - Branch tree: Cache for 5 minutes
   - Person details: Cache for 10 minutes
   - Stories list: Cache for 2 minutes
   - Search results: Cache for 1 minute

2. Database Query Caching
   - Common ancestor queries
   - Generation calculations
   - Branch statistics

3. CDN Caching
   - Static assets: 1 year
   - Photos/documents: 30 days
   - API responses (GET): 1 minute
```

### Database Optimization

```sql
-- Materialized view for common queries
CREATE MATERIALIZED VIEW branch_statistics AS
SELECT
  b.branch_id,
  b.surname,
  COUNT(DISTINCT p.person_id) as total_people,
  MAX(p.generation_number) as total_generations,
  MIN(p.birth_year) as oldest_ancestor_year,
  COUNT(DISTINCT CASE WHEN p.is_living = TRUE THEN p.person_id END) as living_count
FROM family_branches b
LEFT JOIN persons p ON p.branch_id = b.branch_id
GROUP BY b.branch_id, b.surname;

-- Refresh periodically
CREATE INDEX idx_branch_stats_id ON branch_statistics(branch_id);

-- Recursive CTE for ancestor queries
WITH RECURSIVE ancestors AS (
  SELECT person_id, father_id, mother_id, 1 as level
  FROM persons
  WHERE person_id = $1

  UNION ALL

  SELECT p.person_id, p.father_id, p.mother_id, a.level + 1
  FROM persons p
  INNER JOIN ancestors a ON p.person_id IN (a.father_id, a.mother_id)
  WHERE a.level < 10  -- Limit recursion depth
)
SELECT * FROM ancestors;
```

---

## Security Measures

### Application Security

```typescript
// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Helmet.js - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));

// Input validation with Zod
const personSchema = z.object({
  full_name: z.string().min(2).max(255),
  birth_year: z.number().min(1000).max(new Date().getFullYear()),
  // ...
});

// SQL injection prevention (Prisma)
// Prisma ORM automatically prevents SQL injection

// XSS prevention
// - Sanitize user input
// - Use React (auto-escapes)
// - Content Security Policy headers
```

### Authentication Flow

```typescript
// JWT-based authentication
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "accessToken": "eyJhbGc...",  // Expires in 15 minutes
  "refreshToken": "dGhpc2lz...", // Expires in 7 days
  "user": { ... }
}

// Refresh token flow
POST /auth/refresh
Authorization: Bearer <refreshToken>

Response:
{
  "accessToken": "eyJhbGc...",  // New access token
}

// All protected endpoints
GET /branches/:id
Authorization: Bearer <accessToken>
```

---

## Monitoring & Logging

### Application Monitoring

```typescript
// Winston Logger
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Sentry for error tracking
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Metrics with Prometheus
import promClient from 'prom-client';

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});
```

### Health Checks

```typescript
// Health check endpoint
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2025-10-16T10:30:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "storage": "healthy"
  },
  "uptime": 86400,  // seconds
  "version": "1.0.0"
}
```

---

## Development Workflow

### Git Workflow

```
main (production)
  ↑
  └─ staging
      ↑
      └─ develop
          ↑
          ├─ feature/family-tree-ui
          ├─ feature/auth-system
          ├─ bugfix/profile-loading
          └─ hotfix/security-patch
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Run build
        run: npm run build

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: ./scripts/deploy-staging.sh

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: ./scripts/deploy-production.sh
```

---

## Summary

### Recommended Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- React Query + Zustand
- D3.js for tree visualization

**Backend:**
- Node.js 20 + Express
- TypeScript
- Prisma ORM
- PostgreSQL 15

**Infrastructure:**
- Docker + Docker Compose
- DigitalOcean/Hetzner for hosting
- CloudFlare for CDN
- GitHub Actions for CI/CD

**Why This Stack:**
✅ Rapid development
✅ Type safety everywhere
✅ Modern, well-supported
✅ Cost-effective for MVP
✅ Easy to scale later
✅ Great developer experience

### Next Implementation Steps

1. **Project Setup** (Week 1)
   - Initialize Git repository
   - Set up monorepo structure
   - Configure TypeScript
   - Set up Docker development environment

2. **Database Setup** (Week 1-2)
   - Create Prisma schema
   - Set up PostgreSQL
   - Create migrations
   - Seed development data

3. **Backend MVP** (Week 2-4)
   - Authentication system
   - User management
   - Branch & person CRUD
   - Basic API endpoints

4. **Frontend MVP** (Week 3-6)
   - Authentication UI
   - Family tree visualization
   - Person profile pages
   - Branch management

5. **Testing & Deployment** (Week 7-8)
   - Write tests
   - Set up CI/CD
   - Deploy to staging
   - Beta testing

**Estimated MVP Timeline:** 8-10 weeks with a small team (2-3 developers)

Would you like me to create the initial project structure and configuration files?
