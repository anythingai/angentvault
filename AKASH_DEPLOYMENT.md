# Akash Network Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Akash CLI installed (`akash` version 0.20.0+)
- Funded Akash wallet (minimum 10 AKT)
- Docker images pushed to registry
- Environment variables configured

### Step 1: Build and Push Docker Images

```bash
# Build images
docker build -t agentvault/api:latest -f Dockerfile .
docker build -t agentvault/webapp:latest -f Dockerfile.webapp .

# Tag for registry
docker tag agentvault/api:latest ghcr.io/yourusername/agentvault-api:latest
docker tag agentvault/webapp:latest ghcr.io/yourusername/agentvault-webapp:latest

# Push to GitHub Container Registry
docker push ghcr.io/yourusername/agentvault-api:latest
docker push ghcr.io/yourusername/agentvault-webapp:latest
```

### Step 2: Update Deployment Manifest

Edit `deploy.sdl` with your configuration:

```yaml
version: "2.0"

services:
  api:
    image: ghcr.io/yourusername/agentvault-api:latest
    env:
      - NODE_ENV=production
      - PORT=4000
      - DATABASE_URL=<your-postgres-url>
      - JWT_SECRET=<your-jwt-secret>
      - CDP_API_KEY=<your-cdp-key>
      - CDP_PRIVATE_KEY=<your-cdp-private-key>
      - AWS_ACCESS_KEY_ID=<your-aws-key>
      - AWS_SECRET_ACCESS_KEY=<your-aws-secret>
      - PINATA_JWT=<your-pinata-jwt>
    expose:
      - port: 4000
        as: 80
        to:
          - global: true

  webapp:
    image: ghcr.io/yourusername/agentvault-webapp:latest
    env:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
    expose:
      - port: 3000
        as: 80
        to:
          - global: true

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

  placement:
    dcloud:
      pricing:
        api:
          denom: uakt
          amount: 100
        webapp:
          denom: uakt
          amount: 50

deployment:
  api:
    dcloud:
      profile: api
      count: 1
  webapp:
    dcloud:
      profile: webapp
      count: 1
```

### Step 3: Create Certificate (for HTTPS)

```bash
# Generate certificate for your domain
akash tx cert create server yourdomain.com --from $AKASH_KEY_NAME

# Verify certificate
akash query cert list --owner $AKASH_ACCOUNT_ADDRESS
```

### Step 4: Deploy to Akash

```bash
# Create deployment
akash tx deployment create deploy.sdl --from $AKASH_KEY_NAME

# Get deployment ID
akash query deployment list --owner $AKASH_ACCOUNT_ADDRESS

# Wait for bids
akash query market bid list --owner $AKASH_ACCOUNT_ADDRESS

# Accept a bid
akash tx market lease create --dseq $DSEQ --from $AKASH_KEY_NAME --provider $PROVIDER

# Get lease status
akash query market lease list --owner $AKASH_ACCOUNT_ADDRESS

# Upload manifest
akash provider send-manifest deploy.sdl --dseq $DSEQ --from $AKASH_KEY_NAME --provider $PROVIDER
```

### Step 5: Access Your Deployment

```bash
# Get service URIs
akash provider lease-status --dseq $DSEQ --from $AKASH_KEY_NAME --provider $PROVIDER

# Update DNS records
# Add CNAME records pointing to the Akash provider URIs
```

## 📊 Cost Optimization

### Estimated Monthly Costs
- API Service: ~$15/month (vs $100+ on AWS)
- Web App: ~$10/month (vs $50+ on Vercel)
- Total: ~$25/month (85% savings)

### Resource Optimization Tips
1. Use appropriate CPU/memory limits
2. Enable auto-scaling for traffic spikes
3. Use persistent storage only where needed
4. Monitor resource usage and adjust

## 🔧 Production Configuration

### Environment Variables
```bash
# Create secrets file
cat > .env.production <<EOF
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/agentvault
REDIS_URL=redis://host:6379
JWT_SECRET=$(openssl rand -base64 32)
CDP_API_KEY=your-production-cdp-key
CDP_PRIVATE_KEY=your-production-cdp-private-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
X402_PAY_API_KEY=your-x402-key
X402_PAY_SECRET_KEY=your-x402-secret
PINATA_JWT=your-pinata-jwt
EOF
```

### Database Setup
```bash
# Connect to production database
psql $DATABASE_URL

# Run migrations
npm run db:migrate:deploy
```

### Monitoring
```yaml
# Add to deploy.sdl for monitoring
services:
  api:
    env:
      - ENABLE_METRICS=true
      - METRICS_PORT=9090
    expose:
      - port: 9090
        as: 9090
        to:
          - service: prometheus
```

## 🚨 Troubleshooting

### Common Issues

1. **Deployment Stuck in "Pending"**
   - Check wallet balance: `akash query bank balances $AKASH_ACCOUNT_ADDRESS`
   - Increase bid amount in SDL

2. **Service Not Accessible**
   - Verify lease is active: `akash query market lease list`
   - Check provider logs: `akash provider lease-logs`

3. **Environment Variables Not Working**
   - Ensure no spaces around `=` in env vars
   - Use quotes for values with special characters

4. **Image Pull Errors**
   - Verify images are public or add registry credentials
   - Check image tags match exactly

### Debug Commands
```bash
# View deployment logs
akash provider lease-logs --dseq $DSEQ --from $AKASH_KEY_NAME --provider $PROVIDER

# Check deployment events
akash provider lease-events --dseq $DSEQ --from $AKASH_KEY_NAME --provider $PROVIDER

# Shell into container
akash provider lease-shell --dseq $DSEQ --from $AKASH_KEY_NAME --provider $PROVIDER
```

## 🎯 Hackathon Demo Setup

### Quick Deploy for Demo
```bash
# One-command deploy script
./scripts/akash-deploy.sh

# This will:
# 1. Build and push images
# 2. Create deployment
# 3. Accept lowest bid
# 4. Upload manifest
# 5. Output service URLs
```

### Demo Environment
- Use testnet for lower costs during development
- Keep production deployment ready as backup
- Have local fallback if Akash has issues

## 📚 Resources

- [Akash Documentation](https://docs.akash.network/)
- [Akash Console](https://console.akash.network/) - GUI alternative
- [Akash Discord](https://discord.gg/akash) - Get help
- [Awesome Akash](https://github.com/ovrclk/awesome-akash) - Examples

---

**Pro Tip**: Deploy early and test thoroughly. Akash deployments are persistent and cost-effective, perfect for hackathon demos! 