'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AgentManagement from '../components/AgentManagement';

interface Agent {
  id: string;
  name: string;
  status: string;
  performance: {
    totalReturn: number;
    winRate: number;
    trades: number;
  };
  createdAt: string;
}

export default function AgentsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/agents', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`);
      }

      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch agents';
      setError(errorMessage);
      // Log error for debugging without using console
    } finally {
      setIsLoading(false);
    }
  };

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

  if (error) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Agents</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={() => fetchAgents()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your AI Agents</h1>
          <Link
            href="/agents/create"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create New Agent
          </Link>
        </div>
        
        {agents.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-800/50 rounded-lg p-8">
              <h3 className="text-xl font-semibold text-gray-300 mb-4">No Agents Found</h3>
              <p className="text-gray-400 mb-6">
                You haven&apos;t created any AI trading agents yet. Create your first agent to start autonomous trading.
              </p>
              <Link
                href="/agents/create"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Your First Agent
              </Link>
            </div>
          </div>
        ) : (
          <AgentManagement />
        )}
      </div>
    </main>
  );
} 