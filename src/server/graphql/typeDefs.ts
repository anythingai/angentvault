import gql from 'graphql-tag';

export const typeDefs = gql`
  scalar JSON
  scalar DateTime

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
    status: String!
    config: JSON!
    performance: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MarketData {
    symbol: String!
    price: Float!
    volume24h: Float!
    change24h: Float!
    changePercentage24h: Float!
    marketCap: Float
    timestamp: DateTime!
  }

  type Query {
    me: User
    agents: [Agent!]!
    agent(id: ID!): Agent
    marketData(symbol: String!): MarketData
  }

  type Mutation {
    createAgent(name: String!, description: String!, config: JSON!): Agent!
    updateAgent(id: ID!, name: String, description: String, config: JSON): Agent!
    startAgent(id: ID!): Agent!
    pauseAgent(id: ID!): Agent!
  }

  type Subscription {
    agentStatusChanged(userId: ID!): Agent!
    marketDataUpdated(symbol: String!): MarketData!
  }
`; 