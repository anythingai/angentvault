'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AgentCards from '../components/AgentCards';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'error' | 'deploying';
  strategy: string;
  performance: {
    totalReturn: number;
    winRate: number;
    totalTrades: number;
    revenue: number;
  };
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  created: string;
  lastActive: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'error'>('all');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockAgents: Agent[] = [
        {
          id: '1',
          name: 'DeFi Yield Master',
          description: 'Automated yield farming across multiple DeFi protocols',
          status: 'active',
          strategy: 'yield_farming',
          performance: {
            totalReturn: 23.4,
            winRate: 87.3,
            totalTrades: 156,
            revenue: 2140.50
          },
          riskLevel: 'moderate',
          created: '2024-06-01',
          lastActive: new Date().toISOString()
        },
        {
          id: '2',
          name: 'BTC Momentum Bot',
          description: 'Bitcoin momentum trading with technical analysis',
          status: 'active',
          strategy: 'momentum',
          performance: {
            totalReturn: 18.7,
            winRate: 73.2,
            totalTrades: 89,
            revenue: 1876.25
          },
          riskLevel: 'aggressive',
          created: '2024-05-15',
          lastActive: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: '3',
          name: 'Arbitrage Hunter',
          description: 'Cross-exchange arbitrage opportunity detector',
          status: 'paused',
          strategy: 'arbitrage',
          performance: {
            totalReturn: 12.1,
            winRate: 92.1,
            totalTrades: 234,
            revenue: 965.80
          },
          riskLevel: 'conservative',
          created: '2024-05-20',
          lastActive: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '4',
          name: 'ETH Scalper',
          description: 'High-frequency Ethereum scalping strategy',
          status: 'error',
          strategy: 'scalping',
          performance: {
            totalReturn: 8.9,
            winRate: 68.4,
            totalTrades: 445,
            revenue: 734.20
          },
          riskLevel: 'aggressive',
          created: '2024-06-10',
          lastActive: new Date(Date.now() - 7200000).toISOString()
        }
      ];

      setAgents(mockAgents);
    } catch (error) {
      // Handle error - could implement toast notification or error state
      // console.error('Failed to fetch agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentAction = async (agentId: string, action: 'start' | 'pause' | 'stop' | 'restart') => {
    try {
      // Mock API call - replace with actual implementation
      setAgents(prev => prev.map(agent => 
        agent.id === agentId 
          ? { 
              ...agent, 
              status: action === 'start' || action === 'restart' ? 'active' 
                     : action === 'pause' ? 'paused' 
                     : 'error',
              lastActive: new Date().toISOString()
            }
          : agent
      ));
    } catch (error) {
      // Handle error - could implement toast notification or error state
      // console.error('Failed to perform agent action:', error);
    }
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-600/20';
      case 'paused': return 'text-yellow-400 bg-yellow-600/20';
      case 'error': return 'text-red-400 bg-red-600/20';
      case 'deploying': return 'text-blue-400 bg-blue-600/20';
      default: return 'text-gray-400 bg-gray-600/20';
    }
  };

  const getRiskColor = (risk: Agent['riskLevel']) => {
    switch (risk) {
      case 'conservative': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'aggressive': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const filteredAgents = agents.filter(agent => 
    filterStatus === 'all' || agent.status === filterStatus
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My AI Agents</h1>
          <p className="text-gray-400">Manage and monitor your autonomous trading agents</p>
        </div>
        
        <Link href="/agents/create" className="btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Agent
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Total Agents</h3>
            <span className="text-2xl">🤖</span>
          </div>
          <p className="text-2xl font-bold text-white">{agents.length}</p>
          <p className="text-sm text-gray-400">
            {agents.filter(a => a.status === 'active').length} active
          </p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Total Revenue</h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-white">
            ${agents.reduce((sum, agent) => sum + agent.performance.revenue, 0).toLocaleString()}
          </p>
          <p className="text-sm text-green-400">+12.3% this month</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Avg Win Rate</h3>
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {(agents.reduce((sum, agent) => sum + agent.performance.winRate, 0) / agents.length).toFixed(1)}%
          </p>
          <p className="text-sm text-green-400">Above average</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Total Trades</h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {agents.reduce((sum, agent) => sum + agent.performance.totalTrades, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-400">All time</p>
        </div>
      </div>

      {/* Filters */}
      <div className="crypto-card p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-white font-medium">Filter by status:</span>
            <div className="flex space-x-2">
              {(['all', 'active', 'paused', 'error'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors capitalize ${
                    filterStatus === status
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {status} {status !== 'all' && `(${agents.filter(a => a.status === status).length})`}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            onClick={fetchAgents}
            className="btn-secondary px-4 py-2 text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      {filteredAgents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {filterStatus === 'all' ? 'No agents found' : `No ${filterStatus} agents`}
          </h3>
          <p className="text-gray-400 mb-6">
            {filterStatus === 'all' 
              ? 'Create your first AI trading agent to get started'
              : `Try changing the filter or create a new agent`
            }
          </p>
          <Link href="/agents/create" className="btn-primary">
            Create Your First Agent
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredAgents.map((agent) => (
            <div 
              key={agent.id} 
              className={`crypto-card p-6 hover:border-purple-500/50 transition-all cursor-pointer ${
                selectedAgent === agent.id ? 'border-purple-500 bg-purple-600/10' : ''
              }`}
              onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
            >
              {/* Agent Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{agent.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{agent.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(agent.status)}`}>
                  {agent.status}
                </span>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="glass-card p-3">
                  <div className="text-xs text-gray-400 mb-1">Total Return</div>
                  <div className={`font-bold ${agent.performance.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {agent.performance.totalReturn >= 0 ? '+' : ''}{agent.performance.totalReturn}%
                  </div>
                </div>
                <div className="glass-card p-3">
                  <div className="text-xs text-gray-400 mb-1">Win Rate</div>
                  <div className="text-white font-bold">{agent.performance.winRate}%</div>
                </div>
                <div className="glass-card p-3">
                  <div className="text-xs text-gray-400 mb-1">Revenue</div>
                  <div className="text-green-400 font-bold">${agent.performance.revenue.toFixed(2)}</div>
                </div>
                <div className="glass-card p-3">
                  <div className="text-xs text-gray-400 mb-1">Trades</div>
                  <div className="text-white font-bold">{agent.performance.totalTrades}</div>
                </div>
              </div>

              {/* Agent Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Strategy:</span>
                  <span className="text-white capitalize">{agent.strategy.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className={`capitalize font-medium ${getRiskColor(agent.riskLevel)}`}>
                    {agent.riskLevel}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Last Active:</span>
                  <span className="text-white">
                    {new Date(agent.lastActive).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {agent.status === 'active' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAgentAction(agent.id, 'pause');
                    }}
                    className="flex-1 btn-secondary text-sm py-1"
                  >
                    ⏸️ Pause
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAgentAction(agent.id, 'start');
                    }}
                    className="flex-1 btn-primary text-sm py-1"
                  >
                    ▶️ Start
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAgentAction(agent.id, 'restart');
                  }}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                  title="Restart Agent"
                >
                  🔄
                </button>
                
                <Link
                  href={`/agents/${agent.id}/settings`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                  title="Agent Settings"
                >
                  ⚙️
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agent Cards Component */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Marketplace Preview</h2>
        <AgentCards />
      </div>
    </div>
  );
} 