'use client';

import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Agent {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'paused' | 'stopped' | 'error';
  strategy: string; // JSON string
  riskParameters: string; // JSON string
  performance: string | null; // JSON string
  createdAt: string;
  lastExecutionTime?: string;
}

interface Trade {
  id: string;
  agentId: string | null;
  type: 'buy' | 'sell';
  fromAsset: string;
  toAsset: string;
  amount: number;
  price: number;
  status: 'pending' | 'success' | 'failed';
  executedAt: string;
  usdValue: number;
}

interface MonetizationData {
  totalEarned: number;
  queriesProcessed: number;
  subscriberCount: number;
  revenueThisMonth: number;
}

const fetchAgents = async (): Promise<Agent[]> => {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/agents', {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    throw new Error('Failed to fetch agents');
  }
  const data = await res.json();
  return data.agents;
};

const fetchRecentTrades = async (agentId: string | null): Promise<Trade[]> => {
    if (!agentId) return [];
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/agents/${agentId}/trades`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
        throw new Error('Failed to fetch recent trades');
    }
    const data = await res.json();
    return data.trades;
};

const fetchMonetizationData = async (agentId: string | null): Promise<MonetizationData> => {
    if (!agentId) return { totalEarned: 0, queriesProcessed: 0, subscriberCount: 0, revenueThisMonth: 0 };
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/agents/${agentId}/monetization`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
        throw new Error('Failed to fetch monetization data');
    }
    return res.json();
};

const updateAgentStatus = async ({ agentId, status }: { agentId: string; status: string }) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/agents/${agentId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error('Failed to update agent status');
}
  return res.json();
};

