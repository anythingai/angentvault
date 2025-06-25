'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  createdAt: string;
  performance?: {
    totalTrades: number;
    winRate: number;
    totalReturn: number;
  };
}

interface Portfolio {
  totalValue: number;
  totalPnL: number;
  pnlPercentage: number;
  assets: Array<{
    symbol: string;
    amount: number;
    value: number;
    change24h: number;
  }>;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      // Fetch agents and portfolio via GraphQL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const query = `
        query Dashboard {
          agents { id name description status createdAt }
          portfolio
        }
      `;

      const resp = await fetch(`${apiUrl}/graphql`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
        credentials: 'include',
      });

      const json: GraphQLResponse<{ agents: Agent[]; portfolio: Portfolio }> = await resp.json();

      if (json.errors) {
        throw new Error(json.errors[0].message);
      }

      setAgents(json.data?.agents || []);
      setPortfolio(json.data?.portfolio || null);
    } catch (error) {
      // console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-500';
      case 'PAUSED': return 'text-yellow-500';
      case 'ERROR': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="crypto-card p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-gray-300 mt-4 text-center">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">AgentVault Dashboard</h1>
            <p className="text-gray-400">Monitor and manage your AI trading agents</p>
          </div>
          <button
            onClick={() => router.push('/agents/create')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Create New Agent
          </button>
        </div>

        {/* Portfolio Overview */}
        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="crypto-card p-6">
              <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-2">Total Value</h3>
              <p className="text-2xl font-bold text-white">${portfolio.totalValue.toLocaleString()}</p>
            </div>
            <div className="crypto-card p-6">
              <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-2">P&L</h3>
              <p className={`text-2xl font-bold ${portfolio.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${portfolio.totalPnL.toLocaleString()}
              </p>
            </div>
            <div className="crypto-card p-6">
              <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-2">P&L %</h3>
              <p className={`text-2xl font-bold ${portfolio.pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolio.pnlPercentage >= 0 ? '+' : ''}{portfolio.pnlPercentage.toFixed(2)}%
              </p>
            </div>
            <div className="crypto-card p-6">
              <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-2">Active Agents</h3>
              <p className="text-2xl font-bold text-white">{agents.filter(a => a.status === 'ACTIVE').length}</p>
            </div>
          </div>
        )}

        {/* Agents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="crypto-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Your AI Agents</h2>
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="border border-gray-700 rounded-lg p-4 hover:border-purple-500 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-semibold">{agent.name}</h3>
                    <span className={`text-sm px-2 py-1 rounded ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{agent.description}</p>
                  {agent.performance && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Trades</p>
                        <p className="text-white font-medium">{agent.performance.totalTrades}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Win Rate</p>
                        <p className="text-white font-medium">{agent.performance.winRate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Return</p>
                        <p className={`font-medium ${agent.performance.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {agent.performance.totalReturn >= 0 ? '+' : ''}{agent.performance.totalReturn}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="crypto-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Portfolio Assets</h2>
            <div className="space-y-4">
              {portfolio?.assets.map((asset) => (
                <div key={asset.symbol} className="flex justify-between items-center border border-gray-700 rounded-lg p-4">
                  <div>
                    <p className="text-white font-semibold">{asset.symbol}</p>
                    <p className="text-gray-400 text-sm">{asset.amount} {asset.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">${asset.value.toLocaleString()}</p>
                    <p className={`text-sm ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="crypto-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { time: '2 min ago', action: 'BTC Momentum Bot executed buy order', amount: '$1,250' },
              { time: '15 min ago', action: 'DeFi Yield Hunter paused by user', amount: null },
              { time: '1 hour ago', action: 'BTC Momentum Bot executed sell order', amount: '$2,100' },
              { time: '3 hours ago', action: 'New agent "ETH Scalper" created', amount: null }
            ].map((activity, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-b-0">
                <div>
                  <p className="text-white text-sm">{activity.action}</p>
                  <p className="text-gray-500 text-xs">{activity.time}</p>
                </div>
                {activity.amount && (
                  <p className="text-green-400 font-medium">{activity.amount}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 