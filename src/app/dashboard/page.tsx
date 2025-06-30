'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import AgentCards from '../components/AgentCards';

// Dynamically import chart components to avoid SSR issues
const DynamicPortfolioChart = dynamic(() => import('../components/PortfolioChart'), {
  ssr: false,
  loading: () => <div className="crypto-card p-6 animate-pulse"><div className="h-64 bg-gray-700/50 rounded-lg"></div></div>
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="skeleton h-8 w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-32"></div>
              ))}
            </div>
            <div className="skeleton h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
          <div>
              <h1 className="text-4xl font-black text-white mb-2">
                <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="text-gray-400 text-lg">Monitor your autonomous agents and portfolio performance</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-semibold">Live Trading Active</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">💼</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">PORTFOLIO</span>
            </div>
            <div className="text-3xl font-black text-white mb-1">
              {formatCurrency(stats?.totalPortfolioValue || 0)}
            </div>
            <div className={`text-sm font-semibold ${
              (stats?.totalPnL || 0) >= 0 ? 'metric-positive' : 'metric-negative'
            }`}>
              {(stats?.totalPnL || 0) >= 0 ? '+' : ''}{formatCurrency(stats?.totalPnL || 0)}
              ({(stats?.pnlPercentage || 0) >= 0 ? '+' : ''}{stats?.pnlPercentage?.toFixed(2)}%)
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🤖</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">AGENTS</span>
            </div>
            <div className="text-3xl font-black text-white mb-1">
              {stats?.activeAgents || 0}
            </div>
            <div className="text-sm text-green-400 font-semibold">
              Active & Trading
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">💰</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">REVENUE</span>
            </div>
            <div className="text-3xl font-black text-white mb-1">
              ${stats?.totalRevenue?.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-purple-400 font-semibold">
              ${stats?.monthlyRevenue?.toFixed(2) || '0.00'} this month
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📈</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">SUCCESS</span>
            </div>
            <div className="text-3xl font-black text-white mb-1">
              {stats?.successRate?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-sm text-blue-400 font-semibold">
              {stats?.totalTrades || 0} total trades
            </div>
          </div>
                  </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Portfolio Chart */}
          <div className="lg:col-span-2 animate-slide-up delay-200">
            <Suspense fallback={<div className="crypto-card p-6 animate-pulse"><div className="h-64 bg-gray-700/50 rounded-lg"></div></div>}>
              <DynamicPortfolioChart />
            </Suspense>
                      </div>

          {/* Market Alerts & Activity */}
          <div className="space-y-6 animate-slide-up delay-300">
            {/* Market Alerts */}
            <div className="crypto-card p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">🚨</span>
                Market Alerts
              </h3>
              <div className="space-y-3">
                {marketAlerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded-xl border ${
                      alert.type === 'opportunity' ? 'bg-green-500/10 border-green-500/30' :
                      alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-blue-500/10 border-blue-500/30'
                    } hover:scale-[1.02] transition-transform duration-200`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getAlertIcon(alert.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-semibold text-sm">{alert.title}</h4>
                          <span className="text-xs text-gray-400">{formatTime(alert.timestamp)}</span>
                      </div>
                        <p className="text-gray-300 text-xs leading-relaxed">{alert.message}</p>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          </div>

            {/* Recent Activity */}
          <div className="crypto-card p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">{getActivityIcon(activity.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-medium text-sm truncate">{activity.title}</h4>
                        <span className="text-xs text-gray-400 ml-2">{formatTime(activity.timestamp)}</span>
                      </div>
                      <p className="text-gray-400 text-xs truncate">{activity.description}</p>
                      {activity.amount && (
                        <div className={`text-xs font-semibold ${getStatusColor(activity.status)}`}>
                          {activity.type === 'payment' ? '-' : '+'}{formatCurrency(activity.amount)}
                        </div>
                      )}
                  </div>
                  </div>
                ))}
                </div>
            </div>
          </div>
        </div>

        {/* Agent Management Section */}
        <div className="mt-8 animate-slide-up delay-400">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your AI Agents</h2>
            <button className="btn-primary">
              Create New Agent
            </button>
                </div>
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-48"></div>
            ))}
          </div>
          }>
            <AgentCards />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 