#!/bin/bash
# Production logs viewer for Pustikorijen

echo "=== Pustikorijen Production Logs ==="
echo ""
echo "Choose an option:"
echo "1) Backend logs (real-time)"
echo "2) Backend logs (last 100 lines)"
echo "3) Backend logs (today only)"
echo "4) Backend errors only"
echo "5) Backend logs (last 1 hour)"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
  1)
    echo "Following backend logs (Ctrl+C to exit)..."
    sudo journalctl -u pustikorijen-backend -f --output=short-iso
    ;;
  2)
    echo "Last 100 lines of backend logs:"
    sudo journalctl -u pustikorijen-backend -n 100 --no-pager
    ;;
  3)
    echo "Backend logs since today:"
    sudo journalctl -u pustikorijen-backend --since today --no-pager
    ;;
  4)
    echo "Backend errors only:"
    sudo journalctl -u pustikorijen-backend --no-pager | grep -i error
    ;;
  5)
    echo "Backend logs (last 1 hour):"
    sudo journalctl -u pustikorijen-backend --since "1 hour ago" --no-pager
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac
