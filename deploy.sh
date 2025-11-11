#!/bin/bash
set -e

echo "🚀 Deploying Pustikorijen..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Stop services
echo -e "${BLUE}📍 Stopping services...${NC}"
sudo systemctl stop pustikorijen-backend.service
echo -e "  ${GREEN}✅ Services stopped${NC}"
echo ""

# Step 2: Pull latest code
echo -e "${BLUE}📍 Pulling latest code...${NC}"
git pull
echo -e "  ${GREEN}✅ Code updated${NC}"
echo ""

# Step 3: Install dependencies
echo -e "${BLUE}📍 Installing dependencies...${NC}"
npm install
echo -e "  ${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 4: Run database migrations
echo -e "${BLUE}📍 Running database migrations...${NC}"
npx prisma migrate deploy
echo -e "  ${GREEN}✅ Migrations complete${NC}"
echo ""

# Step 5: Build
echo -e "${BLUE}📍 Building...${NC}"
npm run build
echo -e "  ${GREEN}✅ Build complete${NC}"
echo ""

# Step 7: Start services
echo -e "${BLUE}📍 Starting services...${NC}"
sudo systemctl start pustikorijen-backend.service
sleep 3
echo -e "  ${GREEN}✅ Services started${NC}"
echo ""

# Step 8: Health check
echo -e "${BLUE}📍 Checking health...${NC}"
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✅ backend is healthy${NC}"
else
    echo -e "  ${RED}❌ backend health check failed${NC}"
    sudo journalctl -u pustikorijen-backend.service -n 20
    exit 1
fi
echo ""

# Final status
echo -e "${GREEN}✨ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
sudo systemctl status pustikorijen-backend.service --no-pager | head -5
echo ""
