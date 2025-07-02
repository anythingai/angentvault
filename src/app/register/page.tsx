'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useConnect, useAccount } from 'wagmi';
import { setCookie } from 'cookies-next';
import Image from 'next/image';

export default function RegisterPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const { connectAsync, connectors } = useConnect();
  const { address: connectedAddress } = useAccount();
  const [error, setError] = useState('');

  const handleWalletConnect = async () => {
    try {
      setIsConnecting(true);
      setError('');

      // Initiate wallet connection via wagmi so RainbowKit detects it
      let walletAddress = connectedAddress;

      if (!walletAddress) {
        const connector = connectors[0];
        if (!connector) {
          throw new Error('No wallet connectors available');
        }
        // connectAsync resolves with account info
        await connectAsync({ connector });
        const accs = await connector.getAccounts();
        walletAddress = accs[0];
      }
      
      // Create account with wallet
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          walletAddress,
          method: 'wallet'
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token in both localStorage and cookie for SSR/API consistency
      localStorage.setItem('token', data.token);
      setCookie('auth-token', data.token, {
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet. Please try again.');
      // Log error for debugging without using console
    } finally {
      setIsConnecting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsCreating(true);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      const result = await response.json();
      if (result.success) {
        localStorage.setItem('token', result.token);
        setCookie('auth-token', result.token, {
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });
        router.push('/dashboard');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center space-x-2 mb-6">
            <Image src="/icon.svg" alt="AgentVault Logo" width={48} height={48} />
            <span className="text-3xl font-bold text-white relative top-px">AgentVault</span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Join AgentVault</h2>
          <p className="text-gray-400">Create your account and start building autonomous trading agents</p>
        </div>

        <div className="crypto-card p-8 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}
          
          {/* CDP Wallet Connection */}
          <div>
            <button
              onClick={handleWalletConnect}
              disabled={isConnecting}
              className="w-full flex items-center justify-center px-4 py-3 border border-purple-500 rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isConnecting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>Connect Wallet</span>
                </div>
              )}
            </button>
            <p className="text-xs text-gray-300 mt-1">Supports MetaMask, Coinbase Wallet, WalletConnect, and more</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or create with email</span>
            </div>
          </div>

          {/* Email Registration Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="Create a strong password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="Confirm your password"
              />
            </div>
            
            <div className="flex items-center">
              <input
                id="accept-terms"
                name="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 bg-gray-700 border-gray-600 rounded text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-300">
                I agree to the{' '}
                <Link href="/terms" className="text-purple-400 hover:text-purple-300">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-purple-400 hover:text-purple-300">
                  Privacy Policy
                </Link>
              </label>
            </div>
            
            <button
              type="submit"
              disabled={isCreating || !acceptTerms}
              className="w-full py-2 px-4 border border-transparent rounded-lg text-white bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-purple-400">🤖</span>
              <span className="text-purple-400 font-medium">AI-Powered Trading</span>
            </div>
            <p className="text-xs text-purple-300">
              Join thousands of users leveraging autonomous AI agents for cryptocurrency trading.<br/>
              Secure, transparent, and powered by cutting-edge blockchain technology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 