#!/bin/bash
set -e

echo "🔄 Restarting Pustikorijen Services..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check service status
check_service() {
    if systemctl is-active --quiet $1; then
        echo -e "${GREEN}✅ $1 is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 is NOT running${NC}"
        return 1
    fi
}

# Step 1: Clean up zombie processes
echo -e "${BLUE}📍 Step 1: Cleaning zombie processes...${NC}"
./cleanup-zombies.sh

echo ""

# Step 2: Stop services
echo -e "${BLUE}📍 Step 2: Stopping services...${NC}"
sudo systemctl stop pustikorijen-backend.service
echo "  ⏸️  Backend stopped"

# Note: We don't use frontend service - nginx serves static files
# sudo systemctl stop pustikorijen-frontend.service 2>/dev/null || true

sleep 2

# Step 3: Rebuild backend
echo ""
echo -e "${BLUE}📍 Step 3: Building backend...${NC}"
cd /home/bohhem/projects/pustikorijen/backend
npm run build
echo -e "${GREEN}  ✅ Backend built${NC}"

# Step 4: Rebuild frontend
echo ""
echo -e "${BLUE}📍 Step 4: Building frontend...${NC}"
cd /home/bohhem/projects/pustikorijen/frontend
npm run build
echo -e "${GREEN}  ✅ Frontend built (dist/ ready for nginx)${NC}"

# Step 5: Start backend service
echo ""
echo -e "${BLUE}📍 Step 5: Starting backend service...${NC}"
sudo systemctl start pustikorijen-backend.service
sleep 3

# Step 6: Check status
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
check_service pustikorijen-backend.service

# Step 7: Test endpoints
echo ""
echo -e "${BLUE}🧪 Testing endpoints...${NC}"

# Test backend
if curl -s -f http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API responding on port 5000${NC}"
else
    echo -e "${RED}❌ Backend API not responding${NC}"
fi

# Test frontend (via nginx)
if curl -s -f -I https://pustikorijen.vibengin.com > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend accessible via nginx${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend check skipped (certificate/network)${NC}"
fi

# Step 8: Show recent logs
echo ""
echo -e "${BLUE}📝 Recent Backend Logs:${NC}"
sudo journalctl -u pustikorijen-backend.service -n 10 --no-pager | tail -5

echo ""
echo -e "${GREEN}✨ Restart complete!${NC}"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "  Frontend: https://pustikorijen.vibengin.com"
echo "  Backend:  https://api-pustikorijen.vibengin.com"
echo "  Backend Health: http://localhost:5000/health"
echo ""
echo -e "${BLUE}📊 Monitor logs:${NC}"
echo "  Backend:  sudo journalctl -u pustikorijen-backend.service -f"
echo "  nginx:    sudo tail -f /var/log/nginx/error.log"
echo ""
echo -e "${BLUE}🔧 Troubleshooting:${NC}"
echo "  Check ports: sudo ss -tlnp | grep 5000"
echo "  Check processes: ps aux | grep pustikorijen"
echo "  Clean zombies: ./cleanup-zombies.sh"
