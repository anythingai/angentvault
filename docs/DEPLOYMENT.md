# AgentVault Deployment Guide

This guide covers deployment options for AgentVault in production environments.

## Prerequisites

- Node.js 18+
- Docker (optional but recommended)
- Required API keys (see `.env.example`)

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Core Configuration
NODE_ENV=production
PORT=4000
JWT_SECRET=your-super-secure-jwt-secret

# Database
DATABASE_URL=file:./prisma/prod.db

# Redis Cache
REDIS_URL=redis://localhost:6379

# AWS Bedrock
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# Coinbase CDP
CDP_API_KEY=your-cdp-api-key
CDP_API_SECRET=your-cdp-api-secret
COINBASE_API_KEY=your-coinbase-api-key
COINBASE_API_SECRET=your-coinbase-api-secret

# x402pay
X402PAY_API_KEY=your-x402pay-api-key
X402PAY_SECRET=your-x402pay-secret
X402PAY_WEBHOOK_URL=https://your-domain.com/api/webhooks/x402pay

# Pinata IPFS
PINATA_JWT=your-pinata-jwt-token
PINATA_GATEWAY_KEY=your-pinata-gateway-key
PINATA_GATEWAY_URL=https://gateway.pinata.cloud
```

## Deployment Options

### 1. Docker Deployment (Recommended)

**Build and Deploy:**

```bash
npm run docker:build
npm run docker:run
```

**Manual Docker Commands:**

```bash
# Build
docker build -t agentvault:latest .

# Run with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### 2. Akash Network Deployment

**Prerequisites:**

- Install Akash CLI
- Configure wallet with AKT tokens
- Update `deploy.yaml` with your requirements

**Deploy:**

```bash
npm run deploy:akash

# Follow the instructions printed by the script:
# 1. Create deployment
akash tx deployment create deploy.yaml --from <wallet> --node <node> --chain-id <chain-id>

# 2. Get bids
akash provider bid-get --dseq <deployment-sequence>

# 3. Create lease
akash tx market lease create --from <wallet> --dseq <deployment-sequence> --provider <provider>
```

### 3. Traditional VPS/Cloud Deployment

**Setup:**

```bash
# Install dependencies
npm ci --only=production

# Generate Prisma client
npm run prisma:generate

# Push database schema
npm run prisma:push

# Build application
npm run build

# Start production
npm run production
```

**Using PM2 (Process Manager):**

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/server/index.js --name agentvault-api
pm2 start npm --name agentvault-web -- run start:client

# Save PM2 configuration
pm2 save
pm2 startup
```

## Health Checks

Verify deployment health:

```bash
# API Health Check
curl http://localhost:4000/api/health

# Frontend Check
curl http://localhost:3000

# Database Check
npm run prisma:studio
```

## Production Considerations

### Security

1. **Environment Variables:** Never commit secrets to git
2. **HTTPS:** Use SSL certificates in production
3. **CORS:** Configure appropriate CORS settings
4. **Rate Limiting:** Default rate limits are configured
5. **JWT Secrets:** Use strong, unique JWT secrets

### Performance

1. **Redis Caching:** Redis is configured for session management
2. **Database:** Consider PostgreSQL for high-scale deployments
3. **CDN:** Use CDN for static assets in global deployments
4. **Monitoring:** Implement application monitoring

### Scaling

1. **Horizontal Scaling:** Use Docker swarm or Kubernetes
2. **Load Balancing:** Implement load balancer for multiple instances
3. **Database Scaling:** Consider read replicas for high traffic
4. **Caching:** Implement Redis clustering for large deployments

## Monitoring

### Logs

Application logs are written to:

- Console output (captured by Docker/PM2)
- `logs/` directory for file-based logging

### Metrics

Monitor these key metrics:

- API response times
- Database connection pool
- Redis cache hit rates
- Active agent count
- Memory and CPU usage

### Alerts

Set up alerts for:

- Application downtime
- High error rates
- Database connection failures
- API key quota limits

## Troubleshooting

### Common Issues

**Database Connection Failed:**

```bash
# Check database file permissions
ls -la prisma/

# Regenerate Prisma client
npm run prisma:generate

# Push schema changes
npm run prisma:push
```

**Redis Connection Failed:**

```bash
# Check Redis status
redis-cli ping

# Start Redis manually
redis-server

# Check Redis logs
tail -f /var/log/redis/redis-server.log
```

**API Keys Invalid:**

```bash
# Verify environment variables
npm run health-check

# Check API key permissions in respective dashboards
# - AWS Console for Bedrock access
# - Coinbase Developer Portal for CDP access
# - x402pay dashboard for payment access
# - Pinata dashboard for IPFS access
```

### Debug Mode

Enable debug logging:

```bash
DEBUG=* npm start
```

### Performance Issues

**Database Performance:**

```bash
# Check database size
du -h prisma/dev.db

# Optimize database
npx prisma db push --force-reset
```

**Memory Issues:**

```bash
# Monitor memory usage
docker stats

# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## Backup and Recovery

### Database Backup

```bash
# Backup SQLite database
cp prisma/prod.db backups/prod-$(date +%Y%m%d).db

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/agentvault"
mkdir -p $BACKUP_DIR
cp prisma/prod.db $BACKUP_DIR/prod-$(date +%Y%m%d-%H%M%S).db
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
```

### Configuration Backup

```bash
# Backup environment configuration (without secrets)
cp .env.example backups/env-backup-$(date +%Y%m%d).txt
```

## Support

For deployment issues:

1. Check the troubleshooting section above
2. Review application logs
3. Verify all environment variables are set correctly
4. Ensure all external services (AWS, Coinbase, etc.) are accessible

## Security Notes

- Never expose database files directly via web server
- Use strong JWT secrets (minimum 32 characters)
- Implement proper CORS policies
- Use HTTPS in production
- Regularly update dependencies
- Monitor for security vulnerabilities

## Performance Tuning

- Enable Redis caching for session management
- Use connection pooling for database access
- Implement proper error handling and retries
- Monitor and optimize API call patterns
- Use appropriate timeout settings for external services
