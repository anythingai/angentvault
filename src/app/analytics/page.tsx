'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalTrades: number;
  winRate: number;
  avgReturn: number;
  bestStrategy: string;
  totalVolume: number;
  activeAgents: number;
  performanceMetrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    alpha: number;
    beta: number;
    volatility: number;
    calmarRatio: number;
  };
  strategyPerformance: Array<{
    name: string;
    return: number;
    trades: number;
    winRate: number;
  }>;
  riskDistribution: Array<{
    level: string;
    percentage: number;
  }>;
  tradingActivity: Array<{
    date: string;
    trades: number;
    volume: number;
  }>;
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
  }, [timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        throw new Error(result.error || 'Invalid response');
      }
    } catch (error) {
      // Handle error silently in production
      // Set empty state
      setAnalytics({
        totalTrades: 0,
        winRate: 0,
        avgReturn: 0,
        bestStrategy: 'No data',
        totalVolume: 0,
        activeAgents: 0,
        performanceMetrics: {
          sharpeRatio: 0,
          maxDrawdown: 0,
          alpha: 0,
          beta: 1,
          volatility: 0,
          calmarRatio: 0,
        },
        strategyPerformance: [],
        riskDistribution: [
          { level: 'Low Risk', percentage: 0 },
          { level: 'Medium Risk', percentage: 0 },
          { level: 'High Risk', percentage: 0 },
        ],
        tradingActivity: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Convert API performance metrics to display format
  const getPerformanceMetrics = (): PerformanceMetric[] => {
    if (!analytics?.performanceMetrics) return [];
    
    const metrics = analytics.performanceMetrics;
    return [
      { 
        label: 'Sharpe Ratio', 
        value: metrics.sharpeRatio.toFixed(2), 
        change: 0, // Would need historical data for real change
        trend: metrics.sharpeRatio > 1 ? 'up' : metrics.sharpeRatio > 0.5 ? 'neutral' : 'down' 
      },
      { 
        label: 'Max Drawdown', 
        value: `${metrics.maxDrawdown.toFixed(1)}%`, 
        change: 0, // Max drawdown change not meaningful without context
        trend: 'neutral' 
      },
      { 
        label: 'Alpha', 
        value: metrics.alpha.toFixed(2), 
        change: 0, // Would need historical data for real change
        trend: metrics.alpha > 0 ? 'up' : metrics.alpha > -0.02 ? 'neutral' : 'down' 
      },
      { 
        label: 'Beta', 
        value: metrics.beta.toFixed(2), 
        change: 0, // Would need historical data for real change
        trend: Math.abs(metrics.beta - 1) < 0.2 ? 'neutral' : metrics.beta > 1 ? 'up' : 'down' 
      },
      { 
        label: 'Volatility', 
        value: `${metrics.volatility.toFixed(1)}%`, 
        change: 0, // Would need historical data for real change
        trend: metrics.volatility < 15 ? 'up' : metrics.volatility < 25 ? 'neutral' : 'down' 
      },
      { 
        label: 'Calmar Ratio', 
        value: metrics.calmarRatio.toFixed(2), 
        change: 0, // Would need historical data for real change
        trend: metrics.calmarRatio > 1 ? 'up' : metrics.calmarRatio > 0.5 ? 'neutral' : 'down' 
      },
    ];
  };

  // Generate heatmap data from real trading activity
  const generateHeatmapData = () => {
    if (!analytics?.tradingActivity || analytics.tradingActivity.length === 0) {
      // Return empty heatmap if no data
      return Array.from({ length: 35 }, () => 0);
    }

    // Create a map of dates to trade counts
    const activityMap = new Map<string, number>();
    analytics.tradingActivity.forEach(activity => {
      activityMap.set(activity.date, activity.trades);
    });

    // Generate last 35 days of data
    const heatmapData: number[] = [];
    const today = new Date();
    
    for (let i = 34; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const trades = activityMap.get(dateStr) || 0;
      heatmapData.push(trades);
    }
    
    return heatmapData;
  };

  const performanceMetrics = getPerformanceMetrics();
  const heatmapData = generateHeatmapData();
  const maxTrades = Math.max(...heatmapData, 1); // Avoid division by zero

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
            <p className="text-sm text-green-400">
              {analytics.totalTrades > 0 ? `${analytics.totalTrades} in selected period` : 'No trades yet'}
            </p>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Win Rate</h3>
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-2xl font-bold text-white">{analytics.winRate}%</p>
            <p className="text-sm text-green-400">
              {analytics.winRate > 50 ? '+' : ''}{(analytics.winRate - 50).toFixed(1)}% vs average
            </p>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Average Return</h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-2xl font-bold text-white">{analytics.avgReturn}%</p>
            <p className={`text-sm ${analytics.avgReturn > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {analytics.avgReturn > 0 ? '+' : ''}{analytics.avgReturn.toFixed(1)}% vs benchmark
            </p>
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
                  {metric.change !== 0 && (
                    <span className="text-sm font-medium">
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                  )}
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
            {analytics?.strategyPerformance && analytics.strategyPerformance.length > 0 ? (
              analytics.strategyPerformance.map((strategy) => (
                <div key={strategy.name} className="glass-card p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-white">{strategy.name}</h3>
                    <span className={`font-bold ${strategy.return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {strategy.return >= 0 ? '+' : ''}{strategy.return.toFixed(1)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Trades: </span>
                      <span className="text-white">{strategy.trades}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Win Rate: </span>
                      <span className="text-white">{strategy.winRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-card p-4">
                <p className="text-gray-400 text-center">No strategy data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="crypto-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Risk Analysis</h2>
          <div className="space-y-4">
            <div className="glass-card p-4">
              <h3 className="font-semibold text-white mb-3">Risk Distribution</h3>
              <div className="space-y-2">
                {analytics?.riskDistribution.map((risk) => {
                  // Convert percentage to Tailwind width class
                  const getWidthClass = (percentage: number) => {
                    if (percentage === 0) return 'w-0';
                    if (percentage <= 10) return 'w-1/12';
                    if (percentage <= 20) return 'w-1/5';
                    if (percentage <= 25) return 'w-1/4';
                    if (percentage <= 33) return 'w-1/3';
                    if (percentage <= 40) return 'w-2/5';
                    if (percentage <= 50) return 'w-1/2';
                    if (percentage <= 60) return 'w-3/5';
                    if (percentage <= 66) return 'w-2/3';
                    if (percentage <= 75) return 'w-3/4';
                    if (percentage <= 80) return 'w-4/5';
                    if (percentage <= 90) return 'w-11/12';
                    return 'w-full';
                  };

                  return (
                    <div key={risk.level} className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">{risk.level}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2 relative">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getWidthClass(risk.percentage)} ${
                              risk.level === 'Low Risk' ? 'bg-green-500' :
                              risk.level === 'Medium Risk' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                          ></div>
                        </div>
                        <span className="text-white text-sm w-8">{risk.percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="glass-card p-4">
              <h3 className="font-semibold text-white mb-3">Risk Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Value at Risk (VaR)</span>
                  <span className="text-white text-sm">
                    -{analytics?.performanceMetrics.maxDrawdown.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Expected Shortfall</span>
                  <span className="text-white text-sm">
                    -{(analytics?.performanceMetrics.maxDrawdown || 0 * 1.5).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Risk Score</span>
                  <span className={`text-sm font-medium ${
                    (analytics?.performanceMetrics.volatility || 0) < 15 ? 'text-green-400' :
                    (analytics?.performanceMetrics.volatility || 0) < 25 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {(analytics?.performanceMetrics.volatility || 0) < 15 ? 'Low' :
                     (analytics?.performanceMetrics.volatility || 0) < 25 ? 'Medium' : 'High'}
                  </span>
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
          {heatmapData.map((trades, i) => {
            const intensity = maxTrades > 0 ? trades / maxTrades : 0;
            return (
              <div
                key={i}
                className={`aspect-square rounded-sm ${
                  intensity > 0.7 ? 'bg-purple-500' :
                  intensity > 0.4 ? 'bg-purple-600/70' :
                  intensity > 0.1 ? 'bg-purple-700/50' :
                  'bg-gray-800'
                }`}
                title={`${trades} trades`}
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