#!/bin/bash

# Deploy to Railway (simple cloud deployment)
echo "🚀 Deploying to Railway..."

# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

echo "✅ Deployed to Railway!"
echo "🌐 Get URL with: railway domain"