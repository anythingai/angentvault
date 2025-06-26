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
      // Mock API call - replace with actual GraphQL query
      const mockData: PortfolioData = {
        timestamp: new Date().toISOString(),
        totalValue: 25000 + Math.random() * 1000 - 500, // Simulate market fluctuation
        totalPnL: 2100 + Math.random() * 200 - 100,
        pnlPercentage: 9.2 + Math.random() * 2 - 1,
        assets: [
          {
            symbol: 'BTC',
            amount: 0.25,
            value: 11250 + Math.random() * 500 - 250,
            change24h: 4.65 + Math.random() * 2 - 1
          },
          {
            symbol: 'ETH',
            amount: 2.5,
            value: 7500 + Math.random() * 300 - 150,
            change24h: 5.26 + Math.random() * 2 - 1
          },
          {
            symbol: 'USDC',
            amount: 6250,
            value: 6250,
            change24h: 0.01
          }
        ]
      };
      
      setPortfolioData(mockData);
      setIsLoading(false);
    } catch (error) {
      // eslint-disable-next-line no-console -- Replace with proper logger
      setIsLoading(false);
    }
  };

  const generateChartData = () => {
    const dataPoints: ChartDataPoint[] = [];
    const baseValue = 22900; // Starting portfolio value
    const now = new Date();
    
    const getTimePoints = () => {
      switch (timeRange) {
        case '1H':
          return Array.from({ length: 60 }, (_, i) => {
            const time = new Date(now.getTime() - (59 - i) * 60 * 1000);
            return time;
          });
        case '1D':
          return Array.from({ length: 24 }, (_, i) => {
            const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
            return time;
          });
        case '7D':
          return Array.from({ length: 7 }, (_, i) => {
            const time = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
            return time;
          });
        case '30D':
          return Array.from({ length: 30 }, (_, i) => {
            const time = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
            return time;
          });
        case '1Y':
          return Array.from({ length: 12 }, (_, i) => {
            const time = new Date(now.getTime() - (11 - i) * 30 * 24 * 60 * 60 * 1000);
            return time;
          });
        default:
          return [];
      }
    };

    const timePoints = getTimePoints();
    
    timePoints.forEach((time, index) => {
      // Simulate portfolio growth with some volatility
      const growth = index * 0.02 + Math.sin(index * 0.5) * 0.01;
      const value = baseValue * (1 + growth);
      const pnl = value - baseValue;
      const pnlPercentage = (pnl / baseValue) * 100;
      
      dataPoints.push({
        time: timeRange === '1H' ? time.toLocaleTimeString() : time.toLocaleDateString(),
        value: Math.round(value),
        pnl: Math.round(pnl),
        pnlPercentage: Math.round(pnlPercentage * 100) / 100
      });
    });

    setChartData(dataPoints);
  };

  const updateChartData = () => {
    if (chartData.length === 0) return;
    
    // Add new data point and remove oldest if at limit
    const newDataPoint: ChartDataPoint = {
      time: new Date().toLocaleTimeString(),
      value: 25000 + Math.random() * 1000 - 500,
      pnl: 2100 + Math.random() * 200 - 100,
      pnlPercentage: 9.2 + Math.random() * 2 - 1
    };

    setChartData(prev => {
      const updated = [...prev.slice(1), newDataPoint];
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