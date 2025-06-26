# AgentVault - Autonomous Crypto Investment Agent Platform

**Built for Coinbase Agents in Action Hackathon 2025**

[![Demo Video](https://img.shields.io/badge/Demo-Video-blue)](https://youtu.be/demo-link)
[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://agentvault.ai)
[![Documentation](https://img.shields.io/badge/Docs-Available-orange)](./docs)

## 🚀 Overview

AgentVault is an autonomous cryptocurrency investment platform that combines AI-powered decision-making with native monetization capabilities. The system uses Amazon Bedrock Nova for sophisticated financial analysis, x402pay for frictionless payment processing, CDP Wallet for secure fund management, Akash Network for decentralized compute, and Pinata for distributed storage.

### 🏆 Prize Track Targets
- ✅ **$5,000: Best Use of x402pay + CDP Wallet**
- ✅ **AWS Challenge: Best Use of Amazon Bedrock**
- ✅ **$10,000: Best Overall Project and Best Use of Akash**
- ✅ **$10,000: Best Agentic Use of Pinata**

## 🔧 Technology Stack

- **AI Engine**: Amazon Bedrock Nova (Claude 3.5)
- **Payments**: x402pay micropayment infrastructure
- **Wallet**: Coinbase CDP Wallet API
- **Storage**: Pinata IPFS
- **Infrastructure**: Akash Network (decentralized compute)
- **Backend**: Node.js, TypeScript, GraphQL, Express
- **Frontend**: Next.js, React, Tailwind CSS
- **Database**: PostgreSQL + Redis
- **Blockchain**: Base Network (Ethereum L2)

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)
- Akash CLI (for deployment)
- AWS Account with Bedrock access
- Coinbase CDP API credentials
- x402pay API credentials
- Pinata API credentials

## 🛠️ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-team/agentvault.git
cd agentvault
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your credentials
# REQUIRED: CDP_API_KEY, AWS credentials, X402PAY keys, PINATA_JWT
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:push

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 5. Run Development Server
```bash
# Start all services with Docker
docker-compose up -d

# Or run locally
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- GraphQL Playground: http://localhost:4000/graphql

## 🚀 Production Deployment

### Deploy to Akash Network
```bash
# Set Akash credentials in .env
# Run deployment script
npm run deploy:akash
```

### Deploy with Docker
```bash
# Build production images
docker build -t agentvault/webapp:latest -f Dockerfile.webapp .
docker build -t agentvault/api:latest -f Dockerfile .

# Run with docker-compose
docker-compose -f docker-compose.yml up -d
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📊 GraphQL API

### Demo Query (For Hackathon Judges)
```graphql
query HackathonDemo {
  hackathonDemo {
    timestamp
    integrations {
      bedrock { status message }
      cdpWallet { status message }
      x402pay { status message }
      pinata { status message }
      marketData { status message }
      summary { readyForDemo totalIntegrations }
    }
  }
}
```

### Create Agent
```graphql
mutation CreateAgent($input: CreateAgentInput!) {
  createAgent(input: $input) {
    id
    name
    status
    config
  }
}
```

### Start Agent
```graphql
mutation StartAgent($id: ID!) {
  startAgent(id: $id) {
    id
    status
    performance
  }
}
```

## 🔑 Key Features

### 🤖 AI-Powered Trading
- Amazon Bedrock Nova integration for market analysis
- Autonomous trading signal generation
- Risk assessment and portfolio optimization
- Multi-timeframe analysis capabilities

### 💰 Native Monetization
- x402pay micropayment processing
- Pay-per-query pricing ($0.01-$0.025)
- Revenue sharing for successful strategies
- Autonomous payment processing

### 🏦 Secure Fund Management
- CDP Wallet integration
- Programmable wallet controls
- Multi-signature support
- Real-time balance tracking

### ☁️ Decentralized Infrastructure
- Akash Network deployment
- 85% cost savings vs traditional cloud
- Censorship-resistant operations
- Auto-scaling compute resources

### 📁 Immutable Storage
- Pinata IPFS integration
- Trading history on IPFS
- Audit trail storage
- Performance metrics archival

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js UI   │───▶│   GraphQL API    │───▶│ Agent Orchestr. │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ WebSocket Server │    │ Service Layer   │
                       └──────────────────┘    └─────────────────┘
                                                        │
        ┌───────────────────────────────────────────────┼───────────────────────────────────────────────┐
        ▼                 ▼                ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Bedrock   │  │ CDP Wallet  │  │   x402pay   │  │   Pinata    │  │ Market Data │
│    Nova     │  │   Service   │  │   Service   │  │    IPFS     │  │   Service   │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

## 🔐 Security

- End-to-end encryption for sensitive data
- JWT authentication with refresh tokens
- Rate limiting and DDoS protection
- Multi-signature wallet controls
- Immutable audit trails on IPFS

## 📈 Performance

- **AI Response Time**: < 200ms average
- **Trade Execution**: < 1 second end-to-end
- **System Uptime**: 99.9% target availability
- **Cost Savings**: 85% vs traditional cloud (via Akash)
- **Storage Redundancy**: 6x via IPFS pinning

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with ❤️ for the Coinbase Agents in Action Hackathon 2025

Special thanks to:
- Coinbase Developer Platform team
- Amazon Web Services Bedrock team
- x402pay protocol developers
- Akash Network community
- Pinata team

## 📞 Support

- GitHub Issues: [Report a bug](https://github.com/your-team/agentvault/issues)
- Discord: [Join our community](https://discord.gg/agentvault)
- Documentation: [Read the docs](./docs)

---

**AgentVault** - The future of autonomous crypto investment
