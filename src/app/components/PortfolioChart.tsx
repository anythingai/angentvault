'use client';

import { useState, useEffect } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface PortfolioData {
  timestamp: string;
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

interface ChartDataPoint {
  time: string;
  value: number;
  pnl: number;
  pnlPercentage: number;
}

export default function PortfolioChart() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<'1H' | '1D' | '7D' | '30D' | '1Y'>('1D');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioData();
    generateChartData();
    
    // Update every 30 seconds
    const interval = setInterval(() => {
      fetchPortfolioData();
      updateChartData();
    }, 30000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchPortfolioData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/portfolio', {
        headers: { 
          Authorization: `Bearer ${token}` 
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }

      const data = await response.json();
      
      // Transform API response to component format
      if (data.portfolio && data.portfolio.length > 0) {
        const totalValue = data.portfolio.reduce((sum: number, asset: any) => sum + asset.balanceUSD, 0);
        const totalPnL = data.portfolio.reduce((sum: number, asset: any) => sum + (asset.profitLoss || 0), 0);
        const pnlPercentage = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

        const portfolioData: PortfolioData = {
          timestamp: new Date().toISOString(),
          totalValue,
          totalPnL,
          pnlPercentage,
          assets: data.portfolio.map((asset: any) => ({
            symbol: asset.asset,
            amount: asset.balance,
            value: asset.balanceUSD,
            change24h: ((asset.profitLoss || 0) / asset.balanceUSD) * 100
          }))
        };
        
        setPortfolioData(portfolioData);
      }
      
      setIsLoading(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch portfolio data:', error);
      setIsLoading(false);
    }
  };

  const generateChartData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch historical data based on time range
      const response = await fetch(`/api/portfolio/history?range=${timeRange}`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }

      const historyData = await response.json();
      
      if (historyData.history && historyData.history.length > 0) {
        const dataPoints: ChartDataPoint[] = historyData.history.map((point: any) => ({
          time: new Date(point.timestamp).toLocaleString(),
          value: Math.round(point.totalValue),
          pnl: Math.round(point.totalPnL),
          pnlPercentage: Math.round(point.pnlPercentage * 100) / 100
        }));
        
        setChartData(dataPoints);
      } else {
        // If no historical data, use current portfolio value as single point
        if (portfolioData) {
          setChartData([{
            time: new Date().toLocaleString(),
            value: Math.round(portfolioData.totalValue),
            pnl: Math.round(portfolioData.totalPnL),
            pnlPercentage: Math.round(portfolioData.pnlPercentage * 100) / 100
          }]);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to generate chart data:', error);
    }
  };

  const updateChartData = () => {
    if (!portfolioData) return;
    
    // Add current portfolio data as the latest point
    const newDataPoint: ChartDataPoint = {
      time: new Date().toLocaleString(),
      value: Math.round(portfolioData.totalValue),
      pnl: Math.round(portfolioData.totalPnL),
      pnlPercentage: Math.round(portfolioData.pnlPercentage * 100) / 100
    };

    setChartData(prev => {
      if (prev.length === 0) return [newDataPoint];
      
      // Keep appropriate number of points based on time range
      const maxPoints = timeRange === '1H' ? 60 : 
                       timeRange === '1D' ? 24 : 
                       timeRange === '7D' ? 7 * 24 : 
                       timeRange === '30D' ? 30 : 
                       365;
                       
      const updated = [...prev, newDataPoint].slice(-maxPoints);
      return updated;
    });
  };

  const timeRangeButtons = [
    { label: '1H', value: '1H' as const },
    { label: '1D', value: '1D' as const },
    { label: '7D', value: '7D' as const },
    { label: '30D', value: '30D' as const },
    { label: '1Y', value: '1Y' as const },
  ];

  if (isLoading) {
    return (
      <div className="crypto-card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const currentValue = portfolioData?.totalValue || 0;
  const currentPnL = portfolioData?.totalPnL || 0;
  const currentPnLPercentage = portfolioData?.pnlPercentage || 0;

  return (
    <div className="crypto-card p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Portfolio Performance</h2>
          <div className="flex items-baseline space-x-4">
            <span className="text-3xl font-bold text-white">
              ${currentValue.toLocaleString()}
            </span>
            <span className={`text-lg font-semibold ${
              currentPnL >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {currentPnL >= 0 ? '+' : ''}${currentPnL.toLocaleString()}
            </span>
            <span className={`text-sm ${
              currentPnLPercentage >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              ({currentPnLPercentage >= 0 ? '+' : ''}{currentPnLPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {timeRangeButtons.map((button) => (
            <button
              key={button.value}
              onClick={() => setTimeRange(button.value)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeRange === button.value
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: any, name: string) => [
                name === 'value' ? `$${value.toLocaleString()}` : `${value > 0 ? '+' : ''}${value}%`,
                name === 'value' ? 'Portfolio Value' : 'P&L %'
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8B5CF6"
              strokeWidth={2}
              fill="url(#colorGradient)"
              dot={false}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Asset Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {portfolioData?.assets.map((asset) => (
          <div key={asset.symbol} className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">{asset.symbol}</span>
              <span className={`text-sm ${
                asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
              </span>
            </div>
            <div className="text-gray-400 text-sm mb-1">
              {asset.amount} {asset.symbol}
            </div>
            <div className="text-white font-semibold">
              ${asset.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 