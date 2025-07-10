'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ArrowsRightLeftIcon,
  WalletIcon,
  DocumentDuplicateIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';

interface WalletBalance {
  asset: string;
  balance: number;
  balanceUSD: number;
}

interface CDPWalletInfo {
  walletId: string;
  network: string;
  address: string;
  addresses: Record<string, string>;
  createdAt: string;
}

export default function WalletPage() {
  const { address: connectedAddress, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address: connectedAddress });
  
  const [cdpWallet, setCdpWallet] = useState<CDPWalletInfo | null>(null);
  const [cdpBalances, setCdpBalances] = useState<WalletBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDirection, setTransferDirection] = useState<'to-cdp' | 'from-cdp'>('from-cdp');
  const [transferAmount, setTransferAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('ETH');
  const [isTransferring, setIsTransferring] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Fetch CDP wallet info
      const walletResponse = await fetch('/api/wallet/info', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        if (walletData.success) {
          setCdpWallet(walletData.data);
        }
      }

      // Fetch CDP wallet balances
      const portfolioResponse = await fetch('/api/portfolio', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (portfolioResponse.ok) {
        const portfolioData = await portfolioResponse.json();
        if (portfolioData.portfolio) {
          const balances = portfolioData.portfolio.map((item: any) => ({
            asset: item.asset,
            balance: item.balance,
            balanceUSD: item.balanceUSD
          }));
          setCdpBalances(balances);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(label);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      // Failed to copy - silently handle error
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: number, decimals: number = 6) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(balance);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleTransfer = async () => {
    if (!transferAmount || !selectedAsset) return;

    setIsTransferring(true);
    try {
      const token = localStorage.getItem('token');
      
      if (transferDirection === 'from-cdp') {
        // Transfer from CDP wallet to user wallet
        if (!connectedAddress) {
          throw new Error('Please connect your wallet first');
        }

        const response = await fetch('/api/wallet/transfer', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            destinationAddress: connectedAddress,
            amount: parseFloat(transferAmount),
            asset: selectedAsset
          })
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Transfer failed');
        }

        alert(`Transfer successful! Transaction hash: ${result.data.transactionHash}`);
      } else {
        // Transfer from user wallet to CDP wallet - show instructions
        alert(`To deposit ${transferAmount} ${selectedAsset} to your CDP wallet, send it to: ${cdpWallet?.address}\n\nThis will be automatically detected and added to your portfolio.`);
      }

      setShowTransferModal(false);
      setTransferAmount('');
      fetchWalletData(); // Refresh balances
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  const getAvailableAssets = () => {
    if (transferDirection === 'from-cdp') {
      return cdpBalances.filter(b => b.balance > 0);
    } else {
      // For deposits, show common assets
      return [
        { asset: 'ETH', balance: parseFloat(ethBalance?.formatted || '0'), balanceUSD: 0 },
        { asset: 'USDC', balance: 0, balanceUSD: 0 }
      ];
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-700 rounded-lg"></div>
              <div className="h-96 bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Wallet Data</h2>
            <p className="text-red-300">{error}</p>
            <button 
              onClick={fetchWalletData}
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
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Wallet Management</h1>
          <p className="text-gray-400">Manage your connected wallet and CDP wallet</p>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Connected Wallet */}
          <div className="crypto-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <WalletIcon className="w-6 h-6 text-blue-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">Connected Wallet</h2>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs ${
                isConnected ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>

            {isConnected && connectedAddress ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <span className="text-gray-300">Address</span>
                  <div className="flex items-center">
                    <span className="font-mono text-sm text-white mr-2">
                      {formatAddress(connectedAddress)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(connectedAddress, 'connected')}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      {copiedAddress === 'connected' ? (
                        <CheckIcon className="w-4 h-4 text-green-400" />
                      ) : (
                        <DocumentDuplicateIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-white">Balances</h3>
                  <div className="p-3 bg-gray-800/30 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-300">ETH</span>
                      <span className="text-white">{formatBalance(parseFloat(ethBalance?.formatted || '0'))}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setTransferDirection('to-cdp');
                    setShowTransferModal(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <ArrowDownIcon className="w-4 h-4 mr-2" />
                  Deposit to CDP Wallet
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <WalletIcon className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400 mb-4">Connect your wallet to view balances</p>
                <ConnectButton />
              </div>
            )}
          </div>

          {/* CDP Wallet */}
          <div className="crypto-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <WalletIcon className="w-6 h-6 text-purple-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">CDP Wallet</h2>
              </div>
              <div className="px-3 py-1 rounded-full text-xs bg-purple-400/20 text-purple-400">
                System Managed
              </div>
            </div>

            {cdpWallet ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <span className="text-gray-300">Address</span>
                  <div className="flex items-center">
                    <span className="font-mono text-sm text-white mr-2">
                      {formatAddress(cdpWallet.address)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(cdpWallet.address, 'cdp')}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      {copiedAddress === 'cdp' ? (
                        <CheckIcon className="w-4 h-4 text-green-400" />
                      ) : (
                        <DocumentDuplicateIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <span className="text-gray-300">Network</span>
                  <span className="text-white capitalize">{cdpWallet.network}</span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-white">Balances</h3>
                  {cdpBalances.length > 0 ? (
                    <div className="space-y-2">
                      {cdpBalances.map((balance) => (
                        <div key={balance.asset} className="p-3 bg-gray-800/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-gray-300">{balance.asset}</span>
                            <div className="text-right">
                              <div className="text-white">{formatBalance(balance.balance)}</div>
                              <div className="text-sm text-gray-400">{formatCurrency(balance.balanceUSD)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-800/30 rounded-lg text-center text-gray-400">
                      No assets yet
                    </div>
                  )}
                </div>

                {cdpBalances.some(b => b.balance > 0) && (
                  <button
                    onClick={() => {
                      setTransferDirection('from-cdp');
                      setShowTransferModal(true);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <ArrowUpIcon className="w-4 h-4 mr-2" />
                    Withdraw to Connected Wallet
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <WalletIcon className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400">CDP wallet not found</p>
              </div>
            )}
          </div>
        </div>

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <ArrowsRightLeftIcon className="w-5 h-5 mr-2" />
                  Transfer Funds
                </h3>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Direction
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setTransferDirection('from-cdp')}
                      className={`p-3 rounded-lg border transition-colors ${
                        transferDirection === 'from-cdp'
                          ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                          : 'border-gray-600 bg-gray-800/30 text-gray-400'
                      }`}
                    >
                      CDP → Wallet
                    </button>
                    <button
                      onClick={() => setTransferDirection('to-cdp')}
                      className={`p-3 rounded-lg border transition-colors ${
                        transferDirection === 'to-cdp'
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-gray-600 bg-gray-800/30 text-gray-400'
                      }`}
                    >
                      Wallet → CDP
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Asset
                  </label>
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    title="Select asset to transfer"
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    {getAvailableAssets().map((asset) => (
                      <option key={asset.asset} value={asset.asset}>
                        {asset.asset} (Available: {formatBalance(asset.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTransfer}
                    disabled={isTransferring || !transferAmount}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg transition-colors"
                  >
                    {isTransferring ? 'Processing...' : 'Transfer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 