#!/bin/bash

echo "🧹 Cleaning up zombie Pustikorijen processes..."
echo ""

# Get systemd PIDs to preserve
BACKEND_PID=$(systemctl show pustikorijen-backend.service -p MainPID 2>/dev/null | cut -d= -f2)
FRONTEND_PID=$(systemctl show pustikorijen-frontend.service -p MainPID 2>/dev/null | cut -d= -f2)

echo "ℹ️  Preserving systemd services:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""

# Count processes before
BEFORE=$(ps aux | grep pustikorijen | grep node | grep -v grep | wc -l)
echo "📊 Found $BEFORE Pustikorijen node processes"
echo ""

# Kill all other pustikorijen node processes
echo "🔪 Killing zombie processes..."
KILLED=0

ps aux | grep 'pustikorijen.*node' | grep -v grep | grep -v "$BACKEND_PID" | grep -v "$FRONTEND_PID" | while read line; do
    PID=$(echo $line | awk '{print $2}')
    PROCESS=$(echo $line | awk '{for(i=11;i<=NF;i++) printf "%s ", $i}')

    if [ "$PID" != "$BACKEND_PID" ] && [ "$PID" != "$FRONTEND_PID" ]; then
        echo "  Killing PID $PID: $PROCESS"
        kill -9 $PID 2>/dev/null || true
        KILLED=$((KILLED + 1))
    fi
done

echo ""
echo "✅ Killed $KILLED zombie processes"
echo ""

# Show remaining
AFTER=$(ps aux | grep pustikorijen | grep node | grep -v grep | wc -l)
echo "📊 Remaining processes: $AFTER"
echo ""

if [ $AFTER -le 2 ]; then
    echo "✨ Cleanup successful! Only systemd services remain."
else
    echo "⚠️  Some processes still running:"
    ps aux | grep pustikorijen | grep node | grep -v grep
fi
