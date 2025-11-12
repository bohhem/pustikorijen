# Pustikorijen Restart Issues - Root Causes & Solutions

## Problems Identified

### 1. **Zombie Vite Processes** 🧟
You have **12+ orphaned Vite dev servers** running since October 18-26, consuming resources and ports (3003-3010).

```
666879  node .../vite  (Oct 21)
723649  node .../vite  (Oct 21)
728644  node .../vite  (Oct 21)
737552  node .../vite  (Oct 21)
... and 8 more!
```

### 2. **Frontend Service Issue** ⚠️
The frontend systemd service is running `vite preview` on port 3000, but nginx expects static files from `dist/` folder.

**Current**: Frontend service tries ports 3000-3014, ends up on 3015!
**Expected**: nginx serves static files from `/home/bohhem/projects/pustikorijen/frontend/dist`

### 3. **Manual Dev Processes** 🔧
You have manual `tsx watch` and `vite` dev processes running alongside production services, causing confusion.

## Solutions

### IMMEDIATE FIX: Clean Up Zombie Processes

Run this script to kill all orphaned Pustikorijen processes:

```bash
#!/bin/bash
# Save as: cleanup-pustikorijen-zombies.sh

echo "Killing zombie Pustikorijen processes..."

# Kill all vite dev servers except systemd service
ps aux | grep 'pustikorijen.*vite' | grep -v '512094' | awk '{print $2}' | xargs -r kill -9

# Kill orphaned tsx/esbuild processes
ps aux | grep 'pustikorijen.*tsx' | grep -v '4186332' | awk '{print $2}' | xargs -r kill -9
ps aux | grep 'pustikorijen.*esbuild' | grep -v '512105' | awk '{print $2}' | xargs -r kill -9

# Kill Prisma Studio if not needed
ps aux | grep 'pustikorijen.*prisma studio' | awk '{print $2}' | xargs -r kill -9

echo "Cleanup complete! Check with: ps aux | grep pustikorijen"
```

### PROPER FIX: Correct Service Configuration

#### Problem with Current Setup:
1. Frontend service runs `vite preview` (dev server) instead of serving built files
2. nginx configuration expects static files but they're not being served correctly
3. No proper build step before deployment

#### Recommended Architecture:

**Option A: Serve Static Files via nginx (Recommended)**
```
Frontend: nginx serves /dist folder directly
Backend:  systemd service runs Node.js API on port 5000
```

**Option B: Use Vite Preview Server**
```
Frontend: systemd service runs vite preview on fixed port
Backend:  systemd service runs Node.js API on port 5000
```

## Implementation Steps

### Step 1: Clean Up Zombie Processes

```bash
cd /home/bohhem/projects/pustikorijen

# Create cleanup script
cat > cleanup-zombies.sh << 'EOF'
#!/bin/bash
echo "Stopping all non-systemd Pustikorijen processes..."

# Get systemd PIDs to preserve
BACKEND_PID=$(systemctl show pustikorijen-backend.service -p MainPID | cut -d= -f2)
FRONTEND_PID=$(systemctl show pustikorijen-frontend.service -p MainPID | cut -d= -f2)

echo "Preserving systemd services: Backend PID=$BACKEND_PID, Frontend PID=$FRONTEND_PID"

# Kill all other pustikorijen node processes
ps aux | grep 'pustikorijen.*node' | grep -v grep | grep -v "$BACKEND_PID" | grep -v "$FRONTEND_PID" | awk '{print $2}' | while read pid; do
    echo "Killing process $pid"
    kill -9 $pid 2>/dev/null || true
done

echo "Cleanup complete!"
echo ""
echo "Remaining processes:"
ps aux | grep pustikorijen | grep -v grep
EOF

chmod +x cleanup-zombies.sh
./cleanup-zombies.sh
```

### Step 2: Fix Frontend Service (Choose One Option)

#### Option A: Serve Static Files via nginx (RECOMMENDED)

**1. Disable frontend systemd service:**
```bash
sudo systemctl stop pustikorijen-frontend.service
sudo systemctl disable pustikorijen-frontend.service
```

**2. Build frontend:**
```bash
cd /home/bohhem/projects/pustikorijen/frontend
npm run build
```

**3. Verify nginx serves from dist:**
```bash
# nginx already configured correctly at line 246 of multi-project.conf:
# root /home/bohhem/projects/pustikorijen/frontend/dist;
```

**4. Test:**
```bash
curl -I https://pustikorijen.vibengin.com
```

#### Option B: Fix Vite Preview Server (Alternative)

**1. Update service file:**
```bash
sudo tee /etc/systemd/system/pustikorijen-frontend.service > /dev/null << 'EOF'
[Unit]
Description=Pustikorijen Frontend
After=network.target

[Service]
Type=simple
User=bohhem
WorkingDirectory=/home/bohhem/projects/pustikorijen/frontend
Environment="NODE_ENV=production"
Environment="PATH=/home/bohhem/.nvm/versions/node/v20.19.4/bin:/usr/bin:/usr/local/bin"
Environment="PORT=3015"  # Fixed port

# Ensure dist is built
ExecStartPre=/home/bohhem/.nvm/versions/node/v20.19.4/bin/npm run build

# Start preview server on fixed port
ExecStart=/home/bohhem/.nvm/versions/node/v20.19.4/bin/npm run preview -- --port 3015 --host 127.0.0.1

Restart=always
RestartSec=10

# Kill all child processes on stop
KillMode=control-group

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl restart pustikorijen-frontend.service
```

**2. Update nginx to proxy to 3015:**
```nginx
# In /etc/nginx/sites-available/multi-project.conf
# Update pustikorijen section:
server {
    server_name pustikorijen.vibengin.com;

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        # ... proxy settings
    }

    location / {
        proxy_pass http://localhost:3015;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # ... SSL settings
}
```

