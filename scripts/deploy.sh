#!/bin/bash

# AgentVault Production Deployment Script
set -e

echo "🚀 Starting AgentVault deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Environment check
if [ "$NODE_ENV" != "production" ]; then
    echo -e "${YELLOW}Warning: NODE_ENV is not set to production${NC}"
fi

# Check required environment variables
required_vars=(
    "JWT_SECRET"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "CDP_API_KEY"
    "X402PAY_API_KEY"
    "PINATA_JWT"
)

echo "🔍 Checking environment variables..."
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: $var is not set${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ All required environment variables are set${NC}"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "📊 Running database migrations..."
npx prisma db push

# Build the application
echo "🔨 Building application..."
npm run build

# Create production directories
echo "📁 Creating production directories..."
mkdir -p logs
mkdir -p data/redis

# Docker deployment option
if command -v docker &> /dev/null; then
    echo "🐳 Docker detected. Building container..."
    docker build -t agentvault:latest .
    
    if [ "$1" = "--deploy" ]; then
        echo "🚀 Starting production containers..."
        docker-compose up -d
        
        # Wait for services to be ready
        echo "⏳ Waiting for services to start..."
        sleep 10
        
        # Health check
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Application is running successfully!${NC}"
            echo "🌐 Frontend: http://localhost:3000"
            echo "🔌 API: http://localhost:4000"
        else
            echo -e "${RED}❌ Health check failed${NC}"
            exit 1
        fi
    fi
else
    echo "⚠️ Docker not found. Starting application directly..."
    
    # Start Redis if available
    if command -v redis-server &> /dev/null; then
        echo "🔴 Starting Redis..."
        redis-server --daemonize yes --logfile logs/redis.log
    fi
    
    # Start the application
    echo "🚀 Starting AgentVault..."
    npm start
fi

# Akash Network deployment
if [ "$1" = "--akash" ]; then
    echo "☁️ Preparing Akash Network deployment..."
    
    if ! command -v akash &> /dev/null; then
        echo -e "${RED}Error: Akash CLI not found. Please install it first.${NC}"
        exit 1
    fi
    
    echo "📝 Creating deployment configuration..."
    # The deploy.yaml file is already created
    
    echo -e "${GREEN}✅ Ready for Akash deployment!${NC}"
    echo "Next steps:"
    echo "1. akash tx deployment create deploy.yaml --from <wallet> --node <node> --chain-id <chain-id>"
    echo "2. akash provider bid-get --dseq <deployment-sequence>"
    echo "3. akash tx market lease create --from <wallet> --dseq <deployment-sequence> --provider <provider>"
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"

# Show status
echo "📊 Deployment Status:"
echo "- Environment: $NODE_ENV"
echo "- Timestamp: $(date)"
echo "- Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
echo "- Node Version: $(node --version)"

# Log deployment
echo "$(date): AgentVault deployed successfully" >> logs/deployment.log 