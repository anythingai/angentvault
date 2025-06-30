'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'ERROR';
  strategy: string;
  performance: {
    totalReturn: number;
    winRate: number;
    trades24h: number;
    lastTrade: string;
  };
  revenue: {
    totalEarned: number;
    monthlyEarned: number;
  };
  risk: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    maxDrawdown: number;
  };
  assets: string[];
}

export default function AgentCards() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAgents([
        {
          id: '1',
          name: 'DeFi Yield Hunter',
          description: 'Automated yield farming across multiple DeFi protocols with dynamic rebalancing',
          status: 'ACTIVE',
          strategy: 'Yield Farming',
          performance: {
            totalReturn: 1250.75,
            winRate: 91.0,
            trades24h: 8,
            lastTrade: new Date(Date.now() - 23 * 60 * 1000).toISOString()
          },
          revenue: {
            totalEarned: 47.85,
            monthlyEarned: 12.30
          },
          risk: {
            level: 'LOW',
            maxDrawdown: 2.1
          },
          assets: ['USDC', 'ETH', 'WBTC']
        },
        {
          id: '2',
          name: 'Arbitrage Scout',
          description: 'Cross-exchange arbitrage opportunities with lightning-fast execution',
          status: 'ACTIVE',
          strategy: 'Arbitrage',
          performance: {
            totalReturn: 892.40,
            winRate: 94.5,
            trades24h: 15,
            lastTrade: new Date(Date.now() - 8 * 60 * 1000).toISOString()
          },
          revenue: {
            totalEarned: 23.60,
            monthlyEarned: 8.90
          },
          risk: {
            level: 'MEDIUM',
            maxDrawdown: 1.5
          },
          assets: ['BTC', 'ETH', 'USDC']
        },
        {
          id: '3',
          name: 'Momentum Rider',
          description: 'Trend-following algorithm with advanced technical analysis and ML predictions',
          status: 'PAUSED',
          strategy: 'Momentum Trading',
          performance: {
            totalReturn: 2180.90,
            winRate: 73.2,
            trades24h: 0,
            lastTrade: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          },
          revenue: {
            totalEarned: 65.40,
            monthlyEarned: 0
          },
          risk: {
            level: 'HIGH',
            maxDrawdown: 8.3
          },
          assets: ['SOL', 'AVAX', 'MATIC']
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'PAUSED': return 'status-paused';
      case 'STOPPED': return 'status-error';
      case 'ERROR': return 'status-error';
      default: return 'status-error';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HIGH': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-80"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent, index) => (
        <div 
          key={agent.id} 
          className={`agent-card animate-slide-up group`}
          data-delay={index}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-bold text-white">{agent.name}</h3>
                <span className={`${getStatusColor(agent.status)}`}>
                  {agent.status}
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-2">{agent.description}</p>
              <div className="inline-flex items-center px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded-lg">
                <span className="text-purple-300 text-xs font-medium">{agent.strategy}</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Return</div>
              <div className="metric-positive text-lg font-bold">
                +{formatCurrency(agent.performance.totalReturn)}
              </div>
            </div>
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Win Rate</div>
              <div className="text-blue-400 text-lg font-bold">
                {agent.performance.winRate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Trading Activity */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Trading Activity</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  agent.status === 'ACTIVE' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                }`}></div>
                <span className="text-xs text-gray-400">
                  {agent.performance.trades24h} trades today
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last trade: {formatTime(agent.performance.lastTrade)}
            </div>
          </div>

          {/* Revenue & Risk */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Revenue</div>
              <div className="text-green-400 font-semibold text-sm">
                ${agent.revenue.totalEarned.toFixed(2)}
              </div>
              <div className="text-gray-500 text-xs">
                +${agent.revenue.monthlyEarned.toFixed(2)} this month
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Risk Level</div>
              <div className={`font-semibold text-sm ${getRiskColor(agent.risk.level)}`}>
                {agent.risk.level}
              </div>
              <div className="text-gray-500 text-xs">
                Max DD: {agent.risk.maxDrawdown}%
              </div>
            </div>
          </div>

          {/* Assets */}
          <div className="mb-4">
            <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Assets</div>
            <div className="flex space-x-2">
              {agent.assets.map((asset) => (
                <span 
                  key={asset}
                  className="px-2 py-1 bg-gray-700/50 border border-gray-600/50 rounded text-xs text-gray-300 font-medium"
                >
                  {asset}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4 border-t border-gray-700/50">
            <Link href={`/agents/${agent.id}`} className="flex-1">
              <button className="w-full btn-secondary text-sm py-2">
                View Details
              </button>
            </Link>
            <button 
              className={`flex-1 text-sm py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                agent.status === 'ACTIVE' 
                  ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 hover:bg-yellow-600/30' 
                  : 'bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30'
              }`}
            >
              {agent.status === 'ACTIVE' ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>
      ))}

      {/* Create New Agent Card */}
      <div className="agent-card border-2 border-dashed border-gray-600/50 hover:border-purple-500/50 transition-all duration-300 flex items-center justify-center min-h-[320px] group">
        <Link href="/agents/create" className="text-center p-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            <span className="text-white text-2xl">+</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
            Create New Agent
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Deploy a new AI trading agent with custom strategies and risk parameters
          </p>
        </Link>
      </div>
    </div>
  );
} 