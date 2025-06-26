'use client';

import { useState, useEffect } from 'react';

interface PaymentTransaction {
  id: string;
  type: 'INCOMING' | 'OUTGOING';
  category: 'QUERY_FEE' | 'SUBSCRIPTION' | 'API_PAYMENT' | 'WITHDRAWAL';
  amount: number;
  currency: 'USDC' | 'ETH' | 'BTC';
  description: string;
  counterparty: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  timestamp: string;
  txHash?: string;
}

interface RevenueStats {
  totalEarned: number;
  thisMonth: number;
  lastMonth: number;
  thisWeek: number;
  queryRevenue: number;
  subscriptionRevenue: number;
  growthRate: number;
}

interface PaymentMethod {
  id: string;
  type: 'CDP_WALLET' | 'X402PAY';
  address: string;
  balance: number;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'revenue' | 'methods'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  // Demo constants for linting; replace with real state when integrating API
  const totalRevenueDemo = 247.85;
  const thisMonthDemo = 68.40;

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      // Mock data - replace with actual GraphQL queries
      const mockRevenue: RevenueStats = {
        totalEarned: 247.85,
        thisMonth: 68.40,
        lastMonth: 42.30,
        thisWeek: 15.20,
        queryRevenue: 180.25,
        subscriptionRevenue: 67.60,
        growthRate: 61.7
      };

