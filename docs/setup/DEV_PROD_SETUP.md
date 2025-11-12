# Development vs Production Setup

This document explains the development and production environment setup for Pustikorijen.

## Overview

We now have **completely separated development and production environments** to avoid conflicts and confusion.

---

## Production Environment

### Frontend (Static Build)
- **URL:** https://pustikorijen.vibengin.com
- **Location:** `/home/bohhem/projects/pustikorijen/frontend/dist`
- **Server:** Nginx (serves static files)
- **Build:** Production build created with `npm run build`
- **Environment:** Uses `.env.production`
- **API Endpoint:** Points to `https://api-pustikorijen.vibengin.com`

### Backend (Node.js API)
- **URL:** https://api-pustikorijen.vibengin.com
- **Port:** 5000
- **Process:** Systemd service (`pustikorijen-backend.service`)
- **Environment:** Uses `.env.production`
- **Database:** `pustikorijen_dev` on localhost:5433
- **Auto-start:** Yes (enabled in systemd)

**Service Management:**
```bash
# Check status
sudo systemctl status pustikorijen-backend

# Restart
sudo systemctl restart pustikorijen-backend

# View logs
sudo journalctl -u pustikorijen-backend -f

# Stop
sudo systemctl stop pustikorijen-backend
```

---

## Development Environment

### Frontend (Dev Server)
- **URL:** http://localhost:3000
- **Port:** 3000
- **Process:** Vite dev server with HMR
- **Environment:** Uses `.env.development`
- **API Endpoint:** Points to `http://localhost:5001`

**Start Dev Server:**
```bash
cd /home/bohhem/projects/pustikorijen/frontend
npm run dev
```

### Backend (Dev Server)
- **URL:** http://localhost:5001
- **Port:** 5001 (different from production!)
- **Process:** tsx watch mode (auto-restart on changes)
- **Environment:** Uses `.env.development`
- **Database:** Same as production (shared dev database)

**Start Dev Server:**
```bash
cd /home/bohhem/projects/pustikorijen/backend
npm run dev
```

---

## Port Allocation

| Service | Environment | Port | URL |
|---------|-------------|------|-----|
| Backend | Production | 5000 | https://api-pustikorijen.vibengin.com |
| Backend | Development | 5001 | http://localhost:5001 |
| Frontend | Production | N/A | https://pustikorijen.vibengin.com (nginx serves static files) |
| Frontend | Development | 3000 | http://localhost:3000 |

---

## Environment Files

### Backend

- **`.env.production`** - Used by systemd service (production)
  - `PORT=5000`
  - `NODE_ENV=production`
  - `API_URL=https://api-pustikorijen.vibengin.com`
  - `GOOGLE_CLIENT_ID=<google-oauth-client-id>`
  - `FACEBOOK_APP_ID=<facebook-app-id>`
  - `FACEBOOK_APP_SECRET=<facebook-app-secret>`

- **`.env.development`** - Used by `npm run dev` (local development)
  - `PORT=5001`
  - `NODE_ENV=development`
  - `API_URL=http://localhost:5001`
  - `GOOGLE_CLIENT_ID=<google-oauth-client-id>`
  - `FACEBOOK_APP_ID=<facebook-app-id>`
  - `FACEBOOK_APP_SECRET=<facebook-app-secret>`

- **`.env`** - Deprecated, kept for backwards compatibility
  - Falls back to development settings

### Backup & Restore configuration

The backup UI and restore worker read the following variables from the backend `.env.*` files:

- `BACKUP_STORAGE_DIR` – Filesystem path that stores the `database.sql.gz` archives.
- `BACKUP_DEFAULT_RETENTION_DAYS` / `BACKUP_WORKER_POLL_MS` – Controls how long snapshots stick around and how often the worker checks for new jobs.
- `BACKUP_SOURCE_ENV` / `BACKUP_RESTORE_CONFIRM_TEMPLATE` – Labels snapshots and defines the confirmation phrase (`RESTORE {backupId}` by default).
- `RESTORE_WORKER_ENABLED` / `RESTORE_WORKER_POLL_MS` – Enables the restore worker loop.
- `RESTORE_TARGET_<ENV>_URL` – **At least one is required** (e.g. `RESTORE_TARGET_STAGING_URL=postgres://...`). The Admin → Backups page hides the “Restore” button until these targets exist.

### Frontend

- **`.env.production`** - Used by `npm run build` (production builds)
  - `VITE_API_URL=https://api-pustikorijen.vibengin.com`
  - `VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>`
  - `VITE_FACEBOOK_APP_ID=<facebook-app-id>`

