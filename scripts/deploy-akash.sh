#!/bin/bash

# Akash Network Deployment Script for AgentVault
# This script deploys the AgentVault application to Akash Network

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}AgentVault Akash Deployment Script${NC}"
echo "=================================="

# Check if akash CLI is installed
if ! command -v akash &> /dev/null; then
    echo -e "${RED}Error: Akash CLI not found. Please install it first.${NC}"
    echo "Visit: https://docs.akash.network/guides/cli"
    exit 1
fi

# Check environment variables
required_vars=(
    "AKASH_KEY_NAME"
    "AKASH_KEYRING_BACKEND"
    "AKASH_NODE"
    "AKASH_CHAIN_ID"
    "DATABASE_URL"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "CDP_API_KEY"
    "CDP_PRIVATE_KEY"
    "X402_PAY_API_KEY"
    "PINATA_API_KEY"
    "JWT_SECRET"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}Error: Missing required environment variables:${NC}"
    printf '%s\n' "${missing_vars[@]}"
    exit 1
fi

# Build and push Docker images
echo -e "${YELLOW}Building Docker images...${NC}"
docker build -t agentvault/webapp:latest -f Dockerfile.webapp .
docker build -t agentvault/api:latest -f Dockerfile .

echo -e "${YELLOW}Pushing images to registry...${NC}"
docker push agentvault/webapp:latest
docker push agentvault/api:latest

# Create deployment
echo -e "${YELLOW}Creating Akash deployment...${NC}"
akash tx deployment create deploy.sdl \
    --from $AKASH_KEY_NAME \
    --keyring-backend $AKASH_KEYRING_BACKEND \
    --node $AKASH_NODE \
    --chain-id $AKASH_CHAIN_ID \
    --fees 5000uakt \
    -y

# Wait for deployment to be created
sleep 10

# Get deployment ID
DEPLOYMENT_ID=$(akash query deployment list \
    --owner $(akash keys show $AKASH_KEY_NAME -a) \
    --node $AKASH_NODE \
    --output json | jq -r '.deployments[0].deployment.deployment_id.dseq')

echo -e "${GREEN}Deployment created with ID: $DEPLOYMENT_ID${NC}"

# Wait for bids
echo -e "${YELLOW}Waiting for provider bids...${NC}"
sleep 30

# Get bid ID
BID_ID=$(akash query market bid list \
    --owner $(akash keys show $AKASH_KEY_NAME -a) \
    --node $AKASH_NODE \
    --dseq $DEPLOYMENT_ID \
    --output json | jq -r '.bids[0].bid.bid_id')

PROVIDER=$(echo $BID_ID | jq -r '.provider')

# Create lease
echo -e "${YELLOW}Creating lease with provider...${NC}"
akash tx market lease create \
    --from $AKASH_KEY_NAME \
    --keyring-backend $AKASH_KEYRING_BACKEND \
    --node $AKASH_NODE \
    --chain-id $AKASH_CHAIN_ID \
    --dseq $DEPLOYMENT_ID \
    --provider $PROVIDER \
    --fees 5000uakt \
    -y

# Wait for lease creation
sleep 10

# Send manifest
echo -e "${YELLOW}Sending deployment manifest...${NC}"
akash provider send-manifest deploy.sdl \
    --from $AKASH_KEY_NAME \
    --keyring-backend $AKASH_KEYRING_BACKEND \
    --node $AKASH_NODE \
    --dseq $DEPLOYMENT_ID \
    --provider $PROVIDER

# Get lease status
echo -e "${YELLOW}Checking deployment status...${NC}"
akash provider lease-status \
    --from $AKASH_KEY_NAME \
    --keyring-backend $AKASH_KEYRING_BACKEND \
    --node $AKASH_NODE \
    --dseq $DEPLOYMENT_ID \
    --provider $PROVIDER

# Get service URIs
echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Getting service endpoints...${NC}"

akash provider lease-status \
    --from $AKASH_KEY_NAME \
    --keyring-backend $AKASH_KEYRING_BACKEND \
    --node $AKASH_NODE \
    --dseq $DEPLOYMENT_ID \
    --provider $PROVIDER \
    --output json | jq -r '.services[].uris[]'

echo -e "${GREEN}=================================="
echo -e "AgentVault is now deployed on Akash Network!"
echo -e "Deployment ID: $DEPLOYMENT_ID"
echo -e "Provider: $PROVIDER"
echo -e "==================================${NC}" 