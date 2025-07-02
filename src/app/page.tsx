'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import useAuth from '@/app/hooks/useAuth'; // Assuming useAuth hook provides authentication status

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
  const { isAuthenticated } = useAuth(); // Use auth hook

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
      name: 'Wallet (MetaMask, Coinbase, etc.)',
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
    // Always fetch real market data, regardless of authentication
    fetchRealData();
    // For agents, still show mock data for logged-out users
    if (!isAuthenticated) {
      setAgents([
        { id: 'demo-1', name: 'Momentum Master', status: 'ACTIVE', performance: { totalReturn: 1250.75, totalReturnPercentage: 15.2 } },
        { id: 'demo-2', name: 'Volatility Vulture', status: 'ACTIVE', performance: { totalReturn: 840.50, totalReturnPercentage: 8.9 } },
      ]);
    }
  }, [isAuthenticated]);

  const fetchRealData = async () => {
    try {
      // Fetch real agent data
      const token = localStorage.getItem('authToken');
      
      const [agentsResponse, marketResponse] = await Promise.allSettled([
        fetch('/api/agents', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/market/overview', {
          headers: {
            'Content-Type': 'application/json',
          },
        })
      ]);

      // Handle agents data
      if (agentsResponse.status === 'fulfilled' && agentsResponse.value.ok) {
        const agentsData = await agentsResponse.value.json();
        setAgents(agentsData.agents?.slice(0, 2) || []); // Show top 2 agents
      } else {
        // Fallback to empty state if no authentication or no agents
        setAgents([]);
      }

      // Handle market data
      if (marketResponse.status === 'fulfilled' && marketResponse.value.ok) {
        const marketData = await marketResponse.value.json();
        setMarketData(marketData.data || [
          { symbol: 'BTC', price: 45000, change24h: 4.65, icon: '₿' },
          { symbol: 'ETH', price: 3000, change24h: 5.26, icon: 'Ξ' },
          { symbol: 'USDC', price: 1, change24h: 0.01, icon: '$' }
        ]);
      } else {
        // Fallback to default market data
        setMarketData([
          { symbol: 'BTC', price: 45000, change24h: 4.65, icon: '₿' },
          { symbol: 'ETH', price: 3000, change24h: 5.26, icon: 'Ξ' },
          { symbol: 'USDC', price: 1, change24h: 0.01, icon: '$' }
        ]);
      }
    } catch (error) {
      // Log error for debugging without using console
      
      // Fallback to empty/default state on error
      setAgents([]);
      setMarketData([
        { symbol: 'BTC', price: 0, change24h: 0, icon: '₿' },
        { symbol: 'ETH', price: 0, change24h: 0, icon: 'Ξ' },
        { symbol: 'USDC', price: 1, change24h: 0, icon: '$' }
      ]);
    } finally {
      setIsLoaded(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-3xl floating"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-600/10 to-transparent rounded-full blur-3xl floating-delayed"></div>
              </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center">
              <div className="animate-fade-in-up delay-200 inline-flex items-center space-x-2 bg-purple-600/20 border border-purple-500/30 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-purple-300 text-sm font-medium">Your Gateway to Autonomous Trading</span>
              </div>
              
              <h1 className="animate-fade-in-up delay-400 text-5xl md:text-7xl font-black mb-6">
                <span className="gradient-text">Unleash AI-Powered Crypto Agents</span>
              </h1>
              
              <p className="animate-fade-in-up delay-600 text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed">
                Deploy intelligent agents that analyze markets, execute trades, and manage your portfolio 24/7. No code, no hassle.
              </p>
              
              <div className="animate-fade-in-up delay-800 flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <Link href="/dashboard" className="btn-primary text-lg px-8 py-4 animate-glow">
                    Launch Dashboard
                  </Link>
                ) : (
                  <Link href="/register" className="btn-primary text-lg px-8 py-4 animate-glow">
                    Get Started for Free
                  </Link>
                )}
                <Link href="/marketplace" className="btn-secondary text-lg px-8 py-4">
                  Explore Agent Marketplace
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Other Sections Wrapper */}
        <div className="space-y-24 pb-24">
            {/* Technology Integration Showcase */}
            <section>
              <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-white text-center mb-8">
                  Integrating 5 Cutting-Edge Technologies
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {techIntegrations.map((tech, _index) => (
                    <div 
                      key={tech.name}
                      className={`tech-card animate-slide-up group hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2 transition-all duration-300`}
                      data-delay={_index}
                    >
                      <div className={`w-12 h-12 bg-gradient-to-r ${tech.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
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
            </section>

            {/* How It Works Section */}
            <section>
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold mb-4 text-white drop-shadow-md">Get Started in 3 Simple Steps</h2>
                  <p className="text-lg text-gray-200 max-w-2xl mx-auto">
                    Begin your autonomous trading journey with a seamless and secure setup process.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-center">
                  {/* Step 1 */}
                  <div className="how-it-works-card bg-gradient-to-br from-purple-900/60 to-purple-800/40 border border-purple-600/30 rounded-2xl shadow-lg p-8 flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-2xl focus-within:scale-105 focus-within:shadow-2xl">
                    {/* Heroicon: Bank */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 mb-4 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5V7.75A2.25 2.25 0 015.25 5.5h13.5A2.25 2.25 0 0121 7.75v2.75M3 10.5h18M3 10.5v7.75A2.25 2.25 0 005.25 20.5h13.5A2.25 2.25 0 0021 18.25V10.5M7.5 20.5v-4.25m9 4.25v-4.25" />
                    </svg>
                    <h3 className="text-2xl font-semibold mb-2 text-white">Connect Your Wallet</h3>
                    <p className="text-gray-300 text-base">
                      Securely connect your favorite Web3 wallet. We support MetaMask, Coinbase Wallet, and more.
                    </p>
                  </div>
                  {/* Step 2 */}
                  <div className="how-it-works-card bg-gradient-to-br from-purple-900/60 to-purple-800/40 border border-purple-600/30 rounded-2xl shadow-lg p-8 flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-2xl focus-within:scale-105 focus-within:shadow-2xl">
                    {/* Heroicon: Robot */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 mb-4 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 0a7 7 0 017 7v3a7 7 0 01-7 7 7 7 0 01-7-7V11a7 7 0 017-7zm-4 7h8m-4 4v2m-2-2h4" />
                    </svg>
                    <h3 className="text-2xl font-semibold mb-2 text-white">Choose Your Agent</h3>
                    <p className="text-gray-300 text-base">
                      Select a pre-built agent from our marketplace or configure your own with custom strategies.
                    </p>
                  </div>
                  {/* Step 3 */}
                  <div className="how-it-works-card bg-gradient-to-br from-purple-900/60 to-purple-800/40 border border-purple-600/30 rounded-2xl shadow-lg p-8 flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-2xl focus-within:scale-105 focus-within:shadow-2xl">
                    {/* Heroicon: Rocket Launch */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 mb-4 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l2.25-2.25m0 0a7.5 7.5 0 0110.5 0m-10.5 0L12 12m0 0l5.25 5.25m-5.25-5.25V4.5m0 7.5l-2.25 2.25" />
                    </svg>
                    <h3 className="text-2xl font-semibold mb-2 text-white">Deploy & Monitor</h3>
                    <p className="text-gray-300 text-base">
                      Launch your agent and watch it trade autonomously. Track its performance from your dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Live Dashboard Preview */}
            <section>
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {/* Active Agents Section */}
                <div className="lg:col-span-2 flex flex-col h-full">
                  <div className="agent-card flex-1 flex flex-col justify-center p-8 bg-white/10 border border-purple-500/30 shadow-2xl rounded-2xl backdrop-blur-md">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-extrabold text-white drop-shadow">Active Agents</h2>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-300 text-sm font-semibold">Live Trading</span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      {isLoaded && agents.length > 0 ? (
                        agents.map((agent, _index) => (
                          <div key={agent.id} className="bg-white/10 p-4 rounded-xl border border-white/10 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                            <div className="flex items-center space-x-3 mb-2 md:mb-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                {agent.name[0]}
                              </div>
                              <div>
                                <span className="text-white font-bold text-lg">{agent.name}</span>
                                <span className="block text-gray-300 text-xs">{agent.status}</span>
                              </div>
                            </div>
                            <div className="flex flex-col md:items-end">
                              <span className="text-gray-300 text-xs">Total Return</span>
                              <span className="text-green-400 font-extrabold text-lg">${agent.performance.totalReturn.toLocaleString()} ({agent.performance.totalReturnPercentage.toFixed(2)}%)</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        // Featured Agents Ad
                        <div className="w-full flex flex-col items-center justify-center h-full">
                          <div className="mb-6 text-center">
                            <span className="inline-block bg-purple-600/20 text-purple-200 px-3 py-1 rounded-full text-xs font-semibold mb-2">Featured Agents</span>
                            <h3 className="text-2xl font-extrabold text-white mb-2">Discover Top Performing AI Agents</h3>
                            <p className="text-gray-300 text-base">Try one of our best agents and start trading autonomously!</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                            {/* Example featured agents */}
                            {[
                              {
                                avatar: 'M',
                                name: 'Momentum Master',
                                desc: 'Momentum-based trading strategy',
                                roi: '+18.2% ROI',
                                color: 'from-purple-400 to-blue-400',
                              },
                              {
                                avatar: 'V',
                                name: 'Volatility Vulture',
                                desc: 'Volatility arbitrage strategy',
                                roi: '+12.7% ROI',
                                color: 'from-pink-400 to-purple-400',
                              },
                              {
                                avatar: 'A',
                                name: 'Alpha Seeker',
                                desc: 'AI-driven alpha discovery',
                                roi: '+22.4% ROI',
                                color: 'from-blue-400 to-green-400',
                              },
                            ].map((agent, _i) => (
                              <div key={agent.name} className="bg-gradient-to-br from-purple-700/80 to-purple-900/60 rounded-xl p-6 border border-purple-500/30 shadow-md flex flex-col items-center h-full min-h-[320px]">
                                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center text-white text-2xl font-bold mb-3`}>{agent.avatar}</div>
                                <div className="text-white font-semibold mb-1 text-lg">{agent.name}</div>
                                <div className="text-gray-300 text-xs mb-2">{agent.desc}</div>
                                <div className="text-green-400 font-bold mb-4 text-lg">{agent.roi}</div>
                                <div className="flex-1"></div>
                                <a href="/marketplace" className="mt-auto text-xs px-6 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold transition">View Agent</a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Market Overview Section */}
                <div className="flex flex-col h-full">
                  <div className="agent-card flex-1 p-8 bg-white/10 border border-purple-500/30 shadow-2xl rounded-2xl backdrop-blur-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-extrabold text-white drop-shadow">Market Overview</h2>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <span className="text-blue-300 text-sm font-semibold">Real-time</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {isLoaded ? marketData.map(market => (
                          <div key={market.symbol} className="flex items-center justify-between bg-white/10 p-4 rounded-xl border border-white/10 shadow-sm">
                            <div className="flex items-center space-x-3">
                              <span className="text-xl text-white/80">{market.icon}</span>
                              <div>
                                <span className="text-white font-bold text-lg">{market.symbol}</span>
                                <span className="text-gray-300 text-xs block font-mono">${market.price.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className={`text-right font-extrabold text-lg ${market.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}> 
                              {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-8 text-gray-400">Loading market data...</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
        </div>
      </div>
    </div>
  );
} 