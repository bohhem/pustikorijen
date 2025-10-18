#!/bin/bash
# Start development servers with logging

PROJECT_ROOT="$HOME/projects/pustikorijen"
LOG_DIR="$PROJECT_ROOT/logs"

# Create logs directory
mkdir -p "$LOG_DIR"

echo "=== Starting Pustikorijen Development Servers ==="
echo ""
echo "Logs will be saved to: $LOG_DIR"
echo ""

# Check if servers are already running
if pgrep -f "tsx watch" > /dev/null; then
  echo "⚠️  Backend dev server is already running!"
  read -p "Kill and restart? [y/N]: " restart
  if [ "$restart" = "y" ] || [ "$restart" = "Y" ]; then
    pkill -f "tsx watch"
    sleep 1
  else
    echo "Skipping backend..."
  fi
fi

if pgrep -f "vite.*pustikorijen" > /dev/null; then
  echo "⚠️  Frontend dev server is already running!"
  read -p "Kill and restart? [y/N]: " restart
  if [ "$restart" = "y" ] || [ "$restart" = "Y" ]; then
    pkill -f "vite.*pustikorijen"
    sleep 1
  else
    echo "Skipping frontend..."
  fi
fi

# Start backend
echo "Starting backend on port 5001..."
cd "$PROJECT_ROOT/backend"
nohup npm run dev > "$LOG_DIR/dev-backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Wait a bit for backend to start
sleep 2

# Start frontend
echo "Starting frontend on port 3000..."
cd "$PROJECT_ROOT/frontend"
nohup npm run dev > "$LOG_DIR/dev-frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "✅ Development servers started!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:5001"
echo ""
echo "View logs:"
echo "  Backend:  tail -f $LOG_DIR/dev-backend.log"
echo "  Frontend: tail -f $LOG_DIR/dev-frontend.log"
echo "  Both:     tail -f $LOG_DIR/dev-*.log"
echo ""
echo "Or use: ./scripts/logs-dev.sh"
echo ""
echo "Stop servers:"
echo "  pkill -f 'tsx watch'"
echo "  pkill -f 'vite.*pustikorijen'"
