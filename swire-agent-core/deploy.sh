#!/bin/bash

echo "🚀 Deploying Swire Intelligence Assistant"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Creating .env from template..."
    cp .env.example .env
    echo "📝 Please edit .env with your AWS credentials before running"
fi

# Build and start services
echo "🐳 Building Docker containers..."
docker-compose build

echo "🔄 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

# Health check
echo "🏥 Checking health..."
curl -f http://localhost:8000/health || echo "❌ Health check failed"

echo "✅ Deployment complete!"
echo "🌐 API available at: http://localhost:8000"
echo "📊 Database available at: localhost:5432"
echo ""
echo "Test with:"
echo "curl -X POST http://localhost:8000/chat -H 'Content-Type: application/json' -d '{\"query\":\"Show me financial summary\"}'"