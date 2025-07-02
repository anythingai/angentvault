'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AgentManagement from '../components/AgentManagement';

export default function AgentsPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock agents data exists for demo purposes
      // In production, this would update state with fetched agents
    } catch (error) {
      // Handle error - could implement toast notification or error state
      // console.error('Failed to fetch agents:', error);
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
        <AgentManagement />
      </div>
    </main>
  );
} 