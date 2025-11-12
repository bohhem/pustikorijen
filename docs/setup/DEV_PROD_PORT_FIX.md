# Development vs Production Port Configuration - Fix Summary

## Problem Identified

The development backend was crashing with `EADDRINUSE` error because:
1. Production backend was running on port 5000 (systemd service)
2. Development backend was also trying to bind to port 5000
3. The `.env.development` file had PORT=5001 configured, but it wasn't being loaded
4. `dotenv.config()` was loading `.env` by default, not `.env.development`

**Additional Issue**: The `backup_snapshots` table existed in the database but wasn't properly synced with Prisma.

## Root Causes

1. **Environment file not loaded**: The `dotenv.config()` in `backend/src/index.ts` was loading `.env` instead of `.env.development`
2. **Missing NODE_ENV in dev script**: The `npm run dev` script didn't set `NODE_ENV=development`
3. **Prisma client out of sync**: Prisma client needed regeneration after database changes

## Solutions Applied

### 1. Fixed Environment File Loading

**File**: `backend/src/index.ts`

```typescript
// Before:
dotenv.config();

// After:
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';
dotenv.config({ path: envFile });
```

### 2. Updated Dev Script

**File**: `backend/package.json`

```json
// Before:
"dev": "tsx watch src/index.ts",

// After:
"dev": "NODE_ENV=development tsx watch src/index.ts",
```

### 3. Regenerated Prisma Client

```bash
cd backend
npx prisma db pull --force
npx prisma generate
```

## Current Configuration

### Production Backend
- **Port**: 5000
- **Service**: pustikorijen-backend.service (systemd)
- **Environment**: NODE_ENV=production
- **Config File**: `.env.production`
- **Command**: `npm start` → `node dist/index.js`
- **URL**: https://api-pustikorijen.vibengin.com

### Development Backend
- **Port**: 5001
- **Service**: Manual (npm run dev)
- **Environment**: NODE_ENV=development
- **Config File**: `.env.development`
- **Command**: `npm run dev` → `NODE_ENV=development tsx watch src/index.ts`
- **URL**: http://localhost:5001

### Backup Worker
- **Production**: Starts automatically with backend on port 5000
- **Development**: Starts automatically with backend on port 5001
- **Configuration**: Same environment variables, different database connections
- **Poll Interval**: 5000ms (5 seconds)

## Verification

All systems working correctly:

```bash
# Production backend
$ curl http://localhost:5000/health
{"status":"ok","message":"Pustikorijen API is running"}

# Development backend
$ curl http://localhost:5001/health
{"status":"ok","message":"Pustikorijen API is running"}

# Check ports
$ sudo ss -tlnp | grep -E ":(5000|5001)"
LISTEN 0      511                *:5000             *:*    users:(("node",pid=3149467,fd=19))
LISTEN 0      511                *:5001             *:*    users:(("node",pid=3167217,fd=109))
```

## Development Workflow

### Start Development Backend
```bash
cd /home/bohhem/projects/pustikorijen/backend
npm run dev
```

This will:
1. Set NODE_ENV=development
2. Load `.env.development`
3. Start server on port 5001
4. Start backup worker with development database
5. Enable hot-reload with tsx watch

### Start Development Frontend
```bash
cd /home/bohhem/projects/pustikorijen/frontend
npm run dev
```

This will:
1. Start Vite dev server on port 5173
2. Proxy API requests to http://localhost:5001

### Access Development Environment
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001/api/v1
- Backend Health: http://localhost:5001/health

## Production Workflow

Production backend runs as systemd service and is managed via:

```bash
# Restart production (includes build)
./restart.sh

# Or restart just the backend service
sudo systemctl restart pustikorijen-backend.service

# View logs
sudo journalctl -u pustikorijen-backend.service -f
```

## Key Benefits

1. ✅ **No port conflicts**: Dev (5001) and prod (5000) can run simultaneously
2. ✅ **Proper environment isolation**: Different databases, different configs
3. ✅ **Hot reload in development**: tsx watch automatically restarts on changes
4. ✅ **Backup worker works in both**: Automatically starts with each backend
5. ✅ **Clear separation**: Production uses systemd, development uses npm scripts

## Documentation Updated

- ✅ `QUICK_REFERENCE.md` - Added dev/prod port information
- ✅ `PORT_ALLOCATION.md` - Updated Pustikorijen port assignments
- ✅ `DEV_PROD_PORT_FIX.md` - This document

## Environment Variables

### Production (.env.production)
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://...@localhost:5432/pustikorijen_prod"
```

### Development (.env.development)
```bash
NODE_ENV=development
PORT=5001
DATABASE_URL="postgresql://...@localhost:5433/pustikorijen_dev"
```

## Future Improvements

Consider:
1. Add `dotenv-cli` package for more robust environment loading
2. Create separate npm scripts for different environments: `dev:local`, `dev:staging`
3. Add environment validation at startup
4. Document frontend environment configuration (.env.local)

## Troubleshooting

### Dev backend still crashes with EADDRINUSE
```bash
# Check what's on port 5001
sudo ss -tlnp | grep 5001

# Kill any process on port 5001
sudo fuser -k 5001/tcp

# Restart dev backend
cd backend && npm run dev
```

### Backup worker fails in development
```bash
# Check if backup_snapshots table exists
PGPASSWORD=password psql -h 127.0.0.1 -p 5433 -U pustikorijen -d pustikorijen_dev -c "\dt backup_snapshots"

# Regenerate Prisma client
cd backend
npx prisma generate
```

### Wrong environment file loaded
```bash
# Verify NODE_ENV is set correctly
echo $NODE_ENV

# Check which port the backend is using
curl http://localhost:5001/health  # Dev
curl http://localhost:5000/health  # Prod
```

## Summary

**Problem**: Dev backend crashed because prod backend was using port 5000

**Solution**:
1. Configure dev backend to use port 5001
2. Load correct environment file based on NODE_ENV
3. Set NODE_ENV=development in npm dev script

**Result**: Both dev and prod backends can now run simultaneously without conflicts, each with their own database and configuration.
