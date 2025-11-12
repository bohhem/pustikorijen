# Backup Worker Information

## Overview

The backup worker is **automatically started** when the backend service starts. It's not a separate service or process - it runs as part of the main backend Node.js process.

## How It Works

### Start Process
1. Backend starts: `node dist/index.js`
2. Server listens on port 5000
3. `startBackupWorker()` is called automatically
4. Worker polls database every 5 seconds for pending backups

### Architecture
```
┌─────────────────────────────────────────┐
│  Pustikorijen Backend (Node.js)         │
│                                         │
│  ┌────────────┐    ┌────────────────┐  │
│  │ Express    │    │ Backup Worker  │  │
│  │ API        │    │ (setInterval)  │  │
│  │ Port 5000  │    │ Poll: 5s       │  │
│  └────────────┘    └────────────────┘  │
│                                         │
│  Single Node.js Process (PID 512136)   │
└─────────────────────────────────────────┘
```

## Configuration

The backup worker is configured via environment variables in `.env.production`:

```bash
# Enable/disable worker
BACKUP_WORKER_ENABLED=true  # Set to 'false' to disable

# Polling interval (milliseconds)
BACKUP_WORKER_POLL_MS=5000  # Check every 5 seconds

# Storage directory
BACKUP_STORAGE_DIR=/home/bohhem/projects/backups  # Where backups are stored

# Database connection for backups
BACKUP_DATABASE_URL=postgresql://...  # Database to backup
```

## What It Does

1. **Polls for pending backups** every 5 seconds
2. **Creates pg_dump archives** when requested
3. **Compresses backups** with gzip
4. **Stores in filesystem** at BACKUP_STORAGE_DIR
5. **Updates database** with backup status

## Important Notes

### ✅ Good to Know:
- **Integrated**: Worker is part of backend, not separate
- **Automatic**: Starts when backend starts, stops when backend stops
- **No extra service**: No separate systemd service needed
- **Shared resources**: Uses same Node.js process as API
- **Single restart**: Restarting backend restarts both API and worker

### ⚠️ Implications for Restart:

When you restart the backend service:
```bash
sudo systemctl restart pustikorijen-backend.service
```

Both the API **and** the backup worker restart together. This means:
- Any in-progress backup will be interrupted
- Worker will resume polling after restart
- Pending backups will be picked up after restart

### 🔧 Troubleshooting:

**Worker not running:**
- Check if backend is running: `sudo systemctl status pustikorijen-backend.service`
- Worker starts with backend automatically
- Check logs: `sudo journalctl -u pustikorijen-backend.service | grep BackupWorker`

**Worker disabled:**
- Check `.env.production` for `BACKUP_WORKER_ENABLED=false`
- Set to `true` and restart backend

**Backups failing:**
- Check `BACKUP_DATABASE_URL` is set correctly
- Check `BACKUP_STORAGE_DIR` exists and is writable
- Check logs for error messages

## Logs

To see backup worker activity:

```bash
# Watch live
sudo journalctl -u pustikorijen-backend.service -f | grep BackupWorker

# Recent activity
sudo journalctl -u pustikorijen-backend.service -n 100 | grep BackupWorker
```

Expected log messages:
```
[BackupWorker] Starting with poll interval 5000ms. Storage root: /home/bohhem/projects/backups
[BackupWorker] backup_123: processing snapshot_abc
[BackupWorker] backup_123: completed
```

## Monitoring

### Check Worker Status:
```bash
# Worker is running if backend is running
sudo systemctl status pustikorijen-backend.service

# Check for recent backup activity
sudo journalctl -u pustikorijen-backend.service | tail -100 | grep -i backup
```

### Check Backup Storage:
```bash
# List backups
ls -lh /home/bohhem/projects/backups/

# Check disk usage
du -sh /home/bohhem/projects/backups/
```

### Check Database:
```sql
-- Recent backups
SELECT backup_id, status, started_at, completed_at
FROM backup_snapshots
ORDER BY started_at DESC
LIMIT 10;

-- Pending backups
SELECT * FROM backup_snapshots WHERE status = 'PENDING';
```

## Restart Behavior

### What Happens During Restart:

1. **Stop Command** (`systemctl stop`):
   - Express server closes
   - Worker interval is cleared
   - Any in-progress backup is interrupted
   - Process exits

2. **Start Command** (`systemctl start`):
   - New Node.js process starts
   - Express server starts on port 5000
   - Worker starts polling immediately
   - Resumes processing pending backups

### Safe Restart Timing:

Best times to restart:
- ✅ When no backups are in progress
- ✅ During low-traffic periods
- ✅ After checking for pending backups

Check before restart:
```sql
SELECT COUNT(*) FROM backup_snapshots
WHERE status IN ('PENDING', 'PROCESSING');
```

If count > 0, consider waiting for completion or proceeding with caution.

## Integration with Restart Script

The `restart.sh` script handles the backend service correctly:

```bash
# Stops backend (API + Worker)
sudo systemctl stop pustikorijen-backend.service

# Rebuilds code
npm run build

# Starts backend (API + Worker)
sudo systemctl start pustikorijen-backend.service
```

**No special handling needed** - worker automatically starts/stops with backend.

## Environment Variables Summary

| Variable | Default | Purpose |
|----------|---------|---------|
| `BACKUP_WORKER_ENABLED` | `true` | Enable/disable worker |
| `BACKUP_WORKER_POLL_MS` | `5000` | Poll interval (ms) |
| `BACKUP_STORAGE_DIR` | `../backups` | Storage location |
| `BACKUP_DATABASE_URL` | `DATABASE_URL` | Database connection |

## Quick Reference

```bash
# Check if worker is running (check backend)
sudo systemctl status pustikorijen-backend.service

# View worker logs
sudo journalctl -u pustikorijen-backend.service | grep BackupWorker

# Restart (restarts both API and worker)
./restart.sh

# Disable worker temporarily
# Edit .env.production: BACKUP_WORKER_ENABLED=false
# Then: sudo systemctl restart pustikorijen-backend.service
```

## Summary

✅ **Worker is integrated** - Part of backend, not separate
✅ **Automatic lifecycle** - Starts/stops with backend
✅ **Simple management** - Managed via backend service
✅ **No special restart** - Use `./restart.sh` as normal
✅ **Shared process** - Same PID as API server

When you restart the backend with `./restart.sh`, the backup worker is automatically restarted as well!
