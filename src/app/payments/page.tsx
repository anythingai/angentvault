'use client';

import { useState, useEffect } from 'react';
import { ArrowUpIcon, CreditCardIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  averagePerQuery: number;
  totalQueries: number;
}

interface PaymentTransaction {
  id: string;
  type: 'query' | 'subscription' | 'revenue_share';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  agentId?: string;
  agentName?: string;
  reference?: string;
  transactionHash?: string;
  createdAt: string;
}

interface PaymentMethod {
  id: string;
  type: 'wallet' | 'usdc' | 'crypto';
  name: string;
  address?: string;
  isDefault: boolean;
}

export default function PaymentsPage() {
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'methods'>('overview');

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view payment information');
        setIsLoading(false);
        return;
      }

      // Fetch payment data from multiple endpoints
      const [revenueResponse, transactionsResponse] = await Promise.all([
        fetch('/api/payments/revenue', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/payments/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!revenueResponse.ok || !transactionsResponse.ok) {
        throw new Error('Failed to fetch payment data');
      }

      const revenueData = await revenueResponse.json();
      const transactionsData = await transactionsResponse.json();

      // Set revenue stats
      if (revenueData.success && revenueData.data) {
        setRevenueStats(revenueData.data);
      } else {
        setRevenueStats({
          totalRevenue: 0,
          monthlyRevenue: 0,
          averagePerQuery: 0,
          totalQueries: 0
        });
      }

      // Set transactions
      if (transactionsData.success && transactionsData.data) {
        setTransactions(transactionsData.data);
      } else {
        setTransactions([]);
      }

      // Fetch user's wallet information for payment methods
      const walletResponse = await fetch('/api/wallet/info', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        if (walletData.success && walletData.data) {
          setPaymentMethods([
            {
              id: 'primary-wallet',
              type: 'wallet',
              name: 'CDP Wallet',
              address: walletData.data.address,
              isDefault: true
            }
          ]);
        }
      }

      setIsLoading(false);
    } catch (error) {
      // Handle error silently in production
      setError(error instanceof Error ? error.message : 'Failed to load payment data');
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'failed': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'query': return '🔍';
      case 'subscription': return '📅';
      case 'revenue_share': return '💰';
      default: return '💳';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="skeleton h-8 w-48 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-24"></div>
            ))}
          </div>
          <div className="skeleton h-96"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Payment Data</h2>
            <p className="text-red-300">{error}</p>
            <button 
              onClick={fetchPaymentData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Payments & Revenue</h1>
          <p className="text-gray-400">Track your x402pay revenue and payment history</p>
        </div>

        {/* Revenue Stats */}
        {revenueStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="text-sm text-gray-400 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(revenueStats.totalRevenue)}</div>
            </div>

            <div className="card">
              <div className="text-sm text-gray-400 mb-1">This Month</div>
              <div className="text-2xl font-bold text-green-400">{formatCurrency(revenueStats.monthlyRevenue)}</div>
            </div>

            <div className="card">
              <div className="text-sm text-gray-400 mb-1">Avg per Query</div>
              <div className="text-2xl font-bold text-blue-400">{formatCurrency(revenueStats.averagePerQuery)}</div>
            </div>

            <div className="card">
              <div className="text-sm text-gray-400 mb-1">Total Queries</div>
              <div className="text-2xl font-bold text-white">{revenueStats.totalQueries.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: CurrencyDollarIcon },
            { id: 'transactions', label: 'Transactions', icon: ArrowUpIcon },
            { id: 'methods', label: 'Payment Methods', icon: CreditCardIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <CurrencyDollarIcon className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">No payment activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getTransactionIcon(transaction.type)}</span>
                        <div>
                          <div className="font-medium text-white">
                            {transaction.type === 'query' ? 'AI Query Payment' :
                             transaction.type === 'subscription' ? 'Subscription Payment' :
                             'Revenue Share'}
                          </div>
                          <div className="text-sm text-gray-400">{formatDate(transaction.createdAt)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-400">+{formatCurrency(transaction.amount)}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-medium hover:from-purple-700 hover:to-blue-700 transition-colors">
                  💰 Withdraw Earnings
                </button>
                <button className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-white font-medium hover:bg-gray-800 transition-colors">
                  📊 View Analytics
                </button>
                <button className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-white font-medium hover:bg-gray-800 transition-colors">
                  ⚙️ Payment Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Transaction History</h3>
              <button 
                onClick={fetchPaymentData}
                className="btn-secondary text-sm px-4 py-2"
              >
                Refresh
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <CurrencyDollarIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">No Transactions Yet</h4>
                <p className="text-gray-400">Start earning revenue by deploying AI agents!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <span className="text-xl mr-3">{getTransactionIcon(transaction.type)}</span>
                            <div>
                              <div className="font-medium text-white">
                                {transaction.type === 'query' ? 'AI Query Payment' :
                                 transaction.type === 'subscription' ? 'Subscription Payment' :
                                 'Revenue Share'}
                              </div>
                              {transaction.agentName && (
                                <div className="text-sm text-gray-400">{transaction.agentName}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-green-400">
                            +{formatCurrency(transaction.amount)} {transaction.currency}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-300">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="py-4 px-4">
                          {transaction.transactionHash ? (
                            <a
                              href={`https://basescan.org/tx/${transaction.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm font-mono"
                            >
                              {transaction.transactionHash.slice(0, 10)}...
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
            )}
          </div>
        )}

        {activeTab === 'methods' && (
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-6">Payment Methods</h3>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-12">
                <CreditCardIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">No Payment Methods</h4>
                <p className="text-gray-400">Connect a wallet to receive payments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold mr-4">
                        💳
                      </div>
                      <div>
                        <div className="font-medium text-white">{method.name}</div>
                        {method.address && (
                          <div className="text-sm text-gray-400 font-mono">
                            {method.address.slice(0, 6)}...{method.address.slice(-4)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {method.isDefault && (
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                          Default
                        </span>
                      )}
                      <button className="text-gray-400 hover:text-white">
                        ⚙️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 