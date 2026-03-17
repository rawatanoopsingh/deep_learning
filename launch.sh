#!/bin/bash
# Deep Learning Knowledge Graph — launch script
# Double-click this file or run from terminal

cd "$(dirname "$0")"

# Kill any existing server on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Start server in background
python3 -m http.server 8000 &>/dev/null &
SERVER_PID=$!

# Wait briefly for server to start
sleep 0.5

# Open in default browser
open "http://localhost:8000/viewer.html"

echo "Knowledge graph running at http://localhost:8000/viewer.html"
echo "Server PID: $SERVER_PID"
echo "To stop: kill $SERVER_PID"
