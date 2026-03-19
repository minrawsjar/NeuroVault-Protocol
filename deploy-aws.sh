#!/bin/bash
# NeuroVault Agent — AWS EC2 Deployment Script
# 
# Prerequisites:
#   - AWS CLI configured (aws configure)
#   - Docker installed on EC2 instance
#   - Security group allows inbound on port 3001
#
# Usage:
#   1. SSH into your EC2 instance
#   2. Clone the repo: git clone https://github.com/minrawsjar/NeuroVault-Protocol.git
#   3. cd NeuroVault-Protocol
#   4. Copy and fill in env: cp agent/.env.example agent/.env
#   5. Run this script: bash deploy-aws.sh

set -e

echo "🚀 NeuroVault Agent — AWS Deployment"
echo "======================================"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing..."
    sudo yum update -y 2>/dev/null || sudo apt-get update -y
    sudo yum install -y docker 2>/dev/null || sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. You may need to log out and back in for group changes."
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not found. Installing..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed."
fi

# Check .env exists
if [ ! -f agent/.env ]; then
    echo "❌ agent/.env not found!"
    echo "   Run: cp agent/.env.example agent/.env"
    echo "   Then fill in your API keys and private key."
    exit 1
fi

echo ""
echo "📦 Building Docker image..."
docker compose build

echo ""
echo "🔄 Starting agent container..."
docker compose up -d

echo ""
echo "⏳ Waiting for agent to start..."
sleep 10

# Health check
if curl -s http://localhost:3001/status > /dev/null 2>&1; then
    echo "✅ Agent is running!"
    echo "🌐 API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'localhost'):3001"
    echo ""
    echo "📋 Useful commands:"
    echo "   docker compose logs -f          # View logs"
    echo "   docker compose restart           # Restart agent"
    echo "   docker compose down              # Stop agent"
    echo "   docker compose up -d --build     # Rebuild and restart"
else
    echo "⚠️  Agent may still be starting up. Check logs:"
    echo "   docker compose logs -f"
fi

echo ""
echo "🎉 Deployment complete!"
