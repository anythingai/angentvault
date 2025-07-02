import gql from 'graphql-tag';

export const typeDefs = gql`
  scalar JSON
  scalar DateTime

  enum AgentStatus {
    ACTIVE
    PAUSED
    STOPPED
    ERROR
  }

  enum TradeStatus {
    PENDING
    EXECUTED
    FAILED
    CANCELLED
  }

  enum PaymentStatus {
    PENDING
    COMPLETED
    FAILED
    REFUNDED
  }

  enum PaymentType {
    SUBSCRIPTION
    AGENT_ACCESS
    QUERY_FEE
    REVENUE_SHARE
  }

  type User {
    id: ID!
    email: String!
    name: String!
    walletAddress: String!
    subscription: String!
    isVerified: Boolean!
    createdAt: DateTime!
  }

  type Agent {
    id: ID!
    name: String!
    description: String!
    status: AgentStatus!
    config: JSON!
    performance: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Trade {
    id: ID!
    agentId: ID!
    type: String!
    symbol: String!
    amount: Float!
    price: Float!
    status: TradeStatus!
    txHash: String
    createdAt: DateTime!
  }

  type Payment {
    id: ID!
    userId: ID!
    amount: Float!
    currency: String!
    type: PaymentType!
    status: PaymentStatus!
    transactionHash: String
    createdAt: DateTime!
  }

  input CreateAgentInput {
    name: String!
    description: String!
    config: JSON!
  }

  input ExecuteTradeInput {
    agentId: ID!
    type: String!
    symbol: String!
    amount: Float!
    price: Float!
    fromAsset: String!
    toAsset: String!
  }

  input ProcessPaymentInput {
    amount: Float!
    currency: String!
    type: PaymentType!
    recipient: String!
    metadata: JSON
  }

  type DeploymentResponse {
    success: Boolean!
    agent: Agent!
    message: String!
  }

  type Query {
    hello: String!
    testCDPConnection: CDPTestResponse!
    me: User
    agents: [Agent!]!
    agent(id: ID!): Agent
    marketData(symbols: [String!]!): [JSON!]!
    agentDecision(symbol: String!): AgentDecision!
    portfolio: JSON
  }

  type CDPTestResponse {
    success: Boolean!
    message: String!
    timestamp: DateTime!
  }

  type Mutation {
    createAgent(input: CreateAgentInput!): Agent!
    startAgent(id: ID!): Agent!
    stopAgent(id: ID!): Agent!
    deployAgent(id: ID!): DeploymentResponse!
    executeTrade(input: ExecuteTradeInput!): Trade!
    executePayment(agentId: ID!, amount: Float!): Payment!
    processPayment(input: ProcessPaymentInput!): Payment!
  }

  type Subscription {
    agentStatusUpdated: Agent!
    tradeExecuted: Trade!
  }

  # Minimalist trading decision produced by Bedrock
  type AgentDecision {
    symbol: String!
    side: String!
    confidence: Float!
  }
`; 