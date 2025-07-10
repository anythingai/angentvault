'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { setCookie } from 'cookies-next';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function RegisterPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [hasTriedWalletReg, setHasTriedWalletReg] = useState(false);
  const router = useRouter();
  const { address: connectedAddress, isConnected } = useAccount();
  const [error, setError] = useState('');

  // Manual wallet registration (only when explicitly triggered)
    const registerWithWallet = async () => {
    if (!isConnected || !connectedAddress || isCreating || hasTriedWalletReg) return;
    
      try {
        setIsCreating(true);
      setHasTriedWalletReg(true);
        setError('');

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: connectedAddress.toLowerCase(),
            method: 'wallet',
            name: formData.name || undefined,
            email: formData.email || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Registration failed');
        }

        localStorage.setItem('token', data.token);
        setCookie('auth-token', data.token, { maxAge: 60 * 60 * 24 * 7, path: '/' });
        router.push('/dashboard');
      } catch (err: any) {
        setError(err.message || 'Wallet registration failed. Please try again.');
      } finally {
        setIsCreating(false);
      }
    };

  // Reset registration attempt when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setHasTriedWalletReg(false);
      setError('');
    }
  }, [isConnected]);

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
          <h2 className="text-3xl font-bold text-white mb-2">Join AgentVault</h2>
          <p className="text-gray-400">Create your account and start building autonomous trading agents</p>
        </div>

        <div className="crypto-card p-8 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}
          
          {/* Wallet Connection via RainbowKit */}
          <div className="flex flex-col items-center space-y-4">
            <ConnectButton showBalance={false} />
            {isConnected && connectedAddress && !hasTriedWalletReg && (
              <button
                onClick={registerWithWallet}
                disabled={isCreating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {isCreating ? 'Creating Account...' : 'Register with Connected Wallet'}
              </button>
            )}
            {isCreating && (
              <div className="text-sm text-gray-400 text-center">
                Creating your account and setting up your wallet...
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Supports Coinbase Wallet, MetaMask, WalletConnect, and more</p>

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
      </div>
    </div>
  );
} 