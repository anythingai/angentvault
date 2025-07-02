'use client';

import { useState, useEffect } from 'react';

interface MarketplaceAgent {
  id: string;
  name: string;
  description: string;
  creator: string;
  price: number;
  priceType: 'PER_QUERY' | 'MONTHLY' | 'FREE';
  performance: {
    winRate: number;
    totalReturn: number;
    subscriberCount: number;
    totalTrades: number;
  };
  tags: string[];
  rating: number;
  verified: boolean;
}

export default function MarketplacePage() {
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    fetchMarketplaceAgents();
  }, []);

  const fetchMarketplaceAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error('Failed to load agents');
      const json = await res.json();

      const rawAgents: any[] = json.agents || json.data || [];
      const normalized: MarketplaceAgent[] = rawAgents.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        creator: a.userId ? a.userId.slice(0, 10) + '...' : 'Unknown',
        price: a.pricing?.price ?? 0,
        priceType: (a.pricing?.type ?? 'FREE').toUpperCase(),
        performance: typeof a.performance === 'string' ? JSON.parse(a.performance) : a.performance || {
          winRate: 0,
          totalReturn: 0,
          subscriberCount: 0,
          totalTrades: 0,
        },
        tags: a.tags ?? [],
        rating: a.rating ?? 0,
        verified: a.verified ?? false,
      }));

      setAgents(normalized);
    } catch (err) {
      // Handle error silently in production
      setAgents([]);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           agent.tags.some(tag => tag.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'rating': return b.rating - a.rating;
      case 'winRate': return b.performance.winRate - a.performance.winRate;
      case 'subscribers': return b.performance.subscriberCount - a.performance.subscriberCount;
      case 'price': return a.price - b.price;
      default: return 0;
    }
  });

  const getPriceDisplay = (agent: MarketplaceAgent) => {
    switch (agent.priceType) {
      case 'FREE': return 'Free';
      case 'PER_QUERY': return `$${agent.price} per query`;
      case 'MONTHLY': return `$${agent.price}/month`;
      default: return 'Contact';
    }
  };

  const handleSubscribe = async (agentId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to subscribe to agents');
        return;
      }

      const response = await fetch('/api/payments/agent-query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          queryType: 'subscription',
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Subscription initiated! Payment processed via x402pay.');
        // Optionally refresh the page or update UI
      } else {
        alert(`Subscription failed: ${result.error}`);
      }
    } catch (error) {
      // Handle error silently in production
      alert('Subscription failed. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Agent Marketplace</h1>
        <p className="text-gray-400">Discover and subscribe to high-performing AI trading agents</p>
      </div>

      {/* Search and Filters */}
      <div className="crypto-card p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400"
            />
          </div>
          <div>
            <select
              aria-label="Category Filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="all">All Categories</option>
              <option value="defi">DeFi</option>
              <option value="bitcoin">Bitcoin</option>
              <option value="arbitrage">Arbitrage</option>
              <option value="yield farming">Yield Farming</option>
            </select>
          </div>
          <div>
            <select
              aria-label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="rating">Sort by Rating</option>
              <option value="winRate">Sort by Win Rate</option>
              <option value="subscribers">Sort by Subscribers</option>
              <option value="price">Sort by Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <div key={agent.id} className="crypto-card p-6 hover:border-purple-500 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                {agent.verified && (
                  <span className="text-blue-400" title="Verified Agent">✓</span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400">★</span>
                <span className="text-white text-sm">{agent.rating}</span>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-4">{agent.description}</p>

            <div className="flex flex-wrap gap-1 mb-4">
              {agent.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-400">Win Rate:</span>
                <div className="text-green-400 font-semibold">
                  {agent.performance.winRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-gray-400">Total Return:</span>
                <div className="text-blue-400 font-semibold">
                  +{agent.performance.totalReturn.toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-gray-400">Subscribers:</span>
                <div className="text-white font-semibold">
                  {agent.performance.subscriberCount}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Trades:</span>
                <div className="text-white font-semibold">
                  {agent.performance.totalTrades}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-400 text-sm">Price:</span>
                <div className="text-white font-bold">{getPriceDisplay(agent)}</div>
              </div>
              <button
                onClick={() => handleSubscribe(agent.id)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {agent.priceType === 'FREE' ? 'Use Agent' : 'Subscribe'}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Creator: {agent.creator}</span>
                <span>x402pay enabled</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No agents found</div>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Featured Section */}
      <div className="mt-12 crypto-card p-6">
        <h2 className="text-xl font-bold text-white mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Discover Agents</h3>
            <p className="text-gray-400 text-sm">Browse verified AI trading agents with proven performance</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💳</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Pay with x402pay</h3>
            <p className="text-gray-400 text-sm">Seamless micropayments for queries or monthly subscriptions</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Start Trading</h3>
            <p className="text-gray-400 text-sm">Deploy agents to your portfolio and monitor performance</p>
          </div>
        </div>
      </div>
    </div>
  );
} 