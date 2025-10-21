#!/bin/bash
# Restart dev servers and build production bundles

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

echo "=== Restarting dev servers and building production bundles ==="

# Stop running dev servers if any
echo "Stopping running dev processes (if any)..."
pkill -f "tsx watch" 2>/dev/null || true
pkill -f "vite.*pustikorijen" 2>/dev/null || true

# Ensure logs directory exists for start-dev script
mkdir -p "$LOG_DIR"

# Build backend for production
echo ""
echo "→ Building backend (production)..."
cd "$PROJECT_ROOT/backend"
npm run build

# Build frontend for production
echo ""
echo "→ Building frontend (production)..."
cd "$PROJECT_ROOT/frontend"
npm run build

# Restart dev servers using existing helper
echo ""
echo "→ Restarting development servers..."
"$PROJECT_ROOT/scripts/start-dev.sh"

# Attempt to restart production backend service
echo ""
echo "→ Restarting production backend service (pustikorijen-backend)..."
if command -v systemctl >/dev/null 2>&1; then
  if sudo systemctl restart pustikorijen-backend; then
    echo "Production backend service restarted successfully."
  else
    echo "⚠️  Failed to restart pustikorijen-backend automatically. Please run:"
    echo "    sudo systemctl restart pustikorijen-backend"
  fi
else
  echo "⚠️  systemctl not available on this system. Skipping production restart."
fi

echo ""
echo "✅ Done!"
