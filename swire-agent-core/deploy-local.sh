#!/bin/bash

echo "🚀 Deploying Swire Intelligence Assistant Locally"

# Build and push to Docker Hub for easy deployment
echo "🐳 Building Docker image..."
docker build -t swire-agent:latest .

# Tag for Docker Hub
docker tag swire-agent:latest maplesage/swire-agent:latest

echo "📤 Pushing to Docker Hub..."
docker push maplesage/swire-agent:latest

echo "✅ Local deployment complete!"
echo "🌐 Docker image: maplesage/swire-agent:latest"
echo "🔄 Backend running at: http://localhost:8000"
echo "🌍 Frontend deployed at: https://swire-frontend-cf3fmvqgg-maplesage-s-projects.vercel.app"

echo ""
echo "🧪 Test the system:"
echo "curl -X POST http://localhost:8000/chat -H 'Content-Type: application/json' -d '{\"query\":\"What are the wind turbine maintenance procedures?\"}'"