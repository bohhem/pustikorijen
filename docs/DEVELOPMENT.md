# Pustikorijen - Development Guide

This guide will help you set up the development environment and start contributing to Pustikorijen.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Common Tasks](#common-tasks)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ and npm 10+ ([Download](https://nodejs.org/))
- **Docker** and Docker Compose ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))
- A code editor (we recommend [VS Code](https://code.visualstudio.com/))

### Verify Installation

```bash
node --version    # Should be v20.x.x or higher
npm --version     # Should be v10.x.x or higher
docker --version  # Should be 20.x.x or higher
git --version     # Should be 2.x.x or higher
```

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/[username]/pustikorijen.git
cd pustikorijen
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# This will also install dependencies for both backend and frontend
```

### 3. Set Up Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env

# Edit the .env files if needed (defaults should work for local development)
```

### 4. Start Docker Services

Start PostgreSQL, Redis, MinIO, and MailHog:

```bash
npm run docker:dev
```

Wait for all services to be healthy (you can check with `docker ps`).

### 5. Set Up Database

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed

cd ..
```

### 6. Start Development Servers

In separate terminal windows:

```bash
# Terminal 1 - Backend (runs on http://localhost:5000)
npm run dev:backend

# Terminal 2 - Frontend (runs on http://localhost:3000)
npm run dev:frontend
```

Or run both concurrently:

```bash
npm run dev
```

### 7. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api/v1
- **Health Check:** http://localhost:5000/health
- **MailHog UI:** http://localhost:8025 (email testing)
- **MinIO Console:** http://localhost:9001 (file storage, login: minioadmin/minioadmin)

## Project Structure

```
pustikorijen/
├── backend/                # Backend application (Node.js + Express)
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Business logic
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business services
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utility functions
│   │   └── index.ts       # Entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Seed data
│   ├── tests/             # Backend tests
│   └── package.json
│
├── frontend/              # Frontend application (React + TypeScript)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API services
│   │   ├── store/        # State management
│   │   ├── types/        # TypeScript types
│   │   ├── utils/        # Utility functions
│   │   ├── styles/       # Global styles
│   │   ├── App.tsx       # Root component
│   │   └── main.tsx      # Entry point
│   ├── public/           # Static assets
│   └── package.json
│
├── docker/               # Docker configuration
│   └── docker-compose.dev.yml
│
├── docs/                 # Documentation
│   ├── 01-project-overview.md
│   ├── 02-ui-mockups.md
│   ├── ... (and more)
│   └── DEVELOPMENT.md (this file)
│
├── scripts/              # Utility scripts
├── package.json          # Root package.json (workspace)
├── README.md
├── PROJECT_STATUS.md
└── QUICKSTART.md
```

## Development Workflow

### Branching Strategy

We follow a simplified Git Flow:

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
# Make sure you're on develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your feature...
git add .
git commit -m "Add: your feature description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### Commit Message Convention

Use conventional commits:

```
type(scope): description

Examples:
- feat(auth): add email verification
- fix(tree): correct generation calculation
- docs(readme): update installation steps
- style(ui): improve button styling
- refactor(api): simplify user controller
- test(auth): add login tests
- chore(deps): update dependencies
```

## Common Tasks

### Database Management

```bash
cd backend

# Create a new migration after schema changes
npm run db:migrate

# Reset database (WARNING: deletes all data)
npm run db:reset

# Open Prisma Studio (database GUI)
npm run db:studio

# Generate Prisma client (after schema changes)
npm run db:generate
```

### Running Tests

```bash
# Backend tests
cd backend
npm test
npm run test:watch
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:ui
npm run test:coverage
```

### Linting and Formatting

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Format all code
npm run format

# Backend only
cd backend
npm run lint
npm run format

# Frontend only
cd frontend
npm run lint
npm run format
```

### Building for Production

```bash
# Build both backend and frontend
npm run build

# Build backend only
cd backend
npm run build

# Build frontend only
cd frontend
npm run build
```

### Docker Management

```bash
# Start services
npm run docker:dev

# Stop services
npm run docker:down

# View logs
npm run docker:logs

# Restart a specific service
docker-compose -f docker/docker-compose.dev.yml restart postgres

# Remove all containers and volumes (clean slate)
docker-compose -f docker/docker-compose.dev.yml down -v
```

## Testing

### Backend Testing

We use Jest for backend testing:

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

### Frontend Testing

We use Vitest and React Testing Library:

```bash
cd frontend

# Run all tests
npm test

# Run tests in UI mode
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Writing Tests

Backend test example:

```typescript
// backend/tests/auth.test.ts
import request from 'supertest';
import app from '../src/index';

describe('POST /auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

Frontend test example:

```typescript
// frontend/src/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders button text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Docker Services Won't Start

```bash
# Check if ports are already in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO

# Stop all Docker containers
docker stop $(docker ps -aq)

# Remove all containers and volumes
docker-compose -f docker/docker-compose.dev.yml down -v

# Start fresh
npm run docker:dev
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs pustikorijen_postgres

# Verify DATABASE_URL in backend/.env
# Should be: postgresql://pustikorijen:password@localhost:5432/pustikorijen_dev?schema=public
```

### Prisma Issues

```bash
cd backend

# Regenerate Prisma client
npm run db:generate

# Reset and recreate database
npm run db:reset

# If migrations fail, try:
rm -rf prisma/migrations
npm run db:migrate
```

### Runtime 500 Errors After Build (Unknown `branchId`/`createdAt`)

- **Symptoms:** Backend logs report `Unknown argument 'branchId'` (or `createdAt`) on Prisma queries once TypeScript has been compiled.
- **Root Cause:** The production database uses **snake_case** column names (`branch_id`, `created_at`, …) while a portion of our service layer was still calling the camelCase accessors that Prisma generates for *virtual* camel models. The ESBuild/TS compilation step strips the earlier alias hacks, so at runtime Prisma receives invalid field names and throws 500s.
- **Fix:** Always go through the shared Prisma alias (`backend/src/utils/prisma.ts`) or map raw results manually. When adding new queries, double-check the actual field name in `backend/prisma/schema.prisma` and convert the record back to camelCase before returning it to the frontend.
- **Verification:** Run `npm run build` (backend) and hit the affected endpoint (e.g. `/api/v1/branches/:id/partnerships`). If the response is 200 and the logs show no `Unknown argument` errors, the mapping is correct.

### Frontend Build Errors

```bash
cd frontend

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### Port Already in Use

```bash
# Find and kill process using port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Find and kill process using port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

## Development Tools

### Recommended VS Code Extensions

- **ESLint** - Linting
- **Prettier** - Code formatting
- **Prisma** - Prisma schema support
- **TypeScript** - TypeScript support
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **GitLens** - Git integration
- **REST Client** - API testing

### Environment URLs

Development:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API: http://localhost:5000/api/v1

Development Tools:
- MailHog: http://localhost:8025
- MinIO: http://localhost:9001
- Prisma Studio: `npm run db:studio` (opens automatically)

## Getting Help

- Check [PROJECT_STATUS.md](../PROJECT_STATUS.md) for current progress
- Check [QUICKSTART.md](../QUICKSTART.md) for quick reference
- Read other docs in the [docs/](.) folder
- Create an issue on GitHub
- Ask in GitHub Discussions

## Next Steps

Now that you have your development environment set up:

1. Check [PROJECT_STATUS.md](../PROJECT_STATUS.md) to see current status
2. Look at [GitHub Issues](https://github.com/[username]/pustikorijen/issues) for tasks
3. Pick an issue labeled `good first issue`
4. Create a feature branch and start coding!

Happy coding! 🚀
