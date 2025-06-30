#!/bin/bash

# AgentVault Akash Deployment Script
# This script automates the deployment process to Akash Network

set -e

echo "🚀 AgentVault Akash Deployment Script"
echo "====================================="

# Configuration
DOCKER_REGISTRY="ghcr.io"
DOCKER_USERNAME="${GITHUB_USERNAME:-yourusername}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
AKASH_NET="${AKASH_NET:-mainnet}"

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    if ! command -v akash &> /dev/null; then
        echo "❌ Akash CLI not found. Please install it first."
        echo "Visit: https://docs.akash.network/guides/cli"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found. Please install Docker first."
        exit 1
    fi
    
    if [ -z "$AKASH_KEY_NAME" ]; then
        echo "❌ AKASH_KEY_NAME not set. Please export it."
        exit 1
    fi
    
    echo "✅ Prerequisites checked"
}

# Build and push Docker images
build_and_push() {
    echo "🔨 Building Docker images..."
    
    # Build API image
    docker build -t ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/agentvault-api:${IMAGE_TAG} -f Dockerfile .
    
    # Build webapp image
    docker build -t ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/agentvault-webapp:${IMAGE_TAG} -f Dockerfile.webapp .
    
    echo "📤 Pushing images to registry..."
    
    # Login to GitHub Container Registry
    echo $GITHUB_TOKEN | docker login ${DOCKER_REGISTRY} -u ${DOCKER_USERNAME} --password-stdin
    
    # Push images
    docker push ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/agentvault-api:${IMAGE_TAG}
    docker push ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/agentvault-webapp:${IMAGE_TAG}
    
    echo "✅ Images built and pushed"
}

# Update SDL with image URLs
update_sdl() {
    echo "📝 Updating deployment manifest..."
    
    # Create deployment SDL from template
    cat > deploy-prod.sdl <<EOF
version: "2.0"

services:
  api:
    image: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/agentvault-api:${IMAGE_TAG}
    env:
      - NODE_ENV=production
      - PORT=4000
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CDP_API_KEY=${CDP_API_KEY}
      - CDP_PRIVATE_KEY=${CDP_PRIVATE_KEY}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - PINATA_JWT=${PINATA_JWT}
      - X402_PAY_API_KEY=${X402_PAY_API_KEY}
      - X402_PAY_SECRET_KEY=${X402_PAY_SECRET_KEY}
      - REDIS_URL=${REDIS_URL}
    expose:
      - port: 4000
        as: 80
        to:
          - global: true
        accept:
          - agentvault-api.akash.network
    depends_on:
      - redis
      - postgres

  webapp:
    image: ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/agentvault-webapp:${IMAGE_TAG}
    env:
      - NEXT_PUBLIC_API_URL=https://agentvault-api.akash.network
    expose:
      - port: 3000
        as: 80
        to:
          - global: true
        accept:
          - agentvault.akash.network

  redis:
    image: redis:7-alpine
    expose:
      - port: 6379
        as: 6379
        to:
          - service: api

  postgres:
    image: postgres:15-alpine
    env:
      - POSTGRES_USER=agentvault
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=agentvault
    expose:
      - port: 5432
        as: 5432
        to:
          - service: api

profiles:
  compute:
    api:
      resources:
        cpu:
          units: 2.0
        memory:
          size: 2Gi
        storage:
          size: 10Gi
    webapp:
      resources:
        cpu:
          units: 1.0
        memory:
          size: 1Gi
        storage:
          size: 5Gi
    redis:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          size: 1Gi
    postgres:
      resources:
        cpu:
          units: 1.0
        memory:
          size: 1Gi
        storage:
          size: 20Gi

  placement:
    akash:
      attributes:
        host: akash
      signedBy:
        anyOf:
          - "akash1365yvmc4s7awdyj3n2sav7xfx76adc6dnmlx63"
      pricing:
        api:
          denom: uakt
          amount: 100
        webapp:
          denom: uakt
          amount: 50
        redis:
          denom: uakt
          amount: 20
        postgres:
          denom: uakt
          amount: 50

deployment:
  api:
    akash:
      profile: api
      count: 1
  webapp:
    akash:
      profile: webapp
      count: 1
  redis:
    akash:
      profile: redis
      count: 1
  postgres:
    akash:
      profile: postgres
      count: 1
EOF

    echo "✅ SDL updated"
}

# Deploy to Akash
deploy_to_akash() {
    echo "🚀 Deploying to Akash Network..."
    
    # Create deployment
    echo "Creating deployment..."
    DEPLOYMENT_ID=$(akash tx deployment create deploy-prod.sdl --from $AKASH_KEY_NAME --node $AKASH_NODE --chain-id $AKASH_CHAIN_ID -y | grep -oP '"dseq":"\K[^"]+')
    
    echo "Deployment ID: $DEPLOYMENT_ID"
    
    # Wait for bids
    echo "Waiting for bids (this may take a minute)..."
    sleep 30
    
    # Get bids
    BIDS=$(akash query market bid list --owner $AKASH_ACCOUNT_ADDRESS --dseq $DEPLOYMENT_ID --node $AKASH_NODE)
    
    # Accept lowest bid
    echo "Accepting lowest bid..."
    PROVIDER=$(echo $BIDS | jq -r '.bids[0].bid.provider')
    
    akash tx market lease create --dseq $DEPLOYMENT_ID --provider $PROVIDER --from $AKASH_KEY_NAME --node $AKASH_NODE --chain-id $AKASH_CHAIN_ID -y
    
    # Wait for lease
    sleep 10
    
    # Send manifest
    echo "Sending manifest..."
    akash provider send-manifest deploy-prod.sdl --dseq $DEPLOYMENT_ID --provider $PROVIDER --from $AKASH_KEY_NAME --node $AKASH_NODE
    
    echo "✅ Deployment complete!"
}

# Get deployment status
get_deployment_status() {
    echo "📊 Getting deployment status..."
    
    # Get lease status
    akash provider lease-status --dseq $DEPLOYMENT_ID --provider $PROVIDER --from $AKASH_KEY_NAME --node $AKASH_NODE
    
    echo ""
    echo "🎉 AgentVault is now live on Akash Network!"
    echo "API URL: https://agentvault-api.akash.network"
    echo "Web URL: https://agentvault.akash.network"
    echo ""
    echo "Deployment ID: $DEPLOYMENT_ID"
    echo "Provider: $PROVIDER"
}

# Main execution
main() {
    check_prerequisites
    
    # Load environment variables
    if [ -f .env.production ]; then
        export $(cat .env.production | xargs)
    else
        echo "⚠️  .env.production not found. Using environment variables."
    fi
    
    # Execute deployment steps
    build_and_push
    update_sdl
    deploy_to_akash
    get_deployment_status
    
    # Save deployment info
    cat > deployment-info.json <<EOF
{
  "deployment_id": "$DEPLOYMENT_ID",
  "provider": "$PROVIDER",
  "api_url": "https://agentvault-api.akash.network",
  "web_url": "https://agentvault.akash.network",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    
    echo "📄 Deployment info saved to deployment-info.json"
}

# Run main function
main "$@" 