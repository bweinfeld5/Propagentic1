#!/bin/bash

# Check if we're in the agents directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: This script must be run from the agents directory!"
    echo "Please run: cd agents && ./start_server.sh"
    exit 1
fi

# Activate virtual environment and start the FastAPI server
source venv/bin/activate
echo "🔥 Starting FastAPI server from $(pwd)..."
echo "📊 Virtual environment: $(which python)"
echo "🔑 Checking for serviceAccountKey.json..."
if [ -f "serviceAccountKey.json" ]; then
    echo "✅ Firebase service account key found"
else
    echo "⚠️  Warning: serviceAccountKey.json not found - Firebase features will be disabled"
fi
echo "🌐 Server will be available at: http://127.0.0.1:8000"
echo "📍 API docs at: http://127.0.0.1:8000/docs"
echo "🔧 To stop the server, press Ctrl+C"
echo ""

uvicorn main:app --reload --port 8000 --host 127.0.0.1 