      const mockTransactions: PaymentTransaction[] = [
        {
          id: '1',
          type: 'INCOMING',
          category: 'QUERY_FEE',
          amount: 0.05,
          currency: 'USDC',
          description: 'Query fee from DeFi Yield Hunter agent',
          counterparty: '0x742d35...9c0CF',
          status: 'COMPLETED',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          txHash: '0x1234567890abcdef'
        },
        {
          id: '2',
          type: 'OUTGOING',
          category: 'API_PAYMENT',
          amount: 0.002,
          currency: 'USDC',
          description: 'Amazon Bedrock Nova API call',
          counterparty: 'Amazon Bedrock',
          status: 'COMPLETED',
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'INCOMING',
          category: 'SUBSCRIPTION',
          amount: 10.00,
          currency: 'USDC',
          description: 'Monthly subscription payment',
          counterparty: '0x9876543...21ABC',
          status: 'COMPLETED',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          txHash: '0xabcdef1234567890'
        }
      ];

      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: '1',
          type: 'CDP_WALLET',
          address: '0x742d35Cc6634C0532925a3b8D404d01A8dB9c0CF',
          balance: 1250.75,
          currency: 'USDC',
          isDefault: true,
          isActive: true
        },
        {
          id: '2',
          type: 'X402PAY',
          address: 'x402://agentvault.ai/payments',
          balance: 0,
          currency: 'USDC',
          isDefault: false,
          isActive: true
        }
      ];

      setRevenueStats(mockRevenue);
      setTransactions(mockTransactions);
      setPaymentMethods(mockPaymentMethods);
      setIsLoading(false);
    } catch (error) {
      // eslint-disable-next-line no-console -- Replace with proper logger
    }
  };

  const getTransactionIcon = (category: string) => {
    switch (category) {
      case 'QUERY_FEE': return '🔍';
      case 'SUBSCRIPTION': return '📋';
      case 'API_PAYMENT': return '🤖';
      case 'WITHDRAWAL': return '💸';
      default: return '💳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400 bg-green-400/20';
      case 'PENDING': return 'text-yellow-400 bg-yellow-400/20';
      case 'FAILED': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Payments & Billing</h1>
        <p className="text-gray-400">Manage your x402pay transactions and revenue streams</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1 mb-8">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'transactions', label: 'Transactions' },
          { id: 'revenue', label: 'Revenue' },
          { id: 'methods', label: 'Payment Methods' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="crypto-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Earned</p>
                  <p className="text-2xl font-bold text-white">${totalRevenueDemo.toFixed(2)}</p>
                  <p className="text-sm text-green-400">+61.7% growth</p>
                </div>
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>

            <div className="crypto-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">This Month</p>
                  <p className="text-2xl font-bold text-white">${thisMonthDemo.toFixed(2)}</p>
                  <p className="text-sm text-purple-400">x402pay revenue</p>
                </div>
                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
              </div>
            </div>

            <div className="crypto-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Query Revenue</p>
                  <p className="text-2xl font-bold text-white">${revenueStats?.queryRevenue.toFixed(2)}</p>
                  <p className="text-sm text-blue-400">x402pay micropayments</p>
                </div>
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🔍</span>
                </div>
              </div>
            </div>

            <div className="crypto-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Subscriptions</p>
                  <p className="text-2xl font-bold text-white">${revenueStats?.subscriptionRevenue.toFixed(2)}</p>
                  <p className="text-sm text-yellow-400">Monthly recurring</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="crypto-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
              <button 
                onClick={() => setActiveTab('transactions')}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                View all →
              </button>
            </div>
            <div className="space-y-4">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{getTransactionIcon(tx.category)}</span>
                    <div>
                      <p className="text-white font-medium">{tx.description}</p>
                      <p className="text-gray-400 text-sm">{tx.counterparty}</p>
                      <p className="text-gray-500 text-xs">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      tx.type === 'INCOMING' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'INCOMING' ? '+' : '-'}${tx.amount.toFixed(3)}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="crypto-card p-6">
            <h3 className="text-xl font-bold text-white mb-6">Payment Methods</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium">{method.type === 'CDP_WALLET' ? 'CDP Wallet' : 'x402pay'}</span>
                    {method.isDefault && (
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">Default</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{method.address}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">{method.balance.toFixed(2)} {method.currency}</span>
                    <span className={`w-2 h-2 rounded-full ${method.isActive ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="crypto-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">All Transactions</h3>
            <div className="flex space-x-2">
              <select aria-label="Transaction Type Filter" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                <option value="all">All Types</option>
                <option value="incoming">Incoming</option>
                <option value="outgoing">Outgoing</option>
              </select>
              <select aria-label="Time Range Filter" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 py-3 px-4">Transaction</th>
                  <th className="text-left text-gray-400 py-3 px-4">Type</th>
                  <th className="text-left text-gray-400 py-3 px-4">Amount</th>
                  <th className="text-left text-gray-400 py-3 px-4">Status</th>
                  <th className="text-left text-gray-400 py-3 px-4">Date</th>
                  <th className="text-left text-gray-400 py-3 px-4">Hash</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getTransactionIcon(tx.category)}</span>
                        <div>
                          <p className="text-white font-medium">{tx.description}</p>
                          <p className="text-gray-400 text-sm">{tx.counterparty}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.type === 'INCOMING' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-bold ${
                        tx.type === 'INCOMING' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tx.type === 'INCOMING' ? '+' : '-'}${tx.amount.toFixed(3)} {tx.currency}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-400">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      {tx.txHash ? (
                        <a 
                          href={`https://basescan.org/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 text-sm"
                        >
                          {tx.txHash.slice(0, 8)}...
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="crypto-card p-6">
            <h3 className="text-xl font-bold text-white mb-6">Revenue Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-4">Revenue Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Query Fees (x402pay)</span>
                    <span className="text-white font-bold">${revenueStats?.queryRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Subscriptions</span>
                    <span className="text-white font-bold">${revenueStats?.subscriptionRevenue.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">Total</span>
                      <span className="text-green-400 font-bold">${revenueStats?.totalEarned.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-4">Performance Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Growth Rate</span>
                    <span className="text-green-400 font-bold">+{revenueStats?.growthRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">This Week</span>
                    <span className="text-white font-bold">${revenueStats?.thisWeek.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Average Daily</span>
                    <span className="text-white font-bold">${((revenueStats?.thisMonth || 0) / 30).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="crypto-card p-6">
            <h3 className="text-xl font-bold text-white mb-6">Revenue Opportunities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-semibold mb-2">Increase Query Fees</h4>
                <p className="text-gray-300 text-sm mb-3">
                  Your agent performance suggests you could increase x402pay fees by 25%
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                  Optimize Pricing
                </button>
              </div>
              
              <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
                <h4 className="text-purple-400 font-semibold mb-2">Enable Subscriptions</h4>
                <p className="text-gray-300 text-sm mb-3">
                  Offer premium subscription tiers for consistent revenue
                </p>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm">
                  Set Up Tiers
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'methods' && (
        <div className="space-y-6">
          <div className="crypto-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Payment Methods</h3>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm">
                Add Payment Method
              </button>
            </div>
            
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="bg-gray-800/50 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-white font-semibold text-lg">
                          {method.type === 'CDP_WALLET' ? 'CDP Wallet' : 'x402pay Protocol'}
                        </span>
                        {method.isDefault && (
                          <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">Default</span>
                        )}
                        <span className={`w-2 h-2 rounded-full ${method.isActive ? 'bg-green-400' : 'bg-red-400'}`}></span>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-4">{method.address}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-400 text-sm">Balance</span>
                          <p className="text-white font-bold">{method.balance.toFixed(2)} {method.currency}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Status</span>
                          <p className={`font-bold ${method.isActive ? 'text-green-400' : 'text-red-400'}`}>
                            {method.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {!method.isDefault && (
                        <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm">
                          Set Default
                        </button>
                      )}
                      <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="crypto-card p-6">
            <h3 className="text-xl font-bold text-white mb-6">x402pay Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Default Query Fee (USDC)
                </label>
                <input
                  type="number"
                  step="0.001"
                  defaultValue="0.05"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="0.05"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Payment Timeout (seconds)
                </label>
                <input
                  type="number"
                  defaultValue="30"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="30"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-settlement"
                  defaultChecked
                  className="form-checkbox h-4 w-4 text-purple-600"
                />
                <label htmlFor="auto-settlement" className="text-white">
                  Enable automatic settlement to CDP Wallet
                </label>
              </div>
              
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg">
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 