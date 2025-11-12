# Pustikorijen Quick Reference Card

## 🚀 Common Commands

### Production Operations
```bash
# Full restart (recommended for deployments)
./restart.sh

# Quick backend restart only
sudo systemctl restart pustikorijen-backend.service

# Clean zombie processes
./cleanup-zombies.sh
```

### Monitoring
```bash
# Check service status
sudo systemctl status pustikorijen-backend.service

# Watch logs live
sudo journalctl -u pustikorijen-backend.service -f

# Check what's running
ps aux | grep pustikorijen | grep -v grep

# Check port usage
sudo ss -tlnp | grep 5000
```

### Testing
```bash
# Test production backend API
curl http://localhost:5000/health

# Test development backend API
curl http://localhost:5001/health

# Test via domain
curl https://api-pustikorijen.vibengin.com/health

# Test frontend
curl -I https://pustikorijen.vibengin.com
```

## 📂 Project Structure

```
/home/bohhem/projects/pustikorijen/
├── backend/                  # Node.js API
│   ├── src/                 # TypeScript source
│   ├── dist/                # Compiled JavaScript
│   └── .env.production      # Production environment
│
├── frontend/                # React application
│   ├── src/                # React source
│   └── dist/               # Built static files (served by nginx)
│
├── restart.sh              # Production restart script
├── cleanup-zombies.sh      # Kill orphaned processes
└── RESTART_ISSUES_SOLUTION.md  # Full documentation
```

## 🔧 Troubleshooting

### Backend not responding
```bash
# Check if service is running
sudo systemctl status pustikorijen-backend.service

# Check logs for errors
sudo journalctl -u pustikorijen-backend.service -n 50

# Restart backend
sudo systemctl restart pustikorijen-backend.service
```

### Port already in use
```bash
# Check what's on port 5000
sudo ss -tlnp | grep 5000

# Kill zombies
./cleanup-zombies.sh

# Force kill on port if needed
sudo fuser -k 5000/tcp
```

### Frontend not loading
```bash
# Check if dist/ exists
ls -la frontend/dist/

# Rebuild frontend
cd frontend && npm run build

# Check nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Too many processes
```bash
# Count pustikorijen processes
ps aux | grep pustikorijen | grep node | wc -l

# Clean up
./cleanup-zombies.sh
```

## 🌐 Access URLs

| Service | URL | Port |
|---------|-----|------|
| Frontend | https://pustikorijen.vibengin.com | 443 (nginx) |
| Backend API (Prod) | https://api-pustikorijen.vibengin.com | 443 → 5000 |
| Backend Health (Prod) | http://localhost:5000/health | 5000 |
| Backend API (Dev) | http://localhost:5001/api/v1 | 5001 |
| Backend Health (Dev) | http://localhost:5001/health | 5001 |
| Prisma Studio | http://localhost:5555 | 5555 |

## 📋 Service Information

### Backend Service (Production)
- **Name**: pustikorijen-backend.service
- **Type**: systemd service
- **User**: bohhem
- **Command**: `npm start` (runs `node dist/index.js`)
- **Port**: 5000
- **Auto-restart**: Yes
- **Includes**: Backup worker (integrated)

### Backend Service (Development)
- **Command**: `npm run dev` (runs `tsx watch src/index.ts`)
- **Port**: 5001
- **Environment**: NODE_ENV=development
- **Auto-reload**: Yes (tsx watch)
- **Includes**: Backup worker (integrated)

### Frontend
- **Served by**: nginx (static files)
- **Location**: `/home/bohhem/projects/pustikorijen/frontend/dist`
- **Build command**: `npm run build`
- **No service needed**: nginx serves files directly

## 🔄 Deployment Workflow (Production)

1. **Pull changes:**
   ```bash
   cd /home/bohhem/projects/pustikorijen
   git pull
   ```

2. **Install dependencies** (if package.json changed):
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Restart services:**
   ```bash
   cd /home/bohhem/projects/pustikorijen
   ./restart.sh
   ```

4. **Verify:**
   ```bash
   curl http://localhost:5000/health
   ```

## 🔧 Development Workflow

1. **Start development backend:**
   ```bash
   cd /home/bohhem/projects/pustikorijen/backend
   npm run dev  # Runs on port 5001
   ```

2. **Start development frontend:**
   ```bash
   cd /home/bohhem/projects/pustikorijen/frontend
   npm run dev  # Runs on port 5173 (Vite)
   ```

3. **Access:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001/api/v1
   - Backend Health: http://localhost:5001/health

4. **Stop development servers:**
   ```bash
   # Kill by process name
   pkill -f 'tsx watch'
   pkill -f 'vite'
   ```

**Note**: Development and production backends can run simultaneously on different ports (5001 and 5000).

## ⚠️ Important Notes

- **Don't run dev servers on production** - Use systemd service
- **Always clean zombies** before troubleshooting: `./cleanup-zombies.sh`
- **Frontend is static** - No Node process needed, nginx serves dist/
- **Backend logs** - Check with journalctl, not console
- **Port conflicts** - Use cleanup script to resolve

## 🆘 Emergency Commands

```bash
# Kill all Pustikorijen processes (nuclear option)
ps aux | grep pustikorijen | grep node | awk '{print $2}' | xargs kill -9

# Restart everything
sudo systemctl daemon-reload
./restart.sh

# Check system resources
htop  # Press F4, type "pustikorijen"
```

## 📞 Quick Diagnostics

Run this diagnostic one-liner:
```bash
echo "=== Services ===" && \
sudo systemctl status pustikorijen-backend.service --no-pager | grep Active && \
echo "=== Ports ===" && \
sudo ss -tlnp | grep :5000 && \
echo "=== Processes ===" && \
ps aux | grep pustikorijen | grep node | wc -l && \
echo "=== API Health ===" && \
curl -s http://localhost:5000/health
```

## 📚 Full Documentation

- **Detailed solution**: `less RESTART_ISSUES_SOLUTION.md`
- **Port management**: `less ../PORT_ALLOCATION.md`
- **Port management script**: `../manage-ports.sh help`
