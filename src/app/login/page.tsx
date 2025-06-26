'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleWalletConnect = async () => {
    setIsConnecting(true);
    try {
      // Mock CDP Wallet connection - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('walletAddress', '0x742d35Cc6634C0532925a3b8D404d01A8dB9c0CF');
      router.push('/dashboard');
    } catch (error) {
      // Handle wallet connection error
      alert('Wallet connection failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    try {
      // Mock email login - replace with actual authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem('token', 'demo-token');
      router.push('/dashboard');
    } catch (error) {
      // Handle login error
      alert('Login failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">AV</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400">Connect your wallet or sign in to continue</p>
        </div>

        <div className="crypto-card p-8 space-y-6">
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
                  <span>Connect CDP Wallet</span>
                </div>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Recommended for full AgentVault functionality
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with email</span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
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