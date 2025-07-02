'use client';

import { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface Asset {
  symbol: string;
  name: string;
  balance: number;
  balanceUSD: number;
  price: number;
  change24h: number;
  allocation: number;
}

interface PortfolioStats {
  totalValue: number;
  totalChange24h: number;
  totalChangePercentage24h: number;
  totalAssets: number;
}

export default function PortfolioPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolioData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPortfolioData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your portfolio');
        setIsLoading(false);
        return;
      }

      // Fetch portfolio data from API
      const response = await fetch('/api/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch portfolio: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.portfolio && Array.isArray(data.portfolio)) {
        // Transform portfolio data
        const portfolioAssets: Asset[] = data.portfolio.map((item: any) => ({
          symbol: item.asset,
          name: getAssetName(item.asset),
          balance: item.balance,
          balanceUSD: item.balanceUSD,
          price: item.balance > 0 ? item.balanceUSD / item.balance : 0,
          change24h: 0, // Would need real-time price data for this
          allocation: 0, // Will be calculated below
        }));

        // Calculate total value
        const totalValue = portfolioAssets.reduce((sum, asset) => sum + asset.balanceUSD, 0);

        // Calculate allocations
        portfolioAssets.forEach(asset => {
          asset.allocation = totalValue > 0 ? (asset.balanceUSD / totalValue) * 100 : 0;
        });

        // Filter out zero balances
        const nonZeroAssets = portfolioAssets.filter(asset => asset.balance > 0);

        const portfolioStats: PortfolioStats = {
          totalValue,
          totalChange24h: 0, // Would need historical data
          totalChangePercentage24h: 0, // Would need historical data
          totalAssets: nonZeroAssets.length
        };

        setAssets(nonZeroAssets);
        setStats(portfolioStats);
      } else {
        // No portfolio data, user has empty portfolio
        setAssets([]);
        setStats({
          totalValue: 0,
          totalChange24h: 0,
          totalChangePercentage24h: 0,
          totalAssets: 0
        });
      }

      setIsLoading(false);
    } catch (error) {
      // Handle error silently in production
      setError(error instanceof Error ? error.message : 'Failed to load portfolio');
      setIsLoading(false);
    }
  };

  const getAssetName = (symbol: string): string => {
    const assetNames: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'USDC': 'USD Coin',
      'SOL': 'Solana',
      'USDT': 'Tether',
      'BNB': 'Binance Coin',
      'ADA': 'Cardano',
      'DOT': 'Polkadot',
      'MATIC': 'Polygon',
      'AVAX': 'Avalanche',
    };
    return assetNames[symbol] || symbol;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="skeleton h-8 w-48 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-24"></div>
            ))}
          </div>
          <div className="skeleton h-96"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Portfolio</h2>
            <p className="text-red-300">{error}</p>
            <button 
              onClick={fetchPortfolioData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
          <p className="text-gray-400">Track your crypto investments and performance</p>
        </div>

        {/* Portfolio Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="text-sm text-gray-400 mb-1">Total Value</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalValue)}</div>
            </div>

            <div className="card">
              <div className="text-sm text-gray-400 mb-1">24h Change</div>
              <div className={`text-2xl font-bold flex items-center ${
                stats.totalChange24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {stats.totalChange24h >= 0 ? (
                  <ArrowUpIcon className="w-5 h-5 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-5 h-5 mr-1" />
                )}
                {formatCurrency(Math.abs(stats.totalChange24h))}
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-gray-400 mb-1">24h Change %</div>
              <div className={`text-2xl font-bold ${
                stats.totalChangePercentage24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatPercentage(stats.totalChangePercentage24h)}
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-gray-400 mb-1">Total Assets</div>
              <div className="text-2xl font-bold text-white">{stats.totalAssets}</div>
            </div>
          </div>
        )}

        {/* Portfolio Holdings */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Holdings</h2>
            <button 
              onClick={fetchPortfolioData}
              className="btn-secondary text-sm px-4 py-2"
            >
              Refresh
            </button>
          </div>

          {assets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <h3 className="text-lg font-semibold mb-2">No Assets Found</h3>
                <p>Your portfolio is empty. Fund your wallet to start trading.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Asset</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Balance</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Price</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Value</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                            {asset.symbol.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{asset.symbol}</div>
                            <div className="text-sm text-gray-400">{asset.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="font-semibold text-white">
                          {asset.balance.toFixed(6)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="font-semibold text-white">
                          {formatCurrency(asset.price)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="font-semibold text-white">
                          {formatCurrency(asset.balanceUSD)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <div className="w-20 bg-gray-700 rounded-full h-2 mr-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(asset.allocation, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-sm font-semibold text-white w-12">
                            {asset.allocation.toFixed(1)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 