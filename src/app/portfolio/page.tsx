'use client';

import { useState, useEffect } from 'react';
import PortfolioChart from '../components/PortfolioChart';

interface Asset {
  symbol: string;
  name: string;
  amount: number;
  value: number;
  change24h: number;
  allocation: number;
  avgBuyPrice: number;
  currentPrice: number;
}

interface PortfolioStats {
  totalValue: number;
  totalPnL: number;
  pnlPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  totalAssets: number;
}

export default function PortfolioPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockAssets: Asset[] = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          amount: 0.5234,
          value: 26789.42,
          change24h: 2.34,
          allocation: 45.2,
          avgBuyPrice: 48200.00,
          currentPrice: 51156.78
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          amount: 12.87,
          value: 24156.90,
          change24h: -1.23,
          allocation: 40.8,
          avgBuyPrice: 1850.00,
          currentPrice: 1876.45
        },
        {
          symbol: 'SOL',
          name: 'Solana',
          amount: 156.32,
          value: 4892.30,
          change24h: 5.67,
          allocation: 8.2,
          avgBuyPrice: 28.50,
          currentPrice: 31.30
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          amount: 3456.78,
          value: 3456.78,
          change24h: 0.01,
          allocation: 5.8,
          avgBuyPrice: 1.00,
          currentPrice: 1.00
        }
      ];

      const mockStats: PortfolioStats = {
        totalValue: 59295.40,
        totalPnL: 4295.40,
        pnlPercentage: 7.8,
        dayChange: 892.34,
        dayChangePercentage: 1.53,
        totalAssets: mockAssets.length
      };

      setAssets(mockAssets);
      setStats(mockStats);
    } catch (error) {
      // Handle error - could implement toast notification or error state
      // console.error('Failed to fetch portfolio data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-700 rounded-lg mb-8"></div>
          <div className="h-64 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
          <p className="text-gray-400">Track your crypto investments and performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
            aria-label="Grid view"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
            aria-label="List view"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={fetchPortfolioData}
            className="btn-secondary px-4 py-2 text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Portfolio Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Total Value</h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-2xl font-bold text-white">${stats.totalValue.toLocaleString()}</p>
            <p className={`text-sm ${stats.dayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.dayChange >= 0 ? '+' : ''}${stats.dayChange.toLocaleString()} ({stats.dayChangePercentage >= 0 ? '+' : ''}{stats.dayChangePercentage}%) today
            </p>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Total P&L</h3>
              <span className="text-2xl">📈</span>
            </div>
            <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toLocaleString()}
            </p>
            <p className={`text-sm ${stats.pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.pnlPercentage >= 0 ? '+' : ''}{stats.pnlPercentage}% all time
            </p>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Best Performer</h3>
              <span className="text-2xl">🚀</span>
            </div>
            <p className="text-2xl font-bold text-white">SOL</p>
            <p className="text-sm text-green-400">+5.67% today</p>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Assets</h3>
              <span className="text-2xl">🏦</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalAssets}</p>
            <p className="text-sm text-gray-400">Active positions</p>
          </div>
        </div>
      )}

      {/* Portfolio Chart */}
      <div className="mb-8">
        <PortfolioChart />
      </div>

      {/* Assets Section */}
      <div className="crypto-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Your Assets</h2>
          <div className="text-sm text-gray-400">
            {assets.length} assets • Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div key={asset.symbol} className="glass-card p-4 hover:border-purple-500/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{asset.symbol}</h3>
                    <p className="text-sm text-gray-400">{asset.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    asset.change24h >= 0 ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                  }`}>
                    {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Amount</span>
                    <span className="text-white font-medium">{asset.amount.toLocaleString()} {asset.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Value</span>
                    <span className="text-white font-medium">${asset.value.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Allocation</span>
                    <span className="text-purple-400 font-medium">{asset.allocation}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full progress-bar" 
                      style={{ '--width': asset.allocation } as React.CSSProperties & { '--width': number }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Asset</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Amount</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Value</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">24h Change</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Allocation</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">P&L</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const pnl = (asset.currentPrice - asset.avgBuyPrice) * asset.amount;
                  const pnlPercentage = ((asset.currentPrice - asset.avgBuyPrice) / asset.avgBuyPrice) * 100;
                  
                  return (
                    <tr key={asset.symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-semibold text-white">{asset.symbol}</div>
                          <div className="text-sm text-gray-400">{asset.name}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-white">
                        {asset.amount.toLocaleString()} {asset.symbol}
                      </td>
                      <td className="py-4 px-4 text-right text-white font-medium">
                        ${asset.value.toLocaleString()}
                      </td>
                      <td className={`py-4 px-4 text-right font-medium ${
                        asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                      </td>
                      <td className="py-4 px-4 text-right text-purple-400 font-medium">
                        {asset.allocation}%
                      </td>
                      <td className={`py-4 px-4 text-right font-medium ${
                        pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()}
                        <div className="text-sm">
                          ({pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%)
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 