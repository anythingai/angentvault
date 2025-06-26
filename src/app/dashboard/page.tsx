'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import AgentCards from '../components/AgentCards';

// Dynamically import chart components to avoid SSR issues
const DynamicPortfolioChart = dynamic(() => import('../components/PortfolioChart'), {
  ssr: false,
  loading: () => <div className="crypto-card p-6 animate-pulse"><div className="h-64 bg-gray-700 rounded"></div></div>
});

interface DashboardStats {
  totalPortfolioValue: number;
  totalPnL: number;
  pnlPercentage: number;
  activeAgents: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalTrades: number;
  successRate: number;
}

interface MarketAlert {
  id: string;
  type: 'opportunity' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

interface RecentActivity {
  id: string;
  type: 'trade' | 'payment' | 'agent_action' | 'revenue';
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [marketAlerts, setMarketAlerts] = useState<MarketAlert[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock API calls - replace with actual GraphQL queries
      const mockStats: DashboardStats = {
        totalPortfolioValue: 25000 + Math.random() * 1000 - 500,
        totalPnL: 2100 + Math.random() * 200 - 100,
        pnlPercentage: 9.2 + Math.random() * 2 - 1,
        activeAgents: 3,
        totalRevenue: 127.45,
        monthlyRevenue: 42.80,
        totalTrades: 247,
        successRate: 87.5
      };

      const mockAlerts: MarketAlert[] = [
        {
          id: '1',
          type: 'opportunity',
          title: 'High Yield Opportunity Detected',
          message: 'DeFi protocol offering 15.2% APY on USDC staking',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          priority: 'high'
        },
        {
          id: '2',
          type: 'warning',
          title: 'Market Volatility Alert',
          message: 'BTC showing increased volatility, consider reducing position size',
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          priority: 'medium'
        }
      ];

      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'trade',
          title: 'ETH Purchase Executed',
          description: 'DeFi Yield Hunter bought 0.5 ETH at $3,150',
          amount: 1575,
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'revenue',
          title: 'x402pay Revenue Received',
          description: 'Query fee from agent subscription',
          amount: 0.05,
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'success'
        },
        {
          id: '3',
          type: 'payment',
          title: 'Bedrock API Payment',
          description: 'AI analysis query processed',
          amount: 0.002,
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          status: 'success'
        }
      ];

      setStats(mockStats);
      setMarketAlerts(mockAlerts);
      setRecentActivity(mockActivity);
      setIsLoading(false);
    } catch (error) {
      // eslint-disable-next-line no-console -- Replace with proper logger in production
      setIsLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return '🎯';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📊';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'trade':
        return '📈';
      case 'payment':
        return '💳';
      case 'agent_action':
        return '🤖';
      case 'revenue':
        return '💰';
      default:
        return '📊';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Monitor your autonomous agents and portfolio performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="crypto-card p-6">
          <div className="flex items-center justify-between">
          <div>
              <p className="text-gray-400 text-sm">Portfolio Value</p>
              <p className="text-2xl font-bold text-white">
                ${stats?.totalPortfolioValue.toLocaleString()}
              </p>
              <p className={`text-sm ${stats && stats.pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats && stats.pnlPercentage >= 0 ? '+' : ''}{stats?.pnlPercentage.toFixed(2)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

            <div className="crypto-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Agents</p>
              <p className="text-2xl font-bold text-white">{stats?.activeAgents}</p>
              <p className="text-sm text-green-400">All operational</p>
            </div>
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
          </div>
        </div>

            <div className="crypto-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white">${stats?.totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-purple-400">+${stats?.monthlyRevenue.toFixed(2)} this month</p>
            </div>
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

            <div className="crypto-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-white">{stats?.successRate}%</p>
              <p className="text-sm text-blue-400">{stats?.totalTrades} total trades</p>
            </div>
            <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Portfolio Chart - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <Suspense fallback={
            <div className="crypto-card p-6 animate-pulse">
              <div className="h-64 bg-gray-700 rounded"></div>
            </div>
          }>
            <DynamicPortfolioChart />
          </Suspense>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Market Alerts */}
          <div className="crypto-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Market Alerts</h3>
            <div className="space-y-3">
              {marketAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">{getAlertIcon(alert.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{alert.title}</p>
                      <p className="text-gray-400 text-xs mt-1">{alert.message}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                </div>
              ))}
              <button className="w-full text-purple-400 hover:text-purple-300 text-sm mt-2">
                View all alerts →
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="crypto-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                Create New Agent
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                Fund Wallet
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                View Analytics
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="crypto-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <span className="text-lg">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{activity.title}</p>
                    <p className="text-gray-400 text-xs">{activity.description}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-500 text-xs">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                      {activity.amount && (
                        <span className={`text-xs font-medium ${getStatusColor(activity.status)}`}>
                          ${activity.amount.toLocaleString()}
                        </span>
                      )}
                  </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>

      {/* Agent Cards */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Your Agents</h2>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            Manage All Agents
          </button>
                </div>
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="crypto-card p-6 animate-pulse">
                <div className="h-32 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        }>
          <AgentCards />
        </Suspense>
      </div>

      {/* Performance Insights */}
      <div className="mt-8 crypto-card p-6">
        <h3 className="text-xl font-bold text-white mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Best Performing Strategy</h4>
            <p className="text-gray-400 text-sm mb-2">DeFi Yield Farming</p>
            <p className="text-green-400 font-bold">+15.3% this month</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Most Active Pair</h4>
            <p className="text-gray-400 text-sm mb-2">ETH/USDC</p>
            <p className="text-blue-400 font-bold">127 trades executed</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Revenue Growth</h4>
            <p className="text-gray-400 text-sm mb-2">x402pay earnings</p>
            <p className="text-purple-400 font-bold">+28% vs last month</p>
          </div>
        </div>
      </div>
    </div>
  );
} 