'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AgentConfig {
  name: string;
  description: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  tradingPairs: string[];
  strategies: string[];
  maxTradeSize: number;
  chargePerTrade: boolean;
  tradeFee: number;
}

export default function CreateAgent() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    riskTolerance: 'moderate',
    tradingPairs: ['BTC/USD'],
    strategies: ['momentum'],
    maxTradeSize: 100,
    chargePerTrade: false,
    tradeFee: 0.01
  });

  const tradingPairs = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'MATIC/USD'];
  const strategies = [
    { id: 'momentum', name: 'Momentum Trading', description: 'Follow market trends' },
    { id: 'mean_reversion', name: 'Mean Reversion', description: 'Trade against extremes' },
    { id: 'sentiment', name: 'Sentiment Analysis', description: 'Trade based on market sentiment' },
    { id: 'dca', name: 'Dollar Cost Averaging', description: 'Regular interval buying' }
  ];

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('token');
      
      const mutation = `
        mutation CreateAgent($input: CreateAgentInput!) {
          createAgent(input: $input) {
            id
            name
            status
          }
        }
      `;

      const response = await fetch(`${apiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              ...config,
              config: JSON.stringify({
                tradingPairs: config.tradingPairs,
                strategies: config.strategies,
                maxTradeSize: config.maxTradeSize,
                chargePerTrade: config.chargePerTrade,
                tradeFee: config.tradeFee
              })
            }
          }
        })
      });

      const result = await response.json();
      if (result.data?.createAgent) {
        router.push('/dashboard');
      }
    } catch (error) {
      // console.error('Failed to create agent:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Basic Information</h2>
            <div>
              <label className="block text-gray-300 mb-2">Agent Name</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="e.g., BTC Momentum Bot"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Description</label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                rows={3}
                placeholder="Describe your agent&apos;s strategy..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Risk Configuration</h2>
            <div>
              <label className="block text-gray-300 mb-4">Risk Tolerance</label>
              <div className="grid grid-cols-3 gap-4">
                {['conservative', 'moderate', 'aggressive'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfig({ ...config, riskTolerance: level as any })}
                    className={`p-4 rounded-lg border transition-colors ${
                      config.riskTolerance === level
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="capitalize font-semibold">{level}</div>
                    <div className="text-sm mt-1 opacity-80">
                      {level === 'conservative' && 'Low risk, steady returns'}
                      {level === 'moderate' && 'Balanced approach'}
                      {level === 'aggressive' && 'High risk, high reward'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="max-trade-size" className="block text-gray-300 mb-2">Max Trade Size (USDC)</label>
              <input
                id="max-trade-size"
                type="number"
                value={config.maxTradeSize}
                onChange={(e) => setConfig({ ...config, maxTradeSize: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                min="10"
                max="10000"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Trading Configuration</h2>
            <div>
              <label className="block text-gray-300 mb-4">Trading Pairs</label>
              <div className="space-y-2">
                {tradingPairs.map((pair) => (
                  <label key={pair} htmlFor={`trading-pair-${pair}`} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      id={`trading-pair-${pair}`}
                      aria-label={`Trading pair ${pair}`}
                      type="checkbox"
                      checked={config.tradingPairs.includes(pair)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConfig({ ...config, tradingPairs: [...config.tradingPairs, pair] });
                        } else {
                          setConfig({ ...config, tradingPairs: config.tradingPairs.filter(p => p !== pair) });
                        }
                      }}
                      className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-white">{pair}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-gray-300 mb-4">Trading Strategies</label>
              <div className="space-y-3">
                {strategies.map((strategy) => (
                  <label key={strategy.id} htmlFor={`strategy-${strategy.id}`} className="block cursor-pointer">
                    <div className={`p-4 rounded-lg border transition-colors ${
                      config.strategies.includes(strategy.id)
                        ? 'bg-purple-600/20 border-purple-500'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <input
                          id={`strategy-${strategy.id}`}
                          aria-label={`Strategy ${strategy.name}`}
                          type="checkbox"
                          checked={config.strategies.includes(strategy.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConfig({ ...config, strategies: [...config.strategies, strategy.id] });
                            } else {
                              setConfig({ ...config, strategies: config.strategies.filter(s => s !== strategy.id) });
                            }
                          }}
                          className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <div className="text-white font-medium">{strategy.name}</div>
                          <div className="text-gray-400 text-sm">{strategy.description}</div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Monetization (x402pay)</h2>
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-6 rounded-lg border border-purple-500/30">
              <h3 className="text-lg font-semibold text-white mb-2">Enable Agent Monetization</h3>
              <p className="text-gray-300 mb-4">
                Allow other users to access your agent&apos;s insights via x402pay micropayments
              </p>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.chargePerTrade}
                  onChange={(e) => setConfig({ ...config, chargePerTrade: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                />
                <span className="text-white">Charge for trade signals</span>
              </label>
              {config.chargePerTrade && (
                <div className="mt-4">
                  <label htmlFor="trade-fee" className="block text-gray-300 mb-2">Fee per query (USDC)</label>
                  <input
                    id="trade-fee"
                    type="number"
                    value={config.tradeFee}
                    onChange={(e) => setConfig({ ...config, tradeFee: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    min="0.001"
                    max="1"
                    step="0.001"
                  />
                </div>
              )}
            </div>
            <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-500/30">
              <p className="text-blue-300 text-sm">
                💡 Monetized agents can generate passive income when other users access their trading signals
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-400 hover:text-white mb-6 flex items-center space-x-2 transition-colors"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </button>

        <div className="crypto-card p-8">
          <h1 className="text-3xl font-bold text-white mb-8">Create AI Trading Agent</h1>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= i ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {i}
                </div>
                {i < 4 && (
                  <div className={`w-full h-1 mx-2 progress-bar-step ${
                    step > i ? 'bg-purple-600' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!config.name || !config.description}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={isCreating || !config.name || !config.strategies.length}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center space-x-2"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Agent</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 