'use client';

import { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'ERROR';
  performance: {
    totalReturn: number;
    winRate: number;
  };
  revenue: {
    totalEarned: number;
  };
}

export default function AgentCards() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    // Mock data
    setAgents([
      {
        id: '1',
        name: 'DeFi Yield Hunter',
        description: 'Automated yield farming across multiple DeFi protocols',
        status: 'ACTIVE',
        performance: {
          totalReturn: 1250.75,
          winRate: 91.0
        },
        revenue: {
          totalEarned: 47.85
        }
      }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400 bg-green-400/20';
      case 'PAUSED': return 'text-yellow-400 bg-yellow-400/20';
      case 'STOPPED': return 'text-gray-400 bg-gray-400/20';
      case 'ERROR': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <div key={agent.id} className="crypto-card p-6">
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
          </div>
        </div>
      ))}
    </div>
  );
} 