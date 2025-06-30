'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalTrades: number;
  winRate: number;
  avgReturn: number;
  bestStrategy: string;
  totalVolume: number;
  activeAgents: number;
}

interface PerformanceMetric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: AnalyticsData = {
        totalTrades: 1247,
        winRate: 73.2,
        avgReturn: 12.8,
        bestStrategy: 'DeFi Yield Farming',
        totalVolume: 485230,
        activeAgents: 5
      };

      setAnalytics(mockData);
    } catch (error) {
      // Handle error - could implement toast notification or error state
      // console.error('Failed to fetch analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performanceMetrics: PerformanceMetric[] = [
    { label: 'Sharpe Ratio', value: '2.34', change: 8.2, trend: 'up' },
    { label: 'Max Drawdown', value: '12.4%', change: -2.1, trend: 'down' },
    { label: 'Alpha', value: '0.85', change: 15.3, trend: 'up' },
    { label: 'Beta', value: '1.12', change: 3.7, trend: 'up' },
    { label: 'Volatility', value: '18.7%', change: -5.2, trend: 'down' },
    { label: 'Calmar Ratio', value: '1.89', change: 12.1, trend: 'up' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">Comprehensive performance analysis and insights</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Total Trades</h3>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-2xl font-bold text-white">{analytics.totalTrades.toLocaleString()}</p>
            <p className="text-sm text-green-400">+127 this month</p>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Win Rate</h3>
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-2xl font-bold text-white">{analytics.winRate}%</p>
            <p className="text-sm text-green-400">+2.1% vs last month</p>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Average Return</h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-2xl font-bold text-white">{analytics.avgReturn}%</p>
            <p className="text-sm text-green-400">+1.4% vs benchmark</p>
          </div>
        </div>
      )}

      {/* Performance Metrics Grid */}
      <div className="crypto-card p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-6">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performanceMetrics.map((metric) => (
            <div key={metric.label} className="glass-card p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium text-gray-400">{metric.label}</h3>
                  <p className="text-lg font-bold text-white mt-1">{metric.value}</p>
                </div>
                <div className={`flex items-center space-x-1 ${
                  metric.trend === 'up' ? 'text-green-400' : 
                  metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  <span className="text-sm font-medium">
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                  <svg 
                    className={`w-4 h-4 ${metric.trend === 'up' ? 'rotate-0' : metric.trend === 'down' ? 'rotate-180' : 'hidden'}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="crypto-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Strategy Performance</h2>
          <div className="space-y-4">
            {[
              { name: 'DeFi Yield Farming', return: 18.7, trades: 423, winRate: 81.2 },
              { name: 'Momentum Trading', return: 12.3, trades: 287, winRate: 68.5 },
              { name: 'Mean Reversion', return: 9.8, trades: 341, winRate: 74.8 },
              { name: 'Arbitrage', return: 6.2, trades: 196, winRate: 89.3 },
            ].map((strategy) => (
              <div key={strategy.name} className="glass-card p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-white">{strategy.name}</h3>
                  <span className="text-green-400 font-bold">+{strategy.return}%</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Trades: </span>
                    <span className="text-white">{strategy.trades}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Win Rate: </span>
                    <span className="text-white">{strategy.winRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="crypto-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Risk Analysis</h2>
          <div className="space-y-4">
            <div className="glass-card p-4">
              <h3 className="font-semibold text-white mb-3">Risk Distribution</h3>
              <div className="space-y-2">
                {[
                  { level: 'Low Risk', percentage: 35, color: 'bg-green-500' },
                  { level: 'Medium Risk', percentage: 45, color: 'bg-yellow-500' },
                  { level: 'High Risk', percentage: 20, color: 'bg-red-500' },
                ].map((risk) => (
                  <div key={risk.level} className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{risk.level}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                                                 <div 
                           className={`${risk.color} h-2 rounded-full`}
                           style={{ '--width': risk.percentage } as React.CSSProperties & { '--width': number }}
                         ></div>
                      </div>
                      <span className="text-white text-sm w-8">{risk.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass-card p-4">
              <h3 className="font-semibold text-white mb-3">Risk Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Value at Risk (VaR)</span>
                  <span className="text-white text-sm">-8.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Expected Shortfall</span>
                  <span className="text-white text-sm">-12.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Risk Score</span>
                  <span className="text-yellow-400 text-sm font-medium">Medium</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Activity Heatmap */}
      <div className="crypto-card p-6">
        <h2 className="text-xl font-bold text-white mb-6">Trading Activity Heatmap</h2>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs text-gray-400 p-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => {
            const intensity = Math.random();
            return (
              <div
                key={i}
                className={`aspect-square rounded-sm ${
                  intensity > 0.7 ? 'bg-purple-500' :
                  intensity > 0.4 ? 'bg-purple-600/70' :
                  intensity > 0.2 ? 'bg-purple-700/50' :
                  'bg-gray-800'
                }`}
                title={`${Math.floor(intensity * 50)} trades`}
              />
            );
          })}
        </div>
        <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-gray-800 rounded-sm"></div>
            <div className="w-3 h-3 bg-purple-700/50 rounded-sm"></div>
            <div className="w-3 h-3 bg-purple-600/70 rounded-sm"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
} 