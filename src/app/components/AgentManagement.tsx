'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'ERROR';
  config: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    tradingPairs: string[];
    strategies: string[];
    maxTradeSize: number;
    chargePerTrade: boolean;
    tradeFee: number;
  };
  performance: {
    totalTrades: number;
    successfulTrades: number;
    totalReturn: number;
    totalReturnPercentage: number;
    avgTradeSize: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  revenue: {
    totalEarned: number;
    queriesProcessed: number;
    subscriberCount: number;
    revenueThisMonth: number;
  };
  lastExecutionTime?: string;
  createdAt: string;
}

interface Trade {
  id: string;
  agentId: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  amount: number;
  price: number;
  status: 'EXECUTED' | 'PENDING' | 'FAILED';
  timestamp: string;
  confidence: number;
}

export default function AgentManagement() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'monetization' | 'settings'>('overview');

  useEffect(() => {
    fetchAgents();
    fetchRecentTrades();
  }, []);

  const fetchAgents = async () => {
    // Mock data - replace with actual GraphQL query
    const mockAgents: Agent[] = [
      {
        id: '1',
        name: 'DeFi Yield Hunter',
        description: 'Automated yield farming across multiple DeFi protocols',
        status: 'ACTIVE',
        config: {
          riskTolerance: 'moderate',
          tradingPairs: ['ETH/USDC', 'BTC/USDC'],
          strategies: ['yield_farming', 'liquidity_provision'],
          maxTradeSize: 1000,
          chargePerTrade: true,
          tradeFee: 0.02
        },
        performance: {
          totalTrades: 156,
          successfulTrades: 142,
          totalReturn: 1250.75,
          totalReturnPercentage: 12.5,
          avgTradeSize: 350,
          winRate: 91.0,
          sharpeRatio: 1.85,
          maxDrawdown: -3.2
        },
        revenue: {
          totalEarned: 47.85,
          queriesProcessed: 892,
          subscriberCount: 23,
          revenueThisMonth: 12.40
        },
        lastExecutionTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'BTC Momentum Trader',
        description: 'Bitcoin trend-following strategy with technical analysis',
        status: 'PAUSED',
        config: {
          riskTolerance: 'aggressive',
          tradingPairs: ['BTC/USDC'],
          strategies: ['momentum', 'technical_analysis'],
          maxTradeSize: 2000,
          chargePerTrade: false,
          tradeFee: 0
        },
        performance: {
          totalTrades: 89,
          successfulTrades: 67,
          totalReturn: 850.25,
          totalReturnPercentage: 8.5,
          avgTradeSize: 750,
          winRate: 75.3,
          sharpeRatio: 1.45,
          maxDrawdown: -8.7
        },
        revenue: {
          totalEarned: 0,
          queriesProcessed: 0,
          subscriberCount: 0,
          revenueThisMonth: 0
        },
        lastExecutionTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdAt: '2024-02-01T14:20:00Z'
      }
    ];

    setAgents(mockAgents);
    setSelectedAgent(mockAgents[0]);
    setIsLoading(false);
  };

  const fetchRecentTrades = async () => {
    const mockTrades: Trade[] = [
      {
        id: '1',
        agentId: '1',
        type: 'BUY',
        symbol: 'ETH/USDC',
        amount: 350,
        price: 3150.25,
        status: 'EXECUTED',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        confidence: 0.87
      },
      {
        id: '2',
        agentId: '1',
        type: 'SELL',
        symbol: 'BTC/USDC',
        amount: 500,
        price: 45200.50,
        status: 'EXECUTED',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        confidence: 0.92
      }
    ];
    setRecentTrades(mockTrades);
  };

  const handleAgentAction = async (agentId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      // Mock API call - replace with actual GraphQL mutation
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: action === 'start' ? 'ACTIVE' : action === 'pause' ? 'PAUSED' : 'STOPPED' }
          : agent
      ));
    } catch (error) {
      // eslint-disable-next-line no-console -- Replace with proper logger in production
      /**
       * Intentionally kept silent for demo purposes.
       * Use server-side logging or toast notifications in real implementation.
       */
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400 bg-green-400/20';
      case 'PAUSED': return 'text-yellow-400 bg-yellow-400/20';
      case 'STOPPED': return 'text-gray-400 bg-gray-400/20';
      case 'ERROR': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const performanceData = selectedAgent ? [
    { name: 'Win Rate', value: selectedAgent.performance.winRate },
    { name: 'Sharpe Ratio', value: selectedAgent.performance.sharpeRatio * 20 }, // Scale for visualization
    { name: 'Total Return %', value: selectedAgent.performance.totalReturnPercentage },
    { name: 'Max Drawdown', value: Math.abs(selectedAgent.performance.maxDrawdown) }
  ] : [];

  const revenueData = selectedAgent ? [
    { name: 'Query Fees', value: selectedAgent.revenue.totalEarned * 0.7 },
    { name: 'Subscriptions', value: selectedAgent.revenue.totalEarned * 0.3 }
  ] : [];

  const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'];

  if (isLoading) {
    return (
      <div className="crypto-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div 
            key={agent.id} 
            className={`crypto-card p-6 cursor-pointer transition-all hover:border-purple-500 ${
              selectedAgent?.id === agent.id ? 'border-purple-500 ring-1 ring-purple-500' : ''
            }`}
            onClick={() => setSelectedAgent(agent)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{agent.name}</h3>
                <p className="text-gray-400 text-sm">{agent.description}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                {agent.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Return:</span>
                <div className="text-green-400 font-semibold">
                  +${agent.performance.totalReturn.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Win Rate:</span>
                <div className="text-blue-400 font-semibold">
                  {agent.performance.winRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-gray-400">Revenue:</span>
                <div className="text-purple-400 font-semibold">
                  ${agent.revenue.totalEarned.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Trades:</span>
                <div className="text-white font-semibold">
                  {agent.performance.totalTrades}
                </div>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              {agent.status === 'ACTIVE' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAgentAction(agent.id, 'pause');
                  }}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-sm transition-colors"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAgentAction(agent.id, 'start');
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm transition-colors"
                >
                  Start
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAgentAction(agent.id, 'stop');
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                Stop
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Agent View */}
      {selectedAgent && (
        <div className="crypto-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{selectedAgent.name}</h2>
            <div className="flex space-x-2">
              {['overview', 'performance', 'monetization', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Tolerance:</span>
                    <span className="text-white capitalize">{selectedAgent.config.riskTolerance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trading Pairs:</span>
                    <span className="text-white">{selectedAgent.config.tradingPairs.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Trade Size:</span>
                    <span className="text-white">${selectedAgent.config.maxTradeSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monetization:</span>
                    <span className={selectedAgent.config.chargePerTrade ? 'text-green-400' : 'text-gray-400'}>
                      {selectedAgent.config.chargePerTrade ? `$${selectedAgent.config.tradeFee} per query` : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Performance Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Total Trades</div>
                    <div className="text-2xl font-bold text-white">{selectedAgent.performance.totalTrades}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Win Rate</div>
                    <div className="text-2xl font-bold text-green-400">{selectedAgent.performance.winRate.toFixed(1)}%</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Sharpe Ratio</div>
                    <div className="text-2xl font-bold text-blue-400">{selectedAgent.performance.sharpeRatio}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Max Drawdown</div>
                    <div className="text-2xl font-bold text-red-400">{selectedAgent.performance.maxDrawdown}%</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Recent Trades</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentTrades.filter(trade => trade.agentId === selectedAgent.id).map((trade) => (
                    <div key={trade.id} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.type === 'BUY' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {trade.type}
                          </span>
                          <span className="text-white font-medium">{trade.symbol}</span>
                        </div>
                        <span className="text-green-400">${trade.amount}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400 mt-1">
                        <span>Confidence: {(trade.confidence * 100).toFixed(0)}%</span>
                        <span>{new Date(trade.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monetization' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Revenue Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: $${value ? value.toFixed(2) : '0.00'}`}
                      >
                        {revenueData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']}
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Revenue Metrics</h3>
                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Total Earned</div>
                    <div className="text-2xl font-bold text-green-400">${selectedAgent.revenue.totalEarned.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">This Month</div>
                    <div className="text-xl font-bold text-purple-400">${selectedAgent.revenue.revenueThisMonth.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Subscribers</div>
                    <div className="text-xl font-bold text-blue-400">{selectedAgent.revenue.subscriberCount}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Queries Processed</div>
                    <div className="text-xl font-bold text-white">{selectedAgent.revenue.queriesProcessed}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Agent Configuration</h3>
                <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4 mb-4">
                  <p className="text-yellow-200 text-sm">
                    ⚠️ Modifying agent settings will pause the agent and require restart
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Risk Tolerance
                      </label>
                      <select
                        id="risk-tolerance-select"
                        aria-label="Risk Tolerance"
                        value={selectedAgent.config.riskTolerance}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="conservative">Conservative</option>
                        <option value="moderate">Moderate</option>
                        <option value="aggressive">Aggressive</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Max Trade Size (USDC)
                      </label>
                      <input
                        type="number"
                        aria-label="Maximum Trade Size"
                        value={selectedAgent.config.maxTradeSize}
                        placeholder="Maximum trade size in USDC"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Monetization
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedAgent.config.chargePerTrade}
                          className="form-checkbox h-4 w-4 text-purple-600"
                        />
                        <span className="text-white">Enable x402pay monetization</span>
                      </label>
                      {selectedAgent.config.chargePerTrade && (
                        <input
                          type="number"
                          step="0.001"
                          value={selectedAgent.config.tradeFee}
                          placeholder="Fee per query (USDC)"
                          className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors">
                    Save Changes
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors">
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 