#!/bin/bash
# Development logs viewer for Pustikorijen

LOG_DIR="$HOME/projects/pustikorijen/logs"
BACKEND_LOG="$LOG_DIR/dev-backend.log"
FRONTEND_LOG="$LOG_DIR/dev-frontend.log"

echo "=== Pustikorijen Development Logs ==="
echo ""

# Check if logs directory exists
if [ ! -d "$LOG_DIR" ]; then
  echo "Logs directory not found: $LOG_DIR"
  echo "Run dev servers with logging first."
  echo ""
  echo "Example:"
  echo "  cd ~/projects/pustikorijen/backend"
  echo "  npm run dev 2>&1 | tee logs/dev-backend.log"
  exit 1
fi

echo "Choose an option:"
echo "1) Backend logs (real-time)"
echo "2) Frontend logs (real-time)"
echo "3) Both logs (real-time)"
echo "4) Backend logs (last 50 lines)"
echo "5) Frontend logs (last 50 lines)"
echo "6) Search backend logs"
echo "7) Search frontend logs"
echo ""
read -p "Enter choice [1-7]: " choice

case $choice in
  1)
    if [ -f "$BACKEND_LOG" ]; then
      echo "Following backend logs (Ctrl+C to exit)..."
      tail -f "$BACKEND_LOG"
    else
      echo "Backend log not found: $BACKEND_LOG"
    fi
    ;;
  2)
    if [ -f "$FRONTEND_LOG" ]; then
      echo "Following frontend logs (Ctrl+C to exit)..."
      tail -f "$FRONTEND_LOG"
    else
      echo "Frontend log not found: $FRONTEND_LOG"
    fi
    ;;
  3)
    echo "Following both logs (Ctrl+C to exit)..."
    tail -f "$BACKEND_LOG" "$FRONTEND_LOG"
    ;;
  4)
    if [ -f "$BACKEND_LOG" ]; then
      echo "Last 50 lines of backend logs:"
      tail -n 50 "$BACKEND_LOG"
    else
      echo "Backend log not found: $BACKEND_LOG"
    fi
    ;;
  5)
    if [ -f "$FRONTEND_LOG" ]; then
      echo "Last 50 lines of frontend logs:"
      tail -n 50 "$FRONTEND_LOG"
    else
      echo "Frontend log not found: $FRONTEND_LOG"
    fi
    ;;
  6)
    read -p "Search term: " term
    if [ -f "$BACKEND_LOG" ]; then
      echo "Searching backend logs for: $term"
      grep -i "$term" "$BACKEND_LOG"
    else
      echo "Backend log not found: $BACKEND_LOG"
    fi
    ;;
  7)
    read -p "Search term: " term
    if [ -f "$FRONTEND_LOG" ]; then
      echo "Searching frontend logs for: $term"
      grep -i "$term" "$FRONTEND_LOG"
    else
      echo "Frontend log not found: $FRONTEND_LOG"
    fi
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac
