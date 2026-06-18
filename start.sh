#!/bin/bash
cd /Users/macbukbiru/Desktop/Code/Repos/Car-Workshop/carcareco

MODE="${1:-prod}"

echo ""
echo "🚀 Starting CarCareCo..."
echo ""
echo "   App  → http://localhost:3000"
echo "   API  → http://localhost:15567"
echo "   Mail → http://localhost:8025"
echo ""

if [ "$MODE" = "dev" ]; then
    echo "▶  Mode: development (hot reload)"
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
else
    echo "▶  Mode: production"
    docker compose up --build
fi
