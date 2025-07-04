'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

export default function CreateAgentPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth-token');
    if (!token || !isConnected) {
      alert('Please log in to create an agent.');
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
  }, [router, isConnected]);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    strategy: {
      type: string;
      indicators: string[];
      timeframe: string;
    };
    riskParameters: {
      maxTradeSize: number;
      stopLoss: number;
      takeProfit: number;
      maxDailyLoss: number;
      maxOpenPositions: number;
    };
    isPublic: boolean;
    pricing: {
      type: string;
      price: number;
    };
    tags: string[];
  }>({
    name: '',
    description: '',
    strategy: {
      type: 'balanced',
      indicators: ['moving_average', 'rsi'],
      timeframe: '1h'
    },
    riskParameters: {
      maxTradeSize: 100,
      stopLoss: 5,
      takeProfit: 10,
      maxDailyLoss: 20,
      maxOpenPositions: 3
    },
    isPublic: false,
    pricing: {
      type: 'FREE',
      price: 0
    },
    tags: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...formData,
          strategy: JSON.stringify(formData.strategy),
          riskParameters: JSON.stringify(formData.riskParameters),
          pricing: formData.isPublic ? formData.pricing : null,
          tags: formData.isPublic ? formData.tags : null,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('Authentication required. Please log in again.');
          router.push('/login');
          return;
        }
        throw new Error('Failed to create agent');
      }

      await response.json(); // Agent created successfully
      // Redirect to agents list page with success message
      router.push('/agents?created=true');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create agent:', error);
      alert('Failed to create agent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

        if (!isAuthenticated) {
          return (
            <div className="min-h-screen bg-gray-900 text-white p-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Loading...</h1>
                  <p>Checking authentication...</p>
                </div>
              </div>
            </div>
          );
        }

        return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New AI Agent</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            
            <div className="space-y-4">
            <div>
                <label htmlFor="agent-name" className="block text-sm font-medium mb-2">Agent Name</label>
              <input
                  id="agent-name"
                type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                  placeholder="My Trading Agent"
              />
            </div>

            <div>
                <label htmlFor="agent-description" className="block text-sm font-medium mb-2">Description</label>
              <textarea
                  id="agent-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                rows={3}
                  placeholder="Describe your agent's strategy..."
              />
              </div>
            </div>
          </div>

          {/* Trading Strategy */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Trading Strategy</h2>

            <div className="space-y-4">
            <div>
                <label htmlFor="strategy-type" className="block text-sm font-medium mb-2">Strategy Type</label>
                <select
                  id="strategy-type"
                  value={formData.strategy.type}
                  onChange={(e) => setFormData({
                    ...formData,
                    strategy: { ...formData.strategy, type: e.target.value }
                  })}
                  className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                >
                  <option value="conservative">Conservative (Low Risk)</option>
                  <option value="balanced">Balanced (Medium Risk)</option>
                  <option value="aggressive">Aggressive (High Risk)</option>
                </select>
                    </div>

              <div>
                <label htmlFor="timeframe" className="block text-sm font-medium mb-2">Timeframe</label>
                <select
                  id="timeframe"
                  value={formData.strategy.timeframe}
                  onChange={(e) => setFormData({
                    ...formData,
                    strategy: { ...formData.strategy, timeframe: e.target.value }
                  })}
                  className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                >
                  <option value="5m">5 minutes</option>
                  <option value="15m">15 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="4h">4 hours</option>
                  <option value="1d">1 day</option>
                </select>
              </div>
            </div>
          </div>

          {/* Risk Parameters */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Risk Management</h2>
            
            <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="max-trade-size" className="block text-sm font-medium mb-2">Max Trade Size ($)</label>
              <input
                id="max-trade-size"
                type="number"
                  required
                  value={formData.riskParameters.maxTradeSize}
                  onChange={(e) => setFormData({
                    ...formData,
                    riskParameters: { 
                      ...formData.riskParameters, 
                      maxTradeSize: parseFloat(e.target.value) 
                    }
                  })}
                  className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                min="10"
                max="10000"
              />
            </div>

            <div>
                <label htmlFor="stop-loss" className="block text-sm font-medium mb-2">Stop Loss (%)</label>
                    <input
                  id="stop-loss"
                  type="number"
                  required
                  value={formData.riskParameters.stopLoss}
                  onChange={(e) => setFormData({
                    ...formData,
                    riskParameters: { 
                      ...formData.riskParameters, 
                      stopLoss: parseFloat(e.target.value) 
                        }
                  })}
                  className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                  min="1"
                  max="50"
                  step="0.5"
                />
              </div>

            <div>
                <label htmlFor="take-profit" className="block text-sm font-medium mb-2">Take Profit (%)</label>
                        <input
                  id="take-profit"
                  type="number"
                  required
                  value={formData.riskParameters.takeProfit}
                  onChange={(e) => setFormData({
                    ...formData,
                    riskParameters: { 
                      ...formData.riskParameters, 
                      takeProfit: parseFloat(e.target.value) 
                            }
                  })}
                  className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                  min="1"
                  max="100"
                  step="0.5"
                />
              </div>

              <div>
                <label htmlFor="max-daily-loss" className="block text-sm font-medium mb-2">Max Daily Loss ($)</label>
                <input
                  id="max-daily-loss"
                  type="number"
                  required
                  value={formData.riskParameters.maxDailyLoss}
                  onChange={(e) => setFormData({
                    ...formData,
                    riskParameters: { 
                      ...formData.riskParameters, 
                      maxDailyLoss: parseFloat(e.target.value) 
                    }
                  })}
                  className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                  min="10"
                  max="1000"
                  />
            </div>
            </div>
          </div>

          {/* Marketplace Options */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Marketplace Options</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  id="is-public"
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="is-public" className="text-sm font-medium">
                  Publish to Marketplace
                </label>
              </div>
              
              {formData.isPublic && (
                <div className="space-y-4 pl-7">
                  <div>
                    <label htmlFor="pricing-type" className="block text-sm font-medium mb-2">Pricing Type</label>
                    <select
                      id="pricing-type"
                      value={formData.pricing.type}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, type: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="FREE">Free</option>
                      <option value="PER_QUERY">Per Query</option>
                      <option value="MONTHLY">Monthly Subscription</option>
                    </select>
                  </div>
                  
                  {formData.pricing.type !== 'FREE' && (
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium mb-2">Price ($)</label>
                      <input
                        id="price"
                        type="number"
                        value={formData.pricing.price}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, price: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                    <input
                      id="tags"
                      type="text"
                      value={formData.tags.join(', ')}
                      onChange={(e) => setFormData({
                        ...formData,
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                      })}
                      className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                      placeholder="bitcoin, defi, arbitrage"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => router.push('/agents')}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
              <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
              {loading ? 'Creating...' : 'Create Agent'}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
} 