'use client';

import { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  performance: {
    totalReturn: number;
    totalReturnPercentage: number;
  };
}

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
}

export default function AgentVaultDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Mock data for demo
    setAgents([
      {
        id: '1',
        name: 'DeFi Yield Hunter',
        status: 'ACTIVE',
        performance: { totalReturn: 1250, totalReturnPercentage: 12.5 }
      },
      {
        id: '2', 
        name: 'BTC Momentum Trader',
        status: 'PAUSED',
        performance: { totalReturn: 850, totalReturnPercentage: 8.5 }
      }
    ]);

    setMarketData([
      { symbol: 'BTC', price: 45000, change24h: 4.65 },
      { symbol: 'ETH', price: 3000, change24h: 5.26 },
      { symbol: 'USDC', price: 1, change24h: 0.01 }
    ]);

    // Simulate WebSocket connection
    const timer = setTimeout(() => setIsConnected(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AgentVault
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-gray-300 text-sm">
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
            </div>
            <div className="text-gray-300 text-sm">
              Coinbase Agents in Action Hackathon
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Technology Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🧠</span>
              </div>
              <h3 className="text-white font-semibold">Amazon Bedrock Nova</h3>
            </div>
            <p className="text-gray-400 text-sm">
              AI-powered market analysis and autonomous trading decisions
            </p>
            <div className="mt-3 text-green-400 text-xs">✓ Connected</div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">💰</span>
              </div>
              <h3 className="text-white font-semibold">x402pay</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Micropayments for AI queries and revenue sharing
            </p>
            <div className="mt-3 text-green-400 text-xs">✓ Active</div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🏦</span>
              </div>
              <h3 className="text-white font-semibold">CDP Wallet</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Secure programmable wallet management
            </p>
            <div className="mt-3 text-green-400 text-xs">✓ Integrated</div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">☁️</span>
              </div>
              <h3 className="text-white font-semibold">Akash Network</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Decentralized compute infrastructure
            </p>
            <div className="mt-3 text-yellow-400 text-xs">⚡ Ready</div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">📁</span>
              </div>
              <h3 className="text-white font-semibold">Pinata IPFS</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Distributed storage for audit trails
            </p>
            <div className="mt-3 text-green-400 text-xs">✓ Storing</div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Agents */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-6">Active Agents</h2>
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          agent.status === 'ACTIVE' ? 'bg-green-400' :
                          agent.status === 'PAUSED' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                        <span className="text-white font-medium">{agent.name}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        agent.status === 'ACTIVE' ? 'bg-green-900 text-green-200' :
                        agent.status === 'PAUSED' ? 'bg-yellow-900 text-yellow-200' : 'bg-red-900 text-red-200'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Total Return:</span>
                        <div className="text-green-400 font-semibold">
                          ${agent.performance.totalReturn.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Return %:</span>
                        <div className="text-green-400 font-semibold">
                          +{agent.performance.totalReturnPercentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200">
                  + Create New Agent
                </button>
              </div>
            </div>
          </div>

          {/* Market Data */}
          <div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-6">
              <h2 className="text-xl font-semibold text-white mb-6">Market Data</h2>
              <div className="space-y-4">
                {marketData.map((coin) => (
                  <div key={coin.symbol} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">{coin.symbol.slice(0, 2)}</span>
                      </div>
                      <span className="text-white font-medium">{coin.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        ${coin.price.toLocaleString()}
                      </div>
                      <div className={`text-sm ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {coin.change24h >= 0 ? '+' : ''}{coin.change24h}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Overview */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-6">Portfolio</h2>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-white">$25,000</div>
                <div className="text-green-400 text-lg">+$2,100 (+9.2%)</div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">BTC (45%)</span>
                  <span className="text-white">$11,250</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">ETH (30%)</span>
                  <span className="text-white">$7,500</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">USDC (25%)</span>
                  <span className="text-white">$6,250</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="text-gray-400 text-sm">
            🏆 Built for Coinbase Agents in Action Hackathon 2024
          </div>
          <div className="text-gray-500 text-xs mt-2">
            Integrating Amazon Bedrock Nova • x402pay • CDP Wallet • Akash Network • Pinata IPFS
          </div>
        </footer>
      </div>
    </div>
  );
} 