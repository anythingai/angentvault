'use client';

/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PortfolioChart from '../components/PortfolioChart';
import AgentManagement from '../components/AgentManagement';

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  createdAt: string;
  isRead: boolean;
}

interface Activity {
  time: string;
  action: string;
  agent: string;
  value: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalValue: 0,
    dayChange: 0,
    agents: 0,
    activeTrades: 0,
  });
  const [_portfolio, setPortfolio] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch portfolio data
      const portfolioRes = await fetch('/api/portfolio', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const portfolioData = await portfolioRes.json();

      // Fetch agents data
      const agentsRes = await fetch('/api/agents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const agentsData = await agentsRes.json();

      // Fetch recent trades
      const tradesRes = await fetch('/api/trades/recent', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tradesData = await tradesRes.json();

      // Update state with real data
      if (portfolioData.success && portfolioData.data) {
        // Use externalData for the actual portfolio assets array
        setPortfolio(portfolioData.data.externalData || []);
        
        // Use the calculated totalValue from the API
        const totalValue = portfolioData.data.portfolio.totalValue;
        // Use the calculated totalReturn as dayChange
        const dayChange = portfolioData.data.performance.totalReturn || 0;
        
        setStats({
          totalValue,
          dayChange,
          agents: agentsData.agents?.length || 0,
          activeTrades: tradesData.trades?.filter((t: any) => t.status === 'pending').length || 0,
        });
      }

      if (tradesData.trades) {
        setRecentActivity(tradesData.trades.slice(0, 5).map((trade: any) => ({
          time: new Date(trade.executedAt).toLocaleTimeString(),
          action: `${trade.type.toUpperCase()} ${trade.amount} ${trade.fromAsset}`,
          agent: trade.agent?.name || 'Manual',
          value: `$${trade.usdValue.toFixed(2)}`,
        })));
      }

      // Fetch alerts from API
      try {
        const alertsRes = await fetch('/api/alerts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const alertsData = await alertsRes.json();
        if (alertsData.success && alertsData.alerts) {
          setAlerts(alertsData.alerts.filter((alert: any) => !alert.isRead).slice(0, 3)); // Show only unread alerts, max 3
        }
             } catch {
         // If alerts API fails, continue without alerts
         setAlerts([]);
       }

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Trading Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm font-medium">Total Portfolio Value</h3>
            <p className="text-2xl font-bold mt-2">${stats.totalValue.toFixed(2)}</p>
            <p className={`text-sm mt-1 ${stats.dayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.dayChange >= 0 ? '+' : ''}{stats.dayChange.toFixed(2)} ({
                stats.totalValue === 0 ? '0.00' : ((stats.dayChange / stats.totalValue) * 100).toFixed(2)
              }%)
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm font-medium">24h Change</h3>
            <p className={`text-2xl font-bold mt-2 ${stats.dayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.dayChange >= 0 ? '+' : ''}${Math.abs(stats.dayChange).toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm font-medium">Active Agents</h3>
            <p className="text-2xl font-bold mt-2">{stats.agents}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 text-sm font-medium">Active Trades</h3>
            <p className="text-2xl font-bold mt-2">{stats.activeTrades}</p>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3 mb-8">
            {alerts.map((alert) => (
                  <div 
                key={alert.id}
                className={`p-4 rounded-lg ${
                  alert.severity === 'success'
                    ? 'bg-green-900/20 border border-green-500/50 text-green-400'
                    : alert.severity === 'error'
                    ? 'bg-red-900/20 border border-red-500/50 text-red-400'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-900/20 border border-yellow-500/50 text-yellow-400'
                    : 'bg-blue-900/20 border border-blue-500/50 text-blue-400'
                }`}
              >
                {alert.message}
                </div>
              ))}
            </div>
        )}

        {/* Portfolio Chart */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Portfolio Performance</h2>
          <PortfolioChart />
        </div>

        {/* Agent Management */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your AI Agents</h2>
          <AgentManagement />
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Agent</th>
                  <th className="pb-3">Value</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentActivity.map((activity, index) => (
                  <tr key={index} className="border-t border-gray-700">
                    <td className="py-3">{activity.time}</td>
                    <td className="py-3">{activity.action}</td>
                    <td className="py-3">{activity.agent}</td>
                    <td className="py-3">{activity.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 