### Step 3: Create Proper Restart Scripts

```bash
cd /home/bohhem/projects/pustikorijen

# Create restart script
cat > restart.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Restarting Pustikorijen Services..."
echo ""

# Function to check service status
check_service() {
    if systemctl is-active --quiet $1; then
        echo "✅ $1 is running"
    else
        echo "❌ $1 is NOT running"
        return 1
    fi
}

# Stop services
echo "📍 Stopping services..."
sudo systemctl stop pustikorijen-backend.service
sudo systemctl stop pustikorijen-frontend.service 2>/dev/null || true

# Clean up any zombie processes
echo "🧹 Cleaning zombie processes..."
ps aux | grep 'pustikorijen.*node' | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true

# Backend: rebuild
echo "🏗️  Building backend..."
cd /home/bohhem/projects/pustikorijen/backend
npm run build

# Frontend: rebuild (if using static files)
echo "🏗️  Building frontend..."
cd /home/bohhem/projects/pustikorijen/frontend
npm run build

# Start services
echo "🚀 Starting services..."
sudo systemctl start pustikorijen-backend.service

# Only start frontend if using vite preview
# sudo systemctl start pustikorijen-frontend.service

# Wait a moment
sleep 3

# Check status
echo ""
echo "📊 Service Status:"
check_service pustikorijen-backend.service
# check_service pustikorijen-frontend.service  # if using vite preview

# Show logs
echo ""
echo "📝 Recent Backend Logs:"
sudo journalctl -u pustikorijen-backend.service -n 10 --no-pager

echo ""
echo "✨ Restart complete!"
echo ""
echo "🌐 Access:"
echo "  Frontend: https://pustikorijen.vibengin.com"
echo "  Backend:  https://api-pustikorijen.vibengin.com"
echo ""
echo "📊 Monitor logs:"
echo "  Backend:  sudo journalctl -u pustikorijen-backend.service -f"
echo "  nginx:    sudo tail -f /var/log/nginx/error.log"
EOF

chmod +x restart.sh
```

### Step 4: Create Development Scripts

For local development (not production):

```bash
# Create dev-start.sh
cat > dev-start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Pustikorijen Development Servers..."

# Kill any existing dev processes
pkill -f 'pustikorijen.*tsx watch' || true
pkill -f 'pustikorijen.*vite' | grep -v systemd || true

# Start backend dev server
cd /home/bohhem/projects/pustikorijen/backend
npm run dev > ../logs/backend-dev.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend dev server started (PID: $BACKEND_PID) on port 5000"

# Start frontend dev server
cd /home/bohhem/projects/pustikorijen/frontend
npm run dev > ../logs/frontend-dev.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend dev server started (PID: $FRONTEND_PID)"

# Create logs directory
mkdir -p /home/bohhem/projects/pustikorijen/logs

echo ""
echo "📝 Logs:"
echo "  Backend:  tail -f logs/backend-dev.log"
echo "  Frontend: tail -f logs/frontend-dev.log"
echo ""
echo "🌐 Access:"
echo "  Frontend: http://localhost:5173 (Vite dev)"
echo "  Backend:  http://localhost:5000 (API)"
echo ""
echo "⏹️  Stop: pkill -f 'pustikorijen.*tsx' && pkill -f 'pustikorijen.*vite'"
EOF

chmod +x dev-start.sh

# Create dev-stop.sh
cat > dev-stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Pustikorijen Development Servers..."

pkill -f 'pustikorijen.*tsx watch'
pkill -f 'pustikorijen.*vite' | grep -v systemd

echo "✅ Dev servers stopped"
EOF

chmod +x dev-stop.sh
```

## Quick Reference

### Production Commands:
```bash
# Restart everything
./restart.sh

# Just backend
sudo systemctl restart pustikorijen-backend.service

# View logs
sudo journalctl -u pustikorijen-backend.service -f
```

### Development Commands:
```bash
# Start dev servers
./dev-start.sh

# Stop dev servers
./dev-stop.sh

# Clean zombies
./cleanup-zombies.sh
```

### Emergency Commands:
```bash
# Kill everything Pustikorijen
ps aux | grep pustikorijen | grep -v grep | awk '{print $2}' | xargs kill -9

# Check what's running
ps aux | grep pustikorijen | grep -v grep

# Check ports
sudo ss -tlnp | grep -E ":(5000|3000|5173)"
```

## Root Cause Analysis

### Why This Happened:

1. **No process management**: Dev servers started manually without cleanup
2. **Mixed environments**: Dev and prod processes running simultaneously
3. **Frontend service misconfigured**: Running `vite preview` instead of serving static files
4. **No automatic cleanup**: Zombie processes accumulating over time

### Prevention:

1. ✅ Use scripts for consistent start/stop
2. ✅ Always run cleanup before starting
3. ✅ Use systemd only for production
4. ✅ Use separate dev scripts for development
5. ✅ Monitor processes regularly: `./manage-ports.sh check`

## Recommended Setup

**For Production (vibengin.com):**
- ✅ Frontend: nginx serves `/dist` (no Node process needed)
- ✅ Backend: systemd service on port 5000
- ✅ Use `./restart.sh` for deployments

**For Development (local):**
- ✅ Frontend: `npm run dev` (Vite on 5173)
- ✅ Backend: `npm run dev` (tsx watch on 5000)
- ✅ Use `./dev-start.sh` and `./dev-stop.sh`

## Next Steps

1. Run `./cleanup-zombies.sh` to clean up
2. Choose Option A (static nginx) or Option B (vite preview)
3. Test with `./restart.sh`
4. Use dev scripts for local development
5. Monitor with `ps aux | grep pustikorijen`
