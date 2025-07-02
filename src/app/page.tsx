'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  icon: string;
}

interface TechIntegration {
  name: string;
  icon: string;
  description: string;
  status: string;
  color: string;
  gradient: string;
}

export default function AgentVaultHome() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const techIntegrations: TechIntegration[] = [
    {
      name: 'Amazon Bedrock Nova',
      icon: '🧠',
      description: 'AI-powered market analysis and autonomous trading decisions',
      status: 'Connected',
      color: 'from-orange-500 to-orange-600',
      gradient: 'from-orange-500/20 to-orange-600/20'
    },
    {
      name: 'x402pay',
      icon: '💰',
      description: 'Micropayments for AI queries and revenue sharing',
      status: 'Active',
      color: 'from-green-500 to-emerald-600',
      gradient: 'from-green-500/20 to-emerald-600/20'
    },
    {
      name: 'CDP Wallet',
      icon: '🏦',
      description: 'Secure programmable wallet management',
      status: 'Integrated',
      color: 'from-blue-500 to-blue-600',
      gradient: 'from-blue-500/20 to-blue-600/20'
    },
    {
      name: 'Akash Network',
      icon: '☁️',
      description: 'Decentralized compute infrastructure',
      status: 'Ready',
      color: 'from-purple-500 to-purple-600',
      gradient: 'from-purple-500/20 to-purple-600/20'
    },
    {
      name: 'Pinata IPFS',
      icon: '📁',
      description: 'Distributed storage for audit trails',
      status: 'Storing',
      color: 'from-pink-500 to-pink-600',
      gradient: 'from-pink-500/20 to-pink-600/20'
    }
  ];

  useEffect(() => {
    // Simulate loading and data fetching
    setTimeout(() => {
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
        { symbol: 'BTC', price: 45000, change24h: 4.65, icon: '₿' },
        { symbol: 'ETH', price: 3000, change24h: 5.26, icon: 'Ξ' },
        { symbol: 'USDC', price: 1, change24h: 0.01, icon: '$' }
    ]);

      setIsLoaded(true);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-3xl floating"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-600/10 to-transparent rounded-full blur-3xl floating-delayed"></div>
              </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <div className="inline-flex items-center space-x-2 bg-purple-600/20 border border-purple-500/30 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {process.env.NEXT_PUBLIC_ENV !== 'production' && (
                  <span className="text-purple-300 text-sm font-medium">Built for Coinbase Agents in Action Hackathon 2024</span>
                )}
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black mb-6">
                <span className="gradient-text">AgentVault</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Autonomous cryptocurrency investment agents powered by{' '}
                <span className="text-purple-400 font-semibold">AI intelligence</span> and{' '}
                <span className="text-blue-400 font-semibold">blockchain innovation</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard" className="btn-primary text-lg px-8 py-4 animate-glow">
                  Launch Dashboard
                </Link>
                <Link href="/marketplace" className="btn-secondary text-lg px-8 py-4">
                  Explore Marketplace
                </Link>
              </div>
          </div>

            {/* Technology Integration Showcase */}
            <div className="mb-16 animate-slide-up delay-200">
              <h2 className="text-3xl font-bold text-white text-center mb-8">
                Integrating 5 Cutting-Edge Technologies
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {techIntegrations.map((tech, index) => (
                  <div 
                    key={tech.name}
                    className={`tech-card animate-slide-up group`}
                    data-delay={index}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${tech.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                      <span className="text-white text-xl">{tech.icon}</span>
              </div>
                    <h3 className="text-white font-semibold mb-2 text-sm">{tech.name}</h3>
                    <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                      {tech.description}
                    </p>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${tech.gradient} text-white border border-white/20`}>
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      {tech.status}
          </div>
              </div>
                ))}
              </div>
            </div>

            {/* Live Dashboard Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up delay-400">
              {/* Active Agents Preview */}
              <div className="lg:col-span-2">
                <div className="agent-card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Active Agents</h2>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-sm font-medium">Live Trading</span>
          </div>
        </div>

              <div className="space-y-4">
                    {isLoaded ? agents.map((agent, index) => (
                      <div 
                        key={agent.id} 
                        className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30 hover:border-purple-500/30 transition-all duration-300 animate-fade-in"
                        data-delay={index}
                      >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                              agent.status === 'ACTIVE' ? 'bg-green-400 animate-pulse' :
                          agent.status === 'PAUSED' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                            <span className="text-white font-semibold">{agent.name}</span>
                      </div>
                          <span className={`status-badge ${
                            agent.status === 'ACTIVE' ? 'status-active' :
                            agent.status === 'PAUSED' ? 'status-paused' : 'status-error'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Total Return:</span>
                            <div className="metric-positive text-lg">
                          ${agent.performance.totalReturn.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Return %:</span>
                            <div className="metric-positive text-lg">
                          +{agent.performance.totalReturnPercentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                    )) : (
                      [...Array(2)].map((_, i) => (
                        <div key={i} className="skeleton h-20"></div>
                      ))
                    )}
                    
                    <Link href="/agents/create" className="block">
                      <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg">
                        <span className="text-lg">+ Create New Agent</span>
                </button>
                    </Link>
              </div>
            </div>
          </div>

              {/* Market Data & Portfolio Preview */}
              <div className="space-y-6">
          {/* Market Data */}
                <div className="crypto-card p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Live Market Data</h2>
              <div className="space-y-4">
                    {isLoaded ? marketData.map((coin, index) => (
                      <div 
                        key={coin.symbol} 
                        className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all duration-300 animate-fade-in"
                        data-delay={index}
                      >
                    <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold">{coin.icon}</span>
                      </div>
                          <span className="text-white font-semibold">{coin.symbol}</span>
                    </div>
                    <div className="text-right">
                          <div className="text-white font-bold">
                        ${coin.price.toLocaleString()}
                      </div>
                          <div className={`text-sm font-semibold ${coin.change24h >= 0 ? 'metric-positive' : 'metric-negative'}`}>
                        {coin.change24h >= 0 ? '+' : ''}{coin.change24h}%
                      </div>
                    </div>
                  </div>
                    )) : (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton h-16"></div>
                      ))
                    )}
              </div>
            </div>

            {/* Portfolio Overview */}
                <div className="crypto-card p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Portfolio Overview</h2>
                  {isLoaded ? (
                    <div className="text-center">
                      <div className="text-4xl font-black text-white mb-2">$25,000</div>
                      <div className="metric-positive text-xl mb-4">+$2,100 (+9.2%)</div>
                      
              <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">BTC (45%)</span>
                          <span className="text-white font-semibold">$11,250</span>
                </div>
                        <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">ETH (30%)</span>
                          <span className="text-white font-semibold">$7,500</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">USDC (25%)</span>
                          <span className="text-white font-semibold">$6,250</span>
                        </div>
                      </div>
                      
                      <Link href="/portfolio" className="block mt-4">
                        <button className="w-full btn-secondary text-sm">
                          View Full Portfolio
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="skeleton h-8 w-3/4 mx-auto"></div>
                      <div className="skeleton h-6 w-1/2 mx-auto"></div>
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="skeleton h-4"></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center mt-16 animate-fade-in delay-600">
              <div className="crypto-card p-8 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to Deploy Your AI Trading Agent?
                </h2>
                <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                  Join the future of autonomous cryptocurrency investing. Deploy, monitor, and monetize 
                  your AI agents while leveraging cutting-edge blockchain technology.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/marketplace" className="btn-ghost text-lg px-8 py-4">
                    Explore Agents
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 py-8 px-6 mt-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="text-2xl">🏆</span>
                {process.env.NEXT_PUBLIC_ENV !== 'production' && (
                  <span className="text-gray-400 text-sm">Built for Coinbase Agents in Action Hackathon 2024</span>
                )}
              </div>
              <p className="text-gray-500 text-sm">
            Integrating Amazon Bedrock Nova • x402pay • CDP Wallet • Akash Network • Pinata IPFS
              </p>
              <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-gray-500">
                <span>Prize Pool: $28,000</span>
                <span>•</span>
                <span>5 Technology Tracks</span>
                <span>•</span>
                <span>Autonomous AI Agents</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
} 