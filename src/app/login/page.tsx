'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { setCookie } from 'cookies-next';

export default function LoginPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { isConnected, address } = useAccount();

  const handleWalletLogin = useCallback(async (walletAddress: string) => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress.toLowerCase()
        })
      });

      const data = await response.json();

      if (data.success) {
        // Persist token in both localStorage (client) and cookie (SSR / API)
        localStorage.setItem('token', data.token);
        setCookie('auth-token', data.token, {
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: '/',
        });
        router.push('/dashboard');
      } else {
        setError(data.error || 'Wallet authentication failed. Please try again.');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Wallet login failed:', error);
      setError('An unexpected error occurred during wallet login. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  }, [router]);

  // Redirect to dashboard when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      // Authenticate with wallet address
      handleWalletLogin(address);
    }
  }, [isConnected, address, router, handleWalletLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password: password
        })
      });

      const data = await response.json();

      if (data.success) {
        // Persist token in both localStorage (client) and cookie (SSR / API)
        localStorage.setItem('token', data.token);
        setCookie('auth-token', data.token, {
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: '/',
        });
        router.push('/dashboard');
      } else {
        setError(data.error || 'Email authentication failed. Please try again.');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Login failed:', error);
      setError('An unexpected error occurred during login. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400">Connect your wallet or sign in to continue</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="crypto-card p-8 space-y-6">
          {/* Wallet Connection via RainbowKit */}
          <div className="flex justify-center">
            <ConnectButton showBalance={false} />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Your wallet (MetaMask, Coinbase Wallet, WalletConnect, etc.) can be used to sign in. A secure agent wallet is provisioned for you automatically after connecting.
          </p>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with email</span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 bg-gray-700 border-gray-600 rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>
              <Link href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={isConnecting}
              className="w-full py-2 px-4 border border-transparent rounded-lg text-white bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isConnecting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center">
                         <p className="text-gray-400">
               Don&apos;t have an account?{' '}
               <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">
                 Sign up here
               </Link>
             </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-purple-400 hover:text-purple-300">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 