export default function AgentManagement() {
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'monetization' | 'settings'>('overview');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:4000';
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        // WebSocket connected - ready for real-time updates
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'agent_update':
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            queryClient.invalidateQueries({ queryKey: ['agent', message.payload.agentId] });
            break;
          case 'trade_executed':
            queryClient.invalidateQueries({ queryKey: ['recentTrades', message.payload.agentId] });
            queryClient.invalidateQueries({ queryKey: ['agent', message.payload.agentId] });
            break;
          default:
            break;
        }
      };

      ws.current.onclose = () => {
        // WebSocket disconnected - attempt to reconnect
        setTimeout(connectWebSocket, 5000);
      };

      ws.current.onerror = (_error) => {
        // WebSocket error occurred
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [queryClient]);

  const { data: agents = [], isLoading: isLoadingAgents } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: fetchAgents,
  });

  const { data: recentTrades = [], isLoading: isLoadingTrades } = useQuery<Trade[]>({
    queryKey: ['recentTrades', selectedAgentId],
    queryFn: () => fetchRecentTrades(selectedAgentId),
    enabled: !!selectedAgentId,
  });

  const { data: monetizationData } = useQuery<MonetizationData>({
    queryKey: ['monetizationData', selectedAgentId],
    queryFn: () => fetchMonetizationData(selectedAgentId),
    enabled: !!selectedAgentId,
  });

  const agentStatusMutation = useMutation({
    mutationFn: updateAgentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  useEffect(() => {
    if (!selectedAgentId && agents.length > 0) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);

  const handleAgentAction = (agentId: string, action: 'start' | 'pause' | 'stop') => {
    let status: 'active' | 'paused' | 'stopped' = 'paused';
    if(action === 'start') status = 'active';
    if(action === 'stop') status = 'stopped';
    agentStatusMutation.mutate({ agentId, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'paused': return 'text-yellow-400 bg-yellow-400/20';
      case 'stopped': return 'text-gray-400 bg-gray-400/20';
      case 'error': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const parsedPerformance = selectedAgent && selectedAgent.performance ? JSON.parse(selectedAgent.performance) : {};

  const performanceData = selectedAgent ? [
    { name: 'Win Rate', value: parsedPerformance.winRate || 0 },
    { name: 'Sharpe Ratio', value: (parsedPerformance.sharpeRatio || 0) * 20 }, // Scale for visualization
    { name: 'Total Return %', value: parsedPerformance.totalReturnPercentage || 0 },
    { name: 'Max Drawdown', value: Math.abs(parsedPerformance.maxDrawdown || 0) }
  ] : [];

  const revenueData = monetizationData ? [
    { name: 'Query Fees', value: monetizationData.totalEarned * 0.7 },
    { name: 'Subscriptions', value: monetizationData.totalEarned * 0.3 }
  ] : [];

  const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'];

  if (isLoadingAgents) {
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
        {agents.map((agent) => {
          const performance = agent.performance ? JSON.parse(agent.performance) : {};
          return (
          <div 
            key={agent.id} 
            className={`crypto-card p-6 cursor-pointer transition-all hover:border-purple-500 ${
              selectedAgent?.id === agent.id ? 'border-purple-500 ring-1 ring-purple-500' : ''
            }`}
              onClick={() => setSelectedAgentId(agent.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{agent.name}</h3>
                <p className="text-gray-400 text-sm">{agent.description}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                  {agent.status.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Return:</span>
                <div className="text-green-400 font-semibold">
                    +${(performance.totalReturn || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Win Rate:</span>
                <div className="text-blue-400 font-semibold">
                    {(performance.winRate || 0).toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-gray-400">Revenue:</span>
                <div className="text-purple-400 font-semibold">
                    $0.00
                </div>
              </div>
              <div>
                <span className="text-gray-400">Trades:</span>
                <div className="text-white font-semibold">
                    {performance.totalTrades || 0}
                </div>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
                {agent.status === 'active' ? (
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
          );
        })}
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
                    <span className="text-white capitalize">{JSON.parse(selectedAgent.riskParameters).riskTolerance || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trading Pairs:</span>
                    <span className="text-white">{JSON.parse(selectedAgent.strategy).tradingPairs?.join(', ') || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Trade Size:</span>
                    <span className="text-white">${JSON.parse(selectedAgent.riskParameters).maxTradeSize || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monetization:</span>
                    <span className={JSON.parse(selectedAgent.strategy).chargePerTrade ? 'text-green-400' : 'text-gray-400'}>
                      {JSON.parse(selectedAgent.strategy).chargePerTrade ? `$${JSON.parse(selectedAgent.strategy).tradeFee} per query` : 'Disabled'}
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
                    <div className="text-2xl font-bold text-white">{parsedPerformance.totalTrades || 0}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Win Rate</div>
                    <div className="text-2xl font-bold text-green-400">{(parsedPerformance.winRate || 0).toFixed(1)}%</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Sharpe Ratio</div>
                    <div className="text-2xl font-bold text-blue-400">{parsedPerformance.sharpeRatio || 0}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Max Drawdown</div>
                    <div className="text-2xl font-bold text-red-400">{parsedPerformance.maxDrawdown || 0}%</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Recent Trades</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {isLoadingTrades ? <p>Loading trades...</p> : recentTrades.map((trade) => (
                    <div key={trade.id} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.type === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {trade.type.toUpperCase()}
                          </span>
                          <span className="text-white font-medium">{trade.fromAsset}/{trade.toAsset}</span>
                        </div>
                        <span className="text-green-400">${trade.usdValue}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400 mt-1">
                        <span></span>
                        <span>{new Date(trade.executedAt).toLocaleTimeString()}</span>
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
                        formatter={(value: any) => [`$${value ? value.toFixed(2) : '0.00'}`, 'Revenue']}
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
                    <div className="text-2xl font-bold text-green-400">${(monetizationData?.totalEarned || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">This Month</div>
                    <div className="text-xl font-bold text-purple-400">${(monetizationData?.revenueThisMonth || 0).toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Subscribers</div>
                    <div className="text-xl font-bold text-blue-400">{monetizationData?.subscriberCount || 0}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Queries Processed</div>
                    <div className="text-xl font-bold text-white">{monetizationData?.queriesProcessed || 0}</div>
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
                        defaultValue={selectedAgent.riskParameters ? JSON.parse(selectedAgent.riskParameters).riskTolerance : 'moderate'}
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
                        defaultValue={selectedAgent.riskParameters ? JSON.parse(selectedAgent.riskParameters).maxTradeSize : 1000}
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
                          defaultChecked={selectedAgent.strategy ? JSON.parse(selectedAgent.strategy).chargePerTrade : false}
                          className="form-checkbox h-4 w-4 text-purple-600"
                        />
                        <span className="text-white">Enable x402pay monetization</span>
                      </label>
                      {(selectedAgent.strategy && JSON.parse(selectedAgent.strategy).chargePerTrade) && (
                        <input
                          type="number"
                          step="0.001"
                          defaultValue={selectedAgent.strategy ? JSON.parse(selectedAgent.strategy).tradeFee : 0}
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