- **`.env.development`** - Used by `npm run dev` (local development)
  - `VITE_API_URL=http://localhost:5001`
  - `VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>`
  - `VITE_FACEBOOK_APP_ID=<facebook-app-id>`

- **`.env`** - Deprecated, kept for backwards compatibility
  - Falls back to development settings

---

## Typical Workflows

### Working on Local Development

```bash
# Terminal 1 - Start backend dev server
cd /home/bohhem/projects/pustikorijen/backend
npm run dev

# Terminal 2 - Start frontend dev server
cd /home/bohhem/projects/pustikorijen/frontend
npm run dev

# Access at: http://localhost:3000
# API calls go to: http://localhost:5001
```

**Benefits:**
- Hot reload on both frontend and backend
- Changes reflected immediately
- No need to rebuild
- Separate from production

### Deploying to Production

```bash
# 1. Build backend (if needed)
cd /home/bohhem/projects/pustikorijen/backend
npm run build

# 2. Restart backend service
sudo systemctl restart pustikorijen-backend

# 3. Build frontend
cd /home/bohhem/projects/pustikorijen/frontend
npm run build

# Frontend is automatically served by nginx from dist/
# No restart needed - just refresh browser
```

**Important:** Production uses the built files, so you must run `npm run build` after making changes.

---

## Checking What's Running

```bash
# Check all services
sudo ss -tlnp | grep -E ":(3000|5000|5001)"

# Check production backend
sudo systemctl status pustikorijen-backend

# Check if dev servers are running
ps aux | grep -E "vite|tsx" | grep pustikorijen
```

---

## Common Issues

### "Port already in use"

**Problem:** Dev backend won't start because port 5001 is in use.

**Solution:**
```bash
# Find what's using the port
sudo ss -tlnp | grep :5001

# Kill the process if needed
kill <PID>
```

### "API not responding" in development

**Checklist:**
1. Is dev backend running? `ps aux | grep tsx | grep pustikorijen`
2. Is it on port 5001? `curl http://localhost:5001/api/v1`
3. Is frontend pointing to port 5001? Check `frontend/.env.development`

### Production site not updated

**Problem:** Made changes but production site doesn't show them.

**Solution:**
```bash
# Frontend changes - rebuild
cd frontend
npm run build

# Backend changes - rebuild and restart
cd backend
npm run build
sudo systemctl restart pustikorijen-backend

# Clear browser cache or hard refresh (Ctrl+Shift+R)
```

---

## Database

Both development and production currently share the **same database**:
- `pustikorijen_dev` on `localhost:5433`

**Future Improvement:** Create separate production database.

---

## Security Notes

⚠️ **Important:** The production `.env.production` file contains the same JWT secrets as development. These should be changed to strong, unique secrets before going to production with real users.

```bash
# Generate secure secrets
openssl rand -base64 32
```

Update the following in `.env.production`:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

---

## Quick Reference

### Start Everything (Development)
```bash
# Backend
cd ~/projects/pustikorijen/backend && npm run dev &

# Frontend
cd ~/projects/pustikorijen/frontend && npm run dev &
```

### Deploy to Production
```bash
cd ~/projects/pustikorijen
npm run build  # Builds both backend and frontend
sudo systemctl restart pustikorijen-backend
```

### Check Production Status
```bash
# Backend API
curl https://api-pustikorijen.vibengin.com/api/v1

# Frontend
curl -I https://pustikorijen.vibengin.com

# Service status
sudo systemctl status pustikorijen-backend
```

---

## Viewing Logs

### Quick Access Scripts

We've created helper scripts for viewing logs:

```bash
# Production logs
./scripts/logs-prod.sh

# Development logs
./scripts/logs-dev.sh

# Start dev servers with logging
./scripts/start-dev.sh
```

### Production Logs (Manual)

```bash
# Real-time backend logs
sudo journalctl -u pustikorijen-backend -f

# Last 50 lines
sudo journalctl -u pustikorijen-backend -n 50

# Errors only
sudo journalctl -u pustikorijen-backend | grep -i error

# Since 1 hour ago
sudo journalctl -u pustikorijen-backend --since "1 hour ago"
```

### Development Logs (Manual)

Development logs are saved to `logs/` directory:

```bash
# Watch backend logs
tail -f logs/dev-backend.log

# Watch frontend logs
tail -f logs/dev-frontend.log

# Watch both
tail -f logs/dev-*.log

# Search for errors
grep -i error logs/dev-backend.log
```

---

**Last Updated:** 2025-10-18

**Status:** ✅ Fully configured